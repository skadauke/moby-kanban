import { NextRequest, NextResponse } from "next/server";
import { toggleTaskFlag } from "@/lib/api-store";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/tasks/:id/flag - Toggle review flag
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const task = await toggleTaskFlag(id);
    
    if (!task) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(task);
  } catch {
    return NextResponse.json(
      { error: "Failed to toggle flag" },
      { status: 500 }
    );
  }
}
