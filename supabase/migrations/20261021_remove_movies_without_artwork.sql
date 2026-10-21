begin;

delete from public.movies m
where (m.image_url is null or btrim(m.image_url) = '')
  and not exists (
    select 1 from public.game_entries g where g.movie_id = m.id
  )
  and not exists (
    select 1 from public.movie_assignments a where a.movie_id = m.id
  );

commit;
