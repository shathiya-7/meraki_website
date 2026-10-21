# Supabase setup

1. Create a Supabase project, then open **SQL Editor** and run [`schema.sql`](./schema.sql). It creates the five language catalogs, game tables, event setting, row-level security policies, and the public RPCs used by the app.
2. Copy `.env.example` to `.env.local` and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from **Project Settings → API**. The anon key is intended for browser use; never put a service-role key in a `VITE_` variable.
3. In **Authentication → Users**, create an admin user with an email and password. Copy that user's UUID, then add the admin role in SQL Editor:

   ```sql
   insert into public.admin_users (user_id, display_name)
   values ('AUTH_USER_UUID', 'Admin name');
   ```

   The admin page uses Supabase email/password authentication and checks this database role before loading participant or catalog data. Keep account creation restricted to organizers.
4. Start/restart the Vite app. Participants can register once per 9-character alphanumeric college roll number. The database starts and scores attempts using server timestamps; the public leaderboard masks roll numbers.

For an existing project, run [`migrations/20261021_restrict_movie_catalog.sql`](./migrations/20261021_restrict_movie_catalog.sql) once in the Supabase SQL Editor. It activates five selected movies in Tamil, Hindi, English, Telugu, and Malayalam; deactivates other catalog entries; and restricts new registrations to those five languages. Existing movie rows, artwork URLs, and game history are preserved.

The catalog seeds five movies per language. Movie artwork is stored in the public `meraki-movie-artwork` Storage bucket so puzzle images can load in the participant app. The completed [`movie-artwork-template.csv`](./movie-artwork-template.csv) lists the active movies and their direct image URLs. To apply these image mappings to this project, run [`migrations/20261021_update_movie_artwork.sql`](./migrations/20261021_update_movie_artwork.sql) in the SQL Editor.

Admins can save a discovered image or enter an image URL, add titles, and disable/restore movies without deleting historical game records.

To ensure participants selecting the same language receive different movie questions, run [`migrations/20261021_unique_movie_assignments.sql`](./migrations/20261021_unique_movie_assignments.sql) once in the SQL Editor. Each active movie is assigned to at most one new registration; once a language has no unassigned active movies, registrations in that language are blocked until an admin adds more movies. Existing completed game history is preserved and does not consume the new assignment pool; attempts already in progress when the migration runs are reserved.
