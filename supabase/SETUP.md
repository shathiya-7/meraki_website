# Supabase setup

1. Create a Supabase project, then open **SQL Editor** and run [`schema.sql`](./schema.sql). It creates the seven language catalogs, game tables, event setting, row-level security policies, and the public RPCs used by the app.
2. Copy `.env.example` to `.env.local` and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from **Project Settings → API**. The anon key is intended for browser use; never put a service-role key in a `VITE_` variable.
3. In **Authentication → Users**, create an admin user with an email and password. Copy that user's UUID, then add the admin role in SQL Editor:

   ```sql
   insert into public.admin_users (user_id, display_name)
   values ('AUTH_USER_UUID', 'Admin name');
   ```

   The admin page uses Supabase email/password authentication and checks this database role before loading participant or catalog data. Keep account creation restricted to organizers.
4. Start/restart the Vite app. Participants can register once per 9-character alphanumeric college roll number. The database starts and scores attempts using server timestamps; the public leaderboard masks roll numbers.

The catalog seeds ten movies for each language. Artwork is looked up by movie title from Wikipedia when a catalog image URL has not been set. Admins can save a discovered image or enter an approved image URL, add titles, and disable/restore movies without deleting historical game records. Check image rights and source terms before using artwork in a public event.
