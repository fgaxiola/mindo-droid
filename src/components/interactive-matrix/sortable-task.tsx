"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { PositionedTask } from "@/stores/interactive-matrix-store";
import { cn } from "@/lib/utils";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TaskDialog } from "@/components/tasks/task-dialog";
import { useTaskMutations, useTaskVersions, useRestoreTaskVersion } from "@/hooks/use-tasks";

interface SortableTaskProps {
  task: PositionedTask;
}

export function SortableTask({ task }: SortableTaskProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const { updateTask, deleteTask } = useTaskMutations();
  const { data: versions } = useTaskVersions(isEditOpen ? task.id : undefined);
  const restoreTask = useRestoreTaskVersion();

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
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
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
        <h4 className="text-xs font-medium text-foreground line-clamp-2 pr-6">
          {task.title}
        </h4>
        {task.description && (
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
