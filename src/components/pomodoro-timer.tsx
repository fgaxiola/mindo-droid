"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useDictionary } from "@/providers/dictionary-provider";

type TimerMode = "work" | "shortBreak" | "longBreak";

const TIMER_SETTINGS = {
  work: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60,
};

export function PomodoroTimer() {
  const dictionary = useDictionary();
  const [mode, setMode] = useState<TimerMode>("work");
  const [timeLeft, setTimeLeft] = useState(TIMER_SETTINGS.work);
  const [isRunning, setIsRunning] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);

  const totalTime = TIMER_SETTINGS[mode];
  const progress = ((totalTime - timeLeft) / totalTime) * 100;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const switchMode = useCallback((newMode: TimerMode) => {
    setMode(newMode);
    setTimeLeft(TIMER_SETTINGS[newMode]);
    setIsRunning(false);
  }, []);

  const handleComplete = useCallback(() => {
    if (mode === "work") {
      const newCount = completedSessions + 1;
      setCompletedSessions(newCount);
      if (newCount % 4 === 0) {
        switchMode("longBreak");
      } else {
        switchMode("shortBreak");
      }
    } else {
      switchMode("work");
    }
  }, [mode, completedSessions, switchMode]);

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          handleComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, handleComplete]);

  const toggleTimer = () => setIsRunning(!isRunning);

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(TIMER_SETTINGS[mode]);
  };

  const getModeLabel = () => {
    switch (mode) {
      case "work":
        return dictionary.pomodoro.focus;
      case "shortBreak":
        return dictionary.pomodoro.short_break;
      case "longBreak":
        return dictionary.pomodoro.long_break;
    }
  };

  return (
    <div className="h-full flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-0 shadow-none bg-transparent">
        <CardContent className="p-8">
          <div className="text-center space-y-8">
            <div className="space-y-2">
              <h1 className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
                Pomodoro Timer
              </h1>
              <p className="text-lg font-medium text-foreground/80">
                {getModeLabel()}
              </p>
            </div>

            <div className="space-y-6">
              <div className="font-mono text-7xl font-light tracking-tight text-foreground">
                {formatTime(timeLeft)}
              </div>

              <Progress value={progress} className="h-1 bg-muted" />

              <div className="flex items-center justify-center gap-3">
                <Button
                  onClick={toggleTimer}
                  variant="default"
                  className="px-8 py-2 text-sm font-medium rounded-md transition-all hover:opacity-90"
                >
                  {isRunning ? dictionary.pomodoro.pause : dictionary.pomodoro.start}
                </Button>
                <Button
                  onClick={resetTimer}
                  variant="ghost"
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-all"
                >
                  {dictionary.pomodoro.reset}
                </Button>
              </div>
            </div>

            <div className="flex justify-center gap-2 pt-4">
              {(["work", "shortBreak", "longBreak"] as TimerMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => switchMode(m)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    mode === m
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {m === "work"
                    ? dictionary.pomodoro.focus
                    : m === "shortBreak"
                      ? dictionary.pomodoro.short_break
                      : dictionary.pomodoro.long_break}
                </button>
              ))}
            </div>

            <div className="pt-6 border-t border-border">
              <div className="flex items-center justify-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {dictionary.pomodoro.sessions_completed}:
                </span>
                <span className="text-sm font-medium text-foreground">
                  {completedSessions}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
