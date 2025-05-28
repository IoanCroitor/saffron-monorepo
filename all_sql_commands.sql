-- ==================================================
-- ALL SQL COMMANDS FOR SAFFRON PROJECT
-- Compiled from all .sql files in the workspace
-- Generated on: May 28, 2025
-- ==================================================

-- ==================================================
-- 1. USER PROFILES AND AUTHENTICATION SETUP
-- ==================================================

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

-- ==================================================
-- 2. FIX MISSING PROFILES MIGRATION
-- ==================================================

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

-- ==================================================
-- 3. COLLABORATION AND REALTIME SETUP
-- ==================================================

-- Enable realtime for the schema
alter publication supabase_realtime add table projects;

-- Create table for collaborators
CREATE TABLE public.project_collaborators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'viewer', -- 'owner', 'editor', 'viewer'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (project_id, user_id)
);

-- Add RLS policies for collaborators
ALTER TABLE public.project_collaborators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their collaborator entries" 
  ON public.project_collaborators 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Project owners can manage collaborators" 
  ON public.project_collaborators 
  USING (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE id = project_id AND user_id = auth.uid()
    )
  );

-- Create table for cursor positions and user presence
CREATE TABLE public.user_cursors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  position JSONB NOT NULL DEFAULT '{"x": 0, "y": 0}',
  user_info JSONB NOT NULL DEFAULT '{}',
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (project_id, user_id)
);

-- Add RLS policies for cursors
ALTER TABLE public.user_cursors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can update their own cursor" 
  ON public.user_cursors 
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Collaborators can view cursors" 
  ON public.user_cursors 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.project_collaborators 
      WHERE project_id = user_cursors.project_id AND user_id = auth.uid()
    )
  );

-- Create function to clean up old cursors
CREATE OR REPLACE FUNCTION clean_old_cursors() RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.user_cursors 
  WHERE last_updated < NOW() - INTERVAL '10 minutes';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to clean old cursors
CREATE TRIGGER clean_old_cursors_trigger
  AFTER INSERT OR UPDATE ON public.user_cursors
  EXECUTE PROCEDURE clean_old_cursors();

-- Add broadcast procedure
CREATE OR REPLACE FUNCTION public.handle_project_update()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify(
    'project_updates',
    json_build_object(
      'project_id', NEW.id,
      'schematic_data', NEW.schematic_data,
      'updated_at', NEW.updated_at,
      'updated_by', auth.uid()::text
    )::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for project updates
CREATE TRIGGER on_project_update
  AFTER UPDATE OF schematic_data ON public.projects
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_project_update();

-- ==================================================
-- END OF SQL COMMANDS
-- ==================================================
