-- Add is_completed column to tasks table
ALTER TABLE tasks ADD COLUMN is_completed BOOLEAN DEFAULT FALSE;
