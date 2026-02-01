import { NextRequest, NextResponse } from "next/server";
import { reorderProjects } from "@/lib/projects-store";
import { z } from "zod";

const reorderSchema = z.object({
  projectIds: z.array(z.string().uuid()).min(1, "At least one project ID required"),
});

// POST /api/projects/reorder - Reorder projects
export async function POST(request: NextRequest) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }
  
  const validation = reorderSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error.issues.map(i => i.message).join(", ") },
      { status: 400 }
    );
  }

  const result = await reorderProjects(validation.data.projectIds);
  
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error.message },
      { status: result.error.httpStatus }
    );
  }

  return NextResponse.json({ success: true });
}
