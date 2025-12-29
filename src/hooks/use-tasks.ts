import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createBrowserClient } from "@supabase/ssr";
import { Task, TaskCoords, MatrixPosition } from "@/types/task";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function generateTaskId() {
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  return `AWS-${randomNum}`;
}

export function useTasks() {
  return useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .order("position", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: true });

      if (error) throw error;

      return data.map((item: any) => ({
        ...item,
        matrixPosition: item.matrix_position,
        coords: item.quadrant_coords,
      })) as Task[];
    },
  });
}

export function useTaskMutations() {
  const queryClient = useQueryClient();

  const createTask = useMutation({
    mutationFn: async (taskData: Partial<Task>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Set initial position for new task (will be ordered by position, so defaults to end)
      const newPosition = Date.now();

      const newTask = {
        id: generateTaskId(),
        user_id: user.id,
        title: taskData.title,
        description: taskData.description,
        due_date: taskData.due_date,
        estimated_time: taskData.estimated_time,
        is_completed: taskData.is_completed || false,
        tags: [],
        matrix_position: taskData.matrixPosition || null, // For interactive matrix
        quadrant_coords: taskData.coords || { x: -1, y: -1 }, // For priority matrix
        position: newPosition,
      };

      const { data, error } = await supabase
        .from("tasks")
        .insert(newTask)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const updateTask = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Task> }) => {
      // Map frontend properties to DB columns if needed
      const dbUpdates: any = { ...updates };
      if (updates.matrixPosition !== undefined) dbUpdates.matrix_position = updates.matrixPosition;
      if (updates.coords !== undefined) dbUpdates.quadrant_coords = updates.coords;

      // Remove frontend-only props that might conflict
      delete dbUpdates.matrixPosition;
      delete dbUpdates.coords;

      // Handle completed_at timestamp
      if (updates.is_completed !== undefined) {
        if (updates.is_completed) {
          dbUpdates.completed_at = new Date().toISOString();
        } else {
          dbUpdates.completed_at = null;
        }
      }

      const { data, error } = await supabase
        .from("tasks")
        .update(dbUpdates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async ({ id, updates }) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ["tasks"] });

      // Snapshot the previous value
      const previousTasks = queryClient.getQueryData<Task[]>(["tasks"]);

      // Optimistically update to the new value
      if (previousTasks) {
        queryClient.setQueryData<Task[]>(["tasks"], (old) => {
          return old?.map((task) =>
            task.id === id ? { ...task, ...updates } : task
          );
        });
      }

      // Return a context object with the snapshotted value
      return { previousTasks };
    },
    onError: (err, newTodo, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousTasks) {
        queryClient.setQueryData(["tasks"], context.previousTasks);
      }
    },
    onSettled: (data, error, variables) => {
      // Always refetch after error or success:
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["task_versions", variables.id] });
    },
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const updateTasks = useMutation({
    mutationFn: async (updates: Partial<Task>[]) => {
      // Get current cached tasks to ensure we have full objects for UPSERT
      // This prevents "NOT NULL" constraint violations for fields we aren't updating (e.g. title)
      const currentTasks = queryClient.getQueryData<Task[]>(["tasks"]);
      if (!currentTasks) throw new Error("No tasks found in cache to merge updates");

      const updateMap = new Map(updates.map((u) => [u.id, u]));

      // Filter and map: only include tasks that are being updated
      const dbUpserts = currentTasks
        .filter((t) => updateMap.has(t.id))
        .map((t) => {
          const update = updateMap.get(t.id)!;
          
          // Start with the existing task from cache (contains all DB fields)
          const dbObj: any = { ...t };

          // Apply updates
          if (update.position !== undefined) dbObj.position = update.position;
          
          // Map frontend props back to DB columns
          if (update.coords) {
            dbObj.quadrant_coords = update.coords;
          }
          if (update.matrixPosition !== undefined) {
            dbObj.matrix_position = update.matrixPosition;
          }

          // Cleanup: Remove frontend-only properties that shouldn't be sent to DB
          delete dbObj.coords;
          delete dbObj.matrixPosition;
          
          // Ensure user_id is present (it should be in the cached object)
          // If for some reason it's missing, the upsert might fail RLS if not caught here
          if (!dbObj.user_id) {
             console.error("Missing user_id for task", t.id);
          }

          return dbObj;
        });

      if (dbUpserts.length === 0) return [];

      const { data, error } = await supabase
        .from("tasks")
        .upsert(dbUpserts)
        .select();

      if (error) throw error;
      return data;
    },
    onMutate: async (updates) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] });
      const previousTasks = queryClient.getQueryData<Task[]>(["tasks"]);

      if (previousTasks) {
        queryClient.setQueryData<Task[]>(["tasks"], (old) => {
          if (!old) return [];
          const updateMap = new Map(updates.map((u) => [u.id, u]));
          return old.map((task) => {
            const update = updateMap.get(task.id);
            return update ? { ...task, ...update } : task;
          });
        });
      }

      return { previousTasks };
    },
    onError: (err, newTodo, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(["tasks"], context.previousTasks);
      }
    },
    onSuccess: (data) => {
      // Update cache with the actual returned data from server to confirm consistency
      // This avoids a full refetch (GET) of the tasks list
      if (data) {
        queryClient.setQueryData<Task[]>(["tasks"], (old) => {
          if (!old) return data.map((item: any) => ({
            ...item,
            matrixPosition: item.matrix_position,
            coords: item.quadrant_coords,
          })) as Task[];

          const updateMap = new Map(data.map((u: any) => [u.id, u]));
          return old.map((task) => {
            const update = updateMap.get(task.id);
            if (update) {
              return {
                ...task,
                ...update,
                matrixPosition: update.matrix_position,
                coords: update.quadrant_coords,
              };
            }
            return task;
          });
        });
      }
    },
    // No need to invalidate queries immediately if we trust the upsert response
    // onSettled: () => {
    //   queryClient.invalidateQueries({ queryKey: ["tasks"] });
    // },
  });

  return { createTask, updateTask, updateTasks, deleteTask };
}

export function useTaskVersions(taskId?: string) {
  return useQuery({
    queryKey: ["task_versions", taskId],
    queryFn: async () => {
      if (!taskId) return [];
      const { data, error } = await supabase
        .from("task_versions")
        .select("*")
        .eq("task_id", taskId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!taskId,
  });
}

export function useRestoreTaskVersion() {
  const queryClient = useQueryClient();
  const { updateTask } = useTaskMutations();

  return useMutation({
    mutationFn: async (version: any) => {
      const snapshot = version.snapshot;
      // Restore logic essentially updates the current task with the snapshot data
      // Excluding metadata like updated_at to let the trigger handle it
      const { updated_at, ...restoreData } = snapshot;
      
      return updateTask.mutateAsync({ 
        id: snapshot.id, 
        updates: restoreData 
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["task_versions", variables.task_id] });
    },
  });
}
