"use client";

import { useTasks } from "@/hooks/use-tasks";
import { AnalyticsView } from "@/components/analytics/analytics-view";
import { useDictionary } from "@/providers/dictionary-provider";
import { usePathname } from "next/navigation";

export default function AnalyticsPage() {
  const { data: tasks = [] } = useTasks();
  const dictionary = useDictionary();
  const pathname = usePathname();
  const currentLang = (pathname.split("/")[1] || "en") as "en" | "es";

  const completedTasks = tasks.filter(
    (task) => task.is_completed && task.completed_at
  );

  return (
    <div className="h-full w-full overflow-y-auto bg-background">
      <div className="container mx-auto py-8 max-w-6xl">
        <div className="mb-8 px-6">
          <h1 className="text-3xl font-bold text-foreground">
            {dictionary.analytics.title}
          </h1>
          <p className="text-muted-foreground mt-2">
            {dictionary.analytics.subtitle}
          </p>
        </div>
        
        <div className="px-6">
          <AnalyticsView tasks={completedTasks} locale={currentLang} />
        </div>
      </div>
    </div>
  );
}
