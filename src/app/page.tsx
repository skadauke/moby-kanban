"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  
  // Keep a ref to previous tasks for rollback
  const previousTasksRef = useRef<Task[]>([]);

  // Show temporary toast message
  const showToast = useCallback((message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Fetch tasks from API
  const loadTasks = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setIsRefreshing(true);
      setError(null);
      const data = await fetchTasks();
      setTasks(data);
      previousTasksRef.current = data;
    } catch (err) {
      if (!isRefresh) {
        setError("Failed to load tasks. Please try again.");
      } else {
        showToast("Failed to refresh tasks");
      }
      console.error(err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const filteredTasks = useMemo(() => {
    // First filter by project
    const result = selectedProjectId
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
    setTasks((prev) => {
      const newTasks = [...prev, task];
      previousTasksRef.current = newTasks;
      return newTasks;
    });
  };

  const handleTasksChange = async (updatedTasks: Task[]) => {
    // Optimistically update UI
    const oldTasks = previousTasksRef.current;
    setTasks(updatedTasks);
    
    // Find what changed and sync with API
    const oldTaskMap = new Map(oldTasks.map((t) => [t.id, t]));
    const errors: string[] = [];
    
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
            errors.push(task.title);
          }
        }
      }
    }
    
    if (errors.length > 0) {
      // Rollback on failure
      setTasks(oldTasks);
      showToast(`Failed to move: ${errors.join(", ")}`);
    } else {
      // Success - update ref
      previousTasksRef.current = updatedTasks;
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    const oldTasks = previousTasksRef.current;
    const taskToDelete = tasks.find(t => t.id === taskId);
    
    // Optimistically update UI
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    
    try {
      await deleteTask(taskId);
      // Success - update ref
      previousTasksRef.current = previousTasksRef.current.filter((t) => t.id !== taskId);
    } catch (err) {
      console.error("Failed to delete task:", err);
      // Rollback on failure
      setTasks(oldTasks);
      showToast(`Failed to delete "${taskToDelete?.title || "task"}"`);
    }
  };

  const handleToggleFlag = async (taskId: string) => {
    const oldTasks = previousTasksRef.current;
    const task = tasks.find(t => t.id === taskId);
    
    // Optimistically update UI
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, needsReview: !t.needsReview, updatedAt: new Date() } : t
      )
    );
    
    try {
      const updated = await toggleTaskFlag(taskId);
      // Success - update with server response and ref
      setTasks((prev) => {
        const newTasks = prev.map((t) => (t.id === taskId ? updated : t));
        previousTasksRef.current = newTasks;
        return newTasks;
      });
    } catch (err) {
      console.error("Failed to toggle flag:", err);
      // Rollback on failure
      setTasks(oldTasks);
      showToast(`Failed to ${task?.needsReview ? "clear" : "set"} flag`);
    }
  };

  const handleTaskUpdated = async (task: Task) => {
    const oldTasks = previousTasksRef.current;
    
    // Optimistically update UI
    setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));
    
    try {
      const updated = await updateTask(task.id, {
        title: task.title,
        description: task.description,
        priority: task.priority,
        creator: task.creator,
        needsReview: task.needsReview,
        projectId: task.projectId,
      });
      // Success - update with server response and ref
      setTasks((prev) => {
        const newTasks = prev.map((t) => (t.id === task.id ? updated : t));
        previousTasksRef.current = newTasks;
        return newTasks;
      });
    } catch (err) {
      console.error("Failed to update task:", err);
      // Rollback on failure
      setTasks(oldTasks);
      showToast(`Failed to update "${task.title}"`);
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
            onClick={() => loadTasks()}
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
            onRefresh={() => loadTasks(true)}
            isRefreshing={isRefreshing}
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
        
        {/* Toast notification */}
        {toast && (
          <div className="fixed bottom-4 right-4 bg-red-600 text-white px-4 py-2 rounded-md shadow-lg animate-in fade-in slide-in-from-bottom-2">
            {toast}
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
