"use client";

import { EisenhowerBoard } from "@/components/eisenhower";
import { Task } from "@/types/task";

export default function MatrixPage() {
  const handleCoordsChange = (taskId: string, coords: { x: number; y: number }) => {
    console.log(`Task ${taskId} moved to coords:`, coords);
  };

  return (
    <div className="h-full w-full">
      <EisenhowerBoard
        initialTasks={[]}
        onTaskCoordsChange={handleCoordsChange}
      />
    </div>
  );
}
