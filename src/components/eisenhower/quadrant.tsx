"use client";

import { useState } from "react";
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

interface QuadrantProps {
  quadrant: QuadrantType;
  tasks: Task[];
}

export function Quadrant({ quadrant, tasks }: QuadrantProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { createTask } = useTaskMutations();
  const { setNodeRef } = useDroppable({
    id: `quadrant-${quadrant.type}`,
    data: { coords: quadrant.coords },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col p-4 rounded-lg border-2 transition-all min-h-[200px] group relative",
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
        <CreateTaskButton onClick={() => setIsCreateOpen(true)} className="relative opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto">
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <SortableTaskCard key={task.id} task={task} />
          ))}
        </SortableContext>
        {tasks.length === 0 && (
          <div className="flex items-center justify-center h-full min-h-[100px] text-xs text-muted-foreground border-2 border-dashed border-border/50 rounded-md">
            Drop tasks here
          </div>
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
