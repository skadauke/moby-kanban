"use client";

import { ReactNode, createContext, useContext, useState, useCallback } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  rectIntersection,
  CollisionDetection,
  pointerWithin,
} from "@dnd-kit/core";
import { Task, Status, COLUMNS } from "@/lib/types";
import { TaskCard } from "./TaskCard";

interface KanbanDndContextValue {
  activeTask: Task | null;
  isDraggingTask: boolean;
}

const KanbanDndStateContext = createContext<KanbanDndContextValue>({
  activeTask: null,
  isDraggingTask: false,
});

export function useKanbanDnd() {
  return useContext(KanbanDndStateContext);
}

interface KanbanDndProviderProps {
  children: ReactNode;
  tasks: Task[];
  onTaskStatusChange: (taskId: string, newStatus: Status, newPosition: number) => void;
  onTaskProjectChange: (taskId: string, projectId: string | null) => void;
  onTaskReorder: (taskId: string, newPosition: number) => void;
}

export function KanbanDndProvider({
  children,
  tasks,
  onTaskStatusChange,
  onTaskProjectChange,
  onTaskReorder,
}: KanbanDndProviderProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const id = event.active.id as string;
    const task = tasks.find((t) => t.id === id);
    if (task) {
      setActiveTask(task);
    }
  }, [tasks]);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    // Let the Board component handle drag-over for columns
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find the dragged task
    const draggedTask = tasks.find((t) => t.id === activeId);
    if (!draggedTask) return;

    // Check if dropped on a project target
    if (overId.startsWith("project-drop-")) {
      const projectId = overId.replace("project-drop-", "");
      const targetProjectId = projectId === "none" ? null : projectId;
      if (draggedTask.projectId !== targetProjectId) {
        onTaskProjectChange(activeId, targetProjectId);
      }
      return;
    }

    // Check if dropped on a column
    const overColumn = COLUMNS.find((c) => c.id === overId);
    if (overColumn) {
      const columnTasks = tasks
        .filter(t => t.status === overColumn.id && t.id !== activeId)
        .sort((a, b) => a.position - b.position);
      const newPosition = columnTasks.length;
      
      if (draggedTask.status !== overColumn.id || draggedTask.position !== newPosition) {
        onTaskStatusChange(activeId, overColumn.id, newPosition);
      }
      return;
    }

    // Check if dropped on another task
    const overTask = tasks.find((t) => t.id === overId);
    if (overTask) {
      const columnTasks = tasks
        .filter(t => t.status === overTask.status)
        .sort((a, b) => a.position - b.position);
      const overIndex = columnTasks.findIndex(t => t.id === overId);
      
      if (draggedTask.status !== overTask.status) {
        onTaskStatusChange(activeId, overTask.status, overIndex);
      } else if (draggedTask.position !== overIndex) {
        onTaskReorder(activeId, overIndex);
      }
    }
  }, [tasks, onTaskStatusChange, onTaskProjectChange, onTaskReorder]);

  // Custom collision detection: prioritize project drop targets, then task cards for sorting, then columns
  const customCollisionDetection: CollisionDetection = useCallback((args) => {
    // Use pointer-within for project drops (more precise for sidebar)
    const pointerCollisions = pointerWithin(args);
    const projectHit = pointerCollisions.find(c => 
      (c.id as string).startsWith("project-drop-")
    );
    if (projectHit) {
      return [projectHit];
    }
    
    // Use closest center for sorting - this finds task cards first
    const centerCollisions = closestCenter(args);
    
    // Check if we hit a task card (not a column or project)
    const taskHit = centerCollisions.find(c => {
      const id = c.id as string;
      return !COLUMNS.some(col => col.id === id) && !id.startsWith("project-drop-");
    });
    if (taskHit) {
      return [taskHit];
    }
    
    // Fall back to rect intersection for columns
    const rectCollisions = rectIntersection(args);
    const columnHit = rectCollisions.find(c => 
      COLUMNS.some(col => col.id === c.id)
    );
    if (columnHit) {
      return [columnHit];
    }

    return centerCollisions;
  }, []);

  return (
    <KanbanDndStateContext.Provider value={{ activeTask, isDraggingTask: !!activeTask }}>
      <DndContext
        sensors={sensors}
        collisionDetection={customCollisionDetection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        {children}
        <DragOverlay dropAnimation={null}>
          {activeTask && (
            <div className="rotate-3 opacity-90">
              <TaskCard
                task={activeTask}
                onEdit={() => {}}
                onDelete={() => {}}
                onToggleFlag={() => {}}
              />
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </KanbanDndStateContext.Provider>
  );
}
