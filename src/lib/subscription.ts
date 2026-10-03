import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

export type SubscriptionStatus = "none" | "pending" | "active" | "cancelled" | "failed";

export interface MyAccess {
  billing_on: boolean;
  has_access: boolean;
  pilot: boolean;
  status: SubscriptionStatus;
  paid_until: string | null;
  free_lessons: number;
}

/** The signed-in parent's subscription situation (the database decides). */
export async function getMyAccess(supabase: SupabaseClient): Promise<MyAccess> {
  const { data } = await supabase.rpc("my_access").single<MyAccess>();
  return data ?? { billing_on: false, has_access: true, pilot: false, status: "none", paid_until: null, free_lessons: 1 };
}

/** May this child do another lesson or play? (Free lesson, pilot, or a paid-up subscription.) */
export async function learnerMayContinue(supabase: SupabaseClient, learnerId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc("learner_may_continue", { p_learner_id: learnerId });
  // If the question can't be answered, don't lock a child out: saving a
  // lesson is checked by the database anyway.
  if (error) return true;
  return data === true;
}
