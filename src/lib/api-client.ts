import { Task, Status, Priority, Creator } from "./types";

const API_BASE = "/api/tasks";

export async function fetchTasks(): Promise<Task[]> {
  const res = await fetch(API_BASE, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch tasks");
  const data = await res.json();
  return data.map((t: Task) => ({
    ...t,
    createdAt: new Date(t.createdAt),
    updatedAt: new Date(t.updatedAt),
  }));
}

export async function createTask(data: {
  title: string;
  description?: string;
  priority?: Priority;
  creator?: Creator;
  projectId?: string;
}): Promise<Task> {
  const res = await fetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to create task");
  }
  const task = await res.json();
  return {
    ...task,
    createdAt: new Date(task.createdAt),
    updatedAt: new Date(task.updatedAt),
  };
}

export async function updateTask(
  id: string,
  data: Partial<{
    title: string;
    description: string | null;
    status: Status;
    priority: Priority;
    creator: Creator;
    needsReview: boolean;
    position: number;
    projectId: string | null;
  }>
): Promise<Task> {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update task");
  const task = await res.json();
  return {
    ...task,
    createdAt: new Date(task.createdAt),
    updatedAt: new Date(task.updatedAt),
  };
}

export async function deleteTask(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete task");
}

export async function toggleTaskFlag(id: string): Promise<Task> {
  const res = await fetch(`${API_BASE}/${id}/flag`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to toggle flag");
  const task = await res.json();
  return {
    ...task,
    createdAt: new Date(task.createdAt),
    updatedAt: new Date(task.updatedAt),
  };
}

export async function reorderTasks(
  taskIds: string[],
  status: Status
): Promise<Task[]> {
  const res = await fetch(`${API_BASE}/reorder`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ taskIds, status }),
  });
  if (!res.ok) throw new Error("Failed to reorder tasks");
  const data = await res.json();
  return data.tasks.map((t: Task) => ({
    ...t,
    createdAt: new Date(t.createdAt),
    updatedAt: new Date(t.updatedAt),
  }));
}
