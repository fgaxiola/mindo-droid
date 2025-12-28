"use client";

import { useDictionary } from "@/providers/dictionary-provider";
import { Task } from "@/types/task";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from "date-fns";
import { enUS, es } from "date-fns/locale";
import { CheckCircle2 } from "lucide-react";

interface WeekViewProps {
  tasks: Task[];
  locale: "en" | "es";
  onTaskClick?: (task: Task) => void;
}

export function WeekView({ tasks, locale, onTaskClick }: WeekViewProps) {
  const dictionary = useDictionary();
  const dateLocale = locale === "es" ? es : enUS;
  const today = new Date();
  
  // Get current week interval
  const start = startOfWeek(today, { weekStartsOn: 1 }); // Monday start
  const end = endOfWeek(today, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start, end });

  return (
    <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
      {days.map((day) => {
        const dayTasks = tasks
          .filter(
            (task) => task.completed_at && isSameDay(new Date(task.completed_at), day)
          )
          .sort((a, b) => {
            const timeA = new Date(a.completed_at!).getTime();
            const timeB = new Date(b.completed_at!).getTime();
            return timeB - timeA;
          });

        return (
          <div key={day.toISOString()} className="flex flex-col h-full bg-card border border-border rounded-lg overflow-hidden">
            <div className="p-3 bg-muted/30 border-b border-border text-center">
              <span className="block text-sm font-semibold capitalize">
                {format(day, "EEEE", { locale: dateLocale })}
              </span>
              <span className="text-xs text-muted-foreground">
                {format(day, "MMM d")}
              </span>
            </div>
            
            <div className="flex-1 p-2 space-y-2 min-h-[150px]">
              {dayTasks.map((task) => (
                <div key={task.id} className="flex items-start gap-2 p-2 bg-background rounded border border-border/50 text-xs">
                  <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0 mt-0.5" />
                  <button
                    onClick={() => onTaskClick?.(task)}
                    className="line-through text-muted-foreground break-words line-clamp-2 hover:text-foreground hover:underline cursor-pointer text-left"
                    title={task.title}
                  >
                    {task.title}
                  </button>
                </div>
              ))}
              {dayTasks.length === 0 && (
                <div className="h-full flex items-center justify-center">
                  <span className="text-[10px] text-muted-foreground/30">
                    -
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
