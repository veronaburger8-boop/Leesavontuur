import Link from "next/link";
import { notFound } from "next/navigation";
import { Galgie } from "@/components/games/galgie";
import { requireAccount } from "@/lib/auth";
import type { Language, Lesson } from "@/lib/content/types";
import { galgieWords, shuffled } from "@/lib/games/galgie";
import { getLearner } from "@/lib/lesson/next";
import { saveGameRound } from "../../actions";

export const metadata = { title: "Galgie" };

/** Galgie with words from the child's level in one language (published lessons only). */
export default async function GalgiePage({ params, searchParams }: PageProps<"/learn/[learnerId]/galgie">) {
  const [{ learnerId }, sp] = await Promise.all([params, searchParams]);
  const language: Language = sp.language === "en" ? "en" : "af";
  const { supabase } = await requireAccount(`/learn/${learnerId}/galgie`);
  const learner = await getLearner(supabase, learnerId, language);
  if (!learner) notFound();
  const { data } = await supabase
    .from("content_items")
    .select("data")
    .eq("type", "lesson")
    .eq("language", language)
    .eq("level", learner.level)
    .eq("status", "published");
  const words = shuffled(galgieWords((data ?? []).map((r) => r.data as Pick<Lesson, "spelling" | "wordCards">)));
  const back = `/learn/${learnerId}`;
  if (!words.length)
    return (
      <main>
        <section className="panel">
          <p>{language === "af" ? "Daar is nog nie woorde vir jou vlak nie." : "There are no words for your level yet."}</p>
          <Link className="button" href={back}>
            {language === "af" ? "Terug" : "Back"}
          </Link>
        </section>
      </main>
    );
  return (
    <main>
      <Galgie words={words} language={language} backHref={back} onRound={saveGameRound.bind(null, learnerId, language, learner.level)} />
    </main>
  );
}
