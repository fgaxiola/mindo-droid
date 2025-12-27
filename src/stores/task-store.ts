import { create } from "zustand";
import { Task, TaskCoords } from "@/types/task";

interface TaskState {
  tasks: Task[];
  setTasks: (tasks: Task[]) => void;
  updateTaskCoords: (taskId: string, coords: TaskCoords) => void;
  addTask: (task: Task) => void;
  removeTask: (taskId: string) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  moveTask: (activeId: string, overId: string) => void;
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

  moveTask: (activeId, overId) =>
    set((state) => {
      const oldIndex = state.tasks.findIndex((t) => t.id === activeId);
      const newIndex = state.tasks.findIndex((t) => t.id === overId);

      if (oldIndex === -1 || newIndex === -1) return state;

      const newTasks = [...state.tasks];
      const [removed] = newTasks.splice(oldIndex, 1);
      newTasks.splice(newIndex, 0, removed);

      return { tasks: newTasks };
    }),
}));
