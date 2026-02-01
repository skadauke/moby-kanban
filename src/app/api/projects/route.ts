import { NextRequest, NextResponse } from "next/server";
import { getAllProjects, createProject } from "@/lib/projects-store";
import { logger } from "@/lib/logger";
import { z } from "zod";

const createProjectSchema = z.object({
  name: z.string().transform(s => s.trim()).pipe(z.string().min(1, "Name is required").max(100)),
  description: z.string().transform(s => s.trim()).pipe(z.string().max(500)).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Invalid color format").optional(),
});

// GET /api/projects - List all projects
export async function GET() {
  const start = Date.now();
  
  const result = await getAllProjects();
  
  if (!result.ok) {
    await logger.error("Failed to fetch projects", {
      path: "/api/projects",
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

  await logger.info("Projects fetched", {
    path: "/api/projects",
    method: "GET",
    statusCode: 200,
    duration: Date.now() - start,
    context: { count: result.data.length },
  });
  return NextResponse.json(result.data);
}

// POST /api/projects - Create new project
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
  
  const validation = createProjectSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error.issues.map(i => i.message).join(", ") },
      { status: 400 }
    );
  }

  const result = await createProject(validation.data);
  
  if (!result.ok) {
    await logger.error("Failed to create project", {
      path: "/api/projects",
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

  await logger.info("Project created", {
    path: "/api/projects",
    method: "POST",
    statusCode: 201,
    duration: Date.now() - start,
    context: { projectId: result.data.id, name: result.data.name },
  });
  return NextResponse.json(result.data, { status: 201 });
}
