"use client";

import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function LanguageSwitcher() {
  const pathname = usePathname();
  const router = useRouter();

  const currentLang = pathname.split("/")[1] || "en";

  const targetLang = currentLang === "en" ? "es" : "en";

  const toggleLanguage = () => {
    const newLang = targetLang;
    const segments = pathname.split("/");
    segments[1] = newLang;
    const newPath = segments.join("/");
    
    // Set cookie for persistence
    document.cookie = `NEXT_LOCALE=${newLang}; path=/; max-age=31536000; SameSite=Lax`;
    
    router.push(newPath);
  };

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={toggleLanguage} 
      className="text-xs font-medium text-muted-foreground hover:text-foreground uppercase w-8 h-8 p-0"
    >
      {targetLang}
    </Button>
  );
}
