"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Task, PRIORITIES, CREATORS } from "@/lib/types";
import { MoreHorizontal, Flag, Trash2, Pencil } from "lucide-react";

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onToggleFlag: (taskId: string) => void;
}

export function TaskCard({ task, onEdit, onDelete, onToggleFlag }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const priority = PRIORITIES.find((p) => p.value === task.priority);
  const creator = CREATORS.find((c) => c.value === task.creator);

  const handleDelete = () => {
    if (confirm("Delete this task?")) {
      onDelete(task.id);
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't open modal if clicking on dropdown or dragging
    const target = e.target as HTMLElement;
    if (target.closest('[data-dropdown]') || target.closest('button')) return;
    onEdit(task);
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={handleCardClick}
      className={`cursor-grab active:cursor-grabbing bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-all hover:scale-[1.02] ${
        task.needsReview ? "ring-2 ring-amber-500/50" : ""
      }`}
    >
      <CardHeader className="p-3 pb-1 flex flex-row items-start justify-between space-y-0">
        <div className="flex items-center gap-2">
          <span className="text-lg">{creator?.emoji}</span>
          {task.needsReview && (
            <Flag className="h-4 w-4 text-amber-500 fill-amber-500" />
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800">
            <DropdownMenuItem onClick={() => onEdit(task)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onToggleFlag(task.id)}>
              <Flag className="mr-2 h-4 w-4" />
              {task.needsReview ? "Clear Flag" : "Flag for Review"}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleDelete}
              className="text-red-500 focus:text-red-500"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="p-3 pt-1">
        <h3 className="font-medium text-sm mb-1">{task.title}</h3>
        {task.description && (
          <p className="text-xs text-zinc-400 line-clamp-2 mb-2">
            {task.description}
          </p>
        )}
        <div className="flex items-center gap-2">
          <Badge
            variant="secondary"
            className={`${priority?.color} text-white text-xs px-2 py-0`}
          >
            {priority?.label}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
