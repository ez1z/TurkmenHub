-- Open sign-up: anyone who signs in with Google is a member straight away.
-- Invite codes are gone.
--
-- verified_at stays, and every policy still checks it, but it now means
-- "member since" rather than "redeemed a code". It's set when the account is
-- created. Setting it back to null by hand still locks a member out of
-- everything, and signing in again doesn't undo that: the trigger only runs
-- for new accounts.

-------------------------------------------------------------------------------
-- New accounts are verified on creation
-------------------------------------------------------------------------------

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, verified_at) values (new.id, now());
  return new;
end;
$$;

-- People who signed in but never had a code get in now too.
update public.profiles set verified_at = now() where verified_at is null;

-------------------------------------------------------------------------------
-- Invite codes
-------------------------------------------------------------------------------

drop function public.redeem_invite(text);
drop function private.generate_invite_code();
drop table public.invites;

-- Who invited whom only mattered for tracing a bad branch of invites. Its
-- index goes with it.
alter table public.profiles drop column invited_by;
