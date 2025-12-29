import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createBrowserClient } from "@supabase/ssr";
import { Task, TaskCoords } from "@/types/task";
import { MatrixPosition } from "@/stores/interactive-matrix-store";

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
    onSuccess: (_, variables) => {
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

  return { createTask, updateTask, deleteTask };
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
