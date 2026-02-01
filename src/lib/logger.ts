import { db } from "./db";

export type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR";

export interface LogEntry {
  id: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  userId?: string;
  path?: string;
  method?: string;
  statusCode?: number;
  duration?: number;
  createdAt: Date;
}

function generateId(): string {
  return `log_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

export async function log(
  level: LogLevel,
  message: string,
  options?: {
    context?: Record<string, unknown>;
    userId?: string;
    path?: string;
    method?: string;
    statusCode?: number;
    duration?: number;
  }
): Promise<void> {
  const id = generateId();
  const now = new Date().toISOString();
  const contextJson = options?.context ? JSON.stringify(options.context) : null;

  try {
    await db.execute({
      sql: `INSERT INTO Log (id, level, message, context, userId, path, method, statusCode, duration, createdAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        level,
        message,
        contextJson,
        options?.userId || null,
        options?.path || null,
        options?.method || null,
        options?.statusCode || null,
        options?.duration || null,
        now,
      ],
    });
  } catch (error) {
    // Don't throw on logging errors - just console.error
    console.error("Failed to write log:", error);
  }

  // Also log to console for development
  const logFn = level === "ERROR" ? console.error : level === "WARN" ? console.warn : console.log;
  logFn(`[${level}] ${message}`, options?.context || "");
}

export const logger = {
  debug: (message: string, options?: Parameters<typeof log>[2]) => log("DEBUG", message, options),
  info: (message: string, options?: Parameters<typeof log>[2]) => log("INFO", message, options),
  warn: (message: string, options?: Parameters<typeof log>[2]) => log("WARN", message, options),
  error: (message: string, options?: Parameters<typeof log>[2]) => log("ERROR", message, options),
};

export async function getLogs(options?: {
  level?: LogLevel;
  limit?: number;
  offset?: number;
  startDate?: Date;
  endDate?: Date;
}): Promise<LogEntry[]> {
  const conditions: string[] = [];
  const args: (string | number)[] = [];

  if (options?.level) {
    conditions.push("level = ?");
    args.push(options.level);
  }

  if (options?.startDate) {
    conditions.push("createdAt >= ?");
    args.push(options.startDate.toISOString());
  }

  if (options?.endDate) {
    conditions.push("createdAt <= ?");
    args.push(options.endDate.toISOString());
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const limit = options?.limit || 100;
  const offset = options?.offset || 0;

  const result = await db.execute({
    sql: `SELECT * FROM Log ${whereClause} ORDER BY createdAt DESC LIMIT ? OFFSET ?`,
    args: [...args, limit, offset],
  });

  return result.rows.map((row) => ({
    id: row.id as string,
    level: row.level as LogLevel,
    message: row.message as string,
    context: row.context ? JSON.parse(row.context as string) : undefined,
    userId: row.userId as string | undefined,
    path: row.path as string | undefined,
    method: row.method as string | undefined,
    statusCode: row.statusCode as number | undefined,
    duration: row.duration as number | undefined,
    createdAt: new Date(row.createdAt as string),
  }));
}

export async function getLogStats(): Promise<{
  total: number;
  byLevel: Record<LogLevel, number>;
  last24h: number;
}> {
  const [totalResult, levelResult, recentResult] = await Promise.all([
    db.execute("SELECT COUNT(*) as count FROM Log"),
    db.execute("SELECT level, COUNT(*) as count FROM Log GROUP BY level"),
    db.execute(
      "SELECT COUNT(*) as count FROM Log WHERE createdAt >= datetime('now', '-24 hours')"
    ),
  ]);

  const byLevel: Record<LogLevel, number> = { DEBUG: 0, INFO: 0, WARN: 0, ERROR: 0 };
  for (const row of levelResult.rows) {
    byLevel[row.level as LogLevel] = row.count as number;
  }

  return {
    total: totalResult.rows[0]?.count as number || 0,
    byLevel,
    last24h: recentResult.rows[0]?.count as number || 0,
  };
}
