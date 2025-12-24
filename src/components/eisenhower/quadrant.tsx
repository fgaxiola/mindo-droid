"use client";

import { useDroppable } from "@dnd-kit/core";
import { Task, Quadrant as QuadrantType } from "@/types/task";
import { TaskCard } from "./task-card";
import { cn } from "@/lib/utils";

interface QuadrantProps {
  quadrant: QuadrantType;
  tasks: Task[];
}

export function Quadrant({ quadrant, tasks }: QuadrantProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `quadrant-${quadrant.type}`,
    data: { coords: quadrant.coords },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col p-4 rounded-lg border-2 transition-all min-h-[200px]",
        quadrant.color,
        isOver && "ring-2 ring-primary ring-offset-2"
      )}
    >
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-foreground">
          {quadrant.label}
        </h3>
        <p className="text-xs text-muted-foreground">{quadrant.description}</p>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
        {tasks.length === 0 && (
          <div className="flex items-center justify-center h-full min-h-[100px] text-xs text-muted-foreground border-2 border-dashed border-border/50 rounded-md">
            Drop tasks here
          </div>
        )}
      </div>
    </div>
  );
}
