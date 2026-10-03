import Link from "next/link";
import { notFound } from "next/navigation";
import { EYE_TEXT, GAME_ICONS } from "@/lib/games/eye-text";
import { requireAccount } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { Locked } from "@/components/locked";
import { learnerMayContinue } from "@/lib/subscription";

export const metadata = { title: "Speletjies · Games" };

const GAMES = [
  { key: "galgie", af: "Galgie", en: "Hangman", hrefFor: (id: string, l: string) => `/learn/${id}/galgie?language=${l}` },
  ...(["vuurvliegie", "soek", "springwoorde"] as const).map((g) => ({
    key: g,
    af: EYE_TEXT.af[g].title,
    en: EYE_TEXT.en[g].title,
    hrefFor: (id: string, l: string) => `/learn/${id}/games/${g}?language=${l}`,
  })),
];

/** The games corner: Galgie and the eye-movement games, each in Afrikaans or English. */
export default async function GamesPage({ params }: PageProps<"/learn/[learnerId]/games">) {
  const { learnerId } = await params;
  const { supabase } = await requireAccount(`/learn/${learnerId}/games`);
  const [{ data: learner }, locale] = await Promise.all([supabase.from("learners").select("id").eq("id", learnerId).maybeSingle(), getLocale()]);
  if (!learner) notFound();
  if (!(await learnerMayContinue(supabase, learnerId)))
    return (
      <main>
        <Locked languages={["af", "en"]} back={`/learn/${learnerId}`} />
      </main>
    );
  return (
    <main>
      <section className="panel" style={{ textAlign: "center" }}>
        <h1>🎲 Speletjies · Games</h1>
        <div className="cards games-list">
          {GAMES.map((g) => (
            <div key={g.key} className="card">
              <h2>
                <span aria-hidden="true">{GAME_ICONS[g.key as keyof typeof GAME_ICONS]}</span> <span lang="af">{g.af}</span>
                <span className="sub" lang="en" style={{ display: "block", fontSize: 16 }}>
                  {g.en}
                </span>
              </h2>
              <div className="row" style={{ justifyContent: "center" }}>
                <Link className="button small primary" href={g.hrefFor(learnerId, "af")} lang="af" aria-label={`${g.af} – Afrikaans`}>
                  Afrikaans
                </Link>
                <Link className="button small primary" href={g.hrefFor(learnerId, "en")} lang="en" aria-label={`${g.en} – English`}>
                  English
                </Link>
              </div>
            </div>
          ))}
        </div>
        <p style={{ marginTop: 18 }}>
          <Link className="button" href={`/learn/${learnerId}`}>
            {locale === "af" ? "Terug" : "Back"}
          </Link>
        </p>
      </section>
    </main>
  );
}
