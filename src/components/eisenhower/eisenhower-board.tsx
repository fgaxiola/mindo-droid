"use client";

import { useEffect, useState } from "react";
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
import { useTaskMutations, useTasks } from "@/hooks/use-tasks";
import { Task, TaskCoords } from "@/types/task";
import { useDictionary } from "@/providers/dictionary-provider";
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
  const dictionary = useDictionary();
  const { data: tasks = initialTasks } = useTasks();
  const { updateTask } = useTaskMutations();
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [localTasks, setLocalTasks] = useState<Task[]>(initialTasks);

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
        // Create a map of updated tasks for O(1) lookup
        const tasksMap = new Map(tasks.map(t => [t.id, t]));
        
        // Keep existing order for tasks that are still in the list
        const mergedTasks = prev.map(t => tasksMap.get(t.id) || t)
          .filter(t => tasksMap.has(t.id));
          
        // Add any new tasks that weren't in the previous state
        const prevIds = new Set(prev.map(t => t.id));
        const newTasks = tasks.filter(t => !prevIds.has(t.id));
        
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
      setActiveTask(task);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    const activeTask = localTasks.find((t) => t.id === activeId);
    if (!activeTask) return;

    const overTask = localTasks.find((t) => t.id === overId);
    const isOverContainer = over.data.current?.coords;

    let targetCoords: TaskCoords | null = null;

    if (overTask) {
      targetCoords = overTask.coords;
    } else if (isOverContainer) {
      targetCoords = over.data.current?.coords as TaskCoords;
    }

    if (targetCoords) {
      // Check if task is moving to a different list
      const isMovingToList = activeTask.coords.x !== targetCoords.x || activeTask.coords.y !== targetCoords.y;

      if (isMovingToList) {
        // Update local state immediately for responsiveness
        const updated = localTasks.map(t => t.id === activeId ? { ...t, coords: targetCoords! } : t);
        
        // If we are over a specific task in the new list, insert relative to it
        if (overTask) {
           const oldIndex = updated.findIndex(t => t.id === activeId);
           const newIndex = updated.findIndex(t => t.id === overId);
           
           if (oldIndex !== -1 && newIndex !== -1) {
             const [movedTask] = updated.splice(oldIndex, 1);
             // Insert at new index (swapping basically)
             updated.splice(newIndex, 0, movedTask);
           }
        } else {
           // If dropped on container (empty space), move to end of array to be safe, 
           // but technically it should be just added to the group.
           // However, to prevent it from being stuck in "weird space" index if the list is filtered,
           // pushing to end of GLOBAL list is usually safe for "bottom of list" behavior.
           // But if we want it at top, we can't easily guess. 
           // For now, let's just update coords. The sortable context will handle the rest via subsequent DragOver events if user moves it.
           // BUT, if we simply update coords, the index in the global array remains the same.
           // If the global array is [A(Q1), B(Q2)], and we move A to Q2.
           // It becomes [A(Q2), B(Q2)].
           // In Q2 list, A comes before B.
           // If user dropped it on "container" (empty space at bottom), they expect it at bottom.
           // So moving to end of array is actually correct for "drop on container".
           const oldIndex = updated.findIndex(t => t.id === activeId);
           if (oldIndex !== -1) {
               const [movedTask] = updated.splice(oldIndex, 1);
               updated.push(movedTask);
           }
        }
        setLocalTasks(updated);
      } 
      else if (overTask) {
        // Same list sorting
        moveTaskLocally(activeId, overId);
      }
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id as string;
    
    // Check if dropped on a Quadrant droppable area or over another task
    const isOverContainer = over.data.current?.coords;
    const overTask = localTasks.find((t) => t.id === over.id);
    
    let targetCoords: TaskCoords | null = null;

    if (overTask) {
        targetCoords = overTask.coords;
    } else if (isOverContainer) {
        targetCoords = over.data.current?.coords as TaskCoords;
    }

    if (targetCoords) {
      await updateTask.mutateAsync({ id: taskId, updates: { coords: targetCoords } });
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
            <Matrix tasks={localTasks} />
          </div>
        </div>
        <TaskSidebar tasks={localTasks} />
      </div>
      <DragOverlay>
        {activeTask ? <TaskCard task={activeTask} isOverlay /> : null}
      </DragOverlay>
    </DndContext>
  );
}
