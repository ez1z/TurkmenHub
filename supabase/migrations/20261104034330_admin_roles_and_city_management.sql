-- Admins, and the city management they do from the app's Admin page.
--
-- Roles:
--   * superuser  at most one: the founder. Everything an admin can do, and
--                the one who decides who the admins are.
--   * admin      can add, edit, merge and delete cities. Never member data.
--   * member     everyone else; nothing here changes for them.
--
-- A country isn't stored on its own: a city carries its ISO country code, and
-- the app turns that into a name. Adding a country means adding its first
-- city.

-------------------------------------------------------------------------------
-- Who is an admin
-------------------------------------------------------------------------------

-- Kept apart from profiles, which other members can read, so being an admin
-- isn't visible to them.
create table public.admins (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  is_superuser boolean not null default false,
  created_at timestamptz not null default now()
);

-- At most one superuser.
create unique index admins_one_superuser_idx on public.admins (is_superuser)
  where is_superuser;

-- An admin who lost verification has no say until they're verified again.
create function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admins a
    join public.profiles p on p.id = a.profile_id
    where a.profile_id = (select auth.uid()) and p.verified_at is not null
  );
$$;

revoke execute on function private.is_admin() from public, anon;
grant execute on function private.is_admin() to authenticated;

revoke all on public.admins from anon, authenticated;
grant select on public.admins to authenticated;

alter table public.admins enable row level security;

-- Enough for the app to know whether to show the Admin page. Admins are
-- added by the superuser (or, for the superuser, by hand in SQL).
create policy "Users can read their own admin row"
  on public.admins for select
  to authenticated
  using (profile_id = (select auth.uid()));

-------------------------------------------------------------------------------
-- Cities: admins add, edit and delete them
-------------------------------------------------------------------------------

grant insert (slug, name_en, name_tk, country_code, group_url) on public.cities to authenticated;
grant update (slug, name_en, name_tk, country_code, group_url) on public.cities to authenticated;
grant delete on public.cities to authenticated;

create policy "Admins can add cities"
  on public.cities for insert
  to authenticated
  with check ((select private.is_admin()));

create policy "Admins can edit cities"
  on public.cities for update
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- profiles.city_id has no ON DELETE action, so a city anyone still lives in
-- (visible or not) can't be deleted; it has to be merged instead.
create policy "Admins can delete cities"
  on public.cities for delete
  to authenticated
  using ((select private.is_admin()));

-------------------------------------------------------------------------------
-- admin_cities: every city with how many people live there
-------------------------------------------------------------------------------

-- city_member_counts only counts members the caller may see, so a city of
-- hidden members would look empty. Admins need the real number to know
-- whether a city can be deleted. It's a count only: no member is named.
-- Returns nothing for anyone who isn't an admin.
create function public.admin_cities()
returns table (
  id bigint,
  slug text,
  name_en text,
  name_tk text,
  country_code text,
  group_url text,
  member_count integer
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    c.id,
    c.slug,
    c.name_en,
    c.name_tk,
    c.country_code::text,
    c.group_url,
    (select count(*)::integer from public.profiles p where p.city_id = c.id)
  from public.cities c
  where (select private.is_admin());
$$;

revoke execute on function public.admin_cities() from public, anon;
grant execute on function public.admin_cities() to authenticated;

-------------------------------------------------------------------------------
-- merge_cities: move everyone from one city to another, then delete it
-------------------------------------------------------------------------------

-- For a duplicate or misspelt city. Members' city_id is theirs to set, so
-- this runs as the function owner; it changes nothing else about them.
--
-- Both city rows are locked first. A member saving their profile takes a
-- key-share lock on the city they pick, so nobody can move into the old city
-- between the update and the delete.
create function public.merge_cities(from_city bigint, into_city bigint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (select private.is_admin()) then
    raise exception 'Not allowed' using errcode = '42501';
  end if;

  if from_city = into_city then
    raise exception 'Cannot merge a city into itself' using errcode = 'P0001';
  end if;

  perform 1 from public.cities where id in (from_city, into_city) for update;
  if (select count(*) from public.cities where id in (from_city, into_city)) <> 2 then
    raise exception 'City not found' using errcode = 'P0002';
  end if;

  update public.profiles set city_id = into_city where city_id = from_city;
  delete from public.cities where id = from_city;
end;
$$;

revoke execute on function public.merge_cities(bigint, bigint) from public, anon;
grant execute on function public.merge_cities(bigint, bigint) to authenticated;
