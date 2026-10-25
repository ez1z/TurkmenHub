-- TurkmenHub initial schema: cities, profiles, contacts, invites, blocks, reports.
--
-- Access model (enforced by RLS, not the app):
--   * A user is "verified" once they redeem an invite (profiles.verified_at).
--   * Unverified users can read nothing except their own profile.
--   * Verified users see other verified, visible, non-blocked members.
--   * Contact details live in their own table and are readable only by
--     verified members, for profiles they are allowed to see.

-- Helpers that must bypass RLS live in a schema the Data API does not expose.
create schema private;
grant usage on schema private to authenticated;

-------------------------------------------------------------------------------
-- Tables
-------------------------------------------------------------------------------

create table public.cities (
  id bigint generated always as identity primary key,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name_en text not null,
  name_tk text not null,
  country_code char(2) not null check (country_code ~ '^[A-Z]{2}$'),
  -- Optional link to the city's WhatsApp/Telegram group.
  group_url text check (group_url ~ '^https://'),
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  -- Nickname and city are filled in during profile setup, so they start null.
  nickname text check (char_length(nickname) between 2 and 30),
  city_id bigint references public.cities (id),
  bio text check (char_length(bio) <= 500),
  is_visible boolean not null default false,
  locale text not null default 'tk' check (locale in ('tk', 'en')),
  -- Set only by redeem_invite(); null means unverified.
  verified_at timestamptz,
  -- Who invited this member, so a bad branch can be traced and removed.
  invited_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_city_id_idx on public.profiles (city_id)
  where verified_at is not null and is_visible;
create index profiles_invited_by_idx on public.profiles (invited_by);

-- Kept apart from profiles so contact details have their own access rules.
-- A null column means the member chose not to share that channel.
create table public.contacts (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  -- E.164 phone number, used for https://wa.me/<digits>.
  whatsapp text check (whatsapp ~ '^\+[1-9][0-9]{6,14}$'),
  -- Username without the @, used for https://t.me/<username>.
  telegram text check (telegram ~ '^[A-Za-z0-9_]{5,32}$'),
  updated_at timestamptz not null default now()
);

create table public.invites (
  code text primary key,
  -- Null for codes issued by the founder.
  created_by uuid references public.profiles (id) on delete cascade,
  used_by uuid unique references public.profiles (id) on delete set null,
  -- Marks the code as spent. Stays set if the user later deletes their account
  -- (used_by becomes null), so a code can never be redeemed twice.
  used_at timestamptz,
  created_at timestamptz not null default now(),
  check (used_by is null or used_at is not null)
);

create index invites_created_by_idx on public.invites (created_by);

create table public.blocks (
  blocker_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create index blocks_blocked_id_idx on public.blocks (blocked_id);

create table public.reports (
  id bigint generated always as identity primary key,
  -- Kept when the reporter deletes their account, so moderation history survives.
  reporter_id uuid default auth.uid() references public.profiles (id) on delete set null,
  reported_id uuid not null references public.profiles (id) on delete cascade,
  reason text not null check (reason in ('spam', 'harassment', 'political', 'fake', 'other')),
  details text check (char_length(details) <= 1000),
  created_at timestamptz not null default now(),
  check (reporter_id <> reported_id)
);

create index reports_reporter_id_idx on public.reports (reporter_id);
create index reports_reported_id_idx on public.reports (reported_id);

-------------------------------------------------------------------------------
-- Functions and triggers
-------------------------------------------------------------------------------

create function private.is_verified()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and verified_at is not null
  );
$$;

-- Users hidden from the caller: those they blocked and those who blocked them.
create function private.blocked_user_ids()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select blocked_id from public.blocks where blocker_id = (select auth.uid())
  union
  select blocker_id from public.blocks where blocked_id = (select auth.uid());
$$;

-- 10 characters from a 32-symbol alphabet without 0/O/1/I. 256 is a multiple
-- of 32, so "byte % 32" picks every symbol with equal probability.
create function private.generate_invite_code()
returns text
language sql
volatile
set search_path = ''
as $$
  select string_agg(
    substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', get_byte(b, i) % 32 + 1, 1), ''
  )
  from extensions.gen_random_bytes(10) as b, generate_series(0, 9) as i;
$$;

create function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Every new auth user gets an empty, unverified profile. The Google name is
-- deliberately not copied: real names are optional in TurkmenHub.
create function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function private.set_updated_at();

create trigger contacts_set_updated_at
  before update on public.contacts
  for each row execute function private.set_updated_at();

-- Verifies the caller with an unused invite code and gives them 3 invites of
-- their own. Lives in public so the app can call it via supabase.rpc(); it only
-- ever acts on auth.uid(). Codes from a member who lost verification are void.
create function public.redeem_invite(invite_code text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  inviter uuid;
begin
  if caller is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;

  if exists (
    select 1 from public.profiles where id = caller and verified_at is not null
  ) then
    raise exception 'Already verified' using errcode = 'P0001';
  end if;

  update public.invites i
  set used_by = caller, used_at = now()
  where i.code = upper(trim(invite_code))
    and i.used_at is null
    and (
      i.created_by is null
      or exists (
        select 1 from public.profiles p
        where p.id = i.created_by and p.verified_at is not null
      )
    )
  returning i.created_by into inviter;

  if not found then
    raise exception 'Invalid or already used invite code' using errcode = 'P0001';
  end if;

  update public.profiles
  set verified_at = now(), invited_by = inviter
  where id = caller;

  insert into public.invites (code, created_by)
  select private.generate_invite_code(), caller
  from generate_series(1, 3);
end;
$$;

-- Postgres grants EXECUTE to PUBLIC by default; narrow it to signed-in users.
revoke execute on all functions in schema private from public, anon;
grant execute on function private.is_verified() to authenticated;
grant execute on function private.blocked_user_ids() to authenticated;
revoke execute on function public.redeem_invite(text) from public, anon;
grant execute on function public.redeem_invite(text) to authenticated;

-------------------------------------------------------------------------------
-- Privileges: start from nothing, then grant exactly what the app needs.
-- Column-level UPDATE on profiles only works without a table-level grant.
-------------------------------------------------------------------------------

revoke all on public.cities, public.profiles, public.contacts,
  public.invites, public.blocks, public.reports
  from anon, authenticated;

grant select on public.cities to authenticated;
grant select on public.profiles to authenticated;
grant update (nickname, city_id, bio, is_visible, locale) on public.profiles to authenticated;
grant select, insert, update, delete on public.contacts to authenticated;
grant select on public.invites to authenticated;
grant select, insert, delete on public.blocks to authenticated;
grant insert on public.reports to authenticated;

-------------------------------------------------------------------------------
-- Row level security
-------------------------------------------------------------------------------

alter table public.cities enable row level security;
alter table public.profiles enable row level security;
alter table public.contacts enable row level security;
alter table public.invites enable row level security;
alter table public.blocks enable row level security;
alter table public.reports enable row level security;

-- Cities are managed by the founder (SQL/dashboard); members only read them.
create policy "Verified members can read cities"
  on public.cities for select
  to authenticated
  using ((select private.is_verified()));

create policy "Users can read their own profile"
  on public.profiles for select
  to authenticated
  using (id = (select auth.uid()));

create policy "Verified members can read visible members"
  on public.profiles for select
  to authenticated
  using (
    (select private.is_verified())
    and verified_at is not null
    and is_visible
    and id not in (select private.blocked_user_ids())
  );

create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy "Users can manage their own contacts"
  on public.contacts for all
  to authenticated
  using (profile_id = (select auth.uid()))
  with check (profile_id = (select auth.uid()));

-- Visible exactly when the owner's profile is: the subquery runs under the
-- profiles policies above (verified viewer, visible member, not blocked).
create policy "Verified members can read contacts of visible members"
  on public.contacts for select
  to authenticated
  using (
    (select private.is_verified())
    and exists (select 1 from public.profiles p where p.id = contacts.profile_id)
  );

-- Inviters see their own codes to share them. Redemption goes through
-- redeem_invite(), so there are no write policies.
create policy "Members can read invites they created"
  on public.invites for select
  to authenticated
  using (created_by = (select auth.uid()));

-- Only the blocker sees a block; the blocked member just stops seeing them.
create policy "Users can read their own blocks"
  on public.blocks for select
  to authenticated
  using (blocker_id = (select auth.uid()));

create policy "Verified members can block"
  on public.blocks for insert
  to authenticated
  with check (blocker_id = (select auth.uid()) and (select private.is_verified()));

create policy "Users can unblock"
  on public.blocks for delete
  to authenticated
  using (blocker_id = (select auth.uid()));

-- Reports are write-only for members and reviewed by the founder.
create policy "Verified members can report"
  on public.reports for insert
  to authenticated
  with check (reporter_id = (select auth.uid()) and (select private.is_verified()));
