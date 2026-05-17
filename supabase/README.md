# Supabase Backend Setup

This project includes a bootstrap migration for auth-backed user profiles:

- `supabase/migrations/20260517000000_init_auth_profiles.sql`

## What it sets up

- `public.profiles` table (1:1 with `auth.users`)
- RLS policies for authenticated read + self insert/update
- `updated_at` maintenance trigger
- auto-profile creation trigger on `auth.users`

## Apply migration

Run with Supabase CLI in your linked project:

```bash
supabase db push
```
