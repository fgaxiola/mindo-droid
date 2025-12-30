"use client";

import { useState } from "react";
import { useTasks } from "@/hooks/use-tasks";
import { useDictionary } from "@/providers/dictionary-provider";
import { Big3View } from "@/components/big3/big3-view";
import { Button } from "@/components/ui/button";
import { Focus } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function Big3Page() {
  const { data: tasks = [] } = useTasks();
  const dictionary = useDictionary();
  const [focusMode, setFocusMode] = useState(false);

  // Get only tasks marked as "the_one", excluding completed tasks
  // Tasks are already ordered by position from useTasks(), so we just filter
  const theOneTasks = tasks.filter(
    (task) => task.the_one && !task.is_completed
  );

  return (
    <div className="h-full w-full overflow-y-auto bg-background">
      <div className="container mx-auto py-8 max-w-2xl">
        <div className="mb-8 px-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">
            {dictionary.big3.title}
          </h1>
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setFocusMode(!focusMode)}
                className={cn(
                  "h-9 w-9",
                  focusMode && "bg-primary/10 text-primary"
                )}
              >
                <Focus className={cn("h-5 w-5", focusMode && "fill-current")} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {focusMode
                  ? dictionary.big3?.exit_focus_mode || "Exit Focus Mode"
                  : dictionary.big3?.focus_mode || "Focus Mode"}
              </p>
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="px-6">
          <Big3View tasks={theOneTasks} focusMode={focusMode} />
        </div>
      </div>
    </div>
  );
}
