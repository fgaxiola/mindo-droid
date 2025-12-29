"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { useDndContext } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { PositionedTask } from "@/stores/interactive-matrix-store";
import { cn } from "@/lib/utils";
import { CheckCircle2, Circle, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TaskDialog } from "@/components/tasks/task-dialog";
import {
  useTaskMutations,
  useTaskVersions,
  useRestoreTaskVersion,
} from "@/hooks/use-tasks";

interface SortableTaskProps {
  task: PositionedTask;
}

export function SortableTask({ task }: SortableTaskProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const { updateTask } = useTaskMutations();
  const { active } = useDndContext();
  const isAnyDragging = !!active;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, data: { task } });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className={cn(
          "group bg-white border border-border rounded-lg shadow-sm cursor-grab active:cursor-grabbing select-none p-3 transition-shadow hover:shadow-md relative",
          isDragging && "opacity-0"
        )}
      >
        <div
          className={cn(
            "absolute top-2 right-2 transition-opacity z-10",
            isAnyDragging
              ? "opacity-0 pointer-events-none"
              : "opacity-0 group-hover:opacity-100"
          )}
        >
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 bg-background/80 hover:bg-background shadow-sm"
            onClick={(e) => {
              e.stopPropagation(); // Prevent drag start
              setIsEditOpen(true);
            }}
          >
            <Pencil className="h-3 w-3" />
          </Button>
        </div>
        <div className="flex items-start gap-2">
          <button
            className="mt-0.5 shrink-0 hover:opacity-70 transition-opacity cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              updateTask.mutate({
                id: task.id,
                updates: { is_completed: !task.is_completed },
              });
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

      {isEditOpen && (
        <SortableTaskDialogWrapper 
          task={task} 
          open={isEditOpen} 
          onOpenChange={setIsEditOpen} 
        />
      )}
    </>
  );
}

function SortableTaskDialogWrapper({ 
  task, 
  open, 
  onOpenChange 
}: { 
  task: PositionedTask, 
  open: boolean, 
  onOpenChange: (open: boolean) => void 
}) {
  const { updateTask, deleteTask } = useTaskMutations();
  const { data: versions } = useTaskVersions(task.id);
  const restoreTask = useRestoreTaskVersion();

  return (
    <TaskDialog
      open={open}
      onOpenChange={onOpenChange}
      task={task}
      onSave={async (data) => {
        await updateTask.mutateAsync({ id: task.id, updates: data });
      }}
      onDelete={async () => {
        await deleteTask.mutateAsync(task.id);
      }}
      onRestore={async (version) => {
        await restoreTask.mutateAsync(version);
        onOpenChange(false);
      }}
      versions={versions}
    />
  );
}
