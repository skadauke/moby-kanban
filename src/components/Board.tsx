"use client";

import { useState, useCallback } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { Task, Status, COLUMNS } from "@/lib/types";
import { Column } from "./Column";
import { TaskCard } from "./TaskCard";
import { TaskModal } from "./TaskModal";
import { moveTask } from "@/lib/actions";

interface BoardProps {
  initialTasks: Task[];
}

export function Board({ initialTasks }: BoardProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const getTasksByStatus = useCallback(
    (status: Status) => {
      return tasks
        .filter((t) => t.status === status)
        .sort((a, b) => a.position - b.position);
    },
    [tasks]
  );

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    if (task) setActiveTask(task);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeTask = tasks.find((t) => t.id === activeId);
    if (!activeTask) return;

    // Check if dragging over a column
    const overColumn = COLUMNS.find((c) => c.id === overId);
    if (overColumn) {
      // Moving to empty column or column header
      if (activeTask.status !== overColumn.id) {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === activeId
              ? { ...t, status: overColumn.id, position: 0 }
              : t
          )
        );
      }
      return;
    }

    // Dragging over another task
    const overTask = tasks.find((t) => t.id === overId);
    if (!overTask) return;

    if (activeTask.status !== overTask.status) {
      // Moving to different column
      setTasks((prev) => {
        const updated = prev.map((t) =>
          t.id === activeId
            ? { ...t, status: overTask.status, position: overTask.position }
            : t
        );
        return updated;
      });
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    const activeTask = tasks.find((t) => t.id === activeId);
    if (!activeTask) return;

    // Determine target status and position
    let targetStatus: Status = activeTask.status;
    let targetPosition = 0;

    const overColumn = COLUMNS.find((c) => c.id === overId);
    if (overColumn) {
      targetStatus = overColumn.id;
      const columnTasks = getTasksByStatus(overColumn.id);
      targetPosition = columnTasks.length;
    } else {
      const overTask = tasks.find((t) => t.id === overId);
      if (overTask) {
        targetStatus = overTask.status;
        const columnTasks = getTasksByStatus(overTask.status);
        const overIndex = columnTasks.findIndex((t) => t.id === overId);
        targetPosition = overIndex >= 0 ? overIndex : 0;
      }
    }

    // Update local state immediately for optimistic UI
    setTasks((prev) => {
      const oldIndex = prev.findIndex((t) => t.id === activeId);
      const newTasks = [...prev];
      newTasks[oldIndex] = {
        ...newTasks[oldIndex],
        status: targetStatus,
        position: targetPosition,
      };
      return newTasks;
    });

    // Persist to database
    await moveTask(activeId, targetStatus, targetPosition);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTask(null);
  };

  const handleTaskUpdated = (updatedTask: Task) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === updatedTask.id ? updatedTask : t))
    );
  };

  const handleTaskCreated = (newTask: Task) => {
    setTasks((prev) => [...prev, newTask]);
  };

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
          {COLUMNS.map((column) => (
            <Column
              key={column.id}
              id={column.id}
              title={column.title}
              tasks={getTasksByStatus(column.id)}
              onEditTask={handleEditTask}
            />
          ))}
        </div>
        <DragOverlay>
          {activeTask && (
            <TaskCard task={activeTask} onEdit={() => {}} />
          )}
        </DragOverlay>
      </DndContext>

      <TaskModal
        open={isModalOpen}
        onClose={handleCloseModal}
        task={editingTask}
        onTaskUpdated={handleTaskUpdated}
        onTaskCreated={handleTaskCreated}
      />
    </>
  );
}
