"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon, Clock, Trash, Undo } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { Task } from "@/types/task"; // Assuming you update Task type to match DB
import { ScrollArea } from "@/components/ui/scroll-area";

// Schema matching your DB requirements
const taskSchema = z.object({
  title: z.string().min(1, "Title is required").max(150),
  description: z.string().max(1500).optional(),
  due_date: z.date().optional(),
  estimated_time: z.number().min(0).optional(),
  is_completed: z.boolean().optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task; // If provided, edit mode
  onSave: (data: TaskFormData) => Promise<void>;
  onDelete?: () => Promise<void>;
  onRestore?: (version: any) => Promise<void>;
  versions?: any[]; // Array of task versions
}

export function TaskDialog({
  open,
  onOpenChange,
  task,
  onSave,
  onDelete,
  onRestore,
  versions = [],
}: TaskDialogProps) {
  const [activeTab, setActiveTab] = useState("details");

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: task?.title || "",
      description: task?.description || "",
      due_date: task?.due_date ? new Date(task.due_date) : undefined,
      estimated_time: task?.estimated_time || 0,
      is_completed: task?.is_completed || false,
    },
  });

  // Reset form when task changes or dialog opens
  useEffect(() => {
    if (open) {
      reset({
        title: task?.title || "",
        description: task?.description || "",
        due_date: task?.due_date ? new Date(task.due_date) : undefined,
        estimated_time: task?.estimated_time || 0,
        is_completed: task?.is_completed || false,
      });
    }
  }, [task, open, reset]);

  const onSubmit = async (data: TaskFormData) => {
    await onSave(data);
    onOpenChange(false);
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {task ? `Edit Task: ${task.id}` : "Create New Task"}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            {task && <TabsTrigger value="history">History ({versions.length})</TabsTrigger>}
          </TabsList>

          <TabsContent value="details" className="flex-1 overflow-y-auto p-1">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <div className="flex items-center gap-3">
                  <Controller
                    control={control}
                    name="is_completed"
                    render={({ field }) => (
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        aria-label="Mark as completed"
                      />
                    )}
                  />
                  <Input 
                    id="title" 
                    {...register("title")} 
                    placeholder="Task title"
                    autoFocus 
                    className="flex-1"
                  />
                </div>
                {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Controller
                    control={control}
                    name="due_date"
                    render={({ field }) => (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estimated_time">Estimated Time (min)</Label>
                  <div className="relative">
                    <Clock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="estimated_time"
                      type="number"
                      className="pl-9"
                      {...register("estimated_time", { valueAsNumber: true })}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Controller
                  control={control}
                  name="description"
                  render={({ field }) => (
                    <RichTextEditor
                      content={field.value || ""}
                      onChange={field.onChange}
                      placeholder="Task details..."
                    />
                  )}
                />
              </div>

              <div className="flex justify-between pt-4">
                {task && onDelete && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={async () => {
                      if (confirm("Are you sure you want to delete this task?")) {
                        await onDelete();
                        onOpenChange(false);
                      }
                    }}
                  >
                    <Trash className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                )}
                <div className="flex gap-2 ml-auto">
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {task ? "Save Changes" : "Create Task"}
                  </Button>
                </div>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="history" className="flex-1 overflow-hidden flex flex-col">
            <ScrollArea className="flex-1 h-[400px]">
              <div className="space-y-4 p-1">
                {versions.map((version, index) => {
                  const snapshot = version.snapshot;
                  return (
                    <div key={version.id} className="border rounded-md p-3 flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium">
                          {format(new Date(version.created_at), "PPP p")}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Title: {snapshot.title}
                        </p>
                        <div className="text-xs text-muted-foreground mt-1 line-clamp-2" dangerouslySetInnerHTML={{ __html: snapshot.description || "No description" }} />
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRestore?.(version)}
                        title="Restore this version"
                      >
                        <Undo className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
                {versions.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No history available.</p>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
