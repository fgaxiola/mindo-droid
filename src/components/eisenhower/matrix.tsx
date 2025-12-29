"use client";

import { useMemo } from "react";
import { Task, QUADRANTS, Quadrant as QuadrantType } from "@/types/task";
import { Quadrant } from "./quadrant";
import { useDictionary } from "@/providers/dictionary-provider";

interface MatrixProps {
  tasks: Task[];
  isDragging?: boolean;
}

export function Matrix({ tasks, isDragging }: MatrixProps) {
  const dictionary = useDictionary();

  // Memoize task filtering to prevent creating new arrays on every render
  const tasksByQuadrant = useMemo(() => {
    const quadrants = {
      do: [] as Task[], // (1, 1)
      schedule: [] as Task[], // (0, 1)
      delegate: [] as Task[], // (1, 0)
      eliminate: [] as Task[], // (0, 0)
    };

    tasks.forEach((task) => {
      if (task.is_completed) return;
      if (task.coords.x === 1 && task.coords.y === 1) quadrants.do.push(task);
      else if (task.coords.x === 0 && task.coords.y === 1) quadrants.schedule.push(task);
      else if (task.coords.x === 1 && task.coords.y === 0) quadrants.delegate.push(task);
      else if (task.coords.x === 0 && task.coords.y === 0) quadrants.eliminate.push(task);
    });

    return quadrants;
  }, [tasks]);

  // Memoize translated quadrants to prevent unnecessary re-renders
  const translatedQuadrants = useMemo(() => {
    const map = {
      do: { label: dictionary.matrix.do, description: dictionary.matrix.do_desc },
      schedule: { label: dictionary.matrix.decide, description: dictionary.matrix.decide_desc },
      delegate: { label: dictionary.matrix.delegate, description: dictionary.matrix.delegate_desc },
      eliminate: { label: dictionary.matrix.eliminate, description: dictionary.matrix.eliminate_desc },
    };

    return QUADRANTS.map((q) => {
      const trans = map[q.type];
      return { ...q, label: trans.label, description: trans.description };
    });
  }, [dictionary.matrix]);

  const quadrant = {
    schedule: translatedQuadrants[1],
    do: translatedQuadrants[0],
    eliminate: translatedQuadrants[3],
    delegate: translatedQuadrants[2],
  };

  return (
    <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-4 p-4">
      {/* Row 1: Important (y=1) */}
      {/* Schedule: Not Urgent & Important (x=0, y=1) */}
      <Quadrant
        quadrant={quadrant.schedule}
        tasks={tasksByQuadrant.schedule}
        isDragging={isDragging}
      />
      {/* Do: Urgent & Important (x=1, y=1) */}
      <Quadrant
        quadrant={quadrant.do}
        tasks={tasksByQuadrant.do}
        isDragging={isDragging}
      />
      {/* Row 2: Not Important (y=0) */}
      {/* Eliminate: Not Urgent & Not Important (x=0, y=0) */}
      <Quadrant
        quadrant={quadrant.eliminate}
        tasks={tasksByQuadrant.eliminate}
        isDragging={isDragging}
      />
      {/* Delegate: Urgent & Not Important (x=1, y=0) */}
      <Quadrant
        quadrant={quadrant.delegate}
        tasks={tasksByQuadrant.delegate}
        isDragging={isDragging}
      />
    </div>
  );
}
