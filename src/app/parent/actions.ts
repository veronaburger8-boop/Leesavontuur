"use server";

import { redirect } from "next/navigation";
import { requireAccount } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { AVAILABLE_LEVELS, GRADES } from "./data";

const str = (v: FormDataEntryValue | null) => (typeof v === "string" ? v.trim() : "");

function readLearnerForm(formData: FormData) {
  const name = str(formData.get("name"));
  const gradeRaw = str(formData.get("grade"));
  const grade = gradeRaw === "" ? null : Number(gradeRaw);
  const level = (lang: string) => {
    const n = Number(formData.get(`level_${lang}`));
    return AVAILABLE_LEVELS.includes(n) ? n : 1;
  };
  const valid = name.length >= 1 && name.length <= 40 && (grade === null || GRADES.includes(grade));
  return { name, grade, levelAf: level("af"), levelEn: level("en"), valid };
}

export async function addLearner(formData: FormData) {
  const { supabase } = await requireAccount("/parent");
  if (formData.get("consent") !== "yes") redirect("/parent/learners/new?error=consent");
  const f = readLearnerForm(formData);
  if (!f.valid) redirect("/parent/learners/new?error=name");
  const { error } = await supabase.rpc("create_learner", {
    p_name: f.name,
    p_grade: f.grade,
    p_level_af: f.levelAf,
    p_level_en: f.levelEn,
  });
  if (error) redirect(`/parent/learners/new?error=${/learner_limit/.test(error.message) ? "limit" : "failed"}`);
  redirect("/parent?added=1");
}

export async function updateLearner(formData: FormData) {
  const { supabase } = await requireAccount("/parent");
  const id = str(formData.get("id"));
  const f = readLearnerForm(formData);
  if (!f.valid) redirect(`/parent/learners/${id}?error=name`);
  const { error, count } = await supabase.from("learners").update({ name: f.name, grade: f.grade }, { count: "exact" }).eq("id", id);
  if (error || count !== 1) redirect(`/parent/learners/${id}?error=failed`);
  const { error: levelError } = await supabase.from("learner_languages").upsert([
    { learner_id: id, language: "af", level: f.levelAf },
    { learner_id: id, language: "en", level: f.levelEn },
  ]);
  if (levelError) redirect(`/parent/learners/${id}?error=failed`);
  redirect(`/parent/learners/${id}?saved=1`);
}

export async function deleteLearner(formData: FormData) {
  const { supabase } = await requireAccount("/parent");
  const id = str(formData.get("id"));
  if (formData.get("confirm") !== "yes") redirect(`/parent/learners/${id}?error=confirm`);
  const { error } = await supabase.from("learners").delete().eq("id", id);
  if (error) redirect(`/parent/learners/${id}?error=failed`);
  redirect("/parent?removed=1");
}

/** Deletes the account. Children and their results are removed with it (database cascade). */
export async function deleteAccount(formData: FormData) {
  const { supabase, user } = await requireAccount("/parent/account");
  if (formData.get("confirm") !== "yes") redirect("/parent/account?error=confirm");
  const { error } = await createAdminClient().auth.admin.deleteUser(user.id);
  if (error) redirect("/parent/account?error=failed");
  // The account no longer exists, so only clear this browser's session.
  await supabase.auth.signOut({ scope: "local" });
  redirect("/?deleted=1");
}
