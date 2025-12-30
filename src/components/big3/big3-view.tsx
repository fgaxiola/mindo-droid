"use client";

import { useState, useMemo, useRef, useEffect, lazy, Suspense } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  useDroppable,
  PointerSensor,
  useSensor,
  useSensors,
  pointerWithin,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Task } from "@/types/task";
import { SortableTaskCard } from "@/components/eisenhower/sortable-task-card";
import { TaskCard } from "@/components/eisenhower/task-card";
import { cn } from "@/lib/utils";
import { QuickTaskCard } from "@/components/tasks/quick-task-card";
import { CreateTaskButton } from "@/components/tasks/create-task-button";
import { useTaskMutations } from "@/hooks/use-tasks";
import { useDictionary } from "@/providers/dictionary-provider";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const RichTextEditor = lazy(() =>
  import("@/components/ui/rich-text-editor").then((module) => ({
    default: module.RichTextEditor,
  }))
);

interface Big3ViewProps {
  tasks: Task[];
  focusMode?: boolean;
}

export function Big3View({ tasks, focusMode = false }: Big3ViewProps) {
  const dictionary = useDictionary();
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const { createTask, updateTasks } = useTaskMutations();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [localTasks, setLocalTasks] = useState<Task[]>(tasks);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const lastSyncedTasksRef = useRef<Task[]>(tasks);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 20,
      },
    })
  );

  // Sync localTasks with props when they change (but not during drag)
  useEffect(() => {
    if (activeTask) return;

    if (tasks && tasks !== lastSyncedTasksRef.current) {
      lastSyncedTasksRef.current = tasks;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocalTasks((prev) => {
        // Create a map of updated tasks for O(1) lookup
        const tasksMap = new Map(tasks.map((t) => [t.id, t]));

        // Keep existing order for tasks that are still in the list
        const mergedTasks = prev
          .map((t) => tasksMap.get(t.id) || t)
          .filter((t) => tasksMap.has(t.id));

        // Add any new tasks that weren't in the previous state
        const prevIds = new Set(prev.map((t) => t.id));
        const newTasks = tasks.filter((t) => !prevIds.has(t.id));

        return [...mergedTasks, ...newTasks];
      });
    }
  }, [tasks, activeTask]);

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
    id: "big3-quadrant",
    data: droppableData,
  });

  // Memoize task IDs to prevent SortableContext from triggering unnecessary updates
  const taskIds = useMemo(() => localTasks.map((t) => t.id), [localTasks]);

  const updatePositions = (tasksList: Task[]) => {
    // Calculate new positions for all tasks based on their current order
    // Use index * 100 to allow inserting between tasks later
    return tasksList.map((task, index) => ({
      ...task,
      position: index * 100,
    }));
  };

  const moveTaskLocally = (activeId: string, overId: string) => {
    setLocalTasks((prev) => {
      const oldIndex = prev.findIndex((t) => t.id === activeId);
      const newIndex = prev.findIndex((t) => t.id === overId);
      if (oldIndex === -1 || newIndex === -1) return prev;
      // Prevent redundant updates if indices are the same
      if (oldIndex === newIndex) return prev;

      const newTasks = [...prev];
      const [removed] = newTasks.splice(oldIndex, 1);
      newTasks.splice(newIndex, 0, removed);
      return newTasks;
    });
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = localTasks.find((t) => t.id === active.id);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    const overTask = localTasks.find((t) => t.id === overId);
    const isOverContainer = overId === "big3-quadrant";

    if (overTask || isOverContainer) {
      // Same list sorting - update localTasks directly
      moveTaskLocally(activeId, overId);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { over } = event;

    if (!over) {
      setActiveTask(null);
      return;
    }

    const overTask = localTasks.find((t) => t.id === over.id);
    const isOverContainer = over.id === "big3-quadrant";

    if (overTask || isOverContainer) {
      // Update positions based on current order in localTasks
      const updatedTasks = updatePositions(localTasks);

      const tasksToUpdate: Partial<Task>[] = [];
      const tasksMap = new Map(tasks.map((t) => [t.id, t]));

      // Only update the_one tasks that are in this quadrant
      const theOneTasks = updatedTasks.filter((t) => t.the_one);

      for (const task of theOneTasks) {
        if (task.position !== undefined) {
          const originalTask = tasksMap.get(task.id);
          // Only update if position changed
          if (!originalTask || originalTask.position !== task.position) {
            tasksToUpdate.push({
              id: task.id,
              position: task.position,
            });
          }
        }
      }

      if (tasksToUpdate.length > 0) {
        try {
          await updateTasks.mutateAsync(tasksToUpdate);
        } catch (error) {
          // Revert local state on error
          setLocalTasks(lastSyncedTasksRef.current);
          throw error;
        }
      }
    }

    setActiveTask(null);
  };

  // Focus mode: show only the first task centered
  if (focusMode) {
    if (localTasks.length === 0) {
      return (
        <div className="flex flex-col min-h-[600px]">
          <div className="flex-1 flex items-center justify-center py-8">
            <p className="text-muted-foreground text-center">
              {dictionary.big3.no_tasks}
            </p>
          </div>
        </div>
      );
    }

    const firstTask = localTasks[0];
    return (
      <div className="flex flex-col min-h-[600px] w-full">
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-6 max-w-3xl">
            {firstTask.title}
          </h2>
          {firstTask.description && (
            <div className="max-w-3xl w-full">
              <Suspense
                fallback={
                  <div className="h-[200px] border border-input rounded-md p-3 animate-pulse bg-muted" />
                }
              >
                <RichTextEditor
                  content={firstTask.description}
                  onChange={() => {}}
                  readOnly={true}
                  className="text-lg"
                />
              </Suspense>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (localTasks.length === 0) {
    return (
      <div className="flex flex-col rounded-lg border-2 h-[600px] bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900/50">
        <div className="shrink-0 p-4 pb-3 flex justify-between items-start border-b border-border/50">
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              {dictionary.big3.quadrant_title}
            </h3>
            <p className="text-xs text-muted-foreground">
              {dictionary.big3.quadrant_subtitle}
            </p>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground text-center">
            {dictionary.big3.no_tasks}
          </p>
        </div>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div
        ref={setNodeRef}
        className={cn(
          "flex flex-col rounded-lg border-2 transition-all h-[600px] group relative overflow-hidden",
          "bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900/50"
        )}
      >
        {/* Fixed Header */}
        <div className="shrink-0 p-4 pb-3 flex justify-between items-start border-b border-border/50">
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              {dictionary.big3.quadrant_title}
            </h3>
            <p className="text-xs text-muted-foreground">
              {dictionary.big3.quadrant_subtitle}
            </p>
          </div>
          <CreateTaskButton
            onClick={handleCreateClick}
            className={cn(
              "relative transition-opacity opacity-0 group-hover:opacity-100"
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
            {localTasks.map((task) => (
              <SortableTaskCard key={task.id} task={task} />
            ))}
          </SortableContext>

          {/* Quick Create Card - at the end */}
          {showQuickCreate && (
            <QuickTaskCard
              onSave={async (data) => {
                // Calculate position to put new task at the end
                // Find the maximum position among the_one tasks, or use current timestamp
                const maxPosition =
                  localTasks.length > 0
                    ? Math.max(...localTasks.map((t) => t.position || 0))
                    : Date.now();
                const newPosition = maxPosition + 100;

                await createTask.mutateAsync({
                  ...data,
                  the_one: true,
                  coords: { x: -1, y: -1 },
                  position: newPosition,
                });
                setShowQuickCreate(false);
              }}
              onCancel={() => setShowQuickCreate(false)}
              scrollContainerRef={scrollContainerRef}
            />
          )}
        </div>

        {/* Fixed Create Button at Bottom */}
        <div className="shrink-0 px-4 pt-4 pb-4">
          <div className="transition-all duration-200 opacity-0 group-hover:opacity-100">
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
        </div>
      </div>
      <DragOverlay>
        {activeTask ? <TaskCard task={activeTask} isOverlay /> : null}
      </DragOverlay>
    </DndContext>
  );
}
