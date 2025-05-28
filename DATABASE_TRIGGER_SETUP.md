# Database Trigger Setup for Automatic Profile Creation

## Problem
The foreign key constraint violation `insert or update on table "projects" violates foreign key constraint "projects_user_id_fkey"` occurs because:

1. The `projects` table references `user_id` to `public.profiles(id)`
2. When users sign up, they are created in `auth.users` but sometimes the profile creation in `public.profiles` fails or is skipped
3. When trying to create projects, the `user_id` doesn't exist in the `profiles` table

## Solution
Create a database trigger that automatically creates a profile entry whenever a new user is created in the `auth.users` table.

## Installation Steps

### 1. Run the User Trigger Setup
Execute the SQL in `handle_new_user_trigger.sql` in your Supabase SQL Editor:

```sql
-- Function to handle new user creation
-- This function will automatically create a profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.profiles TO postgres, anon, authenticated, service_role;
```

### 2. Fix Existing Users
Execute the SQL in `fix_missing_profiles.sql` to create profiles for any existing users:

```sql
-- Migration script to create missing profiles for existing users
INSERT INTO public.profiles (id, email, name, created_at, updated_at)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'name', 'User') as name,
  au.created_at,
  au.updated_at
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- Verify the migration worked
SELECT 
  'Users in auth.users' as table_name, 
  COUNT(*) as count 
FROM auth.users
UNION ALL
SELECT 
  'Users in public.profiles' as table_name, 
  COUNT(*) as count 
FROM public.profiles
ORDER BY table_name;
```

### 3. Verify Setup
After running both SQL scripts, verify that:

1. The trigger function exists:
```sql
SELECT proname FROM pg_proc WHERE proname = 'handle_new_user';
```

2. The trigger is active:
```sql
SELECT trigger_name, event_manipulation, event_object_table 
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';
```

3. All existing users have profiles:
```sql
SELECT 
  (SELECT COUNT(*) FROM auth.users) as auth_users_count,
  (SELECT COUNT(*) FROM public.profiles) as profiles_count;
```

## Code Changes Made

### 1. Updated Server-side Signup (`src/routes/signup/+page.server.ts`)
- Removed manual profile creation
- Now relies on database trigger

### 2. Updated Client-side Signup (`src/lib/stores/auth.ts`)
- Removed manual profile creation
- Now relies on database trigger

## Benefits

1. **Reliability**: Profile creation is now atomic with user creation
2. **Consistency**: No more race conditions or failed profile creations
3. **Simplicity**: Removes manual profile creation logic from application code
4. **Automatic**: Works for all signup methods (email/password, OAuth, etc.)

## Testing

To test the setup:

1. Create a new user account
2. Verify the profile is automatically created in `public.profiles`
3. Try creating a project - the foreign key constraint should now work

## Troubleshooting

If you still get foreign key errors:

1. Check if the trigger is active
2. Verify the user has a profile in `public.profiles`
3. Run the migration script again if needed
4. Check Supabase logs for any trigger execution errors
