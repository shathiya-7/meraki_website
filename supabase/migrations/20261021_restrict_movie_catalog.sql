begin;

insert into public.movies (title, release_year, language) values
  ('Enthiran', 2010, 'Tamil'), ('Aadukalam', 2011, 'Tamil'), ('Thuppakki', 2012, 'Tamil'),
  ('Raja Rani', 2013, 'Tamil'), ('Kaththi', 2014, 'Tamil'),
  ('Zindagi Na Milegi Dobara', 2011, 'Hindi'), ('Barfi!', 2012, 'Hindi'), ('Queen', 2013, 'Hindi'),
  ('PK', 2014, 'Hindi'), ('Bajrangi Bhaijaan', 2015, 'Hindi'),
  ('Inception', 2010, 'English'), ('Interstellar', 2014, 'English'), ('Whiplash', 2014, 'English'),
  ('Mad Max: Fury Road', 2015, 'English'), ('La La Land', 2016, 'English'),
  ('Eega', 2012, 'Telugu'), ('Mirchi', 2013, 'Telugu'), ('Manam', 2014, 'Telugu'),
  ('Baahubali: The Beginning', 2015, 'Telugu'), ('Kshanam', 2016, 'Telugu'),
  ('Drishyam', 2013, 'Malayalam'), ('Bangalore Days', 2014, 'Malayalam'), ('Premam', 2015, 'Malayalam'),
  ('Charlie', 2015, 'Malayalam'), ('Maheshinte Prathikaaram', 2016, 'Malayalam')
on conflict (language, title) do update
set active = true;

update public.movies
set active = false
where (language, title) not in (
  ('Tamil', 'Enthiran'), ('Tamil', 'Aadukalam'), ('Tamil', 'Thuppakki'), ('Tamil', 'Raja Rani'), ('Tamil', 'Kaththi'),
  ('Hindi', 'Zindagi Na Milegi Dobara'), ('Hindi', 'Barfi!'), ('Hindi', 'Queen'), ('Hindi', 'PK'), ('Hindi', 'Bajrangi Bhaijaan'),
  ('English', 'Inception'), ('English', 'Interstellar'), ('English', 'Whiplash'), ('English', 'Mad Max: Fury Road'), ('English', 'La La Land'),
  ('Telugu', 'Eega'), ('Telugu', 'Mirchi'), ('Telugu', 'Manam'), ('Telugu', 'Baahubali: The Beginning'), ('Telugu', 'Kshanam'),
  ('Malayalam', 'Drishyam'), ('Malayalam', 'Bangalore Days'), ('Malayalam', 'Premam'), ('Malayalam', 'Charlie'), ('Malayalam', 'Maheshinte Prathikaaram')
);

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

commit;
