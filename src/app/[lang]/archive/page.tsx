"use client";

import { useTasks, useTaskMutations } from "@/hooks/use-tasks";
import { useDictionary } from "@/providers/dictionary-provider";
import { usePathname } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArchiveRestore, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { enUS, es } from "date-fns/locale";

export default function ArchivePage() {
  const { data: tasks = [] } = useTasks();
  const { updateTask } = useTaskMutations();
  const dictionary = useDictionary();
  const pathname = usePathname();
  const currentLang = (pathname.split("/")[1] || "en") as "en" | "es";
  const dateLocale = currentLang === "es" ? es : enUS;

  const archivedTasks = tasks.filter((task) => task.is_completed);

  return (
    <div className="h-full w-full overflow-y-auto bg-background">
      <div className="container mx-auto py-8 max-w-4xl">
        <div className="mb-8 px-6">
          <h1 className="text-3xl font-bold text-foreground">
            {dictionary.archive.title}
          </h1>
          <p className="text-muted-foreground mt-2">
            {dictionary.archive.subtitle}
          </p>
        </div>

        <div className="px-6 space-y-4">
          {archivedTasks.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
              <ArchiveRestore className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>{dictionary.archive.no_archived_tasks}</p>
            </div>
          ) : (
            archivedTasks.map((task) => (
              <Card key={task.id} className="p-4 flex items-center justify-between group hover:shadow-md transition-all">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-foreground line-through text-muted-foreground">
                      {task.title}
                    </h3>
                    {task.description && (
                      <div 
                        className="text-xs text-muted-foreground mt-1 line-clamp-1"
                        dangerouslySetInnerHTML={{ __html: task.description }} 
                      />
                    )}
                    {task.completed_at && (
                      <p className="text-[10px] text-muted-foreground mt-1.5">
                        {dictionary.analytics.completed_on} {format(new Date(task.completed_at), "PPP", { locale: dateLocale })}
                      </p>
                    )}
                  </div>
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => updateTask.mutate({ id: task.id, updates: { is_completed: false } })}
                >
                  <ArchiveRestore className="w-4 h-4 mr-2" />
                  {dictionary.archive.restore}
                </Button>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
