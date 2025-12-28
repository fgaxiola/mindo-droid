"use client";

import { useState } from "react";
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
import { ArchiveRestore, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useDictionary } from "@/providers/dictionary-provider";

interface TaskSidebarProps {
  tasks: Task[];
  isDragging?: boolean;
}

export function TaskSidebar({ tasks, isDragging }: TaskSidebarProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const { createTask } = useTaskMutations();
  const dictionary = useDictionary();
  const { setNodeRef } = useDroppable({
    id: "sidebar",
    data: { coords: { x: -1, y: -1 } },
  });

  const unassignedTasks = tasks.filter(
    (task) =>
      task.coords.x === -1 &&
      task.coords.y === -1 &&
      (showArchived ? true : !task.is_completed)
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
        {!isDragging && (
          <div className="flex gap-1 relative opacity-0 group-hover:opacity-100 transition-opacity">
            <CreateTaskButton
              onClick={() => setIsCreateOpen(true)}
              className="static opacity-100"
            />
          </div>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        <SortableContext
          items={unassignedTasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {unassignedTasks.map((task) => (
            <SortableTaskCard key={task.id} task={task} />
          ))}
        </SortableContext>
        {unassignedTasks.length === 0 && (
          <div className="text-center py-8 text-xs text-muted-foreground">
            All tasks are assigned
          </div>
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
