"use client";

import { useEffect } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useState } from "react";
import { Task, TaskCoords } from "@/types/task";
import { useTaskStore } from "@/stores/task-store";
import { Matrix } from "./matrix";
import { TaskSidebar } from "./task-sidebar";
import { TaskCard } from "./task-card";

interface EisenhowerBoardProps {
  initialTasks: Task[];
  onTaskCoordsChange?: (taskId: string, coords: TaskCoords) => void;
}

export function EisenhowerBoard({
  initialTasks,
  onTaskCoordsChange,
}: EisenhowerBoardProps) {
  const { tasks, setTasks, updateTaskCoords } = useTaskStore();
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks, setTasks]);

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
    const dropData = over.data.current as { coords: TaskCoords } | undefined;

    if (dropData?.coords) {
      updateTaskCoords(taskId, dropData.coords);
      onTaskCoordsChange?.(taskId, dropData.coords);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-full w-full">
        <div className="flex-1 flex flex-col">
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-semibold text-foreground">
                  Eisenhower Matrix
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Prioritize tasks by urgency and importance
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span>←</span>
                  <span>Not Urgent</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>Urgent</span>
                  <span>→</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex-1 flex">
            <div className="flex flex-col justify-center px-2 text-xs text-muted-foreground">
              <div className="writing-mode-vertical flex items-center gap-2">
                <span>↑ Important</span>
                <span className="mx-4">|</span>
                <span>Not Important ↓</span>
              </div>
            </div>
            <Matrix tasks={tasks} />
          </div>
        </div>
        <TaskSidebar tasks={tasks} />
      </div>
      <DragOverlay>
        {activeTask ? <TaskCard task={activeTask} isOverlay /> : null}
      </DragOverlay>
    </DndContext>
  );
}
