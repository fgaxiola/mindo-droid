"use client";

import { useState } from "react";
import { useDictionary } from "@/providers/dictionary-provider";
import { Task } from "@/types/task";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TodayView } from "./today-view";
import { WeekView } from "./week-view";
import { MonthView } from "./month-view";
import { StatsCard } from "./stats-card";
import { TaskDialog } from "@/components/tasks/task-dialog";
import { useTaskMutations } from "@/hooks/use-tasks";
import { useQueryClient } from "@tanstack/react-query";
import { subDays } from "date-fns/subDays";
import { isSameDay } from "date-fns/isSameDay";
import { isWeekend } from "date-fns/isWeekend";
import { subMonths } from "date-fns/subMonths";
import { eachDayOfInterval } from "date-fns/eachDayOfInterval";

interface AnalyticsViewProps {
  tasks: Task[];
  locale: "en" | "es";
}

export function AnalyticsView({ tasks, locale }: AnalyticsViewProps) {
  const dictionary = useDictionary();
  const [activeTab, setActiveTab] = useState("today");
  const [selectedTask, setSelectedTask] = useState<Task | undefined>();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const today = new Date();

  // Get the latest task from React Query cache when modal opens
  // This ensures we always show the most recent data
  const latestTask = isDialogOpen && selectedTask ? (() => {
    const cachedTasks = queryClient.getQueryData<Task[]>(["tasks"]);
    return cachedTasks?.find(t => t.id === selectedTask.id) || selectedTask;
  })() : selectedTask;

  // Sort tasks by completed_at (most recent first)
  const sortedTasks = [...tasks].sort((a, b) => {
    if (!a.completed_at) return 1;
    if (!b.completed_at) return -1;
    return new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime();
  });

  const { updateTask, deleteTask } = useTaskMutations();

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsDialogOpen(true);
  };

  const handleSaveTask = async (data: { title: string; description?: string; due_date?: Date; estimated_time?: number; is_completed?: boolean }) => {
    if (!selectedTask) return;

    await updateTask.mutateAsync({
      id: selectedTask.id,
      updates: {
        title: data.title,
        description: data.description,
        due_date: data.due_date,
        estimated_time: data.estimated_time,
        is_completed: data.is_completed,
      },
    });
  };

  const handleDeleteTask = async () => {
    if (!selectedTask) return;
    await deleteTask.mutateAsync(selectedTask.id);
  };

  const handleRestoreTask = async (version: { id: string; created_at: string; snapshot: Task }) => {
    // Restore functionality - implement if needed
    console.log("Restore version:", version);
  };

  const handleToggleTask = async (taskId: string) => {
    const task = sortedTasks.find(t => t.id === taskId);
    if (!task) return;

    await updateTask.mutateAsync({
      id: taskId,
      updates: { is_completed: !task.is_completed },
    });
  };

  // Calculation Helpers
  const getWorkingDays = (start: Date, end: Date) => {
    const days = eachDayOfInterval({ start, end });
    return days.filter(day => !isWeekend(day)).length;
  };

  const calculateStats = () => {
    switch (activeTab) {
      case "today": {
        // Tasks completed yesterday
        const yesterday = subDays(today, 1);
        const count = sortedTasks.filter(t =>
          t.completed_at && isSameDay(new Date(t.completed_at), yesterday)
        ).length;
        return { value: count, label: dictionary.analytics.yesterday };
      }
      case "week": {
        // Avg tasks last 5 working days
        // Logic: Find last 5 working days from today backwards. Sum tasks on those days. Divide by 5.
        let workingDaysFound = 0;
        let daysLookedBack = 0;
        let totalTasks = 0;

        while (workingDaysFound < 5 && daysLookedBack < 30) { // Safety break
           const d = subDays(today, daysLookedBack);
           if (!isWeekend(d)) {
             const tasksOnDay = sortedTasks.filter(t =>
               t.completed_at && isSameDay(new Date(t.completed_at), d)
             ).length;
             totalTasks += tasksOnDay;
             workingDaysFound++;
           }
           daysLookedBack++;
        }

        const avg = workingDaysFound > 0 ? (totalTasks / workingDaysFound).toFixed(1) : "0";
        return { value: avg, label: dictionary.analytics.last_5_days };
      }
      case "month": {
        // Avg tasks on working days from today to same day last month
        const lastMonthDate = subMonths(today, 1);
        // Ensure start <= end
        const start = lastMonthDate < today ? lastMonthDate : today;
        const end = today;

        const workingDaysCount = getWorkingDays(start, end);

        // Count all completed tasks in this range on working days
        const tasksInRange = sortedTasks.filter(t => {
          if (!t.completed_at) return false;
          const d = new Date(t.completed_at);
          return d >= start && d <= end && !isWeekend(d);
        }).length;

        const avg = workingDaysCount > 0 ? (tasksInRange / workingDaysCount).toFixed(1) : "0";
        return { value: avg, label: dictionary.analytics.last_month };
      }
      default:
        return { value: 0, label: "" };
    }
  };

  const stats = calculateStats();

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard value={stats.value} label={stats.label} />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-[400px]">
          <TabsTrigger value="today">{dictionary.analytics.today}</TabsTrigger>
          <TabsTrigger value="week">{dictionary.analytics.week}</TabsTrigger>
          <TabsTrigger value="month">{dictionary.analytics.month}</TabsTrigger>
        </TabsList>
        <div className="mt-6">
          <TabsContent value="today">
            <TodayView tasks={sortedTasks} locale={locale} onTaskClick={handleTaskClick} onTaskToggle={handleToggleTask} />
          </TabsContent>
          <TabsContent value="week">
            <WeekView tasks={sortedTasks} locale={locale} onTaskClick={handleTaskClick} onTaskToggle={handleToggleTask} />
          </TabsContent>
          <TabsContent value="month">
            <MonthView tasks={sortedTasks} locale={locale} onTaskClick={handleTaskClick} onTaskToggle={handleToggleTask} />
          </TabsContent>
        </div>
      </Tabs>

      <TaskDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        task={latestTask}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
        onRestore={handleRestoreTask}
        versions={[]}
        viewOnly={latestTask?.is_completed}
      />
    </div>
  );
}
