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
  useInteractiveMatrixStore,
  MatrixPosition,
} from "@/stores/interactive-matrix-store";
import { MatrixCanvas } from "./matrix-canvas";
import { TaskPanel } from "./task-panel";
import { DraggableTaskOverlay } from "./draggable-task";
import { Task } from "@/types/task";
import { useDictionary } from "@/providers/dictionary-provider";

interface InteractiveMatrixBoardProps {
  initialTasks: Task[];
  onTaskPositionChange?: (taskId: string, position: MatrixPosition | null) => void;
}

export function InteractiveMatrixBoard({
  initialTasks,
  onTaskPositionChange,
}: InteractiveMatrixBoardProps) {
  const dictionary = useDictionary();
  const { tasks, setTasks, updateTaskPosition, moveTask } = useInteractiveMatrixStore();
  const [activeTask, setActiveTask] = useState<PositionedTask | null>(null);
  const matrixRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  useEffect(() => {
    if (tasks.length === 0 && initialTasks.length > 0) {
      const positionedTasks: PositionedTask[] = initialTasks.map((task) => ({
        ...task,
        matrixPosition: null,
      }));
      setTasks(positionedTasks);
    }
  }, [initialTasks, tasks.length, setTasks]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find((t) => t.id === active.id);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const currentTask = tasks.find((t) => t.id === activeId);
    const overTask = tasks.find((t) => t.id === overId);

    if (!currentTask) return;

    // Determine if we are over the list (either the panel itself or a list item)
    const isOverList = overId === "task-panel" || (overTask && overTask.matrixPosition === null);

    if (isOverList) {
      // If task is not currently in list mode, put it in list mode
      if (currentTask.matrixPosition !== null) {
        updateTaskPosition(activeId as string, null);
      }
      
      // Perform sorting if over another task
      if (overTask && overTask.matrixPosition === null) {
        moveTask(activeId as string, overId as string);
      }
    } else {
      // We are NOT over the list (presumably over matrix or a matrix task)
      
      // If the task was originally from the matrix, and we temporarily moved it to list, restore it
      // This prevents it from getting stuck in the list if we drag out without dropping
      if (currentTask.matrixPosition === null && activeTask?.matrixPosition) {
         updateTaskPosition(activeId as string, activeTask.matrixPosition);
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
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
        
        updateTaskPosition(taskId, position);
        onTaskPositionChange?.(taskId, position);
      }
    } else {
      // Check if dropped into the sidebar (task-panel or onto another task in the list)
      const isOverTaskPanel = over.id === "task-panel";
      const isOverPanelTask = tasks.find(t => t.id === over.id)?.matrixPosition === null;

      if (isOverTaskPanel || isOverPanelTask) {
        updateTaskPosition(taskId, null);
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
            <MatrixCanvas tasks={tasks} />
          </div>
        </div>
        <TaskPanel tasks={tasks} />
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
