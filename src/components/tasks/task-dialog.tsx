"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns/format";
import { CalendarIcon, Clock, Trash, Undo, History } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
const RichTextEditor = lazy(() =>
  import("@/components/ui/rich-text-editor").then((module) => ({
    default: module.RichTextEditor,
  }))
);
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { Task } from "@/types/task";
import { useDictionary } from "@/providers/dictionary-provider";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const MAX_TITLE_LENGTH = 150;
const MAX_DESCRIPTION_LENGTH = 1500;

type Dictionary = Record<string, any>;

const createTaskSchema = (dict: Dictionary) =>
  z.object({
    title: z
      .string()
      .min(1, dict.task_dialog?.errors?.title_required || "Title is required")
      .max(
        MAX_TITLE_LENGTH,
        dict.task_dialog?.errors?.title_too_long ||
          `Title must be less than ${MAX_TITLE_LENGTH} characters`
      ),
    description: z
      .string()
      .max(
        MAX_DESCRIPTION_LENGTH,
        dict.task_dialog?.errors?.description_too_long ||
          `Description must be less than ${MAX_DESCRIPTION_LENGTH} characters`
      )
      .optional(),
    due_date: z.date().optional(),
    estimated_time: z.number().min(0).optional(),
    is_completed: z.boolean().optional(),
  });

type TaskFormData = z.infer<ReturnType<typeof createTaskSchema>>;

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task;
  onSave: (data: TaskFormData) => Promise<void>;
  onDelete?: () => Promise<void>;
  onRestore?: (version: {
    id: string;
    created_at: string;
    snapshot: Task;
  }) => Promise<void>;
  versions?: Array<{ id: string; created_at: string; snapshot: Task }>;
  viewOnly?: boolean;
}

export function TaskDialog({
  open,
  onOpenChange,
  task,
  onSave,
  onDelete,
  onRestore,
  versions = [],
  viewOnly = false,
}: TaskDialogProps) {
  const dictionary = useDictionary();
  const [isHistoryPopoverOpen, setIsHistoryPopoverOpen] = useState(false);
  const [titleLength, setTitleLength] = useState(0);
  const [descriptionLength, setDescriptionLength] = useState(0);
  const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const estimatedTimeRef = useRef<HTMLInputElement>(null);
  const deleteConfirmButtonRef = useRef<HTMLButtonElement>(null);

  // Focus delete button when dialog opens
  useEffect(() => {
    if (isDeleteConfirmOpen && deleteConfirmButtonRef.current) {
      // Small delay to ensure dialog is fully rendered
      setTimeout(() => {
        deleteConfirmButtonRef.current?.focus();
      }, 100);
    }
  }, [isDeleteConfirmOpen]);

  // Check if history button should be visible
  const showHistoryButton = task && !task.is_completed && versions.length > 0;

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<TaskFormData>({
    resolver: zodResolver(createTaskSchema(dictionary)),
    defaultValues: {
      title: task?.title || "",
      description: task?.description || "",
      due_date: task?.due_date ? new Date(task.due_date) : undefined,
      estimated_time: task?.estimated_time || 0,
      is_completed: task?.is_completed || false,
    },
  });

  // Watch values to update character counters
  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (name === "title") {
        const len = (value.title || "").length;
        setTitleLength(len > MAX_TITLE_LENGTH ? MAX_TITLE_LENGTH : len);
      }
      if (name === "description") {
        setDescriptionLength((value.description || "").length);
      }
    });

    // Initialize counters with initial values
    setTitleLength(Math.min(task?.title?.length || 0, MAX_TITLE_LENGTH));
    setDescriptionLength(task?.description?.length || 0);

    return () => subscription.unsubscribe();
  }, [watch, task?.title, task?.description]);

  // Reset form when task changes or dialog opens
  useEffect(() => {
    if (open) {
      // Reset history popover when dialog opens
      setIsHistoryPopoverOpen(false);
      reset({
        title: task?.title || "",
        description: task?.description || "",
        due_date: task?.due_date ? new Date(task.due_date) : undefined,
        estimated_time: task?.estimated_time || 0,
        is_completed: task?.is_completed || false,
      });
      setTitleLength(Math.min(task?.title?.length || 0, MAX_TITLE_LENGTH));
      setDescriptionLength(task?.description?.length || 0);
    }
  }, [task, open, reset]);

  // Watch is_completed to determine if fields should be disabled in viewOnly mode
  const isCompleted = watch("is_completed");
  const fieldsDisabled = viewOnly && !!isCompleted;

  // Close history popover if task becomes completed
  useEffect(() => {
    if (isCompleted && isHistoryPopoverOpen) {
      setIsHistoryPopoverOpen(false);
    }
  }, [isCompleted, isHistoryPopoverOpen]);

  const onSubmit = async (data: TaskFormData) => {
    await onSave(data);
    onOpenChange(false);
    reset();
  };

  const isSubmitDisabled = isSubmitting || (task && !isDirty);

  // Handle keyboard shortcuts (CMD+ENTER to submit)
  const handleKeyDown = (e: React.KeyboardEvent | KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      if ("stopPropagation" in e) {
        e.stopPropagation();
      }
      if (!isSubmitDisabled) {
        handleSubmit(onSubmit)(e as React.FormEvent);
      }
    }
  };

  const handleDeleteConfirmKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      handleDeleteConfirm();
    }
    if (e.key === "Escape") {
      e.preventDefault();
      setIsDeleteConfirmOpen(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (onDelete) {
      await onDelete();
      setIsDeleteConfirmOpen(false);
      onOpenChange(false);
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    setValue("due_date", date);
    setIsDatePopoverOpen(false);
    // Focus on estimated_time input after popover closes
    setTimeout(() => {
      estimatedTimeRef.current?.focus();
    }, 100);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-2xl max-h-[90vh] flex flex-col"
        onKeyDown={handleKeyDown}
      >
        {showHistoryButton && (
          <Popover
            open={isHistoryPopoverOpen}
            onOpenChange={setIsHistoryPopoverOpen}
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "absolute top-2 right-8 h-8 w-8",
                      isHistoryPopoverOpen && "bg-accent"
                    )}
                  >
                    <History className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>{dictionary.task_dialog?.restore_version}</p>
              </TooltipContent>
            </Tooltip>
            <PopoverContent
              className="w-96 p-0"
              align="end"
              side="bottom"
              onWheel={(e) => {
                // Prevent scroll from propagating to the dialog
                e.stopPropagation();
              }}
            >
              <div className="p-3 border-b">
                <h4 className="text-sm font-semibold">
                  {dictionary.task_dialog?.history} ({versions.length})
                </h4>
                <p className="text-xs text-muted-foreground mt-1">
                  {dictionary.task_dialog?.restore_version}
                </p>
              </div>
              <div
                className="h-[400px] overflow-y-auto"
                onWheel={(e) => {
                  // Prevent scroll from propagating to the dialog
                  e.stopPropagation();
                }}
              >
                <div className="p-3 space-y-2">
                  {versions.map((version) => {
                    const snapshot = version.snapshot;
                    return (
                      <button
                        key={version.id}
                        type="button"
                        className="w-full text-left border rounded-md p-3 hover:bg-accent/50 transition-colors group"
                        onClick={() => {
                          onRestore?.(version);
                          setIsHistoryPopoverOpen(false);
                        }}
                      >
                        <div className="flex items-start gap-2">
                          <Undo className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0 group-hover:text-primary transition-colors" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-muted-foreground">
                              {format(new Date(version.created_at), "PPP p")}
                            </p>
                            <p className="text-sm font-medium mt-1 line-clamp-1 group-hover:text-primary transition-colors">
                              {snapshot.title}
                            </p>
                            {snapshot.description && (
                              <div
                                className="text-xs text-muted-foreground mt-1 line-clamp-2"
                                dangerouslySetInnerHTML={{
                                  __html: snapshot.description,
                                }}
                              />
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                  {versions.length === 0 && (
                    <p className="text-center text-muted-foreground py-8 text-sm">
                      {dictionary.task_dialog?.no_history}
                    </p>
                  )}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )}
        <DialogHeader>
          <DialogTitle>
            {task ? null : `${dictionary.task_dialog?.create_task}`}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-1 min-h-0">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
            id="task-form"
          >
            <div className="space-y-2">
              <Label htmlFor="title">{dictionary.task_dialog?.title}</Label>
              <Input
                id="title"
                {...register("title")}
                placeholder="Task title"
                maxLength={MAX_TITLE_LENGTH}
                autoFocus
                className={cn(
                  fieldsDisabled && "pointer-events-none opacity-70"
                )}
                disabled={fieldsDisabled}
              />
              <p className="text-xs text-muted-foreground text-right">
                {MAX_TITLE_LENGTH - titleLength} / {MAX_TITLE_LENGTH}
              </p>
              {errors.title && (
                <p className="text-sm text-destructive">
                  {errors.title.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{dictionary.task_dialog?.due_date}</Label>
                <Controller
                  control={control}
                  name="due_date"
                  render={({ field }) => (
                    <Popover
                      open={isDatePopoverOpen}
                      onOpenChange={setIsDatePopoverOpen}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          disabled={fieldsDisabled}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !field.value && "text-muted-foreground",
                            fieldsDisabled && "opacity-70"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>{dictionary.task_dialog?.pick_a_date}</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={handleDateSelect}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimated_time">
                  {dictionary.task_dialog?.estimated_time} (min)
                </Label>
                <div className="relative">
                  <Clock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="estimated_time"
                    type="number"
                    disabled={fieldsDisabled}
                    className={cn("pl-9", fieldsDisabled && "opacity-70")}
                    {...register("estimated_time", { valueAsNumber: true })}
                    ref={(e) => {
                      if (e) estimatedTimeRef.current = e as HTMLInputElement;
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{dictionary.task_dialog?.description}</Label>
              <Controller
                control={control}
                name="description"
                render={({ field }) => (
                  <Suspense fallback={<div className="h-[150px] border border-input rounded-md p-3 animate-pulse bg-muted" />}>
                    <RichTextEditor
                      content={field.value || ""}
                      onChange={(html, length) => {
                        field.onChange(html);
                        if (length !== undefined) {
                          setDescriptionLength(length);
                        }
                      }}
                      placeholder={dictionary.task_dialog?.task_details}
                      maxLength={MAX_DESCRIPTION_LENGTH}
                      readOnly={fieldsDisabled}
                      onKeyDown={handleKeyDown as (e: KeyboardEvent) => void}
                    />
                  </Suspense>
                )}
              />
              <p className="text-xs text-muted-foreground text-right">
                {MAX_DESCRIPTION_LENGTH - descriptionLength} /{" "}
                {MAX_DESCRIPTION_LENGTH}
              </p>
            </div>

            {task && (
              <div className="flex items-center space-x-2 pt-2">
                <Controller
                  control={control}
                  name="is_completed"
                  render={({ field }) => (
                    <Checkbox
                      id="is_completed"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={fieldsDisabled}
                    />
                  )}
                />
                <Label
                  htmlFor="is_completed"
                  className={cn(
                    "text-sm font-normal cursor-pointer",
                    fieldsDisabled && "opacity-70 cursor-not-allowed"
                  )}
                >
                  {dictionary.task_dialog?.mark_as_completed}
                </Label>
              </div>
            )}
          </form>
        </div>

        <div className="border-t pt-4 mt-4 shrink-0">
          <div className="flex justify-between">
            {task && onDelete && (
              <>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => setIsDeleteConfirmOpen(true)}
                >
                  <Trash className="h-4 w-4 mr-2" />
                  {dictionary.task_dialog?.delete}
                </Button>
                <Dialog
                  open={isDeleteConfirmOpen}
                  onOpenChange={setIsDeleteConfirmOpen}
                >
                  <DialogContent
                    className="max-w-md"
                    onKeyDown={handleDeleteConfirmKeyDown}
                    onOpenAutoFocus={(e) => {
                      e.preventDefault();
                      deleteConfirmButtonRef.current?.focus();
                    }}
                  >
                    <DialogHeader>
                      <DialogTitle>
                        {dictionary.task_dialog?.delete}
                      </DialogTitle>
                      <DialogDescription>
                        {dictionary.task_dialog?.delete_confirm}
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsDeleteConfirmOpen(false)}
                      >
                        {dictionary.task_dialog?.cancel || "Cancel"}
                      </Button>
                      <Button
                        ref={deleteConfirmButtonRef}
                        type="button"
                        variant="destructive"
                        onClick={handleDeleteConfirm}
                      >
                        {dictionary.task_dialog?.delete}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </>
            )}
            <div className="flex gap-2 ml-auto">
              <Button
                type="submit"
                form="task-form"
                disabled={isSubmitDisabled}
              >
                {task
                  ? dictionary.task_dialog?.save_changes
                  : dictionary.task_dialog?.create_task}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
