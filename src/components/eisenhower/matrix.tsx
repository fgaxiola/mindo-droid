"use client";

import { useMemo, useRef } from "react";
import { Task, QUADRANTS } from "@/types/task";
import { Quadrant } from "./quadrant";
import { useDictionary } from "@/providers/dictionary-provider";

interface MatrixProps {
  tasks: Task[];
  isDragging?: boolean;
}

// Helper to check if two task arrays are effectively the same (ids, coords, and content)
const areTaskArraysEqual = (prev: Task[], next: Task[]) => {
  if (prev === next) return true;
  if (prev.length !== next.length) return false;
  for (let i = 0; i < prev.length; i++) {
    const prevTask = prev[i];
    const nextTask = next[i];
    // Compare ID, coords, and key content fields to detect changes
    if (
      prevTask.id !== nextTask.id ||
      prevTask.coords.x !== nextTask.coords.x ||
      prevTask.coords.y !== nextTask.coords.y ||
      prevTask.title !== nextTask.title ||
      prevTask.description !== nextTask.description ||
      prevTask.is_completed !== nextTask.is_completed ||
      prevTask.due_date !== nextTask.due_date ||
      prevTask.estimated_time !== nextTask.estimated_time
    ) {
      return false;
    }
  }
  return true;
};

export function Matrix({ tasks, isDragging }: MatrixProps) {
  const dictionary = useDictionary();
  
  // Refs to hold the last stable array for each quadrant
  const prevQuadrantsRef = useRef({
    do: [] as Task[],
    schedule: [] as Task[],
    delegate: [] as Task[],
    eliminate: [] as Task[],
  });

  // Memoize task filtering
  const tasksByQuadrant = useMemo(() => {
    const current = {
      do: [] as Task[],
      schedule: [] as Task[],
      delegate: [] as Task[],
      eliminate: [] as Task[],
    };

    // First pass: distribute tasks
    tasks.forEach((task) => {
      if (task.is_completed) return;
      if (task.coords.x === 1 && task.coords.y === 1) current.do.push(task);
      else if (task.coords.x === 0 && task.coords.y === 1) current.schedule.push(task);
      else if (task.coords.x === 1 && task.coords.y === 0) current.delegate.push(task);
      else if (task.coords.x === 0 && task.coords.y === 0) current.eliminate.push(task);
    });

    // Second pass: check against previous refs to return stable arrays
    const stable = { ...current };
    const prev = prevQuadrantsRef.current;

    // eslint-disable-next-line react-hooks/refs
    (Object.keys(current) as Array<keyof typeof current>).forEach((key) => {
      if (areTaskArraysEqual(prev[key], current[key])) {
        stable[key] = prev[key];
      } else {
        prev[key] = current[key]; // Update ref
      }
    });

    return stable;
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
