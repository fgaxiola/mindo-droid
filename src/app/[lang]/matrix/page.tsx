"use client";

import { EisenhowerBoard } from "@/components/eisenhower";
import { Task } from "@/types/task";

const DEMO_TASKS: Task[] = [
  {
    id: "1",
    title: "Fix critical production bug",
    description: "Users are unable to login",
    coords: { x: 1, y: 1 },
    status: "in_progress",
    tags: [{ id: "t1", name: "Bug", color: "#ef4444" }],
    projectId: "p1",
    is_completed: false,
  },
  {
    id: "2",
    title: "Plan Q1 roadmap",
    description: "Define goals and milestones for next quarter",
    coords: { x: 0, y: 1 },
    status: "pending",
    tags: [{ id: "t2", name: "Planning", color: "#3b82f6" }],
    projectId: "p1",
    is_completed: false,
  },
  {
    id: "3",
    title: "Reply to emails",
    description: "Clear inbox backlog",
    coords: { x: 1, y: 0 },
    status: "pending",
    tags: [{ id: "t3", name: "Admin", color: "#f59e0b" }],
    projectId: "p1",
    is_completed: false,
  },
  {
    id: "4",
    title: "Organize desk",
    description: "Clean up workspace",
    coords: { x: 0, y: 0 },
    status: "pending",
    tags: [],
    projectId: "p1",
    is_completed: false,
  },
  {
    id: "5",
    title: "New feature implementation",
    description: "Build the dashboard analytics",
    coords: { x: -1, y: -1 },
    status: "pending",
    tags: [{ id: "t4", name: "Feature", color: "#22c55e" }],
    projectId: "p1",
    is_completed: false,
  },
  {
    id: "6",
    title: "Write documentation",
    description: "API docs for new endpoints",
    coords: { x: -1, y: -1 },
    status: "pending",
    tags: [{ id: "t5", name: "Docs", color: "#8b5cf6" }],
    projectId: "p1",
    is_completed: false,
  },
];

export default function MatrixPage() {
  const handleCoordsChange = (taskId: string, coords: { x: number; y: number }) => {
    console.log(`Task ${taskId} moved to coords:`, coords);
  };

  return (
    <div className="h-full w-full">
      <EisenhowerBoard
        initialTasks={DEMO_TASKS}
        onTaskCoordsChange={handleCoordsChange}
      />
    </div>
  );
}
