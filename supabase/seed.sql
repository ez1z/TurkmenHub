-- Local development data, loaded by `npx supabase db reset` (see [db.seed] in
-- config.toml). Never run against production.

insert into public.cities (slug, name_en, name_tk, country_code, group_url) values
  ('kuala-lumpur', 'Kuala Lumpur', 'Kuala-Lumpur', 'MY', 'https://chat.whatsapp.com/LOCALDEVGROUP'),
  ('istanbul',     'Istanbul',     'Stambul',      'TR', null),
  ('berlin',       'Berlin',       'Berlin',       'DE', null)
on conflict (slug) do nothing;

-- Founder codes: no created_by, so they work without an inviting member.
-- Each one verifies exactly one account.
insert into public.invites (code, created_by) values
  ('LOCALDEV01', null),
  ('LOCALDEV02', null),
  ('LOCALDEV03', null)
on conflict (code) do nothing;
