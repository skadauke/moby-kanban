import { Project } from "./types";
import { createAdminClient } from "./supabase/server";

// Database row type
interface ProjectRow {
  id: string;
  name: string;
  description: string | null;
  color: string;
  position: number;
  created_at: string;
  updated_at: string;
}

function rowToProject(row: ProjectRow): Project {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    color: row.color,
    position: row.position,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export async function getAllProjects(): Promise<Project[]> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("position", { ascending: true });

    if (error) {
      console.error("Failed to get projects:", error);
      return [];
    }

    return (data || []).map((row: ProjectRow) => rowToProject(row));
  } catch (error) {
    console.error("Failed to get projects:", error);
    return [];
  }
}

export async function getProjectById(id: string): Promise<Project | null> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) return null;

    return rowToProject(data as ProjectRow);
  } catch (error) {
    console.error("Failed to get project:", error);
    return null;
  }
}

export async function createProject(data: {
  name: string;
  description?: string;
  color?: string;
}): Promise<Project> {
  const supabase = createAdminClient();

  // Get max position
  const { data: maxPosData } = await supabase
    .from("projects")
    .select("position")
    .order("position", { ascending: false })
    .limit(1);

  const maxPos = maxPosData?.[0]?.position ?? -1;

  const { data: newProject, error } = await supabase
    .from("projects")
    .insert({
      name: data.name,
      description: data.description || null,
      color: data.color || "#3b82f6",
      position: maxPos + 1,
    })
    .select()
    .single();

  if (error) {
    const errMsg = error.message || "Unknown database error";
    const errCode = error.code || "UNKNOWN";
    throw new Error(`Database error (${errCode}): ${errMsg}`);
  }
  if (!newProject) {
    throw new Error("Project created but no data returned");
  }

  return rowToProject(newProject as ProjectRow);
}

export async function updateProject(
  id: string,
  data: Partial<{
    name: string;
    description: string | null;
    color: string;
    position: number;
  }>
): Promise<Project | null> {
  try {
    const supabase = createAdminClient();

    const updates: Record<string, unknown> = {};
    if (data.name !== undefined) updates.name = data.name;
    if (data.description !== undefined) updates.description = data.description;
    if (data.color !== undefined) updates.color = data.color;
    if (data.position !== undefined) updates.position = data.position;

    if (Object.keys(updates).length === 0) return getProjectById(id);

    updates.updated_at = new Date().toISOString();

    const { data: updated, error } = await supabase
      .from("projects")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error || !updated) return null;

    return rowToProject(updated as ProjectRow);
  } catch (error) {
    console.error("Failed to update project:", error);
    return null;
  }
}

export async function deleteProject(id: string): Promise<boolean> {
  try {
    const supabase = createAdminClient();
    // First, unset projectId for all tasks in this project
    await supabase
      .from("tasks")
      .update({ project_id: null })
      .eq("project_id", id);
    
    // Then delete the project
    const { error } = await supabase.from("projects").delete().eq("id", id);
    return !error;
  } catch (error) {
    console.error("Failed to delete project:", error);
    return false;
  }
}

export async function reorderProjects(projectIds: string[]): Promise<boolean> {
  try {
    const supabase = createAdminClient();
    
    // Update each project's position based on array order
    const updates = projectIds.map((id, position) => 
      supabase
        .from("projects")
        .update({ position, updated_at: new Date().toISOString() })
        .eq("id", id)
    );
    
    const results = await Promise.all(updates);
    
    // Check if any update failed
    const hasErrors = results.some(r => r.error);
    if (hasErrors) {
      console.error("Some project reorder updates failed:", results.filter(r => r.error));
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Failed to reorder projects:", error);
    return false;
  }
}
