"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TaskModal } from "./TaskModal";
import { UserMenu } from "./UserMenu";
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
        <div className="px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Left: Logo & Title */}
            <div className="flex items-center gap-2">
              <span className="text-2xl">🐋</span>
              <h1 className="text-lg font-bold text-zinc-100">Moby Kanban</h1>
            </div>

            {/* Center: Filters */}
            <div className="flex items-center gap-1.5 flex-1 justify-center">
              <Button
                variant={filter === "all" ? "default" : "ghost"}
                size="sm"
                onClick={() => onFilterChange("all")}
                className={`h-7 px-2 ${filter === "all" ? "bg-zinc-700" : "text-zinc-400"}`}
              >
                All
              </Button>
              <Button
                variant={filter === "flagged" ? "default" : "ghost"}
                size="sm"
                onClick={() => onFilterChange("flagged")}
                className={`h-7 px-2 ${
                  filter === "flagged"
                    ? "bg-amber-600 hover:bg-amber-700"
                    : "text-zinc-400"
                }`}
              >
                <Flag className="h-3 w-3 mr-1" />
                Review
                {flaggedCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-1 bg-amber-500/20 text-amber-300 text-xs px-1.5 h-4"
                  >
                    {flaggedCount}
                  </Badge>
                )}
              </Button>
              <Button
                variant={filter === "moby" ? "default" : "ghost"}
                size="sm"
                onClick={() => onFilterChange("moby")}
                className={`h-7 px-2 ${filter === "moby" ? "bg-zinc-700" : "text-zinc-400"}`}
              >
                🐋
              </Button>
              <Button
                variant={filter === "stephan" ? "default" : "ghost"}
                size="sm"
                onClick={() => onFilterChange("stephan")}
                className={`h-7 px-2 ${filter === "stephan" ? "bg-zinc-700" : "text-zinc-400"}`}
              >
                👤
              </Button>
              {filter !== "all" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onFilterChange("all")}
                  className="h-7 w-7 p-0 text-zinc-500 hover:text-zinc-100"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>

            {/* Right: Actions & User */}
            <div className="flex items-center gap-2">
              {onRefresh && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onRefresh}
                  disabled={isRefreshing}
                  className="h-8 w-8 text-zinc-400"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                </Button>
              )}
              <Button
                onClick={() => setIsModalOpen(true)}
                size="sm"
                className="h-8 bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-1" />
                New
              </Button>
              {session?.user && (
                <UserMenu user={session.user} />
              )}
            </div>
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
