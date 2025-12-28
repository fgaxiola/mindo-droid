"use client";

import { useDictionary } from "@/providers/dictionary-provider";
import { Task } from "@/types/task";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, startOfWeek, endOfWeek } from "date-fns";
import { enUS, es } from "date-fns/locale";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface MonthViewProps {
  tasks: Task[];
  locale: "en" | "es";
}

export function MonthView({ tasks, locale }: MonthViewProps) {
  const dictionary = useDictionary();
  const dateLocale = locale === "es" ? es : enUS;
  const today = new Date();
  
  // Get calendar grid
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]; // Standard ISO week labels key, handled by locale format below

  return (
    <div className="flex flex-col h-full bg-card border border-border rounded-lg overflow-hidden">
      {/* Weekday Headers */}
      <div className="grid grid-cols-7 border-b border-border bg-muted/30">
        {days.slice(0, 7).map((day) => (
          <div key={day.toISOString()} className="p-2 text-center text-sm font-semibold capitalize">
            {format(day, "EEEE", { locale: dateLocale })}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 auto-rows-fr">
        {days.map((day) => {
          const isCurrentMonth = day.getMonth() === today.getMonth();
          const dayTasks = tasks.filter(
            (task) => task.completed_at && isSameDay(new Date(task.completed_at), day)
          );

          return (
            <div 
              key={day.toISOString()} 
              className={cn(
                "min-h-[120px] p-2 border-r border-b border-border last:border-r-0",
                !isCurrentMonth && "bg-muted/10 text-muted-foreground"
              )}
            >
              <div className="text-right mb-2">
                <span className={cn(
                  "text-xs font-medium inline-flex items-center justify-center w-6 h-6 rounded-full",
                  isSameDay(day, today) && "bg-primary text-primary-foreground"
                )}>
                  {format(day, "d")}
                </span>
              </div>
              
              <div className="space-y-1">
                {dayTasks.map((task) => (
                  <div key={task.id} className="flex items-center gap-1.5 overflow-hidden">
                    <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0" />
                    <span className="text-[10px] line-through text-muted-foreground truncate">
                      {task.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
