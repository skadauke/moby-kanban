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
  // Log to console
  const logFn = level === "ERROR" ? console.error : level === "WARN" ? console.warn : console.log;
  logFn(`[${level}] ${message}`, options?.context || "");

  // In production, you might want to send logs to an external service
  // For now, we just use console logging
}

export const logger = {
  debug: (message: string, options?: Parameters<typeof log>[2]) => log("DEBUG", message, options),
  info: (message: string, options?: Parameters<typeof log>[2]) => log("INFO", message, options),
  warn: (message: string, options?: Parameters<typeof log>[2]) => log("WARN", message, options),
  error: (message: string, options?: Parameters<typeof log>[2]) => log("ERROR", message, options),
};

export async function getLogs(): Promise<LogEntry[]> {
  // Logging is now console-only; return empty array
  return [];
}

export async function getLogStats(): Promise<{
  total: number;
  byLevel: Record<LogLevel, number>;
  last24h: number;
}> {
  return {
    total: 0,
    byLevel: { DEBUG: 0, INFO: 0, WARN: 0, ERROR: 0 },
    last24h: 0,
  };
}
