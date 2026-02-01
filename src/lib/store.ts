import { Task, Status, Priority, Creator } from "./types";

// Client-side storage for demo (Vercel doesn't support SQLite)
const STORAGE_KEY = "moby-kanban-tasks";

// Generate a simple ID
function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

// Sample tasks for demo
const sampleTasks: Task[] = [
  {
    id: generateId(),
    title: "Build Kanban board MVP",
    description: "Create a beautiful drag-and-drop Kanban board",
    status: "DONE",
    priority: "HIGH",
    creator: "MOBY",
    needsReview: false,
    position: 0,
    projectId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: generateId(),
    title: "Add Vercel deployment",
    description: "Deploy to Vercel for easy preview",
    status: "IN_PROGRESS",
    priority: "HIGH",
    creator: "MOBY",
    needsReview: true,
    position: 0,
    projectId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: generateId(),
    title: "Set up proper database",
    description: "Use Vercel Postgres or Turso for persistence",
    status: "BACKLOG",
    priority: "MEDIUM",
    creator: "STEPHAN",
    needsReview: false,
    position: 0,
    projectId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: generateId(),
    title: "Add keyboard shortcuts",
    description: "Quick actions with keyboard",
    status: "BACKLOG",
    priority: "LOW",
    creator: "MOBY",
    needsReview: false,
    position: 1,
    projectId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export function getStoredTasks(): Task[] {
  if (typeof window === "undefined") return sampleTasks;
  
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sampleTasks));
    return sampleTasks;
  }
  
  try {
    const tasks = JSON.parse(stored);
    return tasks.map((t: Task) => ({
      ...t,
      createdAt: new Date(t.createdAt),
      updatedAt: new Date(t.updatedAt),
    }));
  } catch {
    return sampleTasks;
  }
}

export function saveTasks(tasks: Task[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

export function createTaskLocal(data: {
  title: string;
  description?: string;
  priority?: Priority;
  creator?: Creator;
}): Task {
  return {
    id: generateId(),
    title: data.title,
    description: data.description || null,
    status: "BACKLOG",
    priority: data.priority || "MEDIUM",
    creator: data.creator || "MOBY",
    needsReview: false,
    position: 0,
    projectId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}
