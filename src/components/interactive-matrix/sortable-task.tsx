"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { PositionedTask } from "@/stores/interactive-matrix-store";
import { cn } from "@/lib/utils";

interface SortableTaskProps {
  task: PositionedTask;
}

export function SortableTask({ task }: SortableTaskProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({ id: task.id, data: { task } });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  return (
    <div className="relative">
      {isOver && !isDragging && (
        <div 
          className={cn(
            "absolute left-0 right-0 h-0.5 bg-black z-10",
            transform && transform.y > 0 ? "top-0 -translate-y-1" : "bottom-0 translate-y-1"
          )} 
        />
      )}
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className={cn(
          "bg-white border border-border rounded-lg shadow-sm cursor-grab active:cursor-grabbing select-none p-3 transition-shadow hover:shadow-md",
          isDragging && "opacity-0"
        )}
      >
        <h4 className="text-xs font-medium text-foreground line-clamp-2">
          {task.title}
        </h4>
        <p className="text-[10px] text-muted-foreground line-clamp-1 mt-1">
          {task.description}
        </p>
        {task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {task.tags.slice(0, 2).map((tag) => (
              <span
                key={tag.id}
                className="px-1 py-0.5 text-[8px] font-medium rounded"
                style={{ backgroundColor: tag.color + "20", color: tag.color }}
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
