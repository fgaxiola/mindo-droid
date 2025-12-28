-- Add completed_at column to tasks table
ALTER TABLE tasks ADD COLUMN completed_at TIMESTAMPTZ DEFAULT NULL;
