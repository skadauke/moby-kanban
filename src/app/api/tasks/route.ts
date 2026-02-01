import { NextRequest, NextResponse } from "next/server";
import { getAllTasks, createTask } from "@/lib/api-store";
import { createTaskSchema, formatZodError } from "@/lib/validation";
import { logger } from "@/lib/logger";

// GET /api/tasks - List all tasks
export async function GET() {
  const start = Date.now();
  try {
    const tasks = await getAllTasks();
    await logger.info("Tasks fetched", {
      path: "/api/tasks",
      method: "GET",
      statusCode: 200,
      duration: Date.now() - start,
      context: { count: tasks.length },
    });
    return NextResponse.json(tasks);
  } catch (error) {
    await logger.error("Failed to fetch tasks", {
      path: "/api/tasks",
      method: "GET",
      statusCode: 500,
      duration: Date.now() - start,
      context: { error: String(error) },
    });
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

// POST /api/tasks - Create new task
export async function POST(request: NextRequest) {
  const start = Date.now();
  try {
    const body = await request.json();
    
    // Validate input
    const result = createTaskSchema.safeParse(body);
    if (!result.success) {
      await logger.warn("Task creation validation failed", {
        path: "/api/tasks",
        method: "POST",
        statusCode: 400,
        duration: Date.now() - start,
        context: { errors: formatZodError(result.error) },
      });
      return NextResponse.json(
        { error: formatZodError(result.error) },
        { status: 400 }
      );
    }

    const task = await createTask(result.data);
    await logger.info("Task created", {
      path: "/api/tasks",
      method: "POST",
      statusCode: 201,
      duration: Date.now() - start,
      context: { taskId: task.id, title: task.title },
    });
    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    await logger.error("Failed to create task", {
      path: "/api/tasks",
      method: "POST",
      statusCode: 500,
      duration: Date.now() - start,
      context: { error: String(error) },
    });
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}
