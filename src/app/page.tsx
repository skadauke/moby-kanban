"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Task, Status } from "@/lib/types";
import { fetchTasks, updateTask, deleteTask, toggleTaskFlag } from "@/lib/api-client";
import { Header, FilterType } from "@/components/Header";
import { Board } from "@/components/Board";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { ProjectSidebar } from "@/components/ProjectSidebar";
import { KanbanDndProvider } from "@/components/KanbanDndContext";

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  
  const previousTasksRef = useRef<Task[]>([]);
  const loadRequestIdRef = useRef(0);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string, isError = true) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToast(message);
    toastTimeoutRef.current = setTimeout(() => setToast(null), 3000);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  const loadTasks = useCallback(async (isRefresh = false) => {
    const requestId = ++loadRequestIdRef.current;
    try {
      if (isRefresh) setIsRefreshing(true);
      setError(null);
      const data = await fetchTasks();
      if (requestId !== loadRequestIdRef.current) return;
      setTasks(data);
      previousTasksRef.current = data;
    } catch (err) {
      if (requestId !== loadRequestIdRef.current) return;
      if (!isRefresh) {
        setError("Failed to load tasks. Please try again.");
      } else {
        showToast("Failed to refresh tasks");
      }
      console.error(err);
    } finally {
      if (requestId === loadRequestIdRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [showToast]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const filteredTasks = useMemo(() => {
    const result = selectedProjectId
      ? tasks.filter((t) => t.projectId === selectedProjectId)
      : tasks;
    
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

  // Handle task status/position change (drag to column or task)
  const handleTaskStatusChange = async (taskId: string, newStatus: Status, newPosition: number) => {
    const oldTasks = previousTasksRef.current;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // Optimistically update
    setTasks((prev) => {
      const withoutTask = prev.filter(t => t.id !== taskId);
      const columnTasks = withoutTask
        .filter(t => t.status === newStatus)
        .sort((a, b) => a.position - b.position);
      
      // Insert at position
      columnTasks.splice(newPosition, 0, { ...task, status: newStatus });
      
      // Reindex column
      const reindexed = columnTasks.map((t, i) => ({ ...t, position: i, updatedAt: new Date() }));
      
      // Rebuild task list
      const otherTasks = withoutTask.filter(t => t.status !== newStatus);
      const newTasks = [...otherTasks, ...reindexed];
      previousTasksRef.current = newTasks;
      return newTasks;
    });

    try {
      await updateTask(taskId, { status: newStatus, position: newPosition });
    } catch (err) {
      console.error("Failed to update task:", err);
      setTasks(oldTasks);
      previousTasksRef.current = oldTasks;
      showToast(`Failed to move "${task.title}"`);
    }
  };

  // Handle task reorder within same column
  const handleTaskReorder = async (taskId: string, newPosition: number) => {
    const oldTasks = previousTasksRef.current;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // Optimistically update
    setTasks((prev) => {
      const columnTasks = prev
        .filter(t => t.status === task.status)
        .sort((a, b) => a.position - b.position);
      
      const oldIndex = columnTasks.findIndex(t => t.id === taskId);
      if (oldIndex === -1) return prev;
      
      // Remove and reinsert
      const [removed] = columnTasks.splice(oldIndex, 1);
      columnTasks.splice(newPosition, 0, removed);
      
      // Reindex
      const reindexed = columnTasks.map((t, i) => ({ ...t, position: i, updatedAt: new Date() }));
      
      // Rebuild task list
      const otherTasks = prev.filter(t => t.status !== task.status);
      const newTasks = [...otherTasks, ...reindexed];
      previousTasksRef.current = newTasks;
      return newTasks;
    });

    try {
      await updateTask(taskId, { position: newPosition });
    } catch (err) {
      console.error("Failed to reorder task:", err);
      setTasks(oldTasks);
      previousTasksRef.current = oldTasks;
      showToast(`Failed to reorder "${task.title}"`);
    }
  };

  // Handle task project change (drag to sidebar project)
  const handleTaskProjectChange = async (taskId: string, projectId: string | null) => {
    const oldTasks = previousTasksRef.current;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // Optimistically update
    setTasks((prev) => {
      const newTasks = prev.map(t => 
        t.id === taskId ? { ...t, projectId, updatedAt: new Date() } : t
      );
      previousTasksRef.current = newTasks;
      return newTasks;
    });

    try {
      await updateTask(taskId, { projectId });
      showToast(`Moved to ${projectId ? "project" : "No Project"}`);
    } catch (err) {
      console.error("Failed to change project:", err);
      setTasks(oldTasks);
      previousTasksRef.current = oldTasks;
      showToast(`Failed to move "${task.title}"`);
    }
  };

  const handleTasksChange = async (updatedTasks: Task[]) => {
    const oldTasks = previousTasksRef.current;
    const updatedMap = new Map(updatedTasks.map((t) => [t.id, t]));
    const mergedTasks = oldTasks.map(t => updatedMap.get(t.id) ?? t);
    
    setTasks(mergedTasks);
    
    const oldTaskMap = new Map(oldTasks.map((t) => [t.id, t]));
    const errors: string[] = [];
    
    for (const task of updatedTasks) {
      const oldTask = oldTaskMap.get(task.id);
      if (oldTask) {
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
      setTasks(oldTasks);
      showToast(`Failed to move: ${errors.join(", ")}`);
      await loadTasks(true);
    } else {
      previousTasksRef.current = mergedTasks;
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    const oldTasks = previousTasksRef.current;
    const taskToDelete = tasks.find(t => t.id === taskId);
    
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    
    try {
      await deleteTask(taskId);
      previousTasksRef.current = previousTasksRef.current.filter((t) => t.id !== taskId);
    } catch (err) {
      console.error("Failed to delete task:", err);
      setTasks(oldTasks);
      showToast(`Failed to delete "${taskToDelete?.title || "task"}"`);
    }
  };

  const handleToggleFlag = async (taskId: string) => {
    const oldTasks = previousTasksRef.current;
    const task = tasks.find(t => t.id === taskId);
    
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, needsReview: !t.needsReview, updatedAt: new Date() } : t
      )
    );
    
    try {
      const updated = await toggleTaskFlag(taskId);
      setTasks((prev) => {
        const newTasks = prev.map((t) => (t.id === taskId ? updated : t));
        previousTasksRef.current = newTasks;
        return newTasks;
      });
    } catch (err) {
      console.error("Failed to toggle flag:", err);
      setTasks(oldTasks);
      showToast(`Failed to ${task?.needsReview ? "clear" : "set"} flag`);
    }
  };

  const handleTaskUpdated = async (task: Task) => {
    const oldTasks = previousTasksRef.current;
    
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
      setTasks((prev) => {
        const newTasks = prev.map((t) => (t.id === task.id ? updated : t));
        previousTasksRef.current = newTasks;
        return newTasks;
      });
    } catch (err) {
      console.error("Failed to update task:", err);
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
      <KanbanDndProvider
        tasks={tasks}
        onTaskStatusChange={handleTaskStatusChange}
        onTaskProjectChange={handleTaskProjectChange}
        onTaskReorder={handleTaskReorder}
      >
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
          
          {toast && (
            <div className="fixed bottom-4 right-4 bg-zinc-800 text-white px-4 py-2 rounded-md shadow-lg animate-in fade-in slide-in-from-bottom-2 border border-zinc-700">
              {toast}
            </div>
          )}
        </div>
      </KanbanDndProvider>
    </ErrorBoundary>
  );
}
