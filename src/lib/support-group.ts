import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/** True once the owner has saved the WhatsApp group's invite link (visitors can't read it themselves). */
export async function supportGroupOpen(): Promise<boolean> {
  try {
    const { data } = await createAdminClient().from("support_group").select("invite_link").eq("id", 1).maybeSingle();
    return Boolean(data?.invite_link);
  } catch {
    return false;
  }
}
