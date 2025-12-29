import { create } from "zustand";
import { persist } from "zustand/middleware";
import { PositionedTask, MatrixPosition } from "@/types/task";

interface InteractiveMatrixState {
  tasks: PositionedTask[];
  setTasks: (tasks: PositionedTask[]) => void;
  updateTaskPosition: (taskId: string, position: MatrixPosition | null) => void;
  addTask: (task: PositionedTask) => void;
  removeTask: (taskId: string) => void;
  moveTask: (activeId: string, overId: string) => void;
}

export const useInteractiveMatrixStore = create<InteractiveMatrixState>()(
  persist(
    (set) => ({
      tasks: [],

      setTasks: (tasks) => set({ tasks }),

      updateTaskPosition: (taskId, position) =>
        set((state) => {
          const taskIndex = state.tasks.findIndex((t) => t.id === taskId);
          if (taskIndex === -1) return state;

          // If moving to list (position is null), just update property to preserve order
          if (position === null) {
            const updatedTasks = [...state.tasks];
            updatedTasks[taskIndex] = { ...updatedTasks[taskIndex], matrixPosition: position };
            return { tasks: updatedTasks };
          }

          // If moving to matrix, move to end for Z-index
          const updatedTask = { ...state.tasks[taskIndex], matrixPosition: position };
          const otherTasks = state.tasks.filter((t) => t.id !== taskId);

          return {
            tasks: [...otherTasks, updatedTask],
          };
        }),

      addTask: (task) =>
        set((state) => ({
          tasks: [...state.tasks, task],
        })),

      removeTask: (taskId) =>
        set((state) => ({
          tasks: state.tasks.filter((task) => task.id !== taskId),
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
    }),
    {
      name: "interactive-matrix-tasks",
    }
  )
);
