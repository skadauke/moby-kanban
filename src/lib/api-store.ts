import { Task, Status, Priority, Creator } from "./types";
import { createAdminClient } from "./supabase/server";

// Database row type (matches Supabase table schema)
interface TaskRow {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  creator: string;
  needs_review: boolean;
  position: number;
  project_id: string | null;
  created_at: string;
  updated_at: string;
}

function rowToTask(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status as Status,
    priority: row.priority as Priority,
    creator: row.creator as Creator,
    needsReview: row.needs_review,
    position: row.position,
    projectId: row.project_id,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export async function getAllTasks(): Promise<Task[]> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .order("status", { ascending: true })
      .order("position", { ascending: true });

    if (error) {
      console.error("Failed to get tasks:", error);
      return [];
    }

    return (data || []).map((row: TaskRow) => rowToTask(row));
  } catch (error) {
    console.error("Failed to get tasks:", error);
    return [];
  }
}

export async function getTaskById(id: string): Promise<Task | null> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) return null;

    return rowToTask(data as TaskRow);
  } catch (error) {
    console.error("Failed to get task:", error);
    return null;
  }
}

export async function createTask(data: {
  title: string;
  description?: string;
  priority?: Priority;
  creator?: Creator;
  projectId?: string;
}): Promise<Task> {
  const supabase = createAdminClient();

  // Get max position
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
      project_id: data.projectId || null,
    })
    .select()
    .single();

  if (error) {
    const errMsg = error.message || "Unknown database error";
    const errCode = error.code || "UNKNOWN";
    throw new Error(`Database error (${errCode}): ${errMsg}`);
  }
  if (!newTask) {
    throw new Error("Task created but no data returned");
  }

  return rowToTask(newTask as TaskRow);
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
): Promise<Task | null> {
  try {
    const supabase = createAdminClient();

    const updates: Record<string, unknown> = {};
    if (data.title !== undefined) updates.title = data.title;
    if (data.description !== undefined) updates.description = data.description;
    if (data.status !== undefined) updates.status = data.status;
    if (data.priority !== undefined) updates.priority = data.priority;
    if (data.creator !== undefined) updates.creator = data.creator;
    if (data.needsReview !== undefined) updates.needs_review = data.needsReview;
    if (data.position !== undefined) updates.position = data.position;
    if (data.projectId !== undefined) updates.project_id = data.projectId;

    if (Object.keys(updates).length === 0) return getTaskById(id);

    updates.updated_at = new Date().toISOString();

    const { data: updated, error } = await supabase
      .from("tasks")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error || !updated) return null;

    return rowToTask(updated as TaskRow);
  } catch (error) {
    console.error("Failed to update task:", error);
    return null;
  }
}

export async function deleteTask(id: string): Promise<boolean> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    return !error;
  } catch (error) {
    console.error("Failed to delete task:", error);
    return false;
  }
}

export async function toggleTaskFlag(id: string): Promise<Task | null> {
  try {
    const task = await getTaskById(id);
    if (!task) return null;

    const supabase = createAdminClient();
    const { data: updated, error } = await supabase
      .from("tasks")
      .update({
        needs_review: !task.needsReview,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error || !updated) return null;

    return rowToTask(updated as TaskRow);
  } catch (error) {
    console.error("Failed to toggle flag:", error);
    return null;
  }
}
