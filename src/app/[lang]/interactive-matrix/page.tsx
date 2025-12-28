"use client";

import { InteractiveMatrixBoard } from "@/components/interactive-matrix";
import { MatrixPosition } from "@/stores/interactive-matrix-store";

export default function InteractiveMatrixPage() {
  const handlePositionChange = (taskId: string, position: MatrixPosition | null) => {
    console.log(`Task ${taskId} position changed:`, position);
  };

  return (
    <div className="h-full w-full">
      <InteractiveMatrixBoard
        initialTasks={[]}
        onTaskPositionChange={handlePositionChange}
      />
    </div>
  );
}
