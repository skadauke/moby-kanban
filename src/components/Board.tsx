"use client";

import { useState, useCallback, useEffect } from "react";
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

  // Sync with initialTasks when they change (fixes stale state issue #11)
  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

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

  // Reassign positions for all tasks in a column (0, 1, 2, ...)
  const reindexColumn = (columnTasks: Task[]): Task[] => {
    return columnTasks.map((task, index) => ({
      ...task,
      position: index,
      updatedAt: new Date(),
    }));
  };

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

    // Check if dropping on a column
    const overColumn = COLUMNS.find((c) => c.id === overId);
    if (overColumn && activeTask.status !== overColumn.id) {
      // Move task to new column (will be placed at end, reindexed on dragEnd)
      setTasks(prev => prev.map((t) =>
        t.id === activeId
          ? { ...t, status: overColumn.id, updatedAt: new Date() }
          : t
      ));
      return;
    }

    // Check if dropping on another task
    const overTask = tasks.find((t) => t.id === overId);
    if (overTask && activeTask.status !== overTask.status) {
      // Move task to the column of the task we're hovering over
      setTasks(prev => prev.map((t) =>
        t.id === activeId
          ? { ...t, status: overTask.status, updatedAt: new Date() }
          : t
      ));
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeTask = tasks.find((t) => t.id === activeId);
    if (!activeTask) return;

    // Determine target column and position
    let targetStatus: Status = activeTask.status;
    let insertIndex = -1;

    const overColumn = COLUMNS.find((c) => c.id === overId);
    if (overColumn) {
      // Dropped on column itself - add to end
      targetStatus = overColumn.id;
      insertIndex = -1; // Will append
    } else {
      // Dropped on another task
      const overTask = tasks.find((t) => t.id === overId);
      if (overTask) {
        targetStatus = overTask.status;
        const columnTasks = getTasksByStatus(targetStatus);
        insertIndex = columnTasks.findIndex((t) => t.id === overId);
      }
    }

    // Get current state of source and target columns
    const sourceStatus = tasks.find(t => t.id === activeId)?.status;
    
    // Build new task list with proper positions
    setTasks(prev => {
      // Remove active task from its current position
      const withoutActive = prev.filter(t => t.id !== activeId);
      
      // Get tasks in target column (without the active task)
      const targetColumnTasks = withoutActive
        .filter(t => t.status === targetStatus)
        .sort((a, b) => a.position - b.position);
      
      // Insert active task at the right position
      const updatedActiveTask = { ...activeTask, status: targetStatus, updatedAt: new Date() };
      
      if (insertIndex === -1 || insertIndex >= targetColumnTasks.length) {
        targetColumnTasks.push(updatedActiveTask);
      } else {
        targetColumnTasks.splice(insertIndex, 0, updatedActiveTask);
      }
      
      // Reindex the target column
      const reindexedTarget = reindexColumn(targetColumnTasks);
      
      // If source and target are different, also reindex source column
      let reindexedSource: Task[] = [];
      if (sourceStatus && sourceStatus !== targetStatus) {
        const sourceColumnTasks = withoutActive
          .filter(t => t.status === sourceStatus)
          .sort((a, b) => a.position - b.position);
        reindexedSource = reindexColumn(sourceColumnTasks);
      }
      
      // Build final task list
      const otherTasks = withoutActive.filter(t => 
        t.status !== targetStatus && t.status !== sourceStatus
      );
      
      const newTasks = [
        ...otherTasks,
        ...reindexedTarget,
        ...reindexedSource,
      ];
      
      // Notify parent of changes
      onTasksChange(newTasks);
      
      return newTasks;
    });
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
