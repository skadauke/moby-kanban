// This file is kept for backwards compatibility
// All database operations now use Supabase via ./supabase/server.ts

export { createClient as getDb } from "./supabase/server";
