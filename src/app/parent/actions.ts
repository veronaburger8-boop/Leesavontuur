"use server";

import { redirect } from "next/navigation";
import { requireParent } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Language } from "@/lib/content/types";
import { getResults } from "@/lib/lesson/next";
import type { SupabaseClient } from "@supabase/supabase-js";
import { AVAILABLE_LEVELS, availableTopics, GRADES, MAX_TOPICS, MIN_TOPICS } from "./data";

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
  const topics = [...new Set(formData.getAll("topics").map((v) => str(v)).filter((v) => /^[a-z0-9-]+$/.test(v)))];
  return { name, grade, levelAf: level("af"), levelEn: level("en"), valid, topics };
}

/** 2 to 4 topics, from the ones that can be chosen (fewer only while the library has fewer). */
async function topicsValid(supabase: SupabaseClient, topics: string[]) {
  const available = new Set((await availableTopics(supabase)).map((t) => t.key));
  return topics.every((t) => available.has(t)) && topics.length >= Math.min(MIN_TOPICS, available.size) && topics.length <= MAX_TOPICS;
}

/** Replaces a child's favourite topics (the database allows only the parent's own child). */
async function saveTopics(supabase: SupabaseClient, learnerId: string, topics: string[]) {
  const { error } = await supabase.from("learner_topics").delete().eq("learner_id", learnerId);
  if (error) return error;
  if (!topics.length) return null;
  return (await supabase.from("learner_topics").insert(topics.map((topic) => ({ learner_id: learnerId, topic })))).error;
}

export async function addLearner(formData: FormData) {
  const { supabase } = await requireParent("/parent");
  if (formData.get("consent") !== "yes") redirect("/parent/learners/new?error=consent");
  const f = readLearnerForm(formData);
  if (!f.valid) redirect("/parent/learners/new?error=name");
  if (!(await topicsValid(supabase, f.topics))) redirect("/parent/learners/new?error=topics");
  const { data: newId, error } = await supabase.rpc("create_learner", {
    p_name: f.name,
    p_grade: f.grade,
    p_level_af: f.levelAf,
    p_level_en: f.levelEn,
  });
  if (error) redirect(`/parent/learners/new?error=${/learner_limit/.test(error.message) ? "limit" : "failed"}`);
  await saveTopics(supabase, newId as string, f.topics);
  redirect("/parent?added=1");
}

export async function updateLearner(formData: FormData) {
  const { supabase } = await requireParent("/parent");
  const id = str(formData.get("id"));
  const f = readLearnerForm(formData);
  if (!f.valid) redirect(`/parent/learners/${id}?error=name`);
  if (!(await topicsValid(supabase, f.topics))) redirect(`/parent/learners/${id}?error=topics`);
  const { error, count } = await supabase.from("learners").update({ name: f.name, grade: f.grade }, { count: "exact" }).eq("id", id);
  if (error || count !== 1) redirect(`/parent/learners/${id}?error=failed`);
  const displayStyle = str(formData.get("display_style"));
  const eyeMode = str(formData.get("eye_mode_fixed"));
  const levelUpMode = str(formData.get("level_up_mode"));
  await supabase
    .from("learners")
    .update({
      display_style: ["plain", "border", "tint"].includes(displayStyle) ? displayStyle : "border",
      eye_mode_fixed: ["lines", "groups", "pacer"].includes(eyeMode) ? eyeMode : null,
      level_up_mode: levelUpMode === "auto" ? "auto" : "ask",
    })
    .eq("id", id);
  const { error: levelError } = await supabase.from("learner_languages").upsert([
    { learner_id: id, language: "af", level: f.levelAf },
    { learner_id: id, language: "en", level: f.levelEn },
  ]);
  if (levelError) redirect(`/parent/learners/${id}?error=failed`);
  if (await saveTopics(supabase, id, f.topics)) redirect(`/parent/learners/${id}?error=failed`);
  redirect(`/parent/learners/${id}?saved=1`);
}

export async function deleteLearner(formData: FormData) {
  const { supabase } = await requireParent("/parent");
  const id = str(formData.get("id"));
  if (formData.get("confirm") !== "yes") redirect(`/parent/learners/${id}?error=confirm`);
  const { error } = await supabase.from("learners").delete().eq("id", id);
  if (error) redirect(`/parent/learners/${id}?error=failed`);
  redirect("/parent?removed=1");
}

/** Deletes the account. Children and their results are removed with it (database cascade). */
export async function deleteAccount(formData: FormData) {
  const { supabase, user } = await requireParent("/parent/account");
  if (formData.get("confirm") !== "yes") redirect("/parent/account?error=confirm");
  const { error } = await createAdminClient().auth.admin.deleteUser(user.id);
  if (error) redirect("/parent/account?error=failed");
  // The account no longer exists, so only clear this browser's session.
  await supabase.auth.signOut({ scope: "local" });
  redirect("/?deleted=1");
}

const lang = (v: string): Language => (v === "en" ? "en" : "af");

/** The parent sets a child's level in one language (past results are kept). */
export async function setLevel(learnerId: string, language: Language, formData: FormData) {
  const { supabase } = await requireParent("/parent");
  const level = Number(formData.get("level"));
  if (!AVAILABLE_LEVELS.includes(level)) redirect("/parent?error=level");
  const { error } = await supabase
    .from("learner_languages")
    .upsert({ learner_id: learnerId, language: lang(language), level });
  // A new level starts fresh: an open request for the old level no longer applies.
  await supabase
    .from("level_requests")
    .update({ status: "cancelled", decided_at: new Date().toISOString() })
    .eq("learner_id", learnerId)
    .eq("language", lang(language))
    .in("status", ["pending", "approved"]);
  redirect(error ? "/parent?error=level" : "/parent?levelSet=1");
}

/** The parent approves (challenge lesson next) or declines the child's request to move up. */
export async function decideRequest(formData: FormData) {
  const { supabase } = await requireParent("/parent");
  const id = Number(formData.get("id"));
  const approve = formData.get("approve") === "yes";
  const { data: request } = await supabase
    .from("level_requests")
    .update({ status: approve ? "approved" : "declined", decided_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "pending")
    .select("learner_id, language")
    .maybeSingle<{ learner_id: string; language: Language }>();
  if (request && !approve) {
    // Ask again only after a few more lessons.
    const results = await getResults(supabase, request.learner_id, request.language);
    await supabase
      .from("learner_languages")
      .update({ prompt_snoozed_at: results.filter((r) => r.content_type === "lesson").length })
      .eq("learner_id", request.learner_id)
      .eq("language", request.language);
  }
  redirect("/parent");
}

/** The parent ignores a level suggestion; it comes back after a few more lessons. */
export async function ignoreSuggestion(formData: FormData) {
  const { supabase } = await requireParent("/parent");
  const learnerId = str(formData.get("learner_id"));
  const language = lang(str(formData.get("language")));
  const results = await getResults(supabase, learnerId, language);
  await supabase
    .from("learner_languages")
    .update({ suggestion_snoozed_at: results.filter((r) => r.content_type === "lesson").length })
    .eq("learner_id", learnerId)
    .eq("language", language);
  redirect("/parent");
}

export async function dismissNotification(formData: FormData) {
  const { supabase } = await requireParent("/parent");
  await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", Number(formData.get("id")));
  redirect("/parent");
}

/** Sets or removes the parent PIN that unlocks the parent area in child mode. */
export async function savePin(formData: FormData) {
  const { supabase } = await requireParent("/parent/account");
  if (formData.get("action") === "remove") {
    await supabase.rpc("set_parent_pin", { p_pin: null });
    redirect("/parent/account?pin=removed");
  }
  const pin = str(formData.get("pin"));
  if (!/^[0-9]{4}$/.test(pin)) redirect("/parent/account?pin=format");
  const { error } = await supabase.rpc("set_parent_pin", { p_pin: pin });
  redirect(error ? "/parent/account?pin=format" : "/parent/account?pin=saved");
}

/** A parent asks for a new topic for one child in one language. */
export async function requestTopic(formData: FormData) {
  const { supabase } = await requireParent("/parent");
  const text = str(formData.get("request")).replace(/\s+/g, " ");
  if (text.length < 2 || text.length > 60) redirect("/parent?topicError=length#topics");
  const { error } = await supabase.rpc("request_topic", {
    p_request: text,
    p_learner_id: str(formData.get("learner_id")),
    p_language: lang(str(formData.get("language"))),
  });
  if (error) redirect(`/parent?topicError=${/request_limit/.test(error.message) ? "limit" : "failed"}#topics`);
  redirect("/parent?topicSent=1#topics");
}
