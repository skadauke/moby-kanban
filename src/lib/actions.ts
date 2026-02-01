"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "./supabase/server";
import type { Status, Priority, Creator, Task } from "./types";

export async function getTasks(): Promise<Task[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .order("status", { ascending: true })
      .order("position", { ascending: true });

    if (error) {
      console.error("Error fetching tasks:", error);
      return [];
    }

    return (data || []).map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      status: row.status as Status,
      priority: row.priority as Priority,
      creator: row.creator as Creator,
      needsReview: row.needs_review,
      position: row.position,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }));
  } catch (err) {
    console.error("Error in getTasks:", err);
    return [];
  }
}

export async function createTask(data: {
  title: string;
  description?: string;
  priority?: Priority;
  creator?: Creator;
}): Promise<Task> {
  const supabase = await createClient();

  // Get max position for BACKLOG
  const { data: maxPosData } = await supabase
    .from("tasks")
    .select("position")
    .eq("status", "BACKLOG")
    .order("position", { ascending: false })
    .limit(1);

  const maxPos = maxPosData?.[0]?.position ?? -1;

  const { data: newTask, error } = await supabase
    .from("tasks")
    .insert({
      title: data.title,
      description: data.description || null,
      status: "BACKLOG",
      priority: data.priority || "MEDIUM",
      creator: data.creator || "MOBY",
      needs_review: false,
      position: maxPos + 1,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create task: ${error.message}`);
  }

  revalidatePath("/");

  return {
    id: newTask.id,
    title: newTask.title,
    description: newTask.description,
    status: newTask.status as Status,
    priority: newTask.priority as Priority,
    creator: newTask.creator as Creator,
    needsReview: newTask.needs_review,
    position: newTask.position,
    createdAt: new Date(newTask.created_at),
    updatedAt: new Date(newTask.updated_at),
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
  }>
): Promise<Task | null> {
  const supabase = await createClient();

  // Map camelCase to snake_case
  const updates: Record<string, unknown> = {};
  if (data.title !== undefined) updates.title = data.title;
  if (data.description !== undefined) updates.description = data.description;
  if (data.status !== undefined) updates.status = data.status;
  if (data.priority !== undefined) updates.priority = data.priority;
  if (data.creator !== undefined) updates.creator = data.creator;
  if (data.needsReview !== undefined) updates.needs_review = data.needsReview;
  if (data.position !== undefined) updates.position = data.position;

  if (Object.keys(updates).length === 0) return null;

  updates.updated_at = new Date().toISOString();

  const { data: updated, error } = await supabase
    .from("tasks")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating task:", error);
    return null;
  }

  revalidatePath("/");

  return {
    id: updated.id,
    title: updated.title,
    description: updated.description,
    status: updated.status as Status,
    priority: updated.priority as Priority,
    creator: updated.creator as Creator,
    needsReview: updated.needs_review,
    position: updated.position,
    createdAt: new Date(updated.created_at),
    updatedAt: new Date(updated.updated_at),
  };
}

export async function deleteTask(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("tasks").delete().eq("id", id);

  if (error) {
    throw new Error(`Failed to delete task: ${error.message}`);
  }

  revalidatePath("/");
}

export async function moveTask(
  taskId: string,
  newStatus: Status,
  newPosition: number
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("tasks")
    .update({
      status: newStatus,
      position: newPosition,
      updated_at: new Date().toISOString(),
    })
    .eq("id", taskId);

  if (error) {
    throw new Error(`Failed to move task: ${error.message}`);
  }

  revalidatePath("/");
}

export async function toggleReviewFlag(id: string): Promise<Task | null> {
  const supabase = await createClient();

  // Get current state
  const { data: current, error: fetchError } = await supabase
    .from("tasks")
    .select("needs_review")
    .eq("id", id)
    .single();

  if (fetchError || !current) return null;

  // Toggle
  const { data: updated, error } = await supabase
    .from("tasks")
    .update({
      needs_review: !current.needs_review,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error toggling review flag:", error);
    return null;
  }

  revalidatePath("/");

  return {
    id: updated.id,
    title: updated.title,
    description: updated.description,
    status: updated.status as Status,
    priority: updated.priority as Priority,
    creator: updated.creator as Creator,
    needsReview: updated.needs_review,
    position: updated.position,
    createdAt: new Date(updated.created_at),
    updatedAt: new Date(updated.updated_at),
  };
}
