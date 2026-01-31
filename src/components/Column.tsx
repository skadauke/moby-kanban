"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Task, Status } from "@/lib/types";
import { TaskCard } from "./TaskCard";

interface ColumnProps {
  id: Status;
  title: string;
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onToggleFlag: (taskId: string) => void;
}

export function Column({ id, title, tasks, onEditTask, onDeleteTask, onToggleFlag }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  const columnColors: Record<Status, string> = {
    BACKLOG: "border-zinc-600",
    IN_PROGRESS: "border-blue-600",
    DONE: "border-green-600",
  };

  return (
    <div
      className={`flex flex-col bg-zinc-950 rounded-lg border-t-4 ${columnColors[id]} min-h-[500px]`}
    >
      <div className="p-4 border-b border-zinc-800">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-zinc-100">{title}</h2>
          <span className="text-sm text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded-full">
            {tasks.length}
          </span>
        </div>
      </div>
      <div
        ref={setNodeRef}
        className={`flex-1 p-2 space-y-2 transition-colors ${
          isOver ? "bg-zinc-900/50" : ""
        }`}
      >
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <TaskCard 
              key={task.id} 
              task={task} 
              onEdit={onEditTask}
              onDelete={onDeleteTask}
              onToggleFlag={onToggleFlag}
            />
          ))}
        </SortableContext>
        {tasks.length === 0 && (
          <div className="text-center py-8 text-zinc-600 text-sm">
            Drop tasks here
          </div>
        )}
      </div>
    </div>
  );
}
