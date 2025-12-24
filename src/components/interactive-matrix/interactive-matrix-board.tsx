"use client";

import { useEffect, useRef, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
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

interface InteractiveMatrixBoardProps {
  initialTasks: Task[];
  onTaskPositionChange?: (taskId: string, position: MatrixPosition | null) => void;
}

export function InteractiveMatrixBoard({
  initialTasks,
  onTaskPositionChange,
}: InteractiveMatrixBoardProps) {
  const { tasks, setTasks, updateTaskPosition } = useInteractiveMatrixStore();
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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id as string;

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
    } else if (over.id === "task-panel") {
      updateTaskPosition(taskId, null);
      onTaskPositionChange?.(taskId, null);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-full w-full">
        <div className="flex-1 flex flex-col p-4">
          <div className="mb-4">
            <h1 className="text-lg font-semibold text-foreground">
              Matriz de Eisenhower Interactiva
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Arrastra las tareas libremente sobre la matriz para priorizarlas
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
