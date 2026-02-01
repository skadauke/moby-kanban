import { NextRequest, NextResponse } from "next/server";
import { getLogs, getLogStats, LogLevel } from "@/lib/logger";

// GET /api/logs - Get logs with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const level = searchParams.get("level") as LogLevel | null;
    const limit = searchParams.get("limit");
    const offset = searchParams.get("offset");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const stats = searchParams.get("stats");

    // If stats=true, return statistics instead of logs
    if (stats === "true") {
      const logStats = await getLogStats();
      return NextResponse.json(logStats);
    }

    const logs = await getLogs({
      level: level || undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });

    return NextResponse.json(logs);
  } catch (error) {
    console.error("GET /api/logs error:", error);
    return NextResponse.json(
      { error: "Failed to fetch logs" },
      { status: 500 }
    );
  }
}
