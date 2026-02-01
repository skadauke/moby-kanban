"use client";

import { useState, useCallback, useEffect } from "react";
import { useDroppable } from "@dnd-kit/core";
import { Task, Status, COLUMNS } from "@/lib/types";
import { Column } from "./Column";
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
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  const getTasksByStatus = useCallback(
    (status: Status) => {
      return tasks
        .filter((t) => t.status === status)
        .sort((a, b) => a.position - b.position);
    },
    [tasks]
  );

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
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    onDeleteTask(taskId);
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 flex-1 min-h-0">
        {COLUMNS.map((column) => (
          <DroppableColumn
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

// Droppable column wrapper
function DroppableColumn({
  id,
  title,
  tasks,
  onEditTask,
  onDeleteTask,
  onToggleFlag,
}: {
  id: Status;
  title: string;
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onToggleFlag: (taskId: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`h-full transition-all ${isOver ? "ring-2 ring-blue-500 ring-inset rounded-lg" : ""}`}
    >
      <Column
        id={id}
        title={title}
        tasks={tasks}
        isOver={isOver}
        onEditTask={onEditTask}
        onDeleteTask={onDeleteTask}
        onToggleFlag={onToggleFlag}
      />
    </div>
  );
}
