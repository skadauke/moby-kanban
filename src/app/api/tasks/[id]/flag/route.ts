import { NextRequest, NextResponse } from "next/server";
import { toggleTaskFlag } from "@/lib/api-store";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/tasks/:id/flag - Toggle review flag
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  
  if (!id || typeof id !== "string") {
    return NextResponse.json(
      { error: "Invalid task ID" },
      { status: 400 }
    );
  }

  const result = await toggleTaskFlag(id);
  
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error.message },
      { status: result.error.httpStatus }
    );
  }

  return NextResponse.json(result.data);
}
