"use client";

import { useEffect } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  DragOverEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import { useState } from "react";
import { Task, TaskCoords } from "@/types/task";
import { useTaskStore } from "@/stores/task-store";
import { Matrix } from "./matrix";
import { TaskSidebar } from "./task-sidebar";
import { TaskCard } from "./task-card";
import { useDictionary } from "@/providers/dictionary-provider";

interface EisenhowerBoardProps {
  initialTasks: Task[];
  onTaskCoordsChange?: (taskId: string, coords: TaskCoords) => void;
}

export function EisenhowerBoard({
  initialTasks,
  onTaskCoordsChange,
}: EisenhowerBoardProps) {
  const dictionary = useDictionary();
  const { tasks, setTasks, updateTaskCoords, moveTask } = useTaskStore();
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

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const activeTask = tasks.find((t) => t.id === activeId);
    const overTask = tasks.find((t) => t.id === overId);

    if (!activeTask) return;

    // If over a task
    if (overTask) {
      // Allow sorting if in same container
      if (
        activeTask.coords.x === overTask.coords.x &&
        activeTask.coords.y === overTask.coords.y
      ) {
        moveTask(activeId as string, overId as string);
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id as string;
    
    // Check if dropped on a Quadrant droppable area
    if (over.data.current?.coords) {
      const targetCoords = over.data.current.coords as TaskCoords;
      updateTaskCoords(taskId, targetCoords);
      onTaskCoordsChange?.(taskId, targetCoords);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-full w-full">
        <div className="flex-1 flex flex-col">
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-semibold text-foreground">
                  {dictionary.matrix.title}
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {dictionary.matrix.subtitle}
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span>←</span>
                  <span>{dictionary.matrix.not_urgent}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>{dictionary.matrix.urgent}</span>
                  <span>→</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex-1 flex">
            <div className="flex flex-col justify-center px-2 text-xs text-muted-foreground">
              <div className="writing-mode-vertical flex items-center gap-2">
                <span>↑ {dictionary.matrix.important}</span>
                <span className="mx-4">|</span>
                <span>{dictionary.matrix.not_important} ↓</span>
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
