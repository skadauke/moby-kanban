"use client";

import { useState, useEffect } from "react";
import { Task } from "@/lib/types";
import { getStoredTasks, saveTasks, createTaskLocal } from "@/lib/store";
import { Header } from "@/components/Header";
import { Board } from "@/components/Board";

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setTasks(getStoredTasks());
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      saveTasks(tasks);
    }
  }, [tasks, isLoaded]);

  const handleTaskCreated = (task: Task) => {
    setTasks((prev) => [...prev, task]);
  };

  if (!isLoaded) {
    return (
      <main className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <div className="text-zinc-400">Loading...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-900">
      <Header onTaskCreated={handleTaskCreated} />
      <Board 
        initialTasks={tasks} 
        onTasksChange={setTasks}
      />
    </main>
  );
}
