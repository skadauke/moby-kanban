import { Task, Status, Priority, Creator } from "./types";
import { db } from "./db";

// Generate a simple ID
function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export async function getAllTasks(): Promise<Task[]> {
  try {
    const result = await db.execute("SELECT * FROM Task ORDER BY status ASC, position ASC");
    return result.rows.map((row) => ({
      id: row.id as string,
      title: row.title as string,
      description: row.description as string | null,
      status: row.status as Status,
      priority: row.priority as Priority,
      creator: row.creator as Creator,
      needsReview: Boolean(row.needsReview),
      position: row.position as number,
      createdAt: new Date(row.createdAt as string),
      updatedAt: new Date(row.updatedAt as string),
    }));
  } catch (error) {
    console.error("Failed to get tasks:", error);
    return [];
  }
}

export async function getTaskById(id: string): Promise<Task | null> {
  try {
    const result = await db.execute({
      sql: "SELECT * FROM Task WHERE id = ?",
      args: [id],
    });
    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return {
      id: row.id as string,
      title: row.title as string,
      description: row.description as string | null,
      status: row.status as Status,
      priority: row.priority as Priority,
      creator: row.creator as Creator,
      needsReview: Boolean(row.needsReview),
      position: row.position as number,
      createdAt: new Date(row.createdAt as string),
      updatedAt: new Date(row.updatedAt as string),
    };
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
}): Promise<Task> {
  const id = generateId();
  const now = new Date().toISOString();
  
  // Get max position
  const posResult = await db.execute(
    "SELECT MAX(position) as maxPos FROM Task WHERE status = 'BACKLOG'"
  );
  const maxPos = (posResult.rows[0]?.maxPos as number) ?? -1;

  await db.execute({
    sql: `INSERT INTO Task (id, title, description, status, priority, creator, needsReview, position, createdAt, updatedAt) 
          VALUES (?, ?, ?, 'BACKLOG', ?, ?, 0, ?, ?, ?)`,
    args: [
      id,
      data.title,
      data.description || null,
      data.priority || "MEDIUM",
      data.creator || "MOBY",
      maxPos + 1,
      now,
      now,
    ],
  });

  return {
    id,
    title: data.title,
    description: data.description || null,
    status: "BACKLOG",
    priority: data.priority || "MEDIUM",
    creator: data.creator || "MOBY",
    needsReview: false,
    position: maxPos + 1,
    createdAt: new Date(now),
    updatedAt: new Date(now),
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
  try {
    const now = new Date().toISOString();
    const updates: string[] = [];
    const args: (string | number | null)[] = [];

    if (data.title !== undefined) {
      updates.push("title = ?");
      args.push(data.title);
    }
    if (data.description !== undefined) {
      updates.push("description = ?");
      args.push(data.description);
    }
    if (data.status !== undefined) {
      updates.push("status = ?");
      args.push(data.status);
    }
    if (data.priority !== undefined) {
      updates.push("priority = ?");
      args.push(data.priority);
    }
    if (data.creator !== undefined) {
      updates.push("creator = ?");
      args.push(data.creator);
    }
    if (data.needsReview !== undefined) {
      updates.push("needsReview = ?");
      args.push(data.needsReview ? 1 : 0);
    }
    if (data.position !== undefined) {
      updates.push("position = ?");
      args.push(data.position);
    }

    if (updates.length === 0) return getTaskById(id);

    updates.push("updatedAt = ?");
    args.push(now);
    args.push(id);

    await db.execute({
      sql: `UPDATE Task SET ${updates.join(", ")} WHERE id = ?`,
      args,
    });

    return getTaskById(id);
  } catch (error) {
    console.error("Failed to update task:", error);
    return null;
  }
}

export async function deleteTask(id: string): Promise<boolean> {
  try {
    await db.execute({
      sql: "DELETE FROM Task WHERE id = ?",
      args: [id],
    });
    return true;
  } catch (error) {
    console.error("Failed to delete task:", error);
    return false;
  }
}

export async function toggleTaskFlag(id: string): Promise<Task | null> {
  try {
    const task = await getTaskById(id);
    if (!task) return null;

    await db.execute({
      sql: "UPDATE Task SET needsReview = ?, updatedAt = ? WHERE id = ?",
      args: [task.needsReview ? 0 : 1, new Date().toISOString(), id],
    });

    return getTaskById(id);
  } catch (error) {
    console.error("Failed to toggle flag:", error);
    return null;
  }
}
