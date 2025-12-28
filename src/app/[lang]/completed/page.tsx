"use client";

import { useTasks, useTaskMutations } from "@/hooks/use-tasks";
import { useDictionary } from "@/providers/dictionary-provider";
import { usePathname } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArchiveRestore, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { enUS, es } from "date-fns/locale";

export default function CompletedPage() {
  const { data: tasks = [] } = useTasks();
  const { updateTask } = useTaskMutations();
  const dictionary = useDictionary();
  const pathname = usePathname();
  const currentLang = (pathname.split("/")[1] || "en") as "en" | "es";
  const dateLocale = currentLang === "es" ? es : enUS;

  const completedTasks = tasks.filter((task) => task.is_completed);

  return (
    <div className="h-full w-full overflow-y-auto bg-background">
      <div className="container mx-auto py-8 max-w-4xl">
        <div className="mb-8 px-6">
          <h1 className="text-3xl font-bold text-foreground">
            {dictionary.completed.title}
          </h1>
          <p className="text-muted-foreground mt-2">
            {dictionary.completed.subtitle}
          </p>
        </div>

        <div className="px-6 space-y-4">
          {completedTasks.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
              <ArchiveRestore className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>{dictionary.completed.no_completed_tasks}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {completedTasks.map((task) => (
                <div key={task.id} className="flex items-center gap-3 p-3 bg-muted/20 rounded-md border border-border/50 group hover:bg-muted/40 transition-colors">
                  <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                  <span className="text-sm font-medium line-through text-muted-foreground truncate flex-1">
                    {task.title}
                  </span>
                  
                  {task.completed_at && (
                    <span className="text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded shrink-0">
                      {format(new Date(task.completed_at), "HH:mm")}
                    </span>
                  )}

                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity ml-2"
                    title={dictionary.completed.restore}
                    onClick={() => updateTask.mutate({ id: task.id, updates: { is_completed: false } })}
                  >
                    <ArchiveRestore className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
