"use client";

import { useState, memo } from "react";
import { useDraggable, useDndContext } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Task } from "@/types/task";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CheckCircle2, Circle, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TaskDialog } from "@/components/tasks/task-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  useTaskMutations,
  useTaskVersions,
  useRestoreTaskVersion,
  useTasks,
} from "@/hooks/use-tasks";
import { useDictionary } from "@/providers/dictionary-provider";

interface TaskCardProps {
  task: Task;
  isOverlay?: boolean;
}

function getTooltipDelay() {
  return parseInt(process.env.NEXT_PUBLIC_TOOLTIP_HOVER_DELAY_MS || "1000", 10);
}

export const TaskCard = memo(function TaskCard({ task, isOverlay }: TaskCardProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const tooltipDelay = getTooltipDelay();
  const { updateTask, deleteTask } = useTaskMutations();
  const { data: versions } = useTaskVersions(isEditOpen ? task.id : undefined);
  const restoreTask = useRestoreTaskVersion();
  const { active } = useDndContext();
  const isAnyDragging = !!active;
  const shouldShowTooltip = !isAnyDragging;
  const dictionary = useDictionary();

  // Use useTasks hook to subscribe to cache changes
  // This ensures the component re-renders when the cache updates
  const { data: allTasks } = useTasks();

  // Get the latest task from React Query cache to ensure we always show the most recent data
  // This is important because the parent component may have stale local state
  const latestTask = allTasks?.find((t) => t.id === task.id) || task;

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: latestTask.id,
      data: { task: latestTask },
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
                  id: latestTask.id,
                  updates: { is_completed: !latestTask.is_completed },
                });
              }}
            >
              {latestTask.is_completed ? (
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
                      latestTask.is_completed &&
                        "line-through text-muted-foreground"
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsEditOpen(true);
                    }}
                  >
                    {latestTask.title}
                  </h4>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{latestTask.title}</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <h4
                className={cn(
                  "text-sm font-medium text-foreground line-clamp-2 cursor-pointer hover:underline decoration-primary/50 underline-offset-2",
                  latestTask.is_completed &&
                    "line-through text-muted-foreground"
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditOpen(true);
                }}
              >
                {latestTask.title}
              </h4>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-1">
            {latestTask.the_one && (
              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <span className="px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-yellow-500/20 text-yellow-600 dark:text-yellow-500">
                    Big 3
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{dictionary.task_dialog?.the_one_tooltip || "Tarea más importante de hoy"}</p>
                </TooltipContent>
              </Tooltip>
            )}
            {latestTask.tags.length > 0 &&
              latestTask.tags.slice(0, 3).map((tag) => (
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
        </div>
      </Card>

      <TaskDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        task={latestTask}
        onSave={async (data) => {
          await updateTask.mutateAsync({ id: latestTask.id, updates: data });
        }}
        onDelete={async () => {
          await deleteTask.mutateAsync(latestTask.id);
        }}
        onRestore={async (version) => {
          await restoreTask.mutateAsync(version);
          setIsEditOpen(false);
        }}
        versions={versions}
      />
    </>
  );
}, (prevProps, nextProps) => {
  // Custom comparison: only re-render if task data actually changed
  return (
    prevProps.task.id === nextProps.task.id &&
    prevProps.task.title === nextProps.task.title &&
    prevProps.task.description === nextProps.task.description &&
    prevProps.task.is_completed === nextProps.task.is_completed &&
    prevProps.task.the_one === nextProps.task.the_one &&
    prevProps.task.coords.x === nextProps.task.coords.x &&
    prevProps.task.coords.y === nextProps.task.coords.y &&
    prevProps.isOverlay === nextProps.isOverlay
  );
});
