import { z } from "zod";

// Task creation schema
export const createTaskSchema = z.object({
  title: z
    .string()
    .transform((s) => s.trim())
    .pipe(z.string().min(1, "Title is required").max(200, "Title must be 200 characters or less")),
  description: z
    .string()
    .max(2000, "Description must be 2000 characters or less")
    .optional()
    .transform((s) => s?.trim() || undefined),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional().default("MEDIUM"),
  creator: z.enum(["MOBY", "STEPHAN"]).optional().default("MOBY"),
  projectId: z.string().uuid().optional(),
});

// Task update schema
export const updateTaskSchema = z.object({
  title: z
    .string()
    .transform((s) => s.trim())
    .pipe(z.string().min(1, "Title is required").max(200, "Title must be 200 characters or less"))
    .optional(),
  description: z
    .string()
    .max(2000, "Description must be 2000 characters or less")
    .nullable()
    .optional()
    .transform((s) => (s ? s.trim() : s)),
  status: z.enum(["BACKLOG", "IN_PROGRESS", "DONE"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  creator: z.enum(["MOBY", "STEPHAN"]).optional(),
  needsReview: z.boolean().optional(),
  position: z.number().int().min(0).optional(),
  projectId: z.string().uuid().nullable().optional(),
});

// Helper to format Zod errors
export function formatZodError(error: z.ZodError<unknown>): string {
  return error.issues.map((e) => e.message).join(", ");
}

// Sanitize string to prevent XSS
export function sanitizeString(input: string): string {
  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}
