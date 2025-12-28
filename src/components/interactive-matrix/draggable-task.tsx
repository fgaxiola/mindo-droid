"use client";

import { useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { PositionedTask } from "@/stores/interactive-matrix-store";
import { cn } from "@/lib/utils";
import { CheckCircle2, Circle, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TaskDialog } from "@/components/tasks/task-dialog";
import { useTaskMutations, useTaskVersions, useRestoreTaskVersion } from "@/hooks/use-tasks";

interface DraggableTaskProps {
  task: PositionedTask;
  isOnMatrix?: boolean;
  style?: React.CSSProperties;
}

export function DraggableTask({ task, isOnMatrix, style }: DraggableTaskProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const { updateTask, deleteTask } = useTaskMutations();
  const { data: versions } = useTaskVersions(isEditOpen ? task.id : undefined);
  const restoreTask = useRestoreTaskVersion();

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: task.id,
      data: { task },
    });

  const dndTransform = transform ? CSS.Translate.toString(transform) : "";
  const styleTransform = style?.transform || "";
  
  const combinedTransform = dndTransform 
    ? (styleTransform ? `${dndTransform} ${styleTransform}` : dndTransform)
    : styleTransform;

  const dragStyle = {
    ...style,
    transform: combinedTransform,
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={dragStyle}
        {...listeners}
        {...attributes}
        className={cn(
          "bg-white border border-border rounded-lg shadow-sm cursor-grab active:cursor-grabbing select-none transition-shadow hover:shadow-md group",
          isDragging && "opacity-0",
          isOnMatrix ? "absolute p-2 w-32" : "p-3"
        )}
      >
        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 bg-background/80 hover:bg-background shadow-sm"
            onClick={(e) => {
              e.stopPropagation(); // Prevent drag start
              setIsEditOpen(true);
            }}
          >
            <Pencil className="h-2.5 w-2.5" />
          </Button>
        </div>
        <div className="flex items-start gap-2 pr-5">
          <button
            className="mt-0.5 shrink-0 hover:opacity-70 transition-opacity cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              updateTask.mutate({ id: task.id, updates: { is_completed: !task.is_completed } });
            }}
          >
            {task.is_completed ? (
              <CheckCircle2 className="h-3 w-3 text-green-500" />
            ) : (
              <Circle className="h-3 w-3 text-muted-foreground" />
            )}
          </button>
          <h4 
            className={cn(
              "text-xs font-medium text-foreground line-clamp-2 cursor-pointer hover:underline decoration-primary/50 underline-offset-2",
              task.is_completed && "line-through text-muted-foreground"
            )}
            onClick={(e) => {
              e.stopPropagation();
              setIsEditOpen(true);
            }}
          >
            {task.title}
          </h4>
        </div>
        {!isOnMatrix && task.description && (
          <div className="text-[10px] text-muted-foreground line-clamp-1 mt-1" dangerouslySetInnerHTML={{ __html: task.description }} />
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

      <TaskDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        task={task}
        onSave={async (data) => {
          await updateTask.mutateAsync({ id: task.id, updates: data });
        }}
        onDelete={async () => {
          await deleteTask.mutateAsync(task.id);
        }}
        onRestore={async (version) => {
          await restoreTask.mutateAsync(version);
          setIsEditOpen(false);
        }}
        versions={versions}
      />
    </>
  );
}

export function DraggableTaskOverlay({ task, isFromMatrix }: { task: PositionedTask; isFromMatrix?: boolean }) {
  return (
    <div 
      style={isFromMatrix ? { transform: "translate(-50%, -50%)" } : undefined}
      className={cn(
        "bg-white border border-border rounded-lg shadow-xl rotate-3 cursor-grabbing",
        isFromMatrix ? "p-2 w-32" : "p-3 w-56"
      )}
    >
      <div className="flex items-start gap-2 pr-5">
        {task.is_completed ? (
          <CheckCircle2 className="h-3 w-3 text-green-500 mt-0.5 shrink-0" />
        ) : (
          <Circle className="h-3 w-3 text-muted-foreground mt-0.5 shrink-0" />
        )}
        <h4 className={cn(
          "text-xs font-medium text-foreground line-clamp-2",
          task.is_completed && "line-through text-muted-foreground"
        )}>
          {task.title}
        </h4>
      </div>
      {!isFromMatrix && task.description && (
        <div className="text-[10px] text-muted-foreground line-clamp-1 mt-1" dangerouslySetInnerHTML={{ __html: task.description }} />
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
