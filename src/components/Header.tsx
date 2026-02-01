"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TaskModal } from "./TaskModal";
import { Task, Creator } from "@/lib/types";
import { Plus, Flag, X, RefreshCw } from "lucide-react";

// Map GitHub usernames to Creator type
function getCreatorFromSession(session: ReturnType<typeof useSession>["data"]): Creator {
  const githubUsername = (session?.user as { githubUsername?: string })?.githubUsername?.toLowerCase();
  if (githubUsername === "skadauke") return "STEPHAN";
  return "MOBY"; // Default for other users (including Moby's GitHub account)
}

export type FilterType = "all" | "flagged" | "moby" | "stephan";

interface HeaderProps {
  onTaskCreated: (task: Task) => void;
  filter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  flaggedCount: number;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  selectedProjectId?: string | null;
}

export function Header({
  onTaskCreated,
  filter,
  onFilterChange,
  flaggedCount,
  onRefresh,
  isRefreshing,
  selectedProjectId,
}: HeaderProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: session } = useSession();
  const defaultCreator = getCreatorFromSession(session);

  return (
    <>
      <header className="bg-zinc-950 border-b border-zinc-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🐋</span>
              <div>
                <h1 className="text-xl font-bold text-zinc-100">Moby Kanban</h1>
                <p className="text-xs text-zinc-500">AI-Human Project Tracker</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {onRefresh && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={onRefresh}
                  disabled={isRefreshing}
                  className="border-zinc-700"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                </Button>
              )}
              <Button
                onClick={() => setIsModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Task
              </Button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-zinc-500 mr-1">Filter:</span>
            <Button
              variant={filter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => onFilterChange("all")}
              className={filter === "all" ? "bg-zinc-700" : "border-zinc-700"}
            >
              All
            </Button>
            <Button
              variant={filter === "flagged" ? "default" : "outline"}
              size="sm"
              onClick={() => onFilterChange("flagged")}
              className={
                filter === "flagged"
                  ? "bg-amber-600 hover:bg-amber-700"
                  : "border-zinc-700"
              }
            >
              <Flag className="h-3 w-3 mr-1" />
              Needs Review
              {flaggedCount > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-1 bg-amber-500/20 text-amber-300 text-xs px-1.5"
                >
                  {flaggedCount}
                </Badge>
              )}
            </Button>
            <Button
              variant={filter === "moby" ? "default" : "outline"}
              size="sm"
              onClick={() => onFilterChange("moby")}
              className={filter === "moby" ? "bg-zinc-700" : "border-zinc-700"}
            >
              🐋 Moby
            </Button>
            <Button
              variant={filter === "stephan" ? "default" : "outline"}
              size="sm"
              onClick={() => onFilterChange("stephan")}
              className={filter === "stephan" ? "bg-zinc-700" : "border-zinc-700"}
            >
              👤 Stephan
            </Button>
            {filter !== "all" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onFilterChange("all")}
                className="text-zinc-400 hover:text-zinc-100"
              >
                <X className="h-3 w-3 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>
      </header>

      <TaskModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        task={null}
        onTaskUpdated={() => {}}
        onTaskCreated={(task) => {
          onTaskCreated(task);
          setIsModalOpen(false);
        }}
        defaultCreator={defaultCreator}
        defaultProjectId={selectedProjectId}
      />
    </>
  );
}
