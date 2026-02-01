import { NextRequest, NextResponse } from "next/server";
import { reorderProjects } from "@/lib/projects-store";
import { z } from "zod";

const reorderSchema = z.object({
  projectIds: z.array(z.string().uuid()).min(1, "At least one project ID required"),
});

// POST /api/projects/reorder - Reorder projects
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const result = reorderSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues.map(i => i.message).join(", ") },
        { status: 400 }
      );
    }

    const success = await reorderProjects(result.data.projectIds);
    
    if (!success) {
      return NextResponse.json(
        { error: "Failed to reorder projects" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/projects/reorder error:", error);
    return NextResponse.json(
      { error: "Failed to reorder projects" },
      { status: 500 }
    );
  }
}
