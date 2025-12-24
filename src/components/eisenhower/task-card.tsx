"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Task } from "@/types/task";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  task: Task;
  isOverlay?: boolean;
}

export function TaskCard({ task, isOverlay }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: task.id,
      data: { task },
    });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "p-3 cursor-grab active:cursor-grabbing select-none",
        "border border-border bg-card hover:bg-accent/50 transition-colors",
        isDragging && "opacity-0",
        isOverlay && "shadow-lg rotate-3"
      )}
    >
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-foreground line-clamp-2">
          {task.title}
        </h4>
        {task.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {task.description}
          </p>
        )}
        {task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {task.tags.map((tag) => (
              <span
                key={tag.id}
                className="px-1.5 py-0.5 text-[10px] font-medium rounded"
                style={{ backgroundColor: tag.color + "20", color: tag.color }}
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
