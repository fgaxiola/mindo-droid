"use client";

import { useDictionary } from "@/providers/dictionary-provider";
import { format } from "date-fns";
import { enUS, es } from "date-fns/locale";
import { CheckCircle2 } from "lucide-react";
import { Task } from "@/types/task";
import { cn } from "@/lib/utils";

interface TimelineProps {
  tasks: Task[];
  locale: "en" | "es";
}

export function Timeline({ tasks, locale }: TimelineProps) {
  const dictionary = useDictionary();
  const dateLocale = locale === "es" ? es : enUS;

  // Group tasks by date
  const tasksByDate = tasks.reduce((groups, task) => {
    if (!task.completed_at) return groups;
    
    const date = new Date(task.completed_at);
    const dateKey = format(date, "yyyy-MM-dd");
    
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(task);
    return groups;
  }, {} as Record<string, Task[]>);

  const sortedDates = Object.keys(tasksByDate).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <CheckCircle2 className="w-12 h-12 mb-4 opacity-20" />
        <p>{dictionary.analytics.no_tasks}</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
        <CheckCircle2 className="w-6 h-6 text-green-500" />
        {dictionary.analytics.timeline}
      </h2>

      <div className="relative border-l-2 border-border ml-3 space-y-12">
        {sortedDates.map((date) => (
          <div key={date} className="relative pl-8">
            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-border" />
            
            <h3 className="text-lg font-semibold mb-4 text-foreground/80 capitalize">
              {format(new Date(date), "EEEE, MMMM d, yyyy", { locale: dateLocale })}
            </h3>

            <div className="space-y-6">
              {tasksByDate[date]
                .sort((a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime())
                .map((task) => (
                  <div key={task.id} className="relative group">
                    <div className="absolute -left-[41px] top-2 w-5 h-5 rounded-full border-4 border-background bg-green-500 z-10" />
                    
                    <div className="bg-card border border-border rounded-lg p-4 shadow-sm transition-all hover:shadow-md">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h4 className="font-medium text-foreground line-through decoration-muted-foreground/50 text-muted-foreground">
                            {task.title}
                          </h4>
                          {task.description && (
                            <div 
                              className="text-xs text-muted-foreground mt-1 line-clamp-2"
                              dangerouslySetInnerHTML={{ __html: task.description }}
                            />
                          )}
                        </div>
                        <span className="text-xs font-mono text-muted-foreground shrink-0 bg-muted px-2 py-1 rounded">
                          {format(new Date(task.completed_at!), "HH:mm")}
                        </span>
                      </div>
                      
                      {task.tags.length > 0 && (
                        <div className="flex gap-2 mt-3">
                          {task.tags.map(tag => (
                            <span
                              key={tag.id}
                              className="px-2 py-0.5 text-[10px] rounded-full font-medium"
                              style={{ backgroundColor: tag.color + "20", color: tag.color }}
                            >
                              {tag.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
