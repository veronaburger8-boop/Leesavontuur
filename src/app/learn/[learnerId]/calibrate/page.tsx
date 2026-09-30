import Link from "next/link";
import { notFound } from "next/navigation";
import { CalibrationPlayer } from "@/components/lesson/calibration-player";
import { requireAccount } from "@/lib/auth";
import type { Language } from "@/lib/content/types";
import { getLocale } from "@/lib/i18n";
import { calibrationChoices, getCalibration, getLearner } from "@/lib/lesson/next";
import { lessonText } from "@/lib/lesson/text";
import { saveCalibrationResult } from "../../actions";

export const metadata = { title: "Plasingstoets" };

/** The placement test: the child picks 1 of 3 passages at the level the parent chose, then reads it. */
export default async function CalibratePage({ params, searchParams }: PageProps<"/learn/[learnerId]/calibrate">) {
  const [{ learnerId }, sp] = await Promise.all([params, searchParams]);
  const language: Language = sp.language === "en" ? "en" : "af";
  const { supabase } = await requireAccount(`/learn/${learnerId}`);
  const learner = await getLearner(supabase, learnerId, language);
  if (!learner) notFound();
  const level = Math.min(15, Math.max(1, Number(sp.level) || learner.level));
  const t = lessonText(language);
  const home = `/learn/${learnerId}`;

  if (typeof sp.item === "string") {
    const item = await getCalibration(supabase, sp.item, language);
    if (!item) notFound();
    return (
      <main>
        <CalibrationPlayer
          item={item}
          learnerName={learner.name}
          displayStyle={learner.displayStyle}
          onSave={saveCalibrationResult.bind(null, learner.id, item.id)}
          learnerId={learner.id}
          parentLocale={await getLocale()}
          backHref={home}
        />
      </main>
    );
  }

  const choices = await calibrationChoices(supabase, language, level);
  return (
    <main lang={language}>
      <section className="panel" style={{ textAlign: "center" }}>
        <h1>{t.calibrationTitle}</h1>
        <p className="sub">
          {t.level} {level}
        </p>
        <h2>{t.chooseStory}</h2>
        <div className="cards" style={{ marginTop: 14 }}>
          {choices.map((c) => (
            <Link key={c.id} className="card" style={{ textDecoration: "none" }} href={`/learn/${learnerId}/calibrate?language=${language}&level=${level}&item=${c.id}`}>
              <h3>{c.title}</h3>
              <span className="button primary">{t.startReading}</span>
            </Link>
          ))}
        </div>
        {choices.length === 0 && <p className="message info">–</p>}
        <div className="player-nav">
          <Link className="button" href={home}>
            {t.backHome}
          </Link>
        </div>
      </section>
    </main>
  );
}
