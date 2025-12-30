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
import { CreateTaskButton } from "@/components/tasks/create-task-button";
import { useTaskMutations } from "@/hooks/use-tasks";
import { useDictionary } from "@/providers/dictionary-provider";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useRef } from "react";

interface QuadrantProps {
  quadrant: QuadrantType;
  tasks: Task[];
  isDragging?: boolean;
}

export function Quadrant({ quadrant, tasks, isDragging }: QuadrantProps) {
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const { createTask } = useTaskMutations();
  const dictionary = useDictionary();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleCreateClick = () => {
    setShowQuickCreate(true);
    // Scroll to bottom after a short delay to ensure QuickTaskCard is rendered
    setTimeout(() => {
      scrollContainerRef.current?.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }, 100);
  };

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
        <CreateTaskButton
          onClick={handleCreateClick}
          className={cn(
            "relative transition-opacity",
            isDragging
              ? "!opacity-0 pointer-events-none"
              : "opacity-0 group-hover:opacity-100"
          )}
        />
      </div>
      
      {/* Scrollable Tasks Area */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-2 min-h-0 scrollbar-transparent"
      >
        <SortableContext
          items={taskIds}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <SortableTaskCard key={task.id} task={task} />
          ))}
        </SortableContext>
        {tasks.length === 0 && (
          <div className="flex items-center justify-center min-h-[100px] text-xs text-muted-foreground border-2 border-dashed border-border/50 rounded-md">
            Drop tasks here
          </div>
        )}
        
        {/* Quick Create Card - at the end */}
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
            scrollContainerRef={scrollContainerRef}
            className={cn(
              isDragging && "opacity-50 pointer-events-none"
            )}
          />
        )}
      </div>

      {/* Fixed Create Button at Bottom */}
      <div className="shrink-0 px-4 pt-4 pb-4">
        <div
          className={cn(
            "transition-all duration-200",
            isDragging
              ? "opacity-0 pointer-events-none"
              : "opacity-0 group-hover:opacity-100"
          )}
        >
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleCreateClick}
            className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-transparent border border-dashed border-border/50 rounded-md"
          >
            <Plus className="h-4 w-4 mr-2" />
            <span className="text-sm">{dictionary.task_dialog?.create_new || "Create New"}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
