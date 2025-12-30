"use client";

import { useState, useMemo } from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { PositionedTask } from "@/types/task";
import { SortableTaskCard } from "@/components/eisenhower/sortable-task-card";
import { cn } from "@/lib/utils";
import { useDictionary } from "@/providers/dictionary-provider";
import { QuickTaskCard } from "@/components/tasks/quick-task-card";
import { useTaskMutations } from "@/hooks/use-tasks";
import { Task } from "@/types/task";

interface TaskPanelProps {
  tasks: PositionedTask[];
  isDragging?: boolean;
}

export function TaskPanel({ tasks, isDragging }: TaskPanelProps) {
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const { createTask } = useTaskMutations();
  const dictionary = useDictionary();
  const { setNodeRef } = useDroppable({
    id: "task-panel",
  });

  const unpositionedTasks = useMemo(
    () => tasks.filter((t) => t.matrixPosition === null && !t.is_completed),
    [tasks]
  );

  // Convert PositionedTask to Task format for SortableTaskCard
  const tasksAsTaskType = useMemo(
    () =>
      unpositionedTasks.map(
        (t): Task => ({
          ...t,
          coords: { x: -1, y: -1 }, // SortableTaskCard expects coords, not matrixPosition
        })
      ),
    [unpositionedTasks]
  );

  const taskIds = useMemo(
    () => unpositionedTasks.map((t) => t.id),
    [unpositionedTasks]
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
            {dictionary.interactive_matrix.tasks}
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            {dictionary.interactive_matrix.drag_to_matrix}
          </p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2 relative">
        {/* Quick Create Card */}
        {showQuickCreate && (
          <QuickTaskCard
            onSave={async (data) => {
              await createTask.mutateAsync({
                ...data,
                matrixPosition: null, // Explicitly for list
              });
              setShowQuickCreate(false);
            }}
            onCancel={() => setShowQuickCreate(false)}
            className={cn(
              isDragging && "opacity-50 pointer-events-none"
            )}
          />
        )}
        
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasksAsTaskType.map((task) => (
            <SortableTaskCard key={task.id} task={task} />
          ))}
        </SortableContext>
        
        {/* Show create button when not showing quick create */}
        {!showQuickCreate && (
          <button
            type="button"
            onClick={() => setShowQuickCreate(true)}
            className={cn(
              "w-full text-left text-xs text-muted-foreground border-2 border-dashed border-border/50 rounded-md p-3 hover:bg-accent/50 hover:border-border transition-colors",
              isDragging && "opacity-0 pointer-events-none",
              unpositionedTasks.length > 0 && "opacity-0 group-hover:opacity-100"
            )}
          >
            {unpositionedTasks.length === 0 ? (
              <span>{dictionary.interactive_matrix.all_tasks_in_matrix}</span>
            ) : (
              <span>{dictionary.task_dialog?.create_new || "Create New"}</span>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
