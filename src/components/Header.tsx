"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { TaskModal } from "./TaskModal";
import { Task } from "@/lib/types";
import { Plus } from "lucide-react";

interface HeaderProps {
  onTaskCreated: (task: Task) => void;
}

export function Header({ onTaskCreated }: HeaderProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <header className="bg-zinc-950 border-b border-zinc-800 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🐋</span>
          <div>
            <h1 className="text-xl font-bold text-zinc-100">Moby Kanban</h1>
            <p className="text-xs text-zinc-500">AI-Human Project Tracker</p>
          </div>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Task
        </Button>
      </div>

      <TaskModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        task={null}
        onTaskUpdated={() => {}}
        onTaskCreated={(task) => {
          onTaskCreated(task);
          setIsModalOpen(false);
        }}
      />
    </header>
  );
}
