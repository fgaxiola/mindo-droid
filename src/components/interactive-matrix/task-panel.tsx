"use client";

import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { PositionedTask } from "@/stores/interactive-matrix-store";
import { SortableTask } from "./sortable-task";
import { cn } from "@/lib/utils";
import { useDictionary } from "@/providers/dictionary-provider";
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

interface TaskPanelProps {
  tasks: PositionedTask[];
}

export function TaskPanel({ tasks }: TaskPanelProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const { createTask } = useTaskMutations();
  const dictionary = useDictionary();
  const { setNodeRef } = useDroppable({
    id: "task-panel",
  });

  const unpositionedTasks = tasks.filter(
    (t) => 
      t.matrixPosition === null && 
      (showArchived ? true : !t.is_completed)
  );

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "w-64 border-l border-border bg-muted/30 flex flex-col group relative"
      )}
    >
      <div className="p-4 border-b border-border flex justify-between items-start">
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            {dictionary.interactive_matrix.tasks}
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            {dictionary.interactive_matrix.drag_to_matrix}
          </p>
        </div>
        <div className="flex gap-1 relative opacity-0 group-hover:opacity-100 transition-opacity">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  onClick={() => setShowArchived(!showArchived)}
                >
                  {showArchived ? (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {showArchived ? "Hide Completed" : "View Completed"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <CreateTaskButton onClick={() => setIsCreateOpen(true)} className="static opacity-100" />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        <SortableContext
          items={unpositionedTasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {unpositionedTasks.map((task) => (
            <SortableTask key={task.id} task={task} />
          ))}
        </SortableContext>
        {unpositionedTasks.length === 0 && (
          <div className="text-center py-8 text-xs text-muted-foreground">
            {dictionary.interactive_matrix.all_tasks_in_matrix}
          </div>
        )}
      </div>
      <div className="p-3 border-t border-border">
        <p className="text-[10px] text-muted-foreground text-center">
          {dictionary.interactive_matrix.remove_instructions}
        </p>
      </div>

      <TaskDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSave={async (data) => {
          await createTask.mutateAsync({
            ...data,
            matrixPosition: null, // Explicitly for list
          });
        }}
      />
    </div>
  );
}
