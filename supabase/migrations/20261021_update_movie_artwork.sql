begin;

update public.movies as movie
set image_url = source.image_url
from (values
  ('Tamil', 'Enthiran', 'https://dbyqntphetxindiyvnga.supabase.co/storage/v1/object/public/meraki-movie-artwork/download%20(1).jpg'),
  ('Tamil', 'Aadukalam', 'https://dbyqntphetxindiyvnga.supabase.co/storage/v1/object/public/meraki-movie-artwork/download%202.webp'),
  ('Tamil', 'Thuppakki', 'https://dbyqntphetxindiyvnga.supabase.co/storage/v1/object/public/meraki-movie-artwork/images.webp'),
  ('Tamil', 'Raja Rani', 'https://dbyqntphetxindiyvnga.supabase.co/storage/v1/object/public/meraki-movie-artwork/download.jpg'),
  ('Tamil', 'Kaththi', 'https://dbyqntphetxindiyvnga.supabase.co/storage/v1/object/public/meraki-movie-artwork/download.webp'),
  ('Hindi', 'Zindagi Na Milegi Dobara', 'https://dbyqntphetxindiyvnga.supabase.co/storage/v1/object/public/meraki-movie-artwork/download%20(2).jpg'),
  ('Hindi', 'Barfi!', 'https://dbyqntphetxindiyvnga.supabase.co/storage/v1/object/public/meraki-movie-artwork/download%20(3).jpg'),
  ('Hindi', 'Queen', 'https://dbyqntphetxindiyvnga.supabase.co/storage/v1/object/public/meraki-movie-artwork/download%20(1).webp'),
  ('Hindi', 'PK', 'https://dbyqntphetxindiyvnga.supabase.co/storage/v1/object/public/meraki-movie-artwork/download%20(4).jpg'),
  ('Hindi', 'Bajrangi Bhaijaan', 'https://dbyqntphetxindiyvnga.supabase.co/storage/v1/object/public/meraki-movie-artwork/download%20(5).jpg'),
  ('English', 'Inception', 'https://dbyqntphetxindiyvnga.supabase.co/storage/v1/object/public/meraki-movie-artwork/download%20(6).jpg'),
  ('English', 'Interstellar', 'https://dbyqntphetxindiyvnga.supabase.co/storage/v1/object/public/meraki-movie-artwork/download%20(7).jpg'),
  ('English', 'Whiplash', 'https://dbyqntphetxindiyvnga.supabase.co/storage/v1/object/public/meraki-movie-artwork/download%20(8).jpg'),
  ('English', 'Mad Max: Fury Road', 'https://dbyqntphetxindiyvnga.supabase.co/storage/v1/object/public/meraki-movie-artwork/images%20(1).webp'),
  ('English', 'La La Land', 'https://dbyqntphetxindiyvnga.supabase.co/storage/v1/object/public/meraki-movie-artwork/download%20(9).jpg'),
  ('Telugu', 'Eega', 'https://dbyqntphetxindiyvnga.supabase.co/storage/v1/object/public/meraki-movie-artwork/download%20(10).jpg'),
  ('Telugu', 'Mirchi', 'https://dbyqntphetxindiyvnga.supabase.co/storage/v1/object/public/meraki-movie-artwork/download%20(11).jpg'),
  ('Telugu', 'Manam', 'https://dbyqntphetxindiyvnga.supabase.co/storage/v1/object/public/meraki-movie-artwork/download%20(12).jpg'),
  ('Telugu', 'Baahubali: The Beginning', 'https://dbyqntphetxindiyvnga.supabase.co/storage/v1/object/public/meraki-movie-artwork/download%20(13).jpg'),
  ('Telugu', 'Kshanam', 'https://dbyqntphetxindiyvnga.supabase.co/storage/v1/object/public/meraki-movie-artwork/download%20(14).jpg'),
  ('Malayalam', 'Drishyam', 'https://dbyqntphetxindiyvnga.supabase.co/storage/v1/object/public/meraki-movie-artwork/download%20(15).jpg'),
  ('Malayalam', 'Bangalore Days', 'https://dbyqntphetxindiyvnga.supabase.co/storage/v1/object/public/meraki-movie-artwork/download%20(16).jpg'),
  ('Malayalam', 'Premam', 'https://dbyqntphetxindiyvnga.supabase.co/storage/v1/object/public/meraki-movie-artwork/download%20(17).jpg'),
  ('Malayalam', 'Charlie', 'https://dbyqntphetxindiyvnga.supabase.co/storage/v1/object/public/meraki-movie-artwork/download%20(18).jpg'),
  ('Malayalam', 'Maheshinte Prathikaaram', 'https://dbyqntphetxindiyvnga.supabase.co/storage/v1/object/public/meraki-movie-artwork/download%20(19).jpg')
) as source(language, title, image_url)
where movie.language = source.language
  and movie.title = source.title
  and movie.active;
