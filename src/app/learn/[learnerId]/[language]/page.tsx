import Link from "next/link";
import { notFound } from "next/navigation";
import { LessonPlayer } from "@/components/lesson/lesson-player";
import { requireAccount } from "@/lib/auth";
import type { Language } from "@/lib/content/types";
import { getLearner, nextLesson } from "@/lib/lesson/next";
import { saveLessonResult } from "../../actions";

export const metadata = { title: "Les" };

const text = {
  af: {
    allDone: (n: number) => `Knap gedaan! Jy het al ${n} lesse op hierdie vlak gelees.`,
    allDoneHint: "Vra vir Ma of Pa of jy na die volgende vlak kan gaan, of lees 'n les weer.",
    readAgain: "Lees 'n les weer",
    none: "Daar is nog nie lesse op hierdie vlak nie.",
    back: "Terug",
  },
  en: {
    allDone: (n: number) => `Well done! You've read all ${n} lessons at this level.`,
    allDoneHint: "Ask Mom or Dad whether you can move to the next level, or read a lesson again.",
    readAgain: "Read a lesson again",
    none: "There are no lessons at this level yet.",
    back: "Back",
  },
};

export default async function LessonPage({ params, searchParams }: PageProps<"/learn/[learnerId]/[language]">) {
  const [{ learnerId, language: lang }, { again }] = await Promise.all([params, searchParams]);
  if (lang !== "af" && lang !== "en") notFound();
  const language = lang as Language;
  const { supabase } = await requireAccount(`/learn/${learnerId}/${language}`);
  const learner = await getLearner(supabase, learnerId, language);
  if (!learner) notFound();
  const next = await nextLesson(supabase, learner, language, again === "1");
  const t = text[language];
  const home = `/learn/${learnerId}`;

  if (next.kind !== "lesson")
    return (
      <main lang={language}>
        <section className="panel celebrate">
          {next.kind === "allDone" ? (
            <>
              <div className="stars" aria-hidden="true">
                ⭐⭐⭐
              </div>
              <h2>{t.allDone(next.count)}</h2>
              <p className="sub">{t.allDoneHint}</p>
              <div className="player-nav">
                <Link className="button" href={home}>
                  {t.back}
                </Link>
                <Link className="button primary" href={`/learn/${learnerId}/${language}?again=1`}>
                  {t.readAgain}
                </Link>
              </div>
            </>
          ) : (
            <>
              <h2>{t.none}</h2>
              <div className="player-nav">
                <Link className="button primary" href={home}>
                  {t.back}
                </Link>
              </div>
            </>
          )}
        </section>
      </main>
    );

  return (
    <main>
      <LessonPlayer
        key={next.lesson.id}
        lesson={next.lesson}
        learnerName={learner.name}
        readingWpm={learner.readingWpm}
        eyeMode={next.eyeMode}
        onSave={saveLessonResult.bind(null, learner.id, next.lesson.id)}
        backHref={home}
      />
    </main>
  );
}
