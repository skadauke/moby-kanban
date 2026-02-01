import { NextRequest, NextResponse } from "next/server";
import { getAllProjects, createProject } from "@/lib/projects-store";
import { logger } from "@/lib/logger";
import { z } from "zod";

const createProjectSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Invalid color format").optional(),
});

// GET /api/projects - List all projects
export async function GET() {
  const start = Date.now();
  try {
    const projects = await getAllProjects();
    await logger.info("Projects fetched", {
      path: "/api/projects",
      method: "GET",
      statusCode: 200,
      duration: Date.now() - start,
      context: { count: projects.length },
    });
    return NextResponse.json(projects);
  } catch (error) {
    await logger.error("Failed to fetch projects", {
      path: "/api/projects",
      method: "GET",
      statusCode: 500,
      duration: Date.now() - start,
      context: { error: String(error) },
    });
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

// POST /api/projects - Create new project
export async function POST(request: NextRequest) {
  const start = Date.now();
  try {
    const body = await request.json();
    
    const result = createProjectSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues.map(i => i.message).join(", ") },
        { status: 400 }
      );
    }

    const project = await createProject(result.data);
    await logger.info("Project created", {
      path: "/api/projects",
      method: "POST",
      statusCode: 201,
      duration: Date.now() - start,
      context: { projectId: project.id, name: project.name },
    });
    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    await logger.error("Failed to create project", {
      path: "/api/projects",
      method: "POST",
      statusCode: 500,
      duration: Date.now() - start,
      context: { error: errorMessage },
    });
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
