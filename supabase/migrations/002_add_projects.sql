-- Add projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3b82f6',
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add project_id to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id);

-- Create index for project lookups
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);

-- Create a default project for existing tasks
INSERT INTO projects (name, description, color, position)
VALUES ('Moby Kanban', 'Default project for the Moby Kanban app', '#3b82f6', 0)
ON CONFLICT DO NOTHING;
