"use client";

import { InteractiveMatrixBoard } from "@/components/interactive-matrix";
import { Task } from "@/types/task";
import { MatrixPosition } from "@/stores/interactive-matrix-store";

const DEMO_TASKS: Task[] = [
  {
    id: "im-1",
    title: "Resolver bug crítico en producción",
    description: "Los usuarios no pueden completar pagos",
    coords: { x: 1, y: 1 },
    status: "in_progress",
    tags: [{ id: "t1", name: "Bug", color: "#ef4444" }],
    projectId: "p1",
  },
  {
    id: "im-2",
    title: "Planificar roadmap Q1",
    description: "Definir objetivos y milestones del próximo trimestre",
    coords: { x: 0, y: 1 },
    status: "pending",
    tags: [{ id: "t2", name: "Planning", color: "#3b82f6" }],
    projectId: "p1",
  },
  {
    id: "im-3",
    title: "Responder correos pendientes",
    description: "Limpiar bandeja de entrada",
    coords: { x: 1, y: 0 },
    status: "pending",
    tags: [{ id: "t3", name: "Admin", color: "#f59e0b" }],
    projectId: "p1",
  },
  {
    id: "im-4",
    title: "Organizar escritorio",
    description: "Ordenar espacio de trabajo",
    coords: { x: 0, y: 0 },
    status: "pending",
    tags: [],
    projectId: "p1",
  },
  {
    id: "im-5",
    title: "Implementar nueva funcionalidad",
    description: "Dashboard de analytics",
    coords: { x: -1, y: -1 },
    status: "pending",
    tags: [{ id: "t4", name: "Feature", color: "#22c55e" }],
    projectId: "p1",
  },
  {
    id: "im-6",
    title: "Escribir documentación API",
    description: "Documentar nuevos endpoints",
    coords: { x: -1, y: -1 },
    status: "pending",
    tags: [{ id: "t5", name: "Docs", color: "#8b5cf6" }],
    projectId: "p1",
  },
  {
    id: "im-7",
    title: "Reunión con cliente",
    description: "Revisar avances del proyecto",
    coords: { x: -1, y: -1 },
    status: "pending",
    tags: [{ id: "t6", name: "Meeting", color: "#ec4899" }],
    projectId: "p1",
  },
  {
    id: "im-8",
    title: "Actualizar dependencias",
    description: "Revisar y actualizar paquetes npm",
    coords: { x: -1, y: -1 },
    status: "pending",
    tags: [{ id: "t7", name: "Maintenance", color: "#06b6d4" }],
    projectId: "p1",
  },
];

export default function InteractiveMatrixPage() {
  const handlePositionChange = (taskId: string, position: MatrixPosition | null) => {
    console.log(`Task ${taskId} position changed:`, position);
  };

  return (
    <div className="h-full w-full">
      <InteractiveMatrixBoard
        initialTasks={DEMO_TASKS}
        onTaskPositionChange={handlePositionChange}
      />
    </div>
  );
}
