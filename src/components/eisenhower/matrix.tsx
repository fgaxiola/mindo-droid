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

  const getTasksForQuadrant = (x: number, y: number) => {
    return tasks.filter(
      (task) => task.coords.x === x && task.coords.y === y && !task.is_completed
    );
  };

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
        tasks={getTasksForQuadrant(0, 1)}
        isDragging={isDragging}
      />
      {/* Do: Urgent & Important (x=1, y=1) */}
      <Quadrant
        quadrant={quadrant.do}
        tasks={getTasksForQuadrant(1, 1)}
        isDragging={isDragging}
      />
      {/* Row 2: Not Important (y=0) */}
      {/* Eliminate: Not Urgent & Not Important (x=0, y=0) */}
      <Quadrant
        quadrant={quadrant.eliminate}
        tasks={getTasksForQuadrant(0, 0)}
        isDragging={isDragging}
      />
      {/* Delegate: Urgent & Not Important (x=1, y=0) */}
      <Quadrant
        quadrant={quadrant.delegate}
        tasks={getTasksForQuadrant(1, 0)}
        isDragging={isDragging}
      />
    </div>
  );
}
