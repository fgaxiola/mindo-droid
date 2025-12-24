import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Task } from "@/types/task";

export interface MatrixPosition {
  x: number; // percentage 0-100
  y: number; // percentage 0-100
}

export interface PositionedTask extends Task {
  matrixPosition: MatrixPosition | null; // null = in sidebar
}

interface InteractiveMatrixState {
  tasks: PositionedTask[];
  setTasks: (tasks: PositionedTask[]) => void;
  updateTaskPosition: (taskId: string, position: MatrixPosition | null) => void;
  addTask: (task: PositionedTask) => void;
  removeTask: (taskId: string) => void;
}

export const useInteractiveMatrixStore = create<InteractiveMatrixState>()(
  persist(
    (set) => ({
      tasks: [],

      setTasks: (tasks) => set({ tasks }),

      updateTaskPosition: (taskId, position) =>
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === taskId ? { ...task, matrixPosition: position } : task
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
    }),
    {
      name: "interactive-matrix-tasks",
    }
  )
);
