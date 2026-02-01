"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Task } from "@/lib/types";
import { fetchTasks, updateTask, deleteTask, toggleTaskFlag } from "@/lib/api-client";
import { Header, FilterType } from "@/components/Header";
import { Board } from "@/components/Board";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { ProjectSidebar } from "@/components/ProjectSidebar";

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Fetch tasks from API
  const loadTasks = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchTasks();
      setTasks(data);
    } catch (err) {
      setError("Failed to load tasks. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const filteredTasks = useMemo(() => {
    // First filter by project
    let result = selectedProjectId
      ? tasks.filter((t) => t.projectId === selectedProjectId)
      : tasks;
    
    // Then apply creator/flag filters
    switch (filter) {
      case "flagged":
        return result.filter((t) => t.needsReview);
      case "moby":
        return result.filter((t) => t.creator === "MOBY");
      case "stephan":
        return result.filter((t) => t.creator === "STEPHAN");
      default:
        return result;
    }
  }, [tasks, filter, selectedProjectId]);

  const flaggedCount = useMemo(
    () => tasks.filter((t) => t.needsReview).length,
    [tasks]
  );

  const handleTaskCreated = (task: Task) => {
    setTasks((prev) => [...prev, task]);
  };

  const handleTasksChange = async (updatedTasks: Task[]) => {
    // Find what changed and sync with API
    const oldTaskMap = new Map(tasks.map((t) => [t.id, t]));
    
    for (const task of updatedTasks) {
      const oldTask = oldTaskMap.get(task.id);
      if (oldTask) {
        // Check if status or position changed (drag-drop)
        if (oldTask.status !== task.status || oldTask.position !== task.position) {
          try {
            await updateTask(task.id, {
              status: task.status,
              position: task.position,
            });
          } catch (err) {
            console.error("Failed to update task:", err);
          }
        }
      }
    }
    
    setTasks(updatedTasks);
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTask(taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch (err) {
      console.error("Failed to delete task:", err);
    }
  };

  const handleToggleFlag = async (taskId: string) => {
    try {
      const updated = await toggleTaskFlag(taskId);
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
    } catch (err) {
      console.error("Failed to toggle flag:", err);
    }
  };

  const handleTaskUpdated = async (task: Task) => {
    try {
      const updated = await updateTask(task.id, {
        title: task.title,
        description: task.description,
        priority: task.priority,
        creator: task.creator,
        needsReview: task.needsReview,
      });
      setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
    } catch (err) {
      console.error("Failed to update task:", err);
    }
  };

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <main className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={loadTasks}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-md text-zinc-100"
          >
            Retry
          </button>
        </div>
      </main>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-zinc-900 flex">
        <ProjectSidebar
          selectedProjectId={selectedProjectId}
          onSelectProject={setSelectedProjectId}
        />
        <main className="flex-1 flex flex-col min-h-screen">
          <Header
            onTaskCreated={handleTaskCreated}
            filter={filter}
            onFilterChange={setFilter}
            flaggedCount={flaggedCount}
            onRefresh={loadTasks}
            isRefreshing={isLoading}
            selectedProjectId={selectedProjectId}
          />
          <Board
            initialTasks={filteredTasks}
            onTasksChange={handleTasksChange}
            onDeleteTask={handleDeleteTask}
            onToggleFlag={handleToggleFlag}
            onTaskUpdated={handleTaskUpdated}
            key={`${filter}-${selectedProjectId}-${tasks.length}`}
          />
        </main>
      </div>
    </ErrorBoundary>
  );
}
