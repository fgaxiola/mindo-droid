"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CreateTaskButtonProps {
  onClick: () => void;
  className?: string;
}

export function CreateTaskButton({ onClick, className }: CreateTaskButtonProps) {
  return (
    <Button
      onClick={onClick}
      variant="outline"
      size="icon"
      className={cn(
        "h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity absolute z-10 bg-background shadow-sm hover:bg-accent",
        className
      )}
    >
      <Plus className="h-4 w-4" />
    </Button>
  );
}
