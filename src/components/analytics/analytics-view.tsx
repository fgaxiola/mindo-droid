"use client";

import { useState } from "react";
import { useDictionary } from "@/providers/dictionary-provider";
import { Task } from "@/types/task";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TodayView } from "./today-view";
import { WeekView } from "./week-view";
import { MonthView } from "./month-view";
import { StatsCard } from "./stats-card";
import { subDays, isSameDay, isWeekend, subMonths, eachDayOfInterval } from "date-fns";

interface AnalyticsViewProps {
  tasks: Task[];
  locale: "en" | "es";
}

export function AnalyticsView({ tasks, locale }: AnalyticsViewProps) {
  const dictionary = useDictionary();
  const [activeTab, setActiveTab] = useState("today");
  const today = new Date();

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
        const count = tasks.filter(t => 
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
             const tasksOnDay = tasks.filter(t => 
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
        const tasksInRange = tasks.filter(t => {
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
            <TodayView tasks={tasks} locale={locale} />
          </TabsContent>
          <TabsContent value="week">
            <WeekView tasks={tasks} locale={locale} />
          </TabsContent>
          <TabsContent value="month">
            <MonthView tasks={tasks} locale={locale} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
