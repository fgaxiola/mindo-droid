export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface TaskCoords {
  x: number; // 0 = not urgent, 1 = urgent
  y: number; // 0 = not important, 1 = important
}

export type TaskStatus = "pending" | "in_progress" | "completed";

export interface Task {
  id: string;
  title: string;
  description: string;
  coords: TaskCoords;
  status: TaskStatus;
  tags: Tag[];
  projectId: string;
}

export type QuadrantType = "do" | "schedule" | "delegate" | "eliminate";

export interface Quadrant {
  type: QuadrantType;
  label: string;
  description: string;
  coords: TaskCoords;
  color: string;
}

export const QUADRANTS: Quadrant[] = [
  {
    type: "do",
    label: "Do",
    description: "Urgent & Important",
    coords: { x: 1, y: 1 },
    color: "bg-red-50 border-red-200",
  },
  {
    type: "schedule",
    label: "Schedule",
    description: "Not Urgent & Important",
    coords: { x: 0, y: 1 },
    color: "bg-blue-50 border-blue-200",
  },
  {
    type: "delegate",
    label: "Delegate",
    description: "Urgent & Not Important",
    coords: { x: 1, y: 0 },
    color: "bg-yellow-50 border-yellow-200",
  },
  {
    type: "eliminate",
    label: "Eliminate",
    description: "Not Urgent & Not Important",
    coords: { x: 0, y: 0 },
    color: "bg-gray-50 border-gray-200",
  },
];
