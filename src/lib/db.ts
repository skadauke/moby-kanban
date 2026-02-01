import { createClient } from "@libsql/client";

// Create libSQL client for Turso
export const db = createClient({
  url: process.env.TURSO_DATABASE_URL || "file:./prisma/dev.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});
