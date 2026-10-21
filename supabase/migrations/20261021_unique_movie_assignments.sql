begin;

create table if not exists public.movie_assignments (
  movie_id uuid primary key references public.movies(id),
  game_entry_id uuid not null unique references public.game_entries(id),
  assigned_at timestamptz not null default now()
);

alter table public.movie_assignments enable row level security;
revoke all on table public.movie_assignments from public, anon, authenticated;

insert into public.movie_assignments (movie_id, game_entry_id)
select distinct on (g.movie_id) g.movie_id, g.id
from public.game_entries g
join public.movies m on m.id = g.movie_id and m.active
where g.finished_at is null
order by g.movie_id, g.created_at;

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
    when 'hindi' then 'Hindi'
    when 'english' then 'English'
    when 'telugu' then 'Telugu'
    when 'malayalam' then 'Malayalam'
    else null
  end;
  if normalized_language is null then
    raise exception 'Choose one of the supported movie languages.';
  end if;

  if not exists (select 1 from public.event_settings where id = 1 and is_open) then
    raise exception 'The event is currently closed.';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(normalized_language, 0));

  select * into selected_movie
  from public.movies m
  where m.language = normalized_language
    and m.active
    and not exists (
      select 1 from public.movie_assignments a where a.movie_id = m.id
    )
  order by random()
  limit 1;
  if selected_movie.id is null then
    raise exception 'All movies for this language have already been assigned. Please ask an organizer to add more movies.';
  end if;

  insert into public.game_entries (full_name, roll_number, language, movie_id)
  values (trim(p_full_name), normalized_roll, normalized_language, selected_movie.id)
  returning * into inserted_entry;

  insert into public.movie_assignments (movie_id, game_entry_id)
  values (selected_movie.id, inserted_entry.id);

  return query select inserted_entry.id, selected_movie.title, selected_movie.release_year,
    selected_movie.language, selected_movie.image_url, inserted_entry.started_at;
exception
  when unique_violation then
    raise exception 'This roll number has already registered. One entry per participant.';
end;
$$;

commit;
