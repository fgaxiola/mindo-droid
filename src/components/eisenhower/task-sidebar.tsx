"use client";

import { useState, useMemo } from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Task } from "@/types/task";
import { SortableTaskCard } from "./sortable-task-card";
import { cn } from "@/lib/utils";
import { CreateTaskButton } from "@/components/tasks/create-task-button";
import { TaskDialog } from "@/components/tasks/task-dialog";
import { useTaskMutations } from "@/hooks/use-tasks";
import { useDictionary } from "@/providers/dictionary-provider";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface TaskSidebarProps {
  tasks: Task[];
  isDragging?: boolean;
}

export function TaskSidebar({ tasks, isDragging }: TaskSidebarProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { createTask } = useTaskMutations();
  const dictionary = useDictionary();

  // Memoize droppable data to prevent infinite re-renders
  const droppableData = useMemo(() => ({ coords: { x: -1, y: -1 } }), []);

  const { setNodeRef } = useDroppable({
    id: "sidebar",
    data: droppableData,
  });

  const unassignedTasks = tasks.filter(
    (task) => task.coords.x === -1 && task.coords.y === -1 && !task.is_completed
  );

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "w-72 border-l border-border bg-muted/30 flex flex-col group relative"
      )}
    >
      <div className="p-4 border-b border-border flex justify-between items-start">
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            {dictionary.matrix.unassigned_tasks}
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            {dictionary.matrix.drag_instructions}
          </p>
        </div>
        <div
          className={cn(
            "flex gap-1 relative transition-opacity",
            isDragging
              ? "opacity-0 pointer-events-none"
              : "opacity-0 group-hover:opacity-100"
          )}
        >
          <CreateTaskButton
            onClick={() => setIsCreateOpen(true)}
            className="static opacity-100"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2 relative">
        <SortableContext
          items={unassignedTasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {unassignedTasks.map((task) => (
            <SortableTaskCard key={task.id} task={task} />
          ))}
        </SortableContext>
        {/* Create button - appears on hover, right after tasks (only when there are tasks) */}
        {unassignedTasks.length > 0 && (
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
              className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-transparent border border-dashed border-border/50 rounded-md"
            >
              <Plus className="h-4 w-4 mr-2" />
              <span className="text-sm">{dictionary.task_dialog?.create_new || "Create New"}</span>
            </Button>
          </div>
        )}
        {unassignedTasks.length === 0 && (
          <>
            <div className="text-center py-8 text-xs text-muted-foreground">
              All tasks are assigned
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
            coords: { x: -1, y: -1 },
          });
        }}
      />
    </div>
  );
}
