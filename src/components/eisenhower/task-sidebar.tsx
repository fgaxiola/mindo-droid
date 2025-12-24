"use client";

import { useDroppable } from "@dnd-kit/core";
import { Task } from "@/types/task";
import { TaskCard } from "./task-card";
import { cn } from "@/lib/utils";

interface TaskSidebarProps {
  tasks: Task[];
}

export function TaskSidebar({ tasks }: TaskSidebarProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: "sidebar",
    data: { coords: { x: -1, y: -1 } },
  });

  const unassignedTasks = tasks.filter(
    (task) => task.coords.x === -1 && task.coords.y === -1
  );

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "w-72 border-l border-border bg-muted/30 flex flex-col",
        isOver && "bg-muted/50"
      )}
    >
      <div className="p-4 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground">Tasks</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Drag tasks to the matrix
        </p>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {unassignedTasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
        {unassignedTasks.length === 0 && (
          <div className="text-center py-8 text-xs text-muted-foreground">
            All tasks are assigned
          </div>
        )}
      </div>
    </div>
  );
}
