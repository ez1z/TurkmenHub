-- Contact settings: digits-only WhatsApp numbers and a sharing toggle.

-- WhatsApp numbers are stored as digits only, country code first and no "+",
-- which is the form https://wa.me/<digits> expects.
alter table public.contacts drop constraint contacts_whatsapp_check;
update public.contacts set whatsapp = ltrim(whatsapp, '+') where whatsapp like '+%';
alter table public.contacts add constraint contacts_whatsapp_check
  check (whatsapp ~ '^[1-9][0-9]{6,14}$');

-- The member's choice to share their contacts with verified members.
alter table public.contacts
  add column share_with_verified boolean not null default false;

-- Until member profiles exist, contacts are readable only by their owner
-- ("Users can manage their own contacts"). The policy that lets verified
-- members read them, and honors share_with_verified, comes with that screen.
drop policy "Verified members can read contacts of visible members" on public.contacts;
