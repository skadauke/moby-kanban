import { NextRequest, NextResponse } from "next/server";
import { getProjectById, updateProject, deleteProject } from "@/lib/projects-store";
import { logger } from "@/lib/logger";
import { z } from "zod";

const updateProjectSchema = z.object({
  name: z.string().transform(s => s.trim()).pipe(z.string().min(1).max(100)).optional(),
  description: z.string().transform(s => s.trim()).pipe(z.string().max(500)).nullable().optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  position: z.number().int().min(0).optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/projects/[id]
export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const start = Date.now();
  
  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "Invalid project ID" }, { status: 400 });
  }

  const result = await getProjectById(id);
  
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error.message },
      { status: result.error.httpStatus }
    );
  }

  await logger.info("Project fetched", {
    path: `/api/projects/${id}`,
    method: "GET",
    statusCode: 200,
    duration: Date.now() - start,
  });
  return NextResponse.json(result.data);
}

// PATCH /api/projects/[id]
export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const start = Date.now();
  
  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "Invalid project ID" }, { status: 400 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const validation = updateProjectSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error.issues.map(i => i.message).join(", ") },
      { status: 400 }
    );
  }

  const result = await updateProject(id, validation.data);
  
  if (!result.ok) {
    await logger.error("Failed to update project", {
      path: `/api/projects/${id}`,
      method: "PATCH",
      statusCode: result.error.httpStatus,
      duration: Date.now() - start,
      context: { error: result.error.message, code: result.error.code },
    });
    return NextResponse.json(
      { error: result.error.message },
      { status: result.error.httpStatus }
    );
  }

  await logger.info("Project updated", {
    path: `/api/projects/${id}`,
    method: "PATCH",
    statusCode: 200,
    duration: Date.now() - start,
    context: { projectId: id },
  });
  return NextResponse.json(result.data);
}

// DELETE /api/projects/[id]
export async function DELETE(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const start = Date.now();
  
  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "Invalid project ID" }, { status: 400 });
  }

  const result = await deleteProject(id);
  
  if (!result.ok) {
    await logger.error("Failed to delete project", {
      path: `/api/projects/${id}`,
      method: "DELETE",
      statusCode: result.error.httpStatus,
      duration: Date.now() - start,
      context: { error: result.error.message, code: result.error.code },
    });
    return NextResponse.json(
      { error: result.error.message },
      { status: result.error.httpStatus }
    );
  }

  await logger.info("Project deleted", {
    path: `/api/projects/${id}`,
    method: "DELETE",
    statusCode: 204,
    duration: Date.now() - start,
    context: { projectId: id },
  });
  return new NextResponse(null, { status: 204 });
}
