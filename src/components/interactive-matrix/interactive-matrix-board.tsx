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
import {
  PositionedTask,
  MatrixPosition,
} from "@/stores/interactive-matrix-store";
import { MatrixCanvas } from "./matrix-canvas";
import { TaskPanel } from "./task-panel";
import { DraggableTaskOverlay } from "./draggable-task";
import { Task } from "@/types/task";
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
  const { updateTask } = useTaskMutations();
  const [activeTask, setActiveTask] = useState<PositionedTask | null>(null);
  const [localTasks, setLocalTasks] = useState<Task[]>(initialTasks.filter(t => !t.is_completed));
  const matrixRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 20,
      },
    })
  );

  useEffect(() => {
    if (tasks) {
      setLocalTasks(prev => {
        // Filter out completed tasks before processing
        const activeTasks = tasks.filter(t => !t.is_completed);

        // Create a map of updated active tasks for O(1) lookup
        const tasksMap = new Map(activeTasks.map(t => [t.id, t]));

        // Keep existing order for active tasks that are still in the list
        const mergedTasks = prev.map(t => tasksMap.get(t.id) || t)
          .filter(t => tasksMap.has(t.id));

        // Add any new active tasks that weren't in the previous state
        const prevIds = new Set(prev.map(t => t.id));
        const newTasks = activeTasks.filter(t => !prevIds.has(t.id));

        return [...mergedTasks, ...newTasks];
      });
    }
  }, [tasks]);

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
      
      // Perform sorting if over another task
      if (overTask && overTask.matrixPosition === null) {
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

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id as string;

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
        
        // Update locally first for immediate feedback (though handleDragOver usually handles this)
        const updated = localTasks.map(t => t.id === taskId ? { ...t, matrixPosition: position } : t);
        setLocalTasks(updated);

        await updateTask.mutateAsync({ id: taskId, updates: { matrixPosition: position } });
        onTaskPositionChange?.(taskId, position);
      }
    } else {
      // Check if dropped into the sidebar (task-panel or onto another task in the list)
      const isOverTaskPanel = over.id === "task-panel";
      const isOverPanelTask = localTasks.find(t => t.id === over.id)?.matrixPosition === null;

      if (isOverTaskPanel || isOverPanelTask) {
        // Update locally first
        const updated = localTasks.map(t => t.id === taskId ? { ...t, matrixPosition: null } : t);
        setLocalTasks(updated);

        await updateTask.mutateAsync({ id: taskId, updates: { matrixPosition: null } });
        onTaskPositionChange?.(taskId, null);
      }
    }
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
