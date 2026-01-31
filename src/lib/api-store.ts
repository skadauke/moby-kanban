import { Task, Status, Priority, Creator } from "./types";
import { prisma } from "./db";

// API store using Prisma/SQLite for server-side operations
// Note: SQLite file won't persist on Vercel serverless, but works in dev

export async function getAllTasks(): Promise<Task[]> {
  try {
    const tasks = await prisma.task.findMany({
      orderBy: [{ status: "asc" }, { position: "asc" }],
    });
    return tasks as Task[];
  } catch {
    // Fallback if DB not available
    return [];
  }
}

export async function getTaskById(id: string): Promise<Task | null> {
  try {
    const task = await prisma.task.findUnique({ where: { id } });
    return task as Task | null;
  } catch {
    return null;
  }
}

export async function createTask(data: {
  title: string;
  description?: string;
  priority?: Priority;
  creator?: Creator;
}): Promise<Task> {
  const maxPos = await prisma.task.aggregate({
    where: { status: "BACKLOG" },
    _max: { position: true },
  });

  const task = await prisma.task.create({
    data: {
      title: data.title,
      description: data.description || null,
      priority: data.priority || "MEDIUM",
      creator: data.creator || "MOBY",
      position: (maxPos._max.position ?? -1) + 1,
    },
  });

  return task as Task;
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
  }>
): Promise<Task | null> {
  try {
    const task = await prisma.task.update({
      where: { id },
      data,
    });
    return task as Task;
  } catch {
    return null;
  }
}

export async function deleteTask(id: string): Promise<boolean> {
  try {
    await prisma.task.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}

export async function toggleTaskFlag(id: string): Promise<Task | null> {
  try {
    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) return null;

    const updated = await prisma.task.update({
      where: { id },
      data: { needsReview: !task.needsReview },
    });
    return updated as Task;
  } catch {
    return null;
  }
}
