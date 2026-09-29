import "server-only";
import { createClient } from "@supabase/supabase-js";
import { supabaseUrl } from "./env";

/**
 * Supabase client with the secret key. It bypasses row level security, so use
 * it only on the server and only for tasks a user cannot do with their own
 * access, such as deleting their account.
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!key) throw new Error("SUPABASE_SECRET_KEY is not set. See .env.example.");
  return createClient(supabaseUrl(), key, { auth: { autoRefreshToken: false, persistSession: false } });
}
