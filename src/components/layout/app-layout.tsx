"use client";

import { useAuth } from "@/providers/auth-provider";
import { Sidebar } from "./sidebar";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "./language-switcher";
import { useDictionary } from "@/providers/dictionary-provider";
import { TimerIcon } from "lucide-react";
import { useState } from "react";
import { PomodoroTimer } from "@/components/pomodoro-timer";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user, signOut, loading } = useAuth();
  const dictionary = useDictionary();
  const [showPomodoro, setShowPomodoro] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">{dictionary.common.loading}</div>
      </div>
    );
  }

  if (!user) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 border-b border-border flex items-center justify-between px-4 bg-background">
          <Dialog open={showPomodoro} onOpenChange={setShowPomodoro}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                <TimerIcon className="w-4 h-4 mr-1" />
                {dictionary.sidebar.pomo}
              </Button>
            </DialogTrigger>
            <DialogContent className="p-0 max-w-md border-0">
              <DialogTitle className="sr-only">Pomodoro Timer</DialogTitle>
              <PomodoroTimer />
            </DialogContent>
          </Dialog>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <span className="text-sm text-muted-foreground">{user.email}</span>
            <Button
              onClick={signOut}
              variant="ghost"
              size="sm"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              {dictionary.common.sign_out}
            </Button>
          </div>
        </header>
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
