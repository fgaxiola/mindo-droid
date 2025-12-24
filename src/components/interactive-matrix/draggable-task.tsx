"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { PositionedTask } from "@/stores/interactive-matrix-store";
import { cn } from "@/lib/utils";

interface DraggableTaskProps {
  task: PositionedTask;
  isOnMatrix?: boolean;
  style?: React.CSSProperties;
}

export function DraggableTask({ task, isOnMatrix, style }: DraggableTaskProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: task.id,
      data: { task },
    });

  const dragStyle = {
    transform: CSS.Translate.toString(transform),
    ...style,
  };

  return (
    <div
      ref={setNodeRef}
      style={dragStyle}
      {...listeners}
      {...attributes}
      className={cn(
        "bg-white border border-border rounded-lg shadow-sm cursor-grab active:cursor-grabbing select-none transition-shadow hover:shadow-md",
        isDragging && "opacity-70 shadow-lg z-50",
        isOnMatrix ? "absolute p-2 w-32" : "p-3"
      )}
    >
      <h4 className="text-xs font-medium text-foreground line-clamp-2">
        {task.title}
      </h4>
      {!isOnMatrix && task.description && (
        <p className="text-[10px] text-muted-foreground line-clamp-1 mt-1">
          {task.description}
        </p>
      )}
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
  );
}

export function DraggableTaskOverlay({ task }: { task: PositionedTask }) {
  return (
    <div className="bg-white border border-border rounded-lg shadow-xl p-2 w-32 rotate-3">
      <h4 className="text-xs font-medium text-foreground line-clamp-2">
        {task.title}
      </h4>
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
  );
}
