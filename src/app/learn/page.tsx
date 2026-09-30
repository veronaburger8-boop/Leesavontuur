import Link from "next/link";
import { requireAccount } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";

export const metadata = { title: "Lees" };

/** "Who's reading today?": the family's children, for the child to pick themselves. */
export default async function WhoIsReading() {
  const { supabase } = await requireAccount("/learn");
  const [{ data }, locale] = await Promise.all([supabase.from("learners").select("id, name").order("created_at"), getLocale()]);
  return (
    <main>
      <section className="panel" style={{ textAlign: "center" }}>
        <h1>{locale === "af" ? "Wie lees vandag?" : "Who's reading today?"}</h1>
        <div className="cards" style={{ marginTop: 18 }}>
          {(data ?? []).map((l) => (
            <Link key={l.id} href={`/learn/${l.id}`} className="card" style={{ textDecoration: "none" }}>
              <h2>{l.name}</h2>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
