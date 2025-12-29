"use client";

import { useTasks } from "@/hooks/use-tasks";
import { useDictionary } from "@/providers/dictionary-provider";
import { usePathname } from "next/navigation";
import { lazy, Suspense } from "react";

const AnalyticsView = lazy(() =>
  import("@/components/analytics/analytics-view").then((module) => ({
    default: module.AnalyticsView,
  }))
);

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
          <Suspense fallback={<div className="animate-pulse space-y-4"><div className="h-32 bg-muted rounded" /><div className="h-64 bg-muted rounded" /></div>}>
            <AnalyticsView tasks={completedTasks} locale={currentLang} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
