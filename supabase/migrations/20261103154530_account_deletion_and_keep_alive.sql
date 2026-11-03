-- Account deletion for members, and a no-op the keep-alive job can call.

-------------------------------------------------------------------------------
-- delete_account: a member deletes themselves
-------------------------------------------------------------------------------

-- Deleting the auth user is enough for everything that is theirs, through
-- ON DELETE CASCADE: the profile, and from it contacts, blocks (both ways),
-- reports about them and invite codes they created; in auth, their identities,
-- sessions and refresh tokens. Links from other people's rows are set null
-- instead: the profiles they invited (invited_by), the code they redeemed
-- (used_by, so it stays spent) and reports they filed (reporter_id, so
-- moderation history survives without saying who reported).
--
-- The auth audit log has no foreign key and records the email address, so its
-- entries for this user are removed by hand.
--
-- Runs as the function owner, since members can't touch auth.users. It only
-- ever acts on auth.uid(), so it can't be used to delete anyone else.
create function public.delete_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  caller_email text;
begin
  if caller is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;

  delete from auth.users where id = caller returning email into caller_email;

  delete from auth.audit_log_entries
  where payload ->> 'actor_id' = caller::text
    or payload -> 'traits' ->> 'user_id' = caller::text
    or (caller_email is not null and (
      payload ->> 'actor_username' = caller_email
      or payload -> 'traits' ->> 'user_email' = caller_email
    ));
end;
$$;

revoke execute on function public.delete_account() from public, anon;
grant execute on function public.delete_account() to authenticated;

-------------------------------------------------------------------------------
-- keep_alive: a cheap query for the scheduled GitHub Actions job
-------------------------------------------------------------------------------

-- Free Supabase projects pause after a week without database activity. The
-- daily job calls this with the anon key; it reads nothing and returns 1.
create function public.keep_alive()
returns integer
language sql
stable
set search_path = ''
as $$
  select 1;
$$;

revoke execute on function public.keep_alive() from public;
grant execute on function public.keep_alive() to anon, authenticated;
