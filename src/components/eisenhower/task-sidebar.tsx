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
import { QuickTaskCard } from "@/components/tasks/quick-task-card";
import { useTaskMutations } from "@/hooks/use-tasks";
import { useDictionary } from "@/providers/dictionary-provider";

interface TaskSidebarProps {
  tasks: Task[];
  isDragging?: boolean;
}

export function TaskSidebar({ tasks, isDragging }: TaskSidebarProps) {
  const [showQuickCreate, setShowQuickCreate] = useState(false);
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
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2 relative">
        {/* Quick Create Card */}
        {showQuickCreate && (
          <QuickTaskCard
            onSave={async (data) => {
              await createTask.mutateAsync({
                ...data,
                coords: { x: -1, y: -1 },
              });
              setShowQuickCreate(false);
            }}
            onCancel={() => setShowQuickCreate(false)}
            className={cn(
              isDragging && "opacity-50 pointer-events-none"
            )}
          />
        )}
        
        <SortableContext
          items={unassignedTasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {unassignedTasks.map((task) => (
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
              unassignedTasks.length > 0 && "opacity-0 group-hover:opacity-100"
            )}
          >
            {unassignedTasks.length === 0 ? (
              <span>All tasks are assigned</span>
            ) : (
              <span>{dictionary.task_dialog?.create_new || "Create New"}</span>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
