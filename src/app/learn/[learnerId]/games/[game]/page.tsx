import { notFound } from "next/navigation";
import { EyeGamePlayer } from "@/components/games/eye-game-player";
import { requireAccount } from "@/lib/auth";
import type { Language, Lesson } from "@/lib/content/types";
import { EYE_GAMES, type EyeGame } from "@/lib/games/eyes";
import { galgieWords } from "@/lib/games/galgie";
import { getLearner } from "@/lib/lesson/next";
import { saveEyeGame } from "../../../actions";

export const metadata = { title: "Speletjies · Games" };

/** One eye-movement game, with words from the child's level (published lessons only). */
export default async function EyeGamePage({ params, searchParams }: PageProps<"/learn/[learnerId]/games/[game]">) {
  const [{ learnerId, game }, sp] = await Promise.all([params, searchParams]);
  if (!EYE_GAMES.includes(game as EyeGame)) notFound();
  const language: Language = sp.language === "en" ? "en" : "af";
  const { supabase } = await requireAccount(`/learn/${learnerId}/games/${game}`);
  const learner = await getLearner(supabase, learnerId, language);
  if (!learner) notFound();
  const [{ data: lessons }, { data: progress }] = await Promise.all([
    supabase.from("content_items").select("data").eq("type", "lesson").eq("language", language).eq("level", learner.level).eq("status", "published"),
    supabase.from("game_progress").select("step").eq("learner_id", learnerId).eq("game", game).maybeSingle(),
  ]);
  const words = galgieWords((lessons ?? []).map((r) => r.data as Pick<Lesson, "spelling" | "wordCards">)).filter((w) => w.length <= 9);
  return (
    <main>
      <EyeGamePlayer
        game={game as EyeGame}
        language={language}
        step={(progress?.step as number | undefined) ?? 1}
        words={words}
        backHref={`/learn/${learnerId}/games`}
        onFinish={saveEyeGame.bind(null, learnerId, game as EyeGame, language, learner.level)}
      />
    </main>
  );
}
