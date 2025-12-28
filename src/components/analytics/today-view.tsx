"use client";

import { useDictionary } from "@/providers/dictionary-provider";
import { Task } from "@/types/task";
import { format, isSameDay, subDays } from "date-fns";
import { enUS, es } from "date-fns/locale";
import { CheckCircle2 } from "lucide-react";

interface TodayViewProps {
  tasks: Task[];
  locale: "en" | "es";
}

export function TodayView({ tasks, locale }: TodayViewProps) {
  const dictionary = useDictionary();
  const dateLocale = locale === "es" ? es : enUS;
  const today = new Date();

  // Filter tasks completed today
  const todayTasks = tasks.filter((task) => 
    task.completed_at && isSameDay(new Date(task.completed_at), today)
  );

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
                <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                <span className="text-sm font-medium line-through text-muted-foreground">
                  {task.title}
                </span>
                <span className="ml-auto text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded">
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
