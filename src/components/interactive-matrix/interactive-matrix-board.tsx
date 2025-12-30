"use client";

import { useEffect, useRef, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  DragOverEvent,
  PointerSensor,
  useSensor,
  useSensors,
  pointerWithin,
} from "@dnd-kit/core";
import { PositionedTask, MatrixPosition, Task } from "@/types/task";
import { MatrixCanvas } from "./matrix-canvas";
import { TaskPanel } from "./task-panel";
import { DraggableTaskOverlay } from "./draggable-task";
import { useDictionary } from "@/providers/dictionary-provider";
import { useTaskMutations, useTasks } from "@/hooks/use-tasks";

interface InteractiveMatrixBoardProps {
  initialTasks: Task[];
  onTaskPositionChange?: (taskId: string, position: MatrixPosition | null) => void;
}

export function InteractiveMatrixBoard({
  initialTasks,
  onTaskPositionChange,
}: InteractiveMatrixBoardProps) {
  const dictionary = useDictionary();
  const { data: tasks = initialTasks } = useTasks();
  const { updateTask, updateTasks } = useTaskMutations();
  const [activeTask, setActiveTask] = useState<PositionedTask | null>(null);
  const [localTasks, setLocalTasks] = useState<Task[]>(initialTasks.filter(t => !t.is_completed));
  const matrixRef = useRef<HTMLDivElement>(null);
  const justFinishedDragRef = useRef<string | null>(null);
  const lastSyncedTasksRef = useRef<Task[]>(initialTasks);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 20,
      },
    })
  );

  useEffect(() => {
    // Skip updates if dragging to prevent conflicts
    if (activeTask) return;

    if (tasks && tasks !== lastSyncedTasksRef.current) {
      lastSyncedTasksRef.current = tasks;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocalTasks(prev => {
        // Filter out completed tasks before processing
        const activeTasks = tasks.filter(t => !t.is_completed);
        const tasksMap = new Map(activeTasks.map(t => [t.id, t]));

        // If we just finished dragging a task, preserve its local position
        // to prevent glitch where it briefly shows old position
        const recentlyMovedTaskId = justFinishedDragRef.current;

        // Keep existing order for active tasks that are still in the list
        const mergedTasks = prev.map(t => {
          // Preserve the local position for the task we just moved
          if (recentlyMovedTaskId && t.id === recentlyMovedTaskId) {
            const serverVersion = tasksMap.get(t.id);
            // Keep local position but merge other updates from server
            return serverVersion ? { ...serverVersion, matrixPosition: t.matrixPosition } : t;
          }
          return tasksMap.get(t.id) || t;
        }).filter(t => tasksMap.has(t.id) || (recentlyMovedTaskId && t.id === recentlyMovedTaskId));

        // Add any new active tasks that weren't in the previous state
        const prevIds = new Set(prev.map(t => t.id));
        const newTasks = activeTasks.filter(t => !prevIds.has(t.id));

        return [...mergedTasks, ...newTasks];
      });
    }
  }, [tasks, activeTask]);

  const moveTaskLocally = (activeId: string, overId: string) => {
      setLocalTasks((prev) => {
          const oldIndex = prev.findIndex((t) => t.id === activeId);
          const newIndex = prev.findIndex((t) => t.id === overId);
          if (oldIndex === -1 || newIndex === -1) return prev;
          const newTasks = [...prev];
          const [removed] = newTasks.splice(oldIndex, 1);
          newTasks.splice(newIndex, 0, removed);
          return newTasks;
      });
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = localTasks.find((t) => t.id === active.id);
    if (task) {
      setActiveTask(task as PositionedTask);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const currentTask = localTasks.find((t) => t.id === activeId);
    const overTask = localTasks.find((t) => t.id === overId);

    if (!currentTask) return;

    // Determine if we are over the list (either the panel itself or a list item)
    const isOverList = overId === "task-panel" || (overTask && overTask.matrixPosition === null);

    if (isOverList) {
      // If task is not currently in list mode, put it in list mode
      if (currentTask.matrixPosition !== null) {
        // Update local state immediately
        const updated = localTasks.map(t => t.id === activeId ? { ...t, matrixPosition: null } : t);
        setLocalTasks(updated);
      }
      
      // Perform sorting if over another task in the same list
      if (overTask && overTask.matrixPosition === null && currentTask.matrixPosition === null) {
        moveTaskLocally(activeId as string, overId as string);
      }
    } else {
      // We are NOT over the list (presumably over matrix or a matrix task)
      
      // If the task was originally from the matrix, and we temporarily moved it to list, restore it
      if (currentTask.matrixPosition === null && activeTask?.matrixPosition) {
         const updated = localTasks.map(t => t.id === activeId ? { ...t, matrixPosition: activeTask.matrixPosition } : t);
         setLocalTasks(updated);
      }
    }
  };

  const updatePositions = (tasks: Task[]): Task[] => {
    // Calculate new positions for all tasks based on their current order in the array
    // Group tasks by matrixPosition (null = panel, non-null = matrix)
    const panelTasks = tasks.filter(t => t.matrixPosition === null);
    
    // Update positions for panel tasks based on their index within the panel
    const updatedTasks = tasks.map(task => {
      if (task.matrixPosition === null) {
        const position = panelTasks.findIndex(t => t.id === task.id);
        // Use index * 100 to allow inserting between tasks later
        return { ...task, position: position * 100 };
      }
      return task;
    });

    return updatedTasks;
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    const taskId = active.id as string;

    if (!over) {
      setActiveTask(null);
      return;
    }

    const activeTaskObj = localTasks.find((t) => t.id === taskId);
    if (!activeTaskObj) {
      setActiveTask(null);
      return;
    }

    // Check if dropped into the matrix area
    if (over.id === "matrix-canvas" && matrixRef.current) {
      const rect = matrixRef.current.getBoundingClientRect();
      const activeRect = active.rect.current.translated;
      
      if (activeRect) {
        const centerX = activeRect.left + activeRect.width / 2;
        const centerY = activeRect.top + activeRect.height / 2;
        
        const x = ((centerX - rect.left) / rect.width) * 100;
        const y = ((centerY - rect.top) / rect.height) * 100;
        
        const position: MatrixPosition = {
          x: Math.max(5, Math.min(95, x)),
          y: Math.max(5, Math.min(95, y)),
        };
        
        // Calculate new z-index: get max z-index from all matrix tasks and add 1
        // This ensures the moved task appears on top
        const matrixTasks = localTasks.filter(t => t.matrixPosition !== null);
        const maxZIndex = matrixTasks.reduce((max, t) => {
          const zIndex = t.matrix_z_index ?? 0;
          return Math.max(max, zIndex);
        }, 0);
        const newZIndex = maxZIndex + 1;

        // Update locally first for immediate feedback
        const updated = localTasks.map(t => 
          t.id === taskId 
            ? { ...t, matrixPosition: position, matrix_z_index: newZIndex } 
            : t
        );
        setLocalTasks(updated);

        // Mark that we just finished dragging this task to prevent glitch
        justFinishedDragRef.current = taskId;
        
        try {
          await updateTask.mutateAsync({ 
            id: taskId, 
            updates: { 
              matrixPosition: position,
              matrix_z_index: newZIndex 
            } 
          });
          onTaskPositionChange?.(taskId, position);
        } finally {
          setTimeout(() => {
            justFinishedDragRef.current = null;
          }, 200);
        }
      }
    } else {
      // Check if dropped into the sidebar (task-panel or onto another task in the list)
      const isOverTaskPanel = over.id === "task-panel";
      const overTask = localTasks.find(t => t.id === over.id);
      const isOverPanelTask = overTask?.matrixPosition === null;

      if (isOverTaskPanel || isOverPanelTask) {
        const wasInPanel = activeTaskObj.matrixPosition === null;

        // Update locally first - ensure task is in panel
        let updated = localTasks.map(t => t.id === taskId ? { ...t, matrixPosition: null } : t);
        setLocalTasks(updated);

        // Mark that we just finished dragging this task to prevent glitch
        justFinishedDragRef.current = taskId;

        try {
          // Always update positions for panel tasks when dropping in panel
          // This handles both moving from matrix to panel and reordering within panel
          const updatedTasks = updatePositions(updated);
          setLocalTasks(updatedTasks);
          
          const panelTasks = updatedTasks.filter(t => t.matrixPosition === null);
          const tasksToUpdate: Partial<Task>[] = [];
          const tasksMap = new Map(tasks.map(t => [t.id, t]));

          for (const task of panelTasks) {
            const originalTask = tasksMap.get(task.id);
            // Update position if it changed, or update matrixPosition if task moved from matrix
            if (!originalTask || originalTask.position !== task.position || 
                originalTask.matrixPosition !== null) {
              tasksToUpdate.push({
                id: task.id,
                position: task.position,
                matrixPosition: null, // Ensure it's set to null for panel tasks
              });
            }
          }

          if (tasksToUpdate.length > 0) {
            await updateTasks.mutateAsync(tasksToUpdate);
          }

          // Only call onTaskPositionChange if task was moved from matrix to panel
          if (!wasInPanel) {
            onTaskPositionChange?.(taskId, null);
          }
          // Don't call onTaskPositionChange when just reordering within panel
        } finally {
          setTimeout(() => {
            justFinishedDragRef.current = null;
          }, 200);
        }
      }
    }
    
    setActiveTask(null);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-full w-full">
        <div className="flex-1 flex flex-col p-4">
          <div className="mb-4">
            <h1 className="text-lg font-semibold text-foreground">
              {dictionary.interactive_matrix.title}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {dictionary.interactive_matrix.subtitle}
            </p>
          </div>
          <div ref={matrixRef} className="flex-1 flex">
            <MatrixCanvas tasks={localTasks as PositionedTask[]} />
          </div>
        </div>
        <TaskPanel tasks={localTasks as PositionedTask[]} isDragging={!!activeTask} />
      </div>
      <DragOverlay dropAnimation={null}>
        {activeTask ? (
          <DraggableTaskOverlay 
            task={activeTask} 
            isFromMatrix={activeTask.matrixPosition !== null} 
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
