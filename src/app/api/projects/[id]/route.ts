import { NextRequest, NextResponse } from "next/server";
import { getProjectById, updateProject, deleteProject } from "@/lib/projects-store";
import { logger } from "@/lib/logger";
import { z } from "zod";

const updateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  position: z.number().int().min(0).optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/projects/[id]
export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const start = Date.now();
  
  try {
    const project = await getProjectById(id);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    return NextResponse.json(project);
  } catch (error) {
    await logger.error("Failed to get project", {
      path: `/api/projects/${id}`,
      method: "GET",
      statusCode: 500,
      duration: Date.now() - start,
      context: { error: String(error) },
    });
    return NextResponse.json({ error: "Failed to get project" }, { status: 500 });
  }
}

// PATCH /api/projects/[id]
export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const start = Date.now();
  
  try {
    const body = await request.json();
    const result = updateProjectSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues.map(i => i.message).join(", ") },
        { status: 400 }
      );
    }

    const project = await updateProject(id, result.data);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    await logger.info("Project updated", {
      path: `/api/projects/${id}`,
      method: "PATCH",
      statusCode: 200,
      duration: Date.now() - start,
      context: { projectId: id },
    });
    return NextResponse.json(project);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    await logger.error("Failed to update project", {
      path: `/api/projects/${id}`,
      method: "PATCH",
      statusCode: 500,
      duration: Date.now() - start,
      context: { error: errorMessage },
    });
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// DELETE /api/projects/[id]
export async function DELETE(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const start = Date.now();
  
  try {
    const success = await deleteProject(id);
    if (!success) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    await logger.info("Project deleted", {
      path: `/api/projects/${id}`,
      method: "DELETE",
      statusCode: 204,
      duration: Date.now() - start,
      context: { projectId: id },
    });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    await logger.error("Failed to delete project", {
      path: `/api/projects/${id}`,
      method: "DELETE",
      statusCode: 500,
      duration: Date.now() - start,
      context: { error: String(error) },
    });
    return NextResponse.json({ error: "Failed to delete project" }, { status: 500 });
  }
}
