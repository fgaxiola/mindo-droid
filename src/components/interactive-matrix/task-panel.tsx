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

interface TaskPanelProps {
  tasks: PositionedTask[];
}

export function TaskPanel({ tasks }: TaskPanelProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { createTask } = useTaskMutations();
  const dictionary = useDictionary();
  const { setNodeRef } = useDroppable({
    id: "task-panel",
  });

  const unpositionedTasks = tasks.filter((t) => t.matrixPosition === null);

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
        <CreateTaskButton onClick={() => setIsCreateOpen(true)} className="relative opacity-0 group-hover:opacity-100 transition-opacity" />
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
