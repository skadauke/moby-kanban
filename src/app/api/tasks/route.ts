import { NextRequest, NextResponse } from "next/server";
import { getAllTasks, createTask } from "@/lib/api-store";
import { createTaskSchema, formatZodError } from "@/lib/validation";
import { logger } from "@/lib/logger";

// GET /api/tasks - List all tasks
export async function GET() {
  const start = Date.now();
  
  const result = await getAllTasks();
  
  if (!result.ok) {
    await logger.error("Failed to fetch tasks", {
      path: "/api/tasks",
      method: "GET",
      statusCode: result.error.httpStatus,
      duration: Date.now() - start,
      context: { error: result.error.message, code: result.error.code },
    });
    return NextResponse.json(
      { error: result.error.message },
      { status: result.error.httpStatus }
    );
  }

  await logger.info("Tasks fetched", {
    path: "/api/tasks",
    method: "GET",
    statusCode: 200,
    duration: Date.now() - start,
    context: { count: result.data.length },
  });
  return NextResponse.json(result.data);
}

// POST /api/tasks - Create new task
export async function POST(request: NextRequest) {
  const start = Date.now();
  
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }
  
  // Validate input
  const validation = createTaskSchema.safeParse(body);
  if (!validation.success) {
    await logger.warn("Task creation validation failed", {
      path: "/api/tasks",
      method: "POST",
      statusCode: 400,
      duration: Date.now() - start,
      context: { errors: formatZodError(validation.error) },
    });
    return NextResponse.json(
      { error: formatZodError(validation.error) },
      { status: 400 }
    );
  }

  const result = await createTask(validation.data);
  
  if (!result.ok) {
    await logger.error("Failed to create task", {
      path: "/api/tasks",
      method: "POST",
      statusCode: result.error.httpStatus,
      duration: Date.now() - start,
      context: { error: result.error.message, code: result.error.code },
    });
    return NextResponse.json(
      { error: result.error.message },
      { status: result.error.httpStatus }
    );
  }

  await logger.info("Task created", {
    path: "/api/tasks",
    method: "POST",
    statusCode: 201,
    duration: Date.now() - start,
    context: { taskId: result.data.id, title: result.data.title },
  });
  return NextResponse.json(result.data, { status: 201 });
}
