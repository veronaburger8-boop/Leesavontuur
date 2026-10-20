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
  /** True when the family pays by card (Paystack or PayFast, charged monthly); false for bank transfers (EFT). */
  card: boolean;
}

/** The signed-in parent's subscription situation (the database decides). */
export async function getMyAccess(supabase: SupabaseClient): Promise<MyAccess> {
  const [{ data }, { data: sub }] = await Promise.all([
    supabase.rpc("my_access").single<Omit<MyAccess, "card">>(),
    supabase.from("subscriptions").select("provider, payfast_token, paystack_subscription").maybeSingle(),
  ]);
  const base = data ?? { billing_on: false, has_access: true, pilot: false, status: "none" as const, paid_until: null, free_lessons: 1 };
  return { ...base, card: Boolean(sub?.provider || sub?.payfast_token || sub?.paystack_subscription) };
}

/** May this child do another lesson or play? (Free lesson, pilot, or a paid-up subscription.) */
export async function learnerMayContinue(supabase: SupabaseClient, learnerId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc("learner_may_continue", { p_learner_id: learnerId });
  // If the question can't be answered, don't lock a child out: saving a
  // lesson is checked by the database anyway.
  if (error) return true;
  return data === true;
}

export interface EftDetails {
  bank: string;
  account_name: string;
  account_number: string;
  branch_code: string;
  account_type: string;
}

/** How parents can pay: by card (when the owner has switched it on) and/or by bank transfer (once the details are filled in). */
export async function getPaymentOptions(supabase: SupabaseClient): Promise<{ card: boolean; eft: EftDetails | null }> {
  const [{ data: setting }, { data: eft }] = await Promise.all([
    supabase.from("app_settings").select("value").eq("key", "card_payments").maybeSingle(),
    supabase.from("eft_details").select("bank, account_name, account_number, branch_code, account_type").maybeSingle<EftDetails>(),
  ]);
  return { card: Number(setting?.value) === 1, eft: eft && eft.account_number.trim() ? eft : null };
}
