import { NextRequest, NextResponse } from "next/server";
import { reorderTasks } from "@/lib/api-store";
import { logger } from "@/lib/logger";
import { z } from "zod";

const reorderSchema = z.object({
  taskIds: z.array(z.string().uuid()).min(1),
  status: z.enum(["BACKLOG", "IN_PROGRESS", "DONE"]),
});

// POST /api/tasks/reorder - Reorder tasks within a column
export async function POST(request: NextRequest) {
  const start = Date.now();

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const validation = reorderSchema.safeParse(body);
  if (!validation.success) {
    await logger.warn("Reorder validation failed", {
      path: "/api/tasks/reorder",
      method: "POST",
      statusCode: 400,
      duration: Date.now() - start,
      context: { errors: validation.error.flatten() },
    });
    return NextResponse.json(
      { error: "Invalid request", details: validation.error.flatten() },
      { status: 400 }
    );
  }

  const { taskIds, status } = validation.data;

  const result = await reorderTasks(taskIds, status);

  if (!result.ok) {
    await logger.error("Failed to reorder tasks", {
      path: "/api/tasks/reorder",
      method: "POST",
      statusCode: result.error.httpStatus,
      duration: Date.now() - start,
      context: { error: result.error.message },
    });
    return NextResponse.json(
      { error: result.error.message },
      { status: result.error.httpStatus }
    );
  }

  await logger.info("Tasks reordered", {
    path: "/api/tasks/reorder",
    method: "POST",
    statusCode: 200,
    duration: Date.now() - start,
    context: { status, count: taskIds.length },
  });

  return NextResponse.json({ success: true, tasks: result.data });
}
