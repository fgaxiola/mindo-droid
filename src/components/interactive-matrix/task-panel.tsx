"use client";

import { useDroppable } from "@dnd-kit/core";
import { PositionedTask } from "@/stores/interactive-matrix-store";
import { DraggableTask } from "./draggable-task";
import { cn } from "@/lib/utils";

interface TaskPanelProps {
  tasks: PositionedTask[];
}

export function TaskPanel({ tasks }: TaskPanelProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: "task-panel",
  });

  const unpositionedTasks = tasks.filter((t) => t.matrixPosition === null);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "w-64 border-l border-border bg-muted/30 flex flex-col",
        isOver && "bg-muted/50"
      )}
    >
      <div className="p-4 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground">Tareas</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Arrastra las tareas a la matriz
        </p>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {unpositionedTasks.map((task) => (
          <DraggableTask key={task.id} task={task} />
        ))}
        {unpositionedTasks.length === 0 && (
          <div className="text-center py-8 text-xs text-muted-foreground">
            Todas las tareas están en la matriz
          </div>
        )}
      </div>
      <div className="p-3 border-t border-border">
        <p className="text-[10px] text-muted-foreground text-center">
          Arrastra tareas de vuelta aquí para removerlas de la matriz
        </p>
      </div>
    </div>
  );
}
