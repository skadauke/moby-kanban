import { NextRequest, NextResponse } from "next/server";
import { getLogs, getLogStats } from "@/lib/logger";

// GET /api/logs - Get logs with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const stats = searchParams.get("stats");

    // If stats=true, return statistics instead of logs
    if (stats === "true") {
      const logStats = await getLogStats();
      return NextResponse.json(logStats);
    }

    // Logging is now console-only; return empty array
    const logs = await getLogs();
    return NextResponse.json(logs);
  } catch (error) {
    console.error("GET /api/logs error:", error);
    return NextResponse.json(
      { error: "Failed to fetch logs" },
      { status: 500 }
    );
  }
}
