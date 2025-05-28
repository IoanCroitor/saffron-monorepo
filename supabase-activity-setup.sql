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