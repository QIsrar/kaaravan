# Veiled Canvas — Supabase Setup Guide

## Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in (or create a free account)
2. Click **"New Project"**
3. Fill in:
   - **Name**: `veiled-canvas`
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose the closest to your target users
   - **Plan**: Free tier works for development
4. Click **"Create new project"** and wait ~2 minutes for provisioning

## Step 2: Get Your API Keys

Once the project is ready, go to **Settings → API** and note down:

| Variable | Where to Find | Usage |
|----------|---------------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL (e.g., `https://xxxx.supabase.co`) | Client + Server |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `anon` / `public` key | Client-side only |
| `SUPABASE_SERVICE_ROLE_KEY` | `service_role` key | Server-side ONLY (webhooks) |

> ⚠️ **CRITICAL**: The `SUPABASE_SERVICE_ROLE_KEY` bypasses Row Level Security. NEVER expose it to the client. It goes ONLY in `.env.local` and is used ONLY in server-side Route Handlers.

## Step 3: Run the Schema Migration

1. In the Supabase Dashboard, go to **SQL Editor**
2. Click **"New query"**
3. Copy the **entire contents** of [`supabase/migrations/001_schema.sql`](./migrations/001_schema.sql)
4. Paste it into the SQL editor and click **"Run"**
5. You should see "Success. No rows returned" (this is expected for DDL)

## Step 4: Run the Seed Data

1. In the SQL Editor, click **"New query"** again
2. Copy the **entire contents** of [`supabase/migrations/002_seed.sql`](./migrations/002_seed.sql)
3. Paste and click **"Run"**
4. Verify data by checking the **Table Editor** — you should see categories, products, variants, etc.

## Step 5: Create an Admin User

1. Go to **Authentication → Users** in the Supabase Dashboard
2. Click **"Add user"** → **"Create new user"**
3. Enter your admin email and password
4. After creation, go to **SQL Editor** and run:

```sql
-- Replace 'YOUR_USER_ID' with the UUID shown in the Authentication → Users table
UPDATE profiles
SET role = 'admin'
WHERE id = 'YOUR_USER_ID';
```

5. Verify by running: `SELECT * FROM profiles WHERE role = 'admin';`

## Step 6: Verify Storage Buckets

The migration creates two storage buckets automatically. Verify them:

1. Go to **Storage** in the Supabase Dashboard
2. You should see:
   - `product-images` (public)
   - `blog-images` (public)
3. If they don't appear, create them manually:
   - Click "New bucket"
   - Name: `product-images`, toggle **"Public bucket"** ON
   - Repeat for `blog-images`

## Step 7: Configure Auth Settings

1. Go to **Authentication → Providers**
2. Ensure **Email** provider is enabled
3. For development, you may want to:
   - Disable email confirmation (Authentication → Settings → toggle off "Enable email confirmations")
   - Or set up a custom SMTP for real email delivery

## Step 8: Set Up Environment Variables

Copy `.env.example` to `.env.local` and fill in the values:

```bash
cp .env.example .env.local
```

Fill in all the Supabase variables from Step 2. The Stripe and Resend variables will be configured later.

---

## Troubleshooting

### "permission denied for schema auth"
The `handle_new_user()` trigger requires access to `auth.users`. This should work in the SQL Editor (which runs as `postgres` role). If using the Supabase CLI, ensure you're running with sufficient privileges.

### "relation already exists"
The migration uses `IF NOT EXISTS` clauses, so it's safe to re-run. If you need a clean slate:
```sql
-- DANGER: This drops ALL data
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
```
Then re-run both migrations.

### RLS blocking queries
If you're getting "permission denied" errors:
1. Check that the user has a corresponding `profiles` row
2. Verify the trigger fired by checking `SELECT * FROM profiles`
3. For admin operations, ensure `role = 'admin'` is set
