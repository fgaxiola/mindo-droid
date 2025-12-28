"use client";

import { useDictionary } from "@/providers/dictionary-provider";
import { Task } from "@/types/task";
import { format, isSameDay, subDays } from "date-fns";
import { enUS, es } from "date-fns/locale";
import { CheckCircle2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface TodayViewProps {
  tasks: Task[];
  locale: "en" | "es";
  onTaskClick?: (task: Task) => void;
  onTaskToggle?: (taskId: string) => void;
}

export function TodayView({ tasks, locale, onTaskClick, onTaskToggle }: TodayViewProps) {
  const dictionary = useDictionary();
  const dateLocale = locale === "es" ? es : enUS;
  const today = new Date();

  // Filter tasks completed today and sort by completed_at time (most recent first)
  const todayTasks = tasks
    .filter((task) =>
      task.completed_at && isSameDay(new Date(task.completed_at), today)
    )
    .sort((a, b) => {
      const timeA = new Date(a.completed_at!).getTime();
      const timeB = new Date(b.completed_at!).getTime();
      return timeB - timeA;
    });

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 text-foreground/80">
          {format(today, "EEEE, MMMM d, yyyy", { locale: dateLocale })}
        </h3>
        
        {todayTasks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {dictionary.analytics.no_tasks}
          </div>
        ) : (
          <div className="space-y-3">
            {todayTasks.map((task) => (
              <div key={task.id} className="flex items-center gap-3 p-3 bg-muted/20 rounded-md border border-border/50">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onTaskToggle?.(task.id);
                      }}
                      className="shrink-0 hover:opacity-70 transition-opacity cursor-pointer"
                    >
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" sideOffset={5}>
                    {dictionary.analytics.mark_as_incomplete}
                  </TooltipContent>
                </Tooltip>
                <button
                  onClick={() => onTaskClick?.(task)}
                  className="text-sm font-medium line-through text-muted-foreground hover:text-foreground hover:underline cursor-pointer truncate text-left flex-1"
                  title={task.title}
                >
                  {task.title}
                </button>
                <span className="text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded shrink-0">
                  {format(new Date(task.completed_at!), "HH:mm")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
