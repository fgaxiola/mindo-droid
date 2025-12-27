-- Create tasks table
CREATE TABLE tasks (
  id TEXT PRIMARY KEY, -- Format: AWS-XXXXXX
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT, -- HTML content
  due_date TIMESTAMPTZ,
  estimated_time INTEGER, -- In minutes
  matrix_position JSONB, -- {x: number, y: number} for Interactive Matrix
  quadrant_coords JSONB, -- {x: number, y: number} for Priority Matrix
  tags JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create task versions table
CREATE TABLE task_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  snapshot JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_versions ENABLE ROW LEVEL SECURITY;

-- Policies for tasks
CREATE POLICY "Users can CRUD their own tasks" ON tasks
  FOR ALL USING (auth.uid() = user_id);

-- Policies for task versions
CREATE POLICY "Users can CRUD their own task versions" ON task_versions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM tasks WHERE tasks.id = task_versions.task_id AND tasks.user_id = auth.uid())
  );

-- Function to handle task updates and versioning
CREATE OR REPLACE FUNCTION handle_task_update() RETURNS TRIGGER AS $$
BEGIN
  -- Insert current state into versions
  INSERT INTO task_versions (task_id, snapshot)
  VALUES (OLD.id, to_jsonb(OLD));
  
  -- Delete oldest versions if count > 50
  DELETE FROM task_versions
  WHERE id IN (
    SELECT id FROM task_versions
    WHERE task_id = OLD.id
    ORDER BY created_at DESC
    OFFSET 50
  );
  
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for versioning
CREATE TRIGGER task_update_trigger
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION handle_task_update();

-- Storage bucket for attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('task-attachments', 'task-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'task-attachments');
CREATE POLICY "Authenticated users can upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'task-attachments' AND auth.role() = 'authenticated');
