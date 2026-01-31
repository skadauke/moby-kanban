"use client";

import { useState, useEffect, useMemo } from "react";
import { Task } from "@/lib/types";
import { getStoredTasks, saveTasks } from "@/lib/store";
import { Header, FilterType } from "@/components/Header";
import { Board } from "@/components/Board";

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [filter, setFilter] = useState<FilterType>("all");

  useEffect(() => {
    setTasks(getStoredTasks());
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      saveTasks(tasks);
    }
  }, [tasks, isLoaded]);

  const filteredTasks = useMemo(() => {
    switch (filter) {
      case "flagged":
        return tasks.filter((t) => t.needsReview);
      case "moby":
        return tasks.filter((t) => t.creator === "MOBY");
      case "stephan":
        return tasks.filter((t) => t.creator === "STEPHAN");
      default:
        return tasks;
    }
  }, [tasks, filter]);

  const flaggedCount = useMemo(() => 
    tasks.filter((t) => t.needsReview).length, 
    [tasks]
  );

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
      <Header 
        onTaskCreated={handleTaskCreated}
        filter={filter}
        onFilterChange={setFilter}
        flaggedCount={flaggedCount}
      />
      <Board 
        initialTasks={filteredTasks} 
        onTasksChange={(newTasks) => {
          // Merge filtered changes back into full task list
          const taskMap = new Map(tasks.map(t => [t.id, t]));
          newTasks.forEach(t => taskMap.set(t.id, t));
          
          // Remove deleted tasks
          const newIds = new Set(newTasks.map(t => t.id));
          const filtered = filter !== "all";
          
          if (filtered) {
            // In filtered view, only update tasks that match filter
            setTasks(Array.from(taskMap.values()));
          } else {
            // In "all" view, newTasks is the complete set
            setTasks(newTasks);
          }
        }}
        key={`${filter}-${filteredTasks.length}`}
      />
    </main>
  );
}
