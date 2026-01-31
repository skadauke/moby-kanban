import { getTasks } from "@/lib/actions";
import { BoardWrapper } from "@/components/BoardWrapper";

export const dynamic = "force-dynamic";

export default async function Home() {
  const tasks = await getTasks();

  return (
    <main className="min-h-screen bg-zinc-900">
      <BoardWrapper initialTasks={tasks} />
    </main>
  );
}
