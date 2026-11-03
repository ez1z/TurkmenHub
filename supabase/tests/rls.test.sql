-- RLS and invite tests. Run with `npx supabase test db` (local stack must be
-- running). Everything happens in one transaction that is rolled back, so the
-- local database is left as it was.
--
-- Each block impersonates a user the way PostgREST does: switch to the
-- authenticated (or anon) role and set the JWT claims auth.uid() reads.
-- Fixtures are written as postgres, which bypasses RLS. Queries are scoped to
-- the fixtures, so data already in the database doesn't affect the results.
--
--   alice  verified, visible, shares contacts
--   bob    verified, visible, does not share contacts
--   carol  verified, hidden, shares contacts
--   frank  verified, visible, shares contacts (later blocks dave)
--   dave   unverified, redeems the founder code
--   erin   unverified, redeems one of dave's codes
--   gina   unverified, tries to reuse codes

begin;

create extension if not exists pgtap with schema extensions;

select plan(38);

-------------------------------------------------------------------------------
-- Fixtures
-------------------------------------------------------------------------------

insert into auth.users (id, email) values
  ('a0000000-0000-0000-0000-000000000000', 'alice@test.local'),
  ('b0000000-0000-0000-0000-000000000000', 'bob@test.local'),
  ('c0000000-0000-0000-0000-000000000000', 'carol@test.local'),
  ('d0000000-0000-0000-0000-000000000000', 'dave@test.local'),
  ('e0000000-0000-0000-0000-000000000000', 'erin@test.local'),
  ('f0000000-0000-0000-0000-000000000000', 'frank@test.local'),
  ('90000000-0000-0000-0000-000000000000', 'gina@test.local');

insert into public.cities (slug, name_en, name_tk, country_code)
values ('test-city', 'Test City', 'Test Şäheri', 'MY');

update public.profiles
set verified_at = now(),
    nickname = initcap(split_part(u.email, '@', 1)),
    city_id = (select id from public.cities where slug = 'test-city'),
    is_visible = u.email <> 'carol@test.local'
from auth.users u
where u.id = profiles.id
  and u.email in ('alice@test.local', 'bob@test.local', 'carol@test.local', 'frank@test.local');

insert into public.contacts (profile_id, whatsapp, telegram, share_with_verified) values
  ('a0000000-0000-0000-0000-000000000000', '60111111111', 'alice_tg', true),
  ('b0000000-0000-0000-0000-000000000000', '60122222222', null,       false),
  ('c0000000-0000-0000-0000-000000000000', '60133333333', null,       true),
  ('f0000000-0000-0000-0000-000000000000', '60144444444', null,       true);

insert into public.invites (code, created_by) values ('TESTFOUNDER1', null);

-------------------------------------------------------------------------------
-- Unverified users can read nothing but their own profile
-------------------------------------------------------------------------------

set local role authenticated;
set local request.jwt.claims to '{"sub":"d0000000-0000-0000-0000-000000000000","role":"authenticated"}';

select results_eq(
  'select id from public.profiles',
  $$ values ('d0000000-0000-0000-0000-000000000000'::uuid) $$,
  'unverified: sees only their own profile'
);
select is_empty('select 1 from public.cities', 'unverified: cannot read cities');
select is_empty('select 1 from public.contacts', 'unverified: cannot read contacts');
select is_empty('select 1 from public.invites', 'unverified: cannot read invites');
select is_empty('select 1 from public.city_member_counts', 'unverified: cannot read member counts');

-------------------------------------------------------------------------------
-- redeem_invite: a founder code verifies once and hands out 3 codes
-------------------------------------------------------------------------------

select lives_ok(
  $$ select public.redeem_invite(' testfounder1 ') $$,
  'founder code redeems (case and spaces ignored)'
);
select isnt(
  (select verified_at from public.profiles where id = 'd0000000-0000-0000-0000-000000000000'),
  null,
  'redeeming sets verified_at'
);
select results_eq(
  $$ select count(*)::int, count(*) filter (where used_at is null)::int from public.invites
     where created_by = 'd0000000-0000-0000-0000-000000000000' $$,
  $$ values (3, 3) $$,
  'redeeming creates 3 unused codes owned by the user'
);
select results_eq(
  'select count(*)::int from public.invites',
  $$ values (3) $$,
  'members see only the codes they created'
);
select throws_ok(
  $$ select public.redeem_invite('TESTFOUNDER1') $$,
  'P0001', 'Already verified',
  'a verified member cannot redeem another code'
);

set local request.jwt.claims to '{"sub":"e0000000-0000-0000-0000-000000000000","role":"authenticated"}';

select throws_ok(
  $$ select public.redeem_invite('TESTFOUNDER1') $$,
  'P0001', 'Invite code already used',
  'a founder code cannot be used twice'
);
select throws_ok(
  $$ select public.redeem_invite('NOSUCHCODE') $$,
  'P0001', 'Invalid invite code',
  'an unknown code is rejected'
);

-- Erin uses one of Dave's codes. Codes are random, so read one as postgres.
reset role;
select set_config(
  'tests.daves_code',
  (select code from public.invites
   where created_by = 'd0000000-0000-0000-0000-000000000000'
   order by code limit 1),
  true
);
set local role authenticated;

select lives_ok(
  $$ select public.redeem_invite(current_setting('tests.daves_code')) $$,
  'a member''s code redeems'
);
select is(
  (select invited_by from public.profiles where id = 'e0000000-0000-0000-0000-000000000000'),
  'd0000000-0000-0000-0000-000000000000'::uuid,
  'redeeming records who invited the user'
);

set local request.jwt.claims to '{"sub":"90000000-0000-0000-0000-000000000000","role":"authenticated"}';

select throws_ok(
  $$ select public.redeem_invite(current_setting('tests.daves_code')) $$,
  'P0001', 'Invite code already used',
  'a member''s code cannot be used twice'
);
select is(
  (select verified_at from public.profiles where id = '90000000-0000-0000-0000-000000000000'),
  null,
  'a failed redeem leaves the user unverified'
);

-------------------------------------------------------------------------------
-- Verified members see visible members, and shared contacts only
-------------------------------------------------------------------------------

set local request.jwt.claims to '{"sub":"d0000000-0000-0000-0000-000000000000","role":"authenticated"}';

select set_eq(
  $$ select nickname from public.profiles
     where city_id = (select id from public.cities where slug = 'test-city') $$,
  array['Alice', 'Bob', 'Frank'],
  'verified: sees visible members, not hidden ones'
);
select isnt_empty(
  $$ select 1 from public.cities where slug = 'test-city' $$,
  'verified: can read cities'
);
select set_eq(
  $$ select profile_id from public.contacts
     where profile_id in (
       'a0000000-0000-0000-0000-000000000000', 'b0000000-0000-0000-0000-000000000000',
       'c0000000-0000-0000-0000-000000000000', 'f0000000-0000-0000-0000-000000000000'
     ) $$,
  array['a0000000-0000-0000-0000-000000000000', 'f0000000-0000-0000-0000-000000000000']::uuid[],
  'verified: sees contacts only of visible members who share them'
);
select results_eq(
  $$ select member_count from public.city_member_counts where slug = 'test-city' $$,
  $$ values (3) $$,
  'member count includes only visible verified members'
);

-------------------------------------------------------------------------------
-- Blocks hide members, and their contacts, in both directions
-------------------------------------------------------------------------------

set local request.jwt.claims to '{"sub":"f0000000-0000-0000-0000-000000000000","role":"authenticated"}';

select lives_ok(
  $$ insert into public.blocks (blocked_id) values ('d0000000-0000-0000-0000-000000000000') $$,
  'a verified member can block'
);

set local request.jwt.claims to '{"sub":"d0000000-0000-0000-0000-000000000000","role":"authenticated"}';

select is_empty(
  $$ select 1 from public.profiles where id = 'f0000000-0000-0000-0000-000000000000' $$,
  'blocked: the blocker''s profile is hidden'
);
select is_empty(
  $$ select 1 from public.contacts where profile_id = 'f0000000-0000-0000-0000-000000000000' $$,
  'blocked: the blocker''s contacts are hidden'
);
select results_eq(
  $$ select member_count from public.city_member_counts where slug = 'test-city' $$,
  $$ values (2) $$,
  'member count leaves out blocked members'
);

-- Contacts the owner doesn't share stay hidden even for a direct lookup.
select is_empty(
  $$ select 1 from public.contacts where profile_id = 'b0000000-0000-0000-0000-000000000000' $$,
  'unshared contacts are hidden'
);

-------------------------------------------------------------------------------
-- Reports are write-only, and only for verified members
-------------------------------------------------------------------------------

set local request.jwt.claims to '{"sub":"a0000000-0000-0000-0000-000000000000","role":"authenticated"}';

select lives_ok(
  $$ insert into public.reports (reported_id, reason, details)
     values ('b0000000-0000-0000-0000-000000000000', 'spam', 'Selling things') $$,
  'a verified member can report'
);
select throws_ok(
  'select 1 from public.reports',
  '42501', null,
  'reports: members cannot read them back'
);

set local request.jwt.claims to '{"sub":"90000000-0000-0000-0000-000000000000","role":"authenticated"}';

select throws_ok(
  $$ insert into public.reports (reported_id, reason)
     values ('b0000000-0000-0000-0000-000000000000', 'spam') $$,
  '42501', null,
  'an unverified user cannot report'
);

-------------------------------------------------------------------------------
-- delete_account: nothing that points at the member survives
-------------------------------------------------------------------------------

-- Alice already reported Bob above. Add a block each way, a report about her,
-- one of her invite codes and an audit log entry with her email.
reset role;
insert into public.blocks (blocker_id, blocked_id) values
  ('a0000000-0000-0000-0000-000000000000', 'c0000000-0000-0000-0000-000000000000'),
  ('c0000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000000');
insert into public.reports (reporter_id, reported_id, reason) values
  ('b0000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000000', 'fake');
insert into public.invites (code, created_by) values
  ('TESTALICE1', 'a0000000-0000-0000-0000-000000000000');
insert into auth.audit_log_entries (id, payload) values
  (gen_random_uuid(), '{"action":"login","actor_id":"a0000000-0000-0000-0000-000000000000","actor_username":"alice@test.local"}');

set local role authenticated;
set local request.jwt.claims to '{"sub":"a0000000-0000-0000-0000-000000000000","role":"authenticated"}';

select lives_ok('select public.delete_account()', 'a member can delete their account');

reset role;

select is_empty(
  $$ select 1 from auth.users where id = 'a0000000-0000-0000-0000-000000000000' $$,
  'delete_account: the auth user is gone'
);
select is_empty(
  $$ select 1 from auth.audit_log_entries where payload::text like '%alice%'
     or payload::text like '%a0000000-0000-0000-0000-000000000000%' $$,
  'delete_account: their audit log entries are gone'
);
-- Every foreign key in public that points at profiles: none may still hold
-- Alice's id. Catches a future table that forgets ON DELETE CASCADE.
select is(
  (select sum(n)::integer from (
    select (xpath('/row/n/text()', query_to_xml(format(
      'select count(*) as n from %s where %I = %L',
      c.conrelid::regclass, a.attname, 'a0000000-0000-0000-0000-000000000000'
    ), false, true, '')))[1]::text::integer as n
    from pg_constraint c
    join pg_attribute a on a.attrelid = c.conrelid and a.attnum = any (c.conkey)
    where c.contype = 'f' and c.confrelid = 'public.profiles'::regclass
  ) as refs),
  0,
  'delete_account: no row in public references the member'
);
select results_eq(
  $$ select reporter_id, reason from public.reports where reported_id = 'b0000000-0000-0000-0000-000000000000' $$,
  $$ values (null::uuid, 'spam'::text) $$,
  'delete_account: reports they filed stay, without saying who filed them'
);
select is_empty(
  $$ select 1 from public.invites where code = 'TESTALICE1' $$,
  'delete_account: their invite codes are gone'
);

-------------------------------------------------------------------------------
-- Signed-out visitors can't redeem or delete, but can keep the project awake
-------------------------------------------------------------------------------

set local role anon;
set local request.jwt.claims to '{"role":"anon"}';

select throws_ok(
  $$ select public.redeem_invite('LOCALDEV02') $$,
  '42501', null,
  'anon cannot call redeem_invite'
);
select throws_ok(
  'select public.delete_account()',
  '42501', null,
  'anon cannot call delete_account'
);
select throws_ok(
  'select 1 from public.city_member_counts',
  '42501', null,
  'anon cannot read member counts'
);
select is(public.keep_alive(), 1, 'anon can call keep_alive');

select * from finish();
rollback;
