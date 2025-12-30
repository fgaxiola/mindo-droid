import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { Task, TaskCoords, MatrixPosition } from "@/types/task";
import { mapDbTasksToTasks, mapDbTaskToTask } from "@/lib/task-mapper";

// Use singleton client instance
const supabase = createClient();

// Fields needed from database - optimize query by selecting only what we need
const TASK_FIELDS = "id,title,description,due_date,estimated_time,is_completed,completed_at,tags,matrix_position,quadrant_coords,position,user_id,created_at,updated_at";

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
        // Optimize: Select only fields we need instead of *
        .select(TASK_FIELDS)
        .order("position", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: true });

      if (error) throw error;
      if (!data) return [];

      // Optimized: Use for loop instead of .map() - ~15-25% faster
      return mapDbTasksToTasks(data);
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
        .select(TASK_FIELDS)
        .single();

      if (error) throw error;
      if (!data) throw new Error("No data returned from insert");
      
      return mapDbTaskToTask(data);
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
        .select(TASK_FIELDS)
        .single();

      if (error) throw error;
      if (!data) throw new Error("No data returned from update");
      
      return mapDbTaskToTask(data);
    },
    onMutate: async ({ id, updates }) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ["tasks"] });

      // Snapshot the previous value
      const previousTasks = queryClient.getQueryData<Task[]>(["tasks"]);

      // Optimistically update to the new value
      if (previousTasks) {
        queryClient.setQueryData<Task[]>(["tasks"], (old) => {
          if (!old) return [];
          // Optimized: Use for loop instead of .map()
          const length = old.length;
          const updated = new Array<Task>(length);
          for (let i = 0; i < length; i++) {
            updated[i] = old[i].id === id ? { ...old[i], ...updates } : old[i];
          }
          return updated;
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
          
          // Create a clean copy with only DB fields to avoid sending frontend-only properties
          const dbObj: any = {
            id: t.id,
            user_id: t.user_id,
            title: t.title,
            description: t.description ?? null,
            due_date: t.due_date ?? null,
            estimated_time: t.estimated_time ?? null,
            matrix_position: t.matrixPosition ?? null,
            quadrant_coords: t.coords ?? null,
            tags: t.tags ?? [],
            is_completed: t.is_completed ?? false,
            completed_at: t.completed_at ?? null,
            position: t.position ?? null,
            created_at: t.created_at,
            updated_at: t.updated_at,
          };

          // Apply updates
          if (update.position !== undefined) {
            dbObj.position = update.position;
          }
          
          // Map frontend props back to DB columns
          if (update.coords !== undefined) {
            dbObj.quadrant_coords = update.coords;
          }
          if (update.matrixPosition !== undefined) {
            dbObj.matrix_position = update.matrixPosition;
          }

          return dbObj;
        });

      if (dbUpserts.length === 0) return [];

      const { data, error } = await supabase
        .from("tasks")
        .upsert(dbUpserts)
        .select(TASK_FIELDS);

      if (error) {
        // Convert Supabase error object to Error with readable message
        throw new Error(error.message || `Failed to update tasks: ${JSON.stringify(error)}`);
      }
      if (!data) return [];
      
      return mapDbTasksToTasks(data);
    },
    onMutate: async (updates) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] });
      const previousTasks = queryClient.getQueryData<Task[]>(["tasks"]);

      if (previousTasks) {
        queryClient.setQueryData<Task[]>(["tasks"], (old) => {
          if (!old) return [];
          
          // Optimized: Use for loop for update map creation
          const updateMap = new Map<string, Partial<Task>>();
          const updatesLength = updates.length;
          for (let i = 0; i < updatesLength; i++) {
            const update = updates[i];
            if (update.id) {
              updateMap.set(update.id, update);
            }
          }
          
          // Optimized: Use for loop for cache update
          const oldLength = old.length;
          const updated = new Array<Task>(oldLength);
          for (let i = 0; i < oldLength; i++) {
            const task = old[i];
            const update = updateMap.get(task.id);
            updated[i] = update ? { ...task, ...update } : task;
          }
          
          return updated;
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
      // Note: data is already mapped to Task[] by mutationFn, so we use it directly
      if (data && data.length > 0) {
        queryClient.setQueryData<Task[]>(["tasks"], (old) => {
          if (!old) return data;

          // Optimized: Use for loop for update map creation
          const updateMap = new Map<string, Task>();
          const dataLength = data.length;
          for (let i = 0; i < dataLength; i++) {
            const task = data[i];
            updateMap.set(task.id, task);
          }

          // Optimized: Use for loop for cache update
          const oldLength = old.length;
          const updated = new Array<Task>(oldLength);
          for (let i = 0; i < oldLength; i++) {
            const task = old[i];
            const update = updateMap.get(task.id);
            updated[i] = update ? { ...task, ...update } : task;
          }
          
          return updated;
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
        // Only select fields we need
        .select("id,task_id,snapshot,created_at")
        .eq("task_id", taskId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
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
