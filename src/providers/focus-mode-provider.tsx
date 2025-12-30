"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface FocusModeContextType {
  focusMode: boolean;
  setFocusMode: (value: boolean) => void;
}

const FocusModeContext = createContext<FocusModeContextType | undefined>(
  undefined
);

export function FocusModeProvider({ children }: { children: ReactNode }) {
  const [focusMode, setFocusMode] = useState(false);

  return (
    <FocusModeContext.Provider value={{ focusMode, setFocusMode }}>
      {children}
    </FocusModeContext.Provider>
  );
}

export function useFocusMode() {
  const context = useContext(FocusModeContext);
  if (context === undefined) {
    throw new Error("useFocusMode must be used within a FocusModeProvider");
  }
  return context;
}

