"use client";

import { useState, memo } from "react";
import { useDraggable, useDndContext } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { PositionedTask } from "@/types/task";
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
} from "@/hooks/use-tasks";
import { useQueryClient } from "@tanstack/react-query";
import { Task } from "@/types/task";

interface DraggableTaskProps {
  task: PositionedTask;
  isOnMatrix?: boolean;
  style?: React.CSSProperties;
}

function getTooltipDelay() {
  return parseInt(process.env.NEXT_PUBLIC_TOOLTIP_HOVER_DELAY_MS || "1000", 10);
}

export const DraggableTask = memo(
  function DraggableTask({ task, isOnMatrix, style }: DraggableTaskProps) {
    const [isEditOpen, setIsEditOpen] = useState(false);
    const tooltipDelay = getTooltipDelay();
    const { updateTask } = useTaskMutations();
    const { active } = useDndContext();
    const isAnyDragging = !!active;
    const shouldShowTooltip = !isAnyDragging;

    const { attributes, listeners, setNodeRef, transform, isDragging } =
      useDraggable({
        id: task.id,
        data: { task },
      });

    const dndTransform = transform ? CSS.Translate.toString(transform) : "";
    const styleTransform = style?.transform || "";

    const combinedTransform = dndTransform
      ? styleTransform
        ? `${dndTransform} ${styleTransform}`
        : dndTransform
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
            {shouldShowTooltip ? (
              <Tooltip delayDuration={tooltipDelay}>
                <TooltipTrigger asChild>
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
                </TooltipTrigger>
                <TooltipContent>
                  <p>{task.title}</p>
                </TooltipContent>
              </Tooltip>
            ) : (
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
            )}
          </div>
          {task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {task.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag.id}
                  className="px-1 py-0.5 text-[8px] font-medium rounded"
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

        {isEditOpen && (
          <DraggableTaskDialogWrapper
            task={task}
            open={isEditOpen}
            onOpenChange={setIsEditOpen}
          />
        )}
      </>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison function for memo
    // Return true if props are equal (skip re-render), false if different (re-render)
    // Only re-render if task data, style, or isOnMatrix changes
    if (prevProps.isOnMatrix !== nextProps.isOnMatrix) return false;

    // Compare style properties
    if (prevProps.style?.zIndex !== nextProps.style?.zIndex) return false;
    if (prevProps.style?.left !== nextProps.style?.left) return false;
    if (prevProps.style?.top !== nextProps.style?.top) return false;

    // Compare task properties that affect rendering
    if (prevProps.task.id !== nextProps.task.id) return false;
    if (prevProps.task.title !== nextProps.task.title) return false;
    if (prevProps.task.is_completed !== nextProps.task.is_completed)
      return false;
    if (prevProps.task.matrixPosition?.x !== nextProps.task.matrixPosition?.x)
      return false;
    if (prevProps.task.matrixPosition?.y !== nextProps.task.matrixPosition?.y)
      return false;

    // Compare tags array length (shallow comparison)
    if (prevProps.task.tags.length !== nextProps.task.tags.length) return false;

    // Props are equal, skip re-render
    return true;
  }
);

function DraggableTaskDialogWrapper({
  task,
  open,
  onOpenChange,
}: {
  task: PositionedTask;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { updateTask, deleteTask } = useTaskMutations();
  const { data: versions } = useTaskVersions(task.id);
  const restoreTask = useRestoreTaskVersion();
  const queryClient = useQueryClient();

  // Get the latest task from React Query cache when modal opens
  // This ensures we always show the most recent data
  const latestTask = open
    ? (() => {
        const tasks = queryClient.getQueryData<Task[]>(["tasks"]);
        return tasks?.find((t) => t.id === task.id) || task;
      })()
    : task;

  return (
    <TaskDialog
      open={open}
      onOpenChange={onOpenChange}
      task={latestTask}
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

export function DraggableTaskOverlay({
  task,
  isFromMatrix,
}: {
  task: PositionedTask;
  isFromMatrix?: boolean;
}) {
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
        <h4
          className={cn(
            "text-xs font-medium text-foreground line-clamp-2",
            task.is_completed && "line-through text-muted-foreground"
          )}
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
  );
}
