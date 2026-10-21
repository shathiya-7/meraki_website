create extension if not exists pgcrypto;

create table if not exists public.movies (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  release_year integer not null check (release_year between 1888 and 2100),
  language text not null check (language in ('Tamil', 'English', 'Hindi', 'Telugu', 'Malayalam', 'Kannada', 'Other')),
  image_url text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (language, title)
);

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.game_entries (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  roll_number text not null,
  language text not null check (language in ('Tamil', 'English', 'Hindi', 'Telugu', 'Malayalam', 'Kannada', 'Other')),
  movie_id uuid not null references public.movies(id),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  answer text,
  status text check (status in ('correct', 'incorrect', 'timeout')),
  elapsed_seconds numeric(6, 2) check (elapsed_seconds between 0 and 60),
  created_at timestamptz not null default now(),
  constraint game_entries_roll_number_format check (roll_number ~ '^[A-Z0-9]{9}$'),
  constraint game_entries_completion_consistent check (
    (finished_at is null and status is null and elapsed_seconds is null)
    or (finished_at is not null and status is not null and elapsed_seconds is not null)
  )
);

create unique index if not exists game_entries_roll_number_unique
  on public.game_entries (upper(roll_number));

create table if not exists public.event_settings (
  id integer primary key check (id = 1),
  is_open boolean not null default true,
  updated_at timestamptz not null default now()
);

insert into public.event_settings (id, is_open)
values (1, true)
on conflict (id) do nothing;

insert into public.movies (title, release_year, language) values
  ('Enthiran', 2010, 'Tamil'), ('Aadukalam', 2011, 'Tamil'), ('Thuppakki', 2012, 'Tamil'),
  ('Raja Rani', 2013, 'Tamil'), ('Kaththi', 2014, 'Tamil'), ('Thani Oruvan', 2015, 'Tamil'),
  ('Kabali', 2016, 'Tamil'), ('Vikram Vedha', 2017, 'Tamil'), ('96', 2018, 'Tamil'),
  ('Kaithi', 2019, 'Tamil'),
  ('Inception', 2010, 'English'), ('Interstellar', 2014, 'English'), ('Whiplash', 2014, 'English'),
  ('Mad Max: Fury Road', 2015, 'English'), ('La La Land', 2016, 'English'), ('Get Out', 2017, 'English'),
  ('Coco', 2017, 'English'), ('Avengers: Endgame', 2019, 'English'), ('Joker', 2019, 'English'),
  ('Tenet', 2020, 'English'),
  ('Zindagi Na Milegi Dobara', 2011, 'Hindi'), ('Barfi!', 2012, 'Hindi'), ('Queen', 2013, 'Hindi'),
  ('PK', 2014, 'Hindi'), ('Bajrangi Bhaijaan', 2015, 'Hindi'), ('Dangal', 2016, 'Hindi'),
  ('Hindi Medium', 2017, 'Hindi'), ('Andhadhun', 2018, 'Hindi'), ('Gully Boy', 2019, 'Hindi'),
  ('Ludo', 2020, 'Hindi'),
  ('Eega', 2012, 'Telugu'), ('Mirchi', 2013, 'Telugu'), ('Manam', 2014, 'Telugu'),
  ('Baahubali: The Beginning', 2015, 'Telugu'), ('Kshanam', 2016, 'Telugu'), ('Arjun Reddy', 2017, 'Telugu'),
  ('Rangasthalam', 2018, 'Telugu'), ('Jersey', 2019, 'Telugu'), ('Ala Vaikunthapurramuloo', 2020, 'Telugu'),
  ('Colour Photo', 2020, 'Telugu'),
  ('Drishyam', 2013, 'Malayalam'), ('Bangalore Days', 2014, 'Malayalam'), ('Premam', 2015, 'Malayalam'),
  ('Charlie', 2015, 'Malayalam'), ('Maheshinte Prathikaaram', 2016, 'Malayalam'),
  ('Kumbalangi Nights', 2019, 'Malayalam'), ('Take Off', 2017, 'Malayalam'), ('Uyare', 2019, 'Malayalam'),
  ('Ayyappanum Koshiyum', 2020, 'Malayalam'), ('Minnal Murali', 2021, 'Malayalam'),
  ('Lucia', 2013, 'Kannada'), ('U Turn', 2016, 'Kannada'), ('Kirik Party', 2016, 'Kannada'),
  ('Rangitaranga', 2015, 'Kannada'), ('Avane Srimannarayana', 2019, 'Kannada'), ('Dia', 2020, 'Kannada'),
  ('Garuda Gamana Vrishabha Vahana', 2021, 'Kannada'), ('777 Charlie', 2022, 'Kannada'),
  ('Kantara', 2022, 'Kannada'), ('Sapta Sagaradaache Ello', 2023, 'Kannada'),
  ('Parasite', 2019, 'Other'), ('Spirited Away', 2001, 'Other'), ('Amélie', 2001, 'Other'),
  ('Pan''s Labyrinth', 2006, 'Other'), ('Roma', 2018, 'Other'), ('Cinema Paradiso', 1988, 'Other'),
  ('The Lives of Others', 2006, 'Other'), ('Run Lola Run', 1998, 'Other'),
  ('Crouching Tiger, Hidden Dragon', 2000, 'Other'), ('The Intouchables', 2011, 'Other')
on conflict (language, title) do nothing;

create or replace function public.is_event_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admin_users
    where user_id = (select auth.uid())
  );
$$;

create or replace function public.register_game(p_full_name text, p_roll_number text, p_language text)
returns table (
  entry_id uuid,
  movie_title text,
  movie_year integer,
  movie_language text,
  movie_image_url text,
  started_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized_roll text := upper(trim(p_roll_number));
  normalized_language text;
  selected_movie public.movies%rowtype;
  inserted_entry public.game_entries%rowtype;
begin
  if length(trim(p_full_name)) < 3 or length(trim(p_full_name)) > 120 then
    raise exception 'Enter a full name between 3 and 120 characters.';
  end if;
  if normalized_roll !~ '^[A-Z0-9]{9}$' then
    raise exception 'College roll number must contain exactly 9 letters or numbers.';
  end if;

  normalized_language := case lower(trim(p_language))
    when 'tamil' then 'Tamil'
    when 'english' then 'English'
    when 'hindi' then 'Hindi'
    when 'telugu' then 'Telugu'
    when 'malayalam' then 'Malayalam'
    when 'kannada' then 'Kannada'
    when 'other' then 'Other'
    else null
  end;
  if normalized_language is null then
    raise exception 'Choose one of the supported movie languages.';
  end if;

  if not exists (select 1 from public.event_settings where id = 1 and is_open) then
    raise exception 'The event is currently closed.';
  end if;

  select * into selected_movie
  from public.movies m
  where m.language = normalized_language and m.active
  order by random()
  limit 1;
  if selected_movie.id is null then
    raise exception 'There are no active movies for this language.';
  end if;

  insert into public.game_entries (full_name, roll_number, language, movie_id)
  values (trim(p_full_name), normalized_roll, normalized_language, selected_movie.id)
  returning * into inserted_entry;

  return query select inserted_entry.id, selected_movie.title, selected_movie.release_year,
    selected_movie.language, selected_movie.image_url, inserted_entry.started_at;
exception
  when unique_violation then
    raise exception 'This roll number has already registered. One entry per participant.';
end;
$$;

create or replace function public.finish_game(p_entry_id uuid, p_answer text)
returns table (
  result_status text,
  movie_title text,
  movie_year integer,
  result_elapsed_seconds numeric(6, 2),
  result_finished_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  game public.game_entries%rowtype;
  selected_movie public.movies%rowtype;
  elapsed numeric;
  final_status text;
  completed_at timestamptz := clock_timestamp();
begin
  select * into game
  from public.game_entries g
  where g.id = p_entry_id
  for update;
  if game.id is null then
    raise exception 'Game entry not found.';
  end if;
  if game.finished_at is not null then
    raise exception 'This attempt has already been submitted.';
  end if;

  select * into selected_movie from public.movies m where m.id = game.movie_id;
  elapsed := greatest(0, extract(epoch from (completed_at - game.started_at)));

  if elapsed >= 60 then
    final_status := 'timeout';
  elsif regexp_replace(lower(trim(coalesce(p_answer, ''))), '\s+', ' ', 'g')
    = regexp_replace(lower(trim(selected_movie.title)), '\s+', ' ', 'g') then
    final_status := 'correct';
  else
    final_status := 'incorrect';
  end if;

  update public.game_entries
  set finished_at = completed_at,
      answer = nullif(trim(coalesce(p_answer, '')), ''),
      status = final_status,
      elapsed_seconds = round(least(elapsed, 60), 2)
  where id = game.id;

  return query select final_status, selected_movie.title, selected_movie.release_year,
    round(least(elapsed, 60), 2), completed_at;
end;
$$;

create or replace function public.get_leaderboard()
returns table (
  rank bigint,
  full_name text,
  masked_roll_number text,
  language text,
  elapsed_seconds numeric,
  prize text
)
language sql
stable
security definer
set search_path = ''
as $$
  select row_number() over (order by g.elapsed_seconds, g.finished_at)::bigint,
    g.full_name,
    left(g.roll_number, 3) || '••••' || right(g.roll_number, 2),
    g.language,
    g.elapsed_seconds,
    case row_number() over (order by g.elapsed_seconds, g.finished_at)
      when 1 then 'Meraki Hoodie'
      when 2 then 'Meraki T-shirt'
      else '—'
    end
  from public.game_entries g
  where g.status = 'correct'
  order by g.elapsed_seconds, g.finished_at;
$$;

alter table public.movies enable row level security;
alter table public.admin_users enable row level security;
alter table public.game_entries enable row level security;
alter table public.event_settings enable row level security;

drop policy if exists "Active movies are readable" on public.movies;
create policy "Active movies are readable" on public.movies
  for select to anon, authenticated
  using (active or (select public.is_event_admin()));
drop policy if exists "Admins manage movies" on public.movies;
create policy "Admins manage movies" on public.movies
  for all to authenticated
  using ((select public.is_event_admin()))
  with check ((select public.is_event_admin()));

drop policy if exists "Admins read admin users" on public.admin_users;
create policy "Admins read admin users" on public.admin_users
  for select to authenticated
  using ((select public.is_event_admin()));

drop policy if exists "Admins read game entries" on public.game_entries;
create policy "Admins read game entries" on public.game_entries
  for select to authenticated
  using ((select public.is_event_admin()));

drop policy if exists "Event status is public" on public.event_settings;
create policy "Event status is public" on public.event_settings
  for select to anon, authenticated using (true);
drop policy if exists "Admins manage event status" on public.event_settings;
create policy "Admins manage event status" on public.event_settings
  for update to authenticated
  using ((select public.is_event_admin()))
  with check ((select public.is_event_admin()));

revoke all on function public.is_event_admin() from public;
revoke all on function public.register_game(text, text, text) from public;
revoke all on function public.finish_game(uuid, text) from public;
revoke all on function public.get_leaderboard() from public;
grant execute on function public.is_event_admin() to authenticated;
grant execute on function public.register_game(text, text, text) to anon, authenticated;
grant execute on function public.finish_game(uuid, text) to anon, authenticated;
grant execute on function public.get_leaderboard() to anon, authenticated;

grant select on public.movies, public.event_settings to anon, authenticated;
grant select on public.game_entries, public.admin_users to authenticated;
grant insert, update, delete on public.movies to authenticated;
grant update on public.event_settings to authenticated;
