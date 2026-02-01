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
import { Task, Status, COLUMNS } from "@/lib/types";
import { Column } from "./Column";
import { TaskCard } from "./TaskCard";
import { TaskModal } from "./TaskModal";

interface BoardProps {
  initialTasks: Task[];
  onTasksChange: (tasks: Task[]) => void;
  onDeleteTask: (taskId: string) => void;
  onToggleFlag: (taskId: string) => void;
  onTaskUpdated: (task: Task) => void;
}

export function Board({
  initialTasks,
  onTasksChange,
  onDeleteTask,
  onToggleFlag,
  onTaskUpdated,
}: BoardProps) {
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

    const overColumn = COLUMNS.find((c) => c.id === overId);
    if (overColumn) {
      if (activeTask.status !== overColumn.id) {
        const newTasks = tasks.map((t) =>
          t.id === activeId
            ? { ...t, status: overColumn.id, position: 0, updatedAt: new Date() }
            : t
        );
        setTasks(newTasks);
      }
      return;
    }

    const overTask = tasks.find((t) => t.id === overId);
    if (!overTask) return;

    if (activeTask.status !== overTask.status) {
      const newTasks = tasks.map((t) =>
        t.id === activeId
          ? { ...t, status: overTask.status, position: overTask.position, updatedAt: new Date() }
          : t
      );
      setTasks(newTasks);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    const activeTask = tasks.find((t) => t.id === activeId);
    if (!activeTask) return;

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

    const newTasks = tasks.map((t) =>
      t.id === activeId
        ? { ...t, status: targetStatus, position: targetPosition, updatedAt: new Date() }
        : t
    );

    setTasks(newTasks);
    onTasksChange(newTasks);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTask(null);
  };

  const handleTaskUpdatedLocal = (updatedTask: Task) => {
    setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
    onTaskUpdated(updatedTask);
  };

  const handleTaskCreated = (newTask: Task) => {
    setTasks((prev) => [...prev, newTask]);
  };

  const handleDeleteTaskLocal = (taskId: string) => {
    if (confirm("Delete this task?")) {
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      onDeleteTask(taskId);
    }
  };

  const handleToggleFlagLocal = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, needsReview: !t.needsReview, updatedAt: new Date() } : t
      )
    );
    onToggleFlag(taskId);
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
              onDeleteTask={handleDeleteTaskLocal}
              onToggleFlag={handleToggleFlagLocal}
            />
          ))}
        </div>
        <DragOverlay>
          {activeTask && (
            <TaskCard
              task={activeTask}
              onEdit={() => {}}
              onDelete={() => {}}
              onToggleFlag={() => {}}
            />
          )}
        </DragOverlay>
      </DndContext>

      <TaskModal
        open={isModalOpen}
        onClose={handleCloseModal}
        task={editingTask}
        onTaskUpdated={handleTaskUpdatedLocal}
        onTaskCreated={handleTaskCreated}
      />
    </>
  );
}
