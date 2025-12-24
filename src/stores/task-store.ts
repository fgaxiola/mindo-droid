import { create } from "zustand";
import { Task, TaskCoords } from "@/types/task";

interface TaskState {
  tasks: Task[];
  setTasks: (tasks: Task[]) => void;
  updateTaskCoords: (taskId: string, coords: TaskCoords) => void;
  addTask: (task: Task) => void;
  removeTask: (taskId: string) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
}

export const useTaskStore = create<TaskState>((set) => ({
  tasks: [],
  
  setTasks: (tasks) => set({ tasks }),
  
  updateTaskCoords: (taskId, coords) =>
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId ? { ...task, coords } : task
      ),
    })),
  
  addTask: (task) =>
    set((state) => ({
      tasks: [...state.tasks, task],
    })),
  
  removeTask: (taskId) =>
    set((state) => ({
      tasks: state.tasks.filter((task) => task.id !== taskId),
    })),
  
  updateTask: (taskId, updates) =>
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId ? { ...task, ...updates } : task
      ),
    })),
}));
