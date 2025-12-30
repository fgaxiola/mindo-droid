"use client";

import { useState, useMemo } from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { PositionedTask, Task } from "@/types/task";
import { SortableTaskCard } from "@/components/eisenhower/sortable-task-card";
import { cn } from "@/lib/utils";
import { useDictionary } from "@/providers/dictionary-provider";
import { QuickTaskCard } from "@/components/tasks/quick-task-card";
import { CreateTaskButton } from "@/components/tasks/create-task-button";
import { useTaskMutations } from "@/hooks/use-tasks";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useRef } from "react";

interface TaskPanelProps {
  tasks: PositionedTask[];
  isDragging?: boolean;
}

export function TaskPanel({ tasks, isDragging }: TaskPanelProps) {
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
  const droppableData = useMemo(() => ({ coords: { x: -1, y: -1 } }), []);

  const { setNodeRef } = useDroppable({
    id: "task-panel",
    data: droppableData,
  });

  const unpositionedTasks = useMemo(
    () => tasks.filter((t) => t.matrixPosition === null && !t.is_completed),
    [tasks]
  );

  // Convert PositionedTask to Task format for SortableTaskCard
  // Use coords: { x: -1, y: -1 } to match TaskSidebar behavior
  const tasksAsTaskType = useMemo(
    () =>
      unpositionedTasks.map(
        (t): Task => ({
          ...t,
          coords: { x: -1, y: -1 }, // SortableTaskCard expects coords
        })
      ),
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
        <div
          className={cn(
            "flex gap-1 relative transition-opacity",
            isDragging
              ? "opacity-0 pointer-events-none"
              : "opacity-0 group-hover:opacity-100"
          )}
        >
          <CreateTaskButton
            onClick={handleCreateClick}
            className="static opacity-100"
          />
        </div>
      </div>
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-2 relative"
      >
        <SortableContext
          items={tasksAsTaskType.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasksAsTaskType.map((task) => (
            <SortableTaskCard key={task.id} task={task} />
          ))}
        </SortableContext>
        
        {/* Quick Create Card - at the end */}
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
            scrollContainerRef={scrollContainerRef}
            className={cn(
              isDragging && "opacity-50 pointer-events-none"
            )}
          />
        )}
        
        {/* Show create button when not showing quick create */}
        {!showQuickCreate && (
          <>
            {unpositionedTasks.length > 0 && (
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
                  onClick={handleCreateClick}
                  className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-transparent border border-dashed border-border/50 rounded-md"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="text-sm">
                    {dictionary.task_dialog?.create_new || "Create New"}
                  </span>
                </Button>
              </div>
            )}
            {unpositionedTasks.length === 0 && (
              <>
                <div className="text-center py-8 text-xs text-muted-foreground">
                  {dictionary.interactive_matrix.all_tasks_in_matrix}
                </div>
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
                    onClick={handleCreateClick}
                    className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-accent/50 border border-dashed border-border/50 rounded-md"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    <span className="text-sm">
                      {dictionary.task_dialog?.create_new || "Create New"}
                    </span>
                  </Button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
