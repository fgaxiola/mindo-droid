"use client";

import { useState, useMemo } from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Task, Quadrant as QuadrantType } from "@/types/task";
import { SortableTaskCard } from "./sortable-task-card";
import { cn } from "@/lib/utils";
import { CreateTaskButton } from "@/components/tasks/create-task-button";
import { TaskDialog } from "@/components/tasks/task-dialog";
import { useTaskMutations } from "@/hooks/use-tasks";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useDictionary } from "@/providers/dictionary-provider";

interface QuadrantProps {
  quadrant: QuadrantType;
  tasks: Task[];
  isDragging?: boolean;
}

export function Quadrant({ quadrant, tasks, isDragging }: QuadrantProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { createTask } = useTaskMutations();
  const dictionary = useDictionary();

  // Memoize droppable data to prevent infinite re-renders
  const droppableData = useMemo(() => ({ coords: quadrant.coords }), [quadrant.coords]);

  const { setNodeRef } = useDroppable({
    id: `quadrant-${quadrant.type}`,
    data: droppableData,
  });

  // Memoize task IDs to prevent SortableContext from triggering unnecessary updates
  const taskIds = useMemo(() => tasks.map((t) => t.id), [tasks]);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col p-4 rounded-lg border-2 transition-all h-full group relative overflow-hidden",
        quadrant.color
      )}
    >
      <div className="mb-3 flex justify-between items-start">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            {quadrant.label}
          </h3>
          <p className="text-xs text-muted-foreground">{quadrant.description}</p>
        </div>
        <CreateTaskButton
          onClick={() => setIsCreateOpen(true)}
          className={cn(
            "relative transition-opacity",
            isDragging
              ? "!opacity-0 pointer-events-none"
              : "opacity-0 group-hover:opacity-100"
          )}
        />
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto relative">
        <SortableContext
          items={taskIds}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <SortableTaskCard key={task.id} task={task} />
          ))}
        </SortableContext>
        {/* Create button - appears on hover, right after tasks (only when there are tasks) */}
        {tasks.length > 0 && (
          <div
            className={cn(
              "pt-2 transition-all duration-200",
              isDragging
                ? "opacity-0 pointer-events-none"
                : "opacity-0 group-hover:opacity-100"
            )}
          >
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsCreateOpen(true)}
              className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-accent/50 border border-dashed border-border/50 rounded-md"
            >
              <Plus className="h-4 w-4 mr-2" />
              <span className="text-sm">{dictionary.task_dialog?.create_new || "Create New"}</span>
            </Button>
          </div>
        )}
        {tasks.length === 0 && (
          <>
            <div className="flex items-center justify-center min-h-[100px] text-xs text-muted-foreground border-2 border-dashed border-border/50 rounded-md">
              Drop tasks here
            </div>
            {/* Create button - appears on hover, below empty message */}
            <div
              className={cn(
                "pt-2 transition-all duration-200",
                isDragging
                  ? "opacity-0 pointer-events-none"
                  : "opacity-0 group-hover:opacity-100"
              )}
            >
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsCreateOpen(true)}
                className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-accent/50 border border-dashed border-border/50 rounded-md"
              >
                <Plus className="h-4 w-4 mr-2" />
                <span className="text-sm">{dictionary.task_dialog?.create_new || "Create New"}</span>
              </Button>
            </div>
          </>
        )}
      </div>

      <TaskDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSave={async (data) => {
          await createTask.mutateAsync({
            ...data,
            coords: quadrant.coords,
          });
        }}
      />
    </div>
  );
}
