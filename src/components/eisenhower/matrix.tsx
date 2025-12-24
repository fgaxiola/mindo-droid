"use client";

import { Task, QUADRANTS } from "@/types/task";
import { Quadrant } from "./quadrant";

interface MatrixProps {
  tasks: Task[];
}

export function Matrix({ tasks }: MatrixProps) {
  const getTasksForQuadrant = (x: number, y: number) => {
    return tasks.filter(
      (task) => task.coords.x === x && task.coords.y === y
    );
  };

  return (
    <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-4 p-4">
      {/* Row 1: Important (y=1) */}
      {/* Schedule: Not Urgent & Important (x=0, y=1) */}
      <Quadrant
        quadrant={QUADRANTS.find((q) => q.type === "schedule")!}
        tasks={getTasksForQuadrant(0, 1)}
      />
      {/* Do: Urgent & Important (x=1, y=1) */}
      <Quadrant
        quadrant={QUADRANTS.find((q) => q.type === "do")!}
        tasks={getTasksForQuadrant(1, 1)}
      />
      {/* Row 2: Not Important (y=0) */}
      {/* Eliminate: Not Urgent & Not Important (x=0, y=0) */}
      <Quadrant
        quadrant={QUADRANTS.find((q) => q.type === "eliminate")!}
        tasks={getTasksForQuadrant(0, 0)}
      />
      {/* Delegate: Urgent & Not Important (x=1, y=0) */}
      <Quadrant
        quadrant={QUADRANTS.find((q) => q.type === "delegate")!}
        tasks={getTasksForQuadrant(1, 0)}
      />
    </div>
  );
}
