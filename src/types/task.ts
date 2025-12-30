export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface TaskCoords {
  x: number; // 0 = not urgent, 1 = urgent
  y: number; // 0 = not important, 1 = important
}

export interface MatrixPosition {
  x: number; // percentage 0-100
  y: number; // percentage 0-100
}

export interface PositionedTask extends Task {
  matrixPosition: MatrixPosition | null; // null = in sidebar
}

export type TaskStatus = "pending" | "in_progress" | "completed";

export interface Task {
  id: string;
  title: string;
  description: string;
  coords: TaskCoords;
  status: TaskStatus;
  tags: Tag[];
  projectId?: string;
  due_date?: Date | string;
  estimated_time?: number;
  matrixPosition?: { x: number; y: number } | null;
  matrix_z_index?: number; // Z-index for interactive matrix (higher = on top)
  is_completed: boolean;
  completed_at?: string | Date | null;
  position?: number;
  // DB specific fields
  user_id?: string;
  created_at?: string;
  updated_at?: string;
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
