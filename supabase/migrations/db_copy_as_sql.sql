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
  CONSTRAINT tasks_pkey PRIMARY KEY (id),
  CONSTRAINT tasks_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);