"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDictionary } from "@/providers/dictionary-provider";

interface StatsCardProps {
  value: number | string;
  label: string;
}

export function StatsCard({ value, label }: StatsCardProps) {
  const dictionary = useDictionary();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {dictionary.analytics.tasks_per_day}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}
