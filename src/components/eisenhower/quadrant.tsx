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
import { QuickTaskCard } from "@/components/tasks/quick-task-card";
import { useTaskMutations } from "@/hooks/use-tasks";
import { useDictionary } from "@/providers/dictionary-provider";

interface QuadrantProps {
  quadrant: QuadrantType;
  tasks: Task[];
  isDragging?: boolean;
}

export function Quadrant({ quadrant, tasks, isDragging }: QuadrantProps) {
  const [showQuickCreate, setShowQuickCreate] = useState(false);
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
        "flex flex-col rounded-lg border-2 transition-all h-full group relative overflow-hidden",
        quadrant.color
      )}
    >
      {/* Fixed Header */}
      <div className="shrink-0 p-4 pb-3 flex justify-between items-start border-b border-border/50">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            {quadrant.label}
          </h3>
          <p className="text-xs text-muted-foreground">{quadrant.description}</p>
        </div>
      </div>
      
      {/* Scrollable Tasks Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-0 scrollbar-transparent">
        {/* Quick Create Card */}
        {showQuickCreate && (
          <QuickTaskCard
            onSave={async (data) => {
              await createTask.mutateAsync({
                ...data,
                coords: quadrant.coords,
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
          items={taskIds}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
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
              isDragging && "opacity-0 pointer-events-none"
            )}
          >
            {tasks.length === 0 ? (
              <span>Drop tasks here or click to create</span>
            ) : (
              <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                {dictionary.task_dialog?.create_new || "Create New"}
              </span>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
