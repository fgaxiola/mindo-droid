"use client";

import { useState } from "react";
import { useDraggable, useDndContext } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Task } from "@/types/task";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CheckCircle2, Circle, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TaskDialog } from "@/components/tasks/task-dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  useTaskMutations,
  useTaskVersions,
  useRestoreTaskVersion,
} from "@/hooks/use-tasks";

interface TaskCardProps {
  task: Task;
  isOverlay?: boolean;
}

function getTooltipDelay() {
  return parseInt(process.env.NEXT_PUBLIC_TOOLTIP_HOVER_DELAY_MS || "1000", 10);
}

export function TaskCard({ task, isOverlay }: TaskCardProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const tooltipDelay = getTooltipDelay();
  const { updateTask, deleteTask } = useTaskMutations();
  const { data: versions } = useTaskVersions(isEditOpen ? task.id : undefined);
  const restoreTask = useRestoreTaskVersion();
  const { active } = useDndContext();
  const isAnyDragging = !!active;
  const shouldShowTooltip = !isAnyDragging;

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: task.id,
      data: { task },
    });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  return (
    <>
      <Card
        ref={setNodeRef}
        style={style}
        {...listeners}
        {...attributes}
        className={cn(
          "group p-3 select-none relative",
          "border border-border bg-card hover:bg-accent/50 transition-colors",
          !isDragging && !isOverlay && "cursor-default",
          (isDragging || isOverlay) && "cursor-grabbing shadow-lg rotate-3",
          isDragging && "opacity-0"
        )}
      >
        <div className="space-y-2">
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
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
            {shouldShowTooltip ? (
              <Tooltip delayDuration={tooltipDelay}>
                <TooltipTrigger asChild>
                  <h4
                    className={cn(
                      "text-sm font-medium text-foreground line-clamp-2 cursor-pointer hover:underline decoration-primary/50 underline-offset-2",
                      task.is_completed && "line-through text-muted-foreground"
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsEditOpen(true);
                    }}
                  >
                    {task.title}
                  </h4>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{task.title}</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <h4
                className={cn(
                  "text-sm font-medium text-foreground line-clamp-2 cursor-pointer hover:underline decoration-primary/50 underline-offset-2",
                  task.is_completed && "line-through text-muted-foreground"
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditOpen(true);
                }}
              >
                {task.title}
              </h4>
            )}
          </div>
          {task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {task.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag.id}
                  className="px-1.5 py-0.5 text-[10px] font-medium rounded-full"
                  style={{
                    backgroundColor: tag.color + "20",
                    color: tag.color,
                  }}
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </Card>

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
