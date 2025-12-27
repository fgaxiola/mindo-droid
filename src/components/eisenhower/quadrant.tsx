"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Task, Quadrant as QuadrantType } from "@/types/task";
import { SortableTaskCard } from "./sortable-task-card";
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
        quadrant.color
      )}
    >
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-foreground">
          {quadrant.label}
        </h3>
        <p className="text-xs text-muted-foreground">{quadrant.description}</p>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto">
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <SortableTaskCard key={task.id} task={task} />
          ))}
        </SortableContext>
        {tasks.length === 0 && (
          <div className="flex items-center justify-center h-full min-h-[100px] text-xs text-muted-foreground border-2 border-dashed border-border/50 rounded-md">
            Drop tasks here
          </div>
        )}
      </div>
    </div>
  );
}
