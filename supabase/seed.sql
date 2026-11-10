-- Local development data, loaded by `npx supabase db reset` (see [db.seed] in
-- config.toml). Never run against production.

insert into public.cities (slug, name_en, name_tk, country_code, group_url) values
  ('kuala-lumpur', 'Kuala Lumpur', 'Kuala-Lumpur', 'MY', 'https://chat.whatsapp.com/LOCALDEVGROUP'),
  ('istanbul',     'Istanbul',     'Stambul',      'TR', null),
  ('berlin',       'Berlin',       'Berlin',       'DE', null)
on conflict (slug) do nothing;

