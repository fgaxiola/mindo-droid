"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns/format";
import { enUS, es } from "date-fns/locale";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useDictionary } from "@/providers/dictionary-provider";

const MAX_TITLE_LENGTH = 150;

interface QuickTaskCardProps {
  onSave: (data: { title: string; due_date?: Date }) => Promise<void>;
  onCancel?: () => void;
  placeholder?: string;
  className?: string;
  scrollContainerRef?: React.RefObject<HTMLDivElement | null>;
}

export function QuickTaskCard({
  onSave,
  onCancel,
  placeholder,
  className,
  scrollContainerRef,
}: QuickTaskCardProps) {
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const dictionary = useDictionary();
  const pathname = usePathname();
  const locale = (pathname.split("/")[1] || "en") as "en" | "es";
  const dateLocale = locale === "es" ? es : enUS;

  // Auto-resize textarea based on content
  const adjustTextareaHeight = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 200)}px`;

      // Scroll to bottom of textarea when it grows
      textareaRef.current.scrollTop = textareaRef.current.scrollHeight;

      // Also scroll the container to show the card
      if (scrollContainerRef?.current && cardRef.current) {
        setTimeout(() => {
          scrollContainerRef.current?.scrollTo({
            top: scrollContainerRef.current.scrollHeight,
            behavior: "smooth",
          });
        }, 50);
      }
    }
  }, [scrollContainerRef]);

  // Auto-focus textarea when component mounts and scroll to it
  useEffect(() => {
    textareaRef.current?.focus();
    adjustTextareaHeight();

    // Scroll to the card when it appears
    if (cardRef.current && scrollContainerRef?.current) {
      setTimeout(() => {
        scrollContainerRef.current?.scrollTo({
          top: scrollContainerRef.current.scrollHeight,
          behavior: "smooth",
        });
      }, 150);
    }
  }, [scrollContainerRef, adjustTextareaHeight]);

  // Auto-resize textarea when content changes
  useEffect(() => {
    adjustTextareaHeight();
  }, [title, adjustTextareaHeight]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSave({
        title: title.trim(),
        due_date: dueDate,
      });
      // Reset form after successful save
      setTitle("");
      setDueDate(undefined);
      // Keep focus on textarea for quick task creation
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    } catch (error) {
      console.error("Error creating task:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === "Escape") {
      e.preventDefault();
      if (onCancel) {
        onCancel();
      } else {
        setTitle("");
        setDueDate(undefined);
      }
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    setDueDate(date);
    setIsDatePopoverOpen(false);
    // Return focus to textarea after selecting date
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
  };

  return (
    <Card
      ref={cardRef}
      className={cn(
        "p-2 border-2 border-primary/30 bg-card shadow-md",
        className
      )}
    >
      <form onSubmit={handleSubmit} className="flex items-start gap-2">
        <div className="flex-1 relative min-w-0">
          <Textarea
            ref={textareaRef}
            value={title}
            onChange={(e) => {
              const value = e.target.value;
              if (value.length <= MAX_TITLE_LENGTH) {
                setTitle(value);
                // Adjust height and scroll after state update
                setTimeout(() => {
                  adjustTextareaHeight();
                }, 0);
              }
            }}
            onKeyDown={handleKeyDown}
            placeholder={
              placeholder ||
              dictionary.task_dialog?.title_placeholder ||
              "¿Qué se debe hacer?"
            }
            className="pr-0 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-0 focus-visible:outline-none bg-transparent text-sm min-h-[2.25rem] max-h-[200px] overflow-y-auto outline-none shadow-none"
            disabled={isSubmitting}
            rows={1}
            maxLength={MAX_TITLE_LENGTH}
          />
        </div>

        {/* Calendar icon button */}
        <div className="flex flex-col items-center gap-0.5">
          <Popover open={isDatePopoverOpen} onOpenChange={setIsDatePopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={cn("h-7 w-7 shrink-0", dueDate && "text-primary")}
                onClick={(e) => {
                  e.preventDefault();
                  setIsDatePopoverOpen(true);
                }}
              >
                <CalendarIcon className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dueDate}
                onSelect={handleDateSelect}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          {dueDate && (
            <span className="text-[10px] text-muted-foreground leading-none lowercase">
              {format(dueDate, locale === "es" ? "d MMM" : "MMM d", {
                locale: dateLocale,
              })}
            </span>
          )}
        </div>
      </form>
    </Card>
  );
}
