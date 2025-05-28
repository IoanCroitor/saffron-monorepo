-- Migration script to create missing profiles for existing users
-- This will ensure all existing auth.users have corresponding profiles

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
