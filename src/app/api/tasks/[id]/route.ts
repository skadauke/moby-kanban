import { NextRequest, NextResponse } from "next/server";
import { getTaskById, updateTask, deleteTask } from "@/lib/api-store";
import { updateTaskSchema, formatZodError } from "@/lib/validation";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/tasks/:id - Get single task
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  
  if (!id || typeof id !== "string") {
    return NextResponse.json(
      { error: "Invalid task ID" },
      { status: 400 }
    );
  }

  const result = await getTaskById(id);
  
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error.message },
      { status: result.error.httpStatus }
    );
  }

  return NextResponse.json(result.data);
}

// PATCH /api/tasks/:id - Update task
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  
  if (!id || typeof id !== "string") {
    return NextResponse.json(
      { error: "Invalid task ID" },
      { status: 400 }
    );
  }

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
  const validation = updateTaskSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { error: formatZodError(validation.error) },
      { status: 400 }
    );
  }

  const result = await updateTask(id, validation.data);
  
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error.message },
      { status: result.error.httpStatus }
    );
  }

  return NextResponse.json(result.data);
}

// DELETE /api/tasks/:id - Delete task
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  
  if (!id || typeof id !== "string") {
    return NextResponse.json(
      { error: "Invalid task ID" },
      { status: 400 }
    );
  }

  const result = await deleteTask(id);
  
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error.message },
      { status: result.error.httpStatus }
    );
  }

  return new NextResponse(null, { status: 204 });
}
