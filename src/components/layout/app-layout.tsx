"use client";

import { useAuth } from "@/providers/auth-provider";
import { Sidebar } from "./sidebar";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "./language-switcher";
import { useDictionary } from "@/providers/dictionary-provider";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user, signOut, loading } = useAuth();
  const dictionary = useDictionary();

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
        <header className="h-14 border-b border-border flex items-center justify-end px-4 bg-background">
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
