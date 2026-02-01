"use client";

import { useState, useEffect } from "react";
import { Project } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Folder, ChevronLeft, ChevronRight, Trash2, Edit2 } from "lucide-react";

interface ProjectSidebarProps {
  selectedProjectId: string | null;
  onSelectProject: (projectId: string | null) => void;
}

const PROJECT_COLORS = [
  "#3b82f6", // blue
  "#10b981", // green
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#84cc16", // lime
];

export function ProjectSidebar({ selectedProjectId, onSelectProject }: ProjectSidebarProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [projectName, setProjectName] = useState("");
  const [projectColor, setProjectColor] = useState(PROJECT_COLORS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch projects
  useEffect(() => {
    async function loadProjects() {
      try {
        const res = await fetch("/api/projects");
        if (res.ok) {
          const data = await res.json();
          setProjects(data.map((p: Project) => ({
            ...p,
            createdAt: new Date(p.createdAt),
            updatedAt: new Date(p.updatedAt),
          })));
        }
      } catch (err) {
        console.error("Failed to load projects:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadProjects();
  }, []);

  const handleCreateOrUpdate = async () => {
    if (!projectName.trim()) return;
    setIsSubmitting(true);

    try {
      const url = editingProject 
        ? `/api/projects/${editingProject.id}`
        : "/api/projects";
      const method = editingProject ? "PATCH" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: projectName, color: projectColor }),
      });

      if (res.ok) {
        const project = await res.json();
        if (editingProject) {
          setProjects(prev => prev.map(p => p.id === project.id ? {
            ...project,
            createdAt: new Date(project.createdAt),
            updatedAt: new Date(project.updatedAt),
          } : p));
        } else {
          setProjects(prev => [...prev, {
            ...project,
            createdAt: new Date(project.createdAt),
            updatedAt: new Date(project.updatedAt),
          }]);
        }
        closeModal();
      }
    } catch (err) {
      console.error("Failed to save project:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (projectId: string) => {
    if (!confirm("Delete this project? Tasks will be unassigned but not deleted.")) return;
    
    try {
      const res = await fetch(`/api/projects/${projectId}`, { method: "DELETE" });
      if (res.ok) {
        setProjects(prev => prev.filter(p => p.id !== projectId));
        if (selectedProjectId === projectId) {
          onSelectProject(null);
        }
      }
    } catch (err) {
      console.error("Failed to delete project:", err);
    }
  };

  const openCreateModal = () => {
    setEditingProject(null);
    setProjectName("");
    setProjectColor(PROJECT_COLORS[Math.floor(Math.random() * PROJECT_COLORS.length)]);
    setIsModalOpen(true);
  };

  const openEditModal = (project: Project) => {
    setEditingProject(project);
    setProjectName(project.name);
    setProjectColor(project.color);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProject(null);
    setProjectName("");
  };

  if (isCollapsed) {
    return (
      <div className="w-12 bg-zinc-950 border-r border-zinc-800 flex flex-col items-center py-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(false)}
          className="text-zinc-400 hover:text-zinc-100"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <div className="mt-4 space-y-2">
          {projects.map(project => (
            <button
              key={project.id}
              onClick={() => onSelectProject(project.id)}
              className={`w-8 h-8 rounded-md flex items-center justify-center transition-colors ${
                selectedProjectId === project.id ? "ring-2 ring-white" : ""
              }`}
              style={{ backgroundColor: project.color }}
              title={project.name}
            >
              <span className="text-white text-xs font-bold">
                {project.name.charAt(0).toUpperCase()}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="w-64 bg-zinc-950 border-r border-zinc-800 flex flex-col">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
            Projects
          </h2>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={openCreateModal}
              className="h-7 w-7 text-zinc-400 hover:text-zinc-100"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCollapsed(true)}
              className="h-7 w-7 text-zinc-400 hover:text-zinc-100"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {/* All Tasks option */}
          <button
            onClick={() => onSelectProject(null)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors ${
              selectedProjectId === null
                ? "bg-zinc-800 text-zinc-100"
                : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
            }`}
          >
            <Folder className="h-4 w-4" />
            <span className="text-sm font-medium">All Tasks</span>
          </button>

          {/* Project list */}
          {isLoading ? (
            <div className="px-3 py-4 text-sm text-zinc-500">Loading...</div>
          ) : (
            <div className="mt-2 space-y-1">
              {projects.map(project => (
                <div
                  key={project.id}
                  className={`group flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                    selectedProjectId === project.id
                      ? "bg-zinc-800 text-zinc-100"
                      : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
                  }`}
                >
                  <button
                    onClick={() => onSelectProject(project.id)}
                    className="flex-1 flex items-center gap-3 text-left"
                  >
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: project.color }}
                    />
                    <span className="text-sm font-medium truncate">{project.name}</span>
                  </button>
                  <div className="hidden group-hover:flex items-center gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); openEditModal(project); }}
                      className="p-1 text-zinc-500 hover:text-zinc-300"
                    >
                      <Edit2 className="h-3 w-3" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(project.id); }}
                      className="p-1 text-zinc-500 hover:text-red-400"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Project Modal */}
      <Dialog open={isModalOpen} onOpenChange={closeModal}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100">
          <DialogHeader>
            <DialogTitle>
              {editingProject ? "Edit Project" : "New Project"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-zinc-400">Name</label>
              <Input
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Project name..."
                className="bg-zinc-900 border-zinc-800 mt-1"
                autoFocus
              />
            </div>
            <div>
              <label className="text-sm text-zinc-400">Color</label>
              <div className="flex gap-2 mt-2">
                {PROJECT_COLORS.map(color => (
                  <button
                    key={color}
                    onClick={() => setProjectColor(color)}
                    className={`w-8 h-8 rounded-full transition-transform ${
                      projectColor === color ? "ring-2 ring-white scale-110" : ""
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeModal} className="border-zinc-700">
              Cancel
            </Button>
            <Button
              onClick={handleCreateOrUpdate}
              disabled={!projectName.trim() || isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? "Saving..." : editingProject ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
