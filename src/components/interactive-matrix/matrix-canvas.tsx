"use client";

import { useRef, useState, useMemo } from "react";
import { useDroppable } from "@dnd-kit/core";
import { PositionedTask } from "@/types/task";
import { DraggableTask } from "./draggable-task";
import { cn } from "@/lib/utils";
import { useDictionary } from "@/providers/dictionary-provider";
import { QuickTaskCard } from "@/components/tasks/quick-task-card";
import { useTaskMutations } from "@/hooks/use-tasks";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface MatrixCanvasProps {
  tasks: PositionedTask[];
  lastMovedTaskId?: string | null;
}

export function MatrixCanvas({ tasks, lastMovedTaskId }: MatrixCanvasProps) {
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [createPosition, setCreatePosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const { createTask } = useTaskMutations();
  const containerRef = useRef<HTMLDivElement>(null);
  const dictionary = useDictionary();
  const { setNodeRef } = useDroppable({
    id: "matrix-canvas",
  });

  const positionedTasks = useMemo(
    () => tasks.filter((t) => t.matrixPosition != null),
    [tasks]
  );

  // Memoize task styles to prevent unnecessary re-renders
  // Only recalculate when tasks or lastMovedTaskId changes
  const taskStylesMap = useMemo(() => {
    const stylesMap = new Map<string, React.CSSProperties>();
    positionedTasks.forEach((task) => {
      stylesMap.set(task.id, {
        left: `${task.matrixPosition!.x}%`,
        top: `${task.matrixPosition!.y}%`,
        transform: "translate(-50%, -50%)",
        zIndex: lastMovedTaskId === task.id ? 10 : 1,
      });
    });
    return stylesMap;
  }, [positionedTasks, lastMovedTaskId]);

  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        (
          containerRef as React.MutableRefObject<HTMLDivElement | null>
        ).current = node;
      }}
      className={cn(
        "relative flex-1 bg-[#f5f5f0] rounded-lg overflow-hidden group"
      )}
    >
      {/* Grid Background */}
      <div className="absolute inset-0 opacity-20">
        <svg width="100%" height="100%">
          <defs>
            <pattern
              id="grid"
              width="40"
              height="40"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="#94a3b8"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Quadrant Colors */}
      <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
        {/* Top Left - HACER (Urgente + Importante) */}
        <div className="bg-[#f8e9a1]/40" />
        {/* Top Right - DECIDIR (No Urgente + Importante) */}
        <div className="bg-[#f4a261]/40" />
        {/* Bottom Left - DELEGAR (Urgente + No Importante) */}
        <div className="bg-[#e9c46a]/40" />
        {/* Bottom Right - ELIMINAR (No Urgente + No Importante) */}
        <div className="bg-[#a8a4ce]/40" />
      </div>

      {/* Quadrant Labels */}
      <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 pointer-events-none">
        <div className="flex flex-col items-center justify-center p-4">
          <span className="text-2xl font-bold text-[#2a6b5c]">
            {dictionary.interactive_matrix.hacer}
          </span>
          <span className="text-sm text-[#2a6b5c]/70 text-center mt-1">
            {dictionary.interactive_matrix.hacer_desc}
          </span>
        </div>
        <div className="flex flex-col items-center justify-center p-4">
          <span className="text-2xl font-bold text-[#c44f2e]">
            {dictionary.interactive_matrix.decidir}
          </span>
          <span className="text-sm text-[#c44f2e]/70 text-center mt-1">
            {dictionary.interactive_matrix.decidir_desc}
          </span>
        </div>
        <div className="flex flex-col items-center justify-center p-4">
          <span className="text-2xl font-bold text-[#b8860b]">
            {dictionary.interactive_matrix.delegar}
          </span>
          <span className="text-sm text-[#b8860b]/70 text-center mt-1">
            {dictionary.interactive_matrix.delegar_desc}
          </span>
        </div>
        <div className="flex flex-col items-center justify-center p-4">
          <span className="text-2xl font-bold text-[#6b5b95]">
            {dictionary.interactive_matrix.eliminar}
          </span>
          <span className="text-sm text-[#6b5b95]/70 text-center mt-1">
            {dictionary.interactive_matrix.eliminar_desc}
          </span>
        </div>
      </div>

      {/* Axis Lines */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Vertical Line (Urgente) */}
        <div className="absolute right-0 top-0 bottom-0 w-0.5 bg-[#2a6b5c]" />
        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gray-400/50" />

        {/* Horizontal Line (Importante) */}
        <div className="absolute left-0 right-0 bottom-0 h-0.5 bg-[#2a6b5c]" />
        <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-gray-400/50" />
      </div>

      {/* Axis Labels */}
      <div className="absolute right-1 top-[-15px] origin-bottom-right -rotate-90 pointer-events-none flex items-center gap-2">
        <span className="text-lg font-bold text-[#2a6b5c] tracking-widest whitespace-nowrap">
          {dictionary.interactive_matrix.more_urgent}
        </span>
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#2a6b5c"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="rotate-90"
        >
          <path d="M12 19V5" />
          <path d="M5 12l7-7 7 7" />
        </svg>
      </div>

      <div className="absolute bottom-1 left-2 pointer-events-none flex items-center gap-2">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#2a6b5c"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M19 12H5" />
          <path d="M12 19l-7-7 7-7" />
        </svg>
        <span className="text-lg font-bold text-[#2a6b5c] tracking-widest whitespace-nowrap">
          {dictionary.interactive_matrix.more_important}
        </span>
      </div>

      {/* Positioned Tasks */}
      {positionedTasks.map((task) => (
        <DraggableTask
          key={task.id}
          task={task}
          isOnMatrix
          style={taskStylesMap.get(task.id)}
        />
      ))}

      {/* Create button - appears on hover over canvas */}
      {!showQuickCreate && (
        <div
          className={cn(
            "absolute bottom-4 right-4 transition-all duration-200 z-10",
            "opacity-0 group-hover:opacity-100"
          )}
        >
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={() => setShowQuickCreate(true)}
            className="shadow-lg hover:shadow-xl transition-shadow"
          >
            <Plus className="h-4 w-4 mr-2" />
            <span>{dictionary.task_dialog?.create_new || "Create New"}</span>
          </Button>
        </div>
      )}

      {/* Quick Create Card - appears on hover over canvas */}
      {showQuickCreate && (
        <div
          className={cn(
            "absolute bottom-4 right-4 z-10 w-80"
          )}
        >
          <QuickTaskCard
            onSave={async (data) => {
              await createTask.mutateAsync({
                ...data,
                matrixPosition: createPosition,
              });
              setShowQuickCreate(false);
            }}
            onCancel={() => setShowQuickCreate(false)}
          />
        </div>
      )}
    </div>
  );
}
