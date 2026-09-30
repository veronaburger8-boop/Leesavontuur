import Link from "next/link";
import { notFound } from "next/navigation";
import { availableTopics, MAX_TOPICS, MIN_TOPICS, topicName } from "@/app/parent/data";
import { requireAccount } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { saveChildTopics } from "../../actions";

export const metadata = { title: "My onderwerpe" };

const text = {
  af: {
    title: "Waaroor lees jy graag?",
    hint: `Kies ${MIN_TOPICS} tot ${MAX_TOPICS} onderwerpe.`,
    save: "Klaar",
    back: "Terug",
    count: `Kies asseblief ${MIN_TOPICS} tot ${MAX_TOPICS}.`,
    saved: "Gestoor! Jou volgende lesse gaan oor hierdie onderwerpe.",
  },
  en: {
    title: "What do you like to read about?",
    hint: `Choose ${MIN_TOPICS} to ${MAX_TOPICS} topics.`,
    save: "Done",
    back: "Back",
    count: `Please choose ${MIN_TOPICS} to ${MAX_TOPICS}.`,
    saved: "Saved! Your next lessons will be about these topics.",
  },
};

const ICONS: Record<string, string> = {
  animals: "🐘",
  nature: "🌳",
  sport: "⚽",
  space: "🚀",
  food: "🍲",
  adventure: "🗺️",
  body: "💪",
  "how-things-work": "⚙️",
};

/** The child picks their own favourite topics (brief, section 4). */
export default async function ChildTopics({ params, searchParams }: PageProps<"/learn/[learnerId]/topics">) {
  const { learnerId } = await params;
  const { supabase } = await requireAccount(`/learn/${learnerId}/topics`);
  const [{ error, saved }, locale, topics, { data: learner }, { data: chosen }] = await Promise.all([
    searchParams,
    getLocale(),
    availableTopics(supabase),
    supabase.from("learners").select("id, name").eq("id", learnerId).maybeSingle(),
    supabase.from("learner_topics").select("topic").eq("learner_id", learnerId),
  ]);
  if (!learner) notFound();
  const t = text[locale];
  const mine = new Set((chosen ?? []).map((c) => c.topic as string));
  return (
    <main>
      <section className="panel" style={{ textAlign: "center" }}>
        <h1>{t.title}</h1>
        <p className="sub">{t.hint}</p>
        {error && <p className="message error">{t.count}</p>}
        {saved && <p className="message ok">{t.saved}</p>}
        <form action={saveChildTopics.bind(null, learnerId)}>
          <div className="topic-choices big">
            {topics.map((topic) => (
              <label key={topic.key} className="check topic-choice">
                <input type="checkbox" name="topics" value={topic.key} defaultChecked={mine.has(topic.key)} />
                <span>
                  <span aria-hidden="true">{ICONS[topic.key] ?? "📖"}</span> {topicName(topic, locale)}
                </span>
              </label>
            ))}
          </div>
          <div className="row" style={{ justifyContent: "center", marginTop: 18 }}>
            <button className="primary" type="submit">
              {t.save}
            </button>
            <Link className="button" href={`/learn/${learnerId}`}>
              {t.back}
            </Link>
          </div>
        </form>
      </section>
    </main>
  );
}
