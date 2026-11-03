-- Invite errors the app can tell apart, shared contacts for member profiles,
-- and per-city member counts for the home page.

-------------------------------------------------------------------------------
-- redeem_invite: separate "invalid" and "already used" errors
-------------------------------------------------------------------------------

-- Same contract as before, but the invite page can now say why a code failed.
-- Both row locks are held until the transaction ends:
--   * the caller's profile, so one user redeeming two codes at once can't be
--     verified twice;
--   * the invite, so two users redeeming the same code at once can't both
--     succeed. The second one waits, then sees used_at set.
create or replace function public.redeem_invite(invite_code text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  normalized text := upper(trim(invite_code));
  caller_verified_at timestamptz;
  inviter uuid;
  spent timestamptz;
begin
  if caller is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;

  select verified_at into caller_verified_at
  from public.profiles
  where id = caller
  for update;

  if caller_verified_at is not null then
    raise exception 'Already verified' using errcode = 'P0001';
  end if;

  select i.created_by, i.used_at into inviter, spent
  from public.invites i
  where i.code = normalized
  for update;

  -- Codes from a member who lost verification are void, so they read as
  -- invalid rather than revealing that the inviter was removed.
  if not found
    or (
      inviter is not null
      and not exists (
        select 1 from public.profiles p
        where p.id = inviter and p.verified_at is not null
      )
    )
  then
    raise exception 'Invalid invite code' using errcode = 'P0001';
  end if;

  if spent is not null then
    raise exception 'Invite code already used' using errcode = 'P0001';
  end if;

  update public.invites
  set used_by = caller, used_at = now()
  where code = normalized;

  update public.profiles
  set verified_at = now(), invited_by = inviter
  where id = caller;

  insert into public.invites (code, created_by)
  select private.generate_invite_code(), caller
  from generate_series(1, 3);
end;
$$;

-------------------------------------------------------------------------------
-- Contacts: readable by verified members when the owner shares them
-------------------------------------------------------------------------------

-- The exists() runs under the profiles policies, so contacts follow the
-- owner's profile: verified viewer, visible member, no block either way.
create policy "Verified members can read shared contacts of visible members"
  on public.contacts for select
  to authenticated
  using (
    share_with_verified
    and (select private.is_verified())
    and exists (select 1 from public.profiles p where p.id = contacts.profile_id)
  );

-------------------------------------------------------------------------------
-- Member counts per city
-------------------------------------------------------------------------------

-- security_invoker makes the view run under the caller's RLS, so a count is
-- exactly the members that caller would see on the city page: verified,
-- visible, and not blocked. Unverified users get no rows at all.
create view public.city_member_counts
with (security_invoker = true)
as
select
  c.id,
  c.slug,
  c.name_en,
  c.name_tk,
  c.country_code,
  c.group_url,
  count(p.id)::integer as member_count
from public.cities c
left join public.profiles p
  on p.city_id = c.id
  and p.verified_at is not null
  and p.is_visible
group by c.id;

revoke all on public.city_member_counts from anon, authenticated;
grant select on public.city_member_counts to authenticated;
