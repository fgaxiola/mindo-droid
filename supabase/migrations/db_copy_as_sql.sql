-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.task_versions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  task_id text NOT NULL,
  snapshot jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT task_versions_pkey PRIMARY KEY (id),
  CONSTRAINT task_versions_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id)
);
CREATE TABLE public.tasks (
  id text NOT NULL,
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  due_date timestamp with time zone,
  estimated_time integer,
  matrix_position jsonb,
  quadrant_coords jsonb,
  tags jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  is_completed boolean DEFAULT false,
  completed_at timestamp with time zone,
  position bigint,
  matrix_z_index integer DEFAULT 0,
  CONSTRAINT tasks_pkey PRIMARY KEY (id),
  CONSTRAINT tasks_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);


-- task_update_trigger that uses tasks table and function handle_task_update to handle task updates and versioning
-- handle_task_update function to handle task updates and versioning
BEGIN
  -- Only create version if something other than matrix_z_index changed
  -- Compare all fields except matrix_z_index
  IF (
    OLD.title IS DISTINCT FROM NEW.title OR
    OLD.description IS DISTINCT FROM NEW.description OR
    OLD.due_date IS DISTINCT FROM NEW.due_date OR
    OLD.estimated_time IS DISTINCT FROM NEW.estimated_time OR
    OLD.matrix_position IS DISTINCT FROM NEW.matrix_position OR
    OLD.quadrant_coords IS DISTINCT FROM NEW.quadrant_coords OR
    OLD.tags IS DISTINCT FROM NEW.tags OR
    OLD.is_completed IS DISTINCT FROM NEW.is_completed OR
    OLD.completed_at IS DISTINCT FROM NEW.completed_at OR
    OLD.position IS DISTINCT FROM NEW.position
  ) THEN
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
  END IF;
  
  NEW.updated_at = NOW();
  RETURN NEW;
END;
