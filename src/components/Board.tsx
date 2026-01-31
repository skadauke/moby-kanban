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
  onTasksChange?: (tasks: Task[]) => void;
}

export function Board({ initialTasks, onTasksChange }: BoardProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const updateTasks = useCallback((newTasks: Task[]) => {
    setTasks(newTasks);
    onTasksChange?.(newTasks);
  }, [onTasksChange]);

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
      if (activeTask.status !== overColumn.id) {
        updateTasks(
          tasks.map((t) =>
            t.id === activeId
              ? { ...t, status: overColumn.id, position: 0, updatedAt: new Date() }
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
      updateTasks(
        tasks.map((t) =>
          t.id === activeId
            ? { ...t, status: overTask.status, position: overTask.position, updatedAt: new Date() }
            : t
        )
      );
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

    updateTasks(
      tasks.map((t) =>
        t.id === activeId
          ? { ...t, status: targetStatus, position: targetPosition, updatedAt: new Date() }
          : t
      )
    );
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
    updateTasks(tasks.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
  };

  const handleTaskCreated = (newTask: Task) => {
    updateTasks([...tasks, newTask]);
  };

  const handleDeleteTask = (taskId: string) => {
    updateTasks(tasks.filter((t) => t.id !== taskId));
  };

  const handleToggleFlag = (taskId: string) => {
    updateTasks(
      tasks.map((t) =>
        t.id === taskId
          ? { ...t, needsReview: !t.needsReview, updatedAt: new Date() }
          : t
      )
    );
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
              onDeleteTask={handleDeleteTask}
              onToggleFlag={handleToggleFlag}
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
        onTaskUpdated={handleTaskUpdated}
        onTaskCreated={handleTaskCreated}
      />
    </>
  );
}
