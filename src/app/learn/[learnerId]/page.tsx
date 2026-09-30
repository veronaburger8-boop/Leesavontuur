import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAccount } from "@/lib/auth";
import { getLearner } from "@/lib/lesson/next";

export const metadata = { title: "Lees" };

/** The child's home: one big button per language, each in its own language. */
export default async function LearnerHome({ params }: PageProps<"/learn/[learnerId]">) {
  const { learnerId } = await params;
  const { supabase } = await requireAccount(`/learn/${learnerId}`);
  const [af, en] = await Promise.all([getLearner(supabase, learnerId, "af"), getLearner(supabase, learnerId, "en")]);
  if (!af || !en) notFound();
  return (
    <main>
      <section className="panel" style={{ textAlign: "center" }}>
        <h1>{af.name}</h1>
        <div className="cards" style={{ marginTop: 18 }}>
          <Link href={`/learn/${learnerId}/af`} className="card" lang="af" style={{ textDecoration: "none" }}>
            <h2>Afrikaans</h2>
            <p className="sub">Vlak {af.level}</p>
            <span className="button primary">Begin vandag se les</span>
          </Link>
          <Link href={`/learn/${learnerId}/en`} className="card" lang="en" style={{ textDecoration: "none" }}>
            <h2>English</h2>
            <p className="sub">Level {en.level}</p>
            <span className="button primary">Start today&apos;s lesson</span>
          </Link>
        </div>
      </section>
    </main>
  );
}
