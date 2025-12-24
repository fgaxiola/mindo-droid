"use client";

import { useRef } from "react";
import { useDroppable } from "@dnd-kit/core";
import { PositionedTask } from "@/stores/interactive-matrix-store";
import { DraggableTask } from "./draggable-task";
import { cn } from "@/lib/utils";

interface MatrixCanvasProps {
  tasks: PositionedTask[];
}

export function MatrixCanvas({ tasks }: MatrixCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { setNodeRef, isOver } = useDroppable({
    id: "matrix-canvas",
  });

  const positionedTasks = tasks.filter((t) => t.matrixPosition !== null);

  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }}
      className={cn(
        "relative flex-1 bg-[#f5f5f0] rounded-lg overflow-hidden",
        isOver && "ring-2 ring-primary ring-inset"
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
          <span className="text-2xl font-bold text-[#2a6b5c]">1 HACER</span>
          <span className="text-sm text-[#2a6b5c]/70 text-center mt-1">
            Acciones inmediatas críticas
          </span>
        </div>
        <div className="flex flex-col items-center justify-center p-4">
          <span className="text-2xl font-bold text-[#c44f2e]">2 DECIDIR</span>
          <span className="text-sm text-[#c44f2e]/70 text-center mt-1">
            Mejoras que requieren planificación
          </span>
        </div>
        <div className="flex flex-col items-center justify-center p-4">
          <span className="text-2xl font-bold text-[#b8860b]">3 DELEGAR</span>
          <span className="text-sm text-[#b8860b]/70 text-center mt-1">
            Tareas que otros pueden hacer
          </span>
        </div>
        <div className="flex flex-col items-center justify-center p-4">
          <span className="text-2xl font-bold text-[#6b5b95]">4 ELIMINAR</span>
          <span className="text-sm text-[#6b5b95]/70 text-center mt-1">
            Actividades que no aportan valor
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
      <div className="absolute right-2 top-1/2 -translate-y-1/2 rotate-90 origin-center pointer-events-none">
        <span className="text-lg font-bold text-[#2a6b5c] tracking-widest">
          URGENTE
        </span>
      </div>
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 pointer-events-none">
        <span className="text-lg font-bold text-[#2a6b5c] tracking-widest">
          IMPORTANTE
        </span>
      </div>

      {/* Arrow indicators */}
      <div className="absolute right-1 top-4 pointer-events-none">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="#2a6b5c">
          <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" transform="rotate(-90 12 12)" />
        </svg>
      </div>
      <div className="absolute left-4 bottom-1 pointer-events-none">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="#2a6b5c" style={{ transform: "rotate(180deg)" }}>
          <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" />
        </svg>
      </div>

      {/* Positioned Tasks */}
      {positionedTasks.map((task) => (
        <DraggableTask
          key={task.id}
          task={task}
          isOnMatrix
          style={{
            left: `${task.matrixPosition!.x}%`,
            top: `${task.matrixPosition!.y}%`,
            transform: "translate(-50%, -50%)",
          }}
        />
      ))}
    </div>
  );
}
