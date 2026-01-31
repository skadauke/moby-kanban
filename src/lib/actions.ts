"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "./db";
import type { Status, Priority, Creator, Task } from "./types";

export async function getTasks(): Promise<Task[]> {
  const tasks = await prisma.task.findMany({
    orderBy: [{ status: "asc" }, { position: "asc" }, { createdAt: "desc" }],
  });
  return tasks as Task[];
}

export async function createTask(data: {
  title: string;
  description?: string;
  priority?: Priority;
  creator?: Creator;
}): Promise<Task> {
  const maxPosition = await prisma.task.aggregate({
    where: { status: "BACKLOG" },
    _max: { position: true },
  });

  const task = await prisma.task.create({
    data: {
      title: data.title,
      description: data.description || null,
      priority: data.priority || "MEDIUM",
      creator: data.creator || "MOBY",
      position: (maxPosition._max.position ?? -1) + 1,
    },
  });

  revalidatePath("/");
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
): Promise<Task> {
  const task = await prisma.task.update({
    where: { id },
    data,
  });

  revalidatePath("/");
  return task as Task;
}

export async function deleteTask(id: string): Promise<void> {
  await prisma.task.delete({ where: { id } });
  revalidatePath("/");
}

export async function moveTask(
  taskId: string,
  newStatus: Status,
  newPosition: number
): Promise<void> {
  // Get current task
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) return;

  // Update positions of other tasks in the destination column
  await prisma.task.updateMany({
    where: {
      status: newStatus,
      position: { gte: newPosition },
      id: { not: taskId },
    },
    data: { position: { increment: 1 } },
  });

  // Move the task
  await prisma.task.update({
    where: { id: taskId },
    data: { status: newStatus, position: newPosition },
  });

  revalidatePath("/");
}

export async function toggleReviewFlag(id: string): Promise<Task> {
  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) throw new Error("Task not found");

  const updated = await prisma.task.update({
    where: { id },
    data: { needsReview: !task.needsReview },
  });

  revalidatePath("/");
  return updated as Task;
}
