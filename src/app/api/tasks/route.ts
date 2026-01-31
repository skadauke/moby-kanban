import { NextRequest, NextResponse } from "next/server";
import { getAllTasks, createTask } from "@/lib/api-store";

// GET /api/tasks - List all tasks
export async function GET() {
  try {
    const tasks = await getAllTasks();
    return NextResponse.json(tasks);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

// POST /api/tasks - Create new task
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.title || typeof body.title !== "string") {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    const task = await createTask({
      title: body.title,
      description: body.description,
      priority: body.priority,
      creator: body.creator,
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}
