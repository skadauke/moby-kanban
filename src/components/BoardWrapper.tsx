"use client";

import { useState } from "react";
import { Task } from "@/lib/types";
import { Header } from "./Header";
import { Board } from "./Board";

interface BoardWrapperProps {
  initialTasks: Task[];
}

export function BoardWrapper({ initialTasks }: BoardWrapperProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);

  const handleTaskCreated = (task: Task) => {
    setTasks((prev) => [...prev, task]);
  };

  return (
    <>
      <Header onTaskCreated={handleTaskCreated} />
      <Board initialTasks={tasks} key={tasks.length} />
    </>
  );
}
