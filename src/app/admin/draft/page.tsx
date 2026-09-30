import { requireStaff } from "@/lib/auth";
import { aiConfigured } from "@/lib/content/draft";
import { estimateCost } from "@/lib/content/draft-map";
import { draftWithAI } from "../actions";
import { DraftForm } from "./draft-form";

export const metadata = { title: "Draft with AI" };
// Writing lessons takes a few minutes.
export const maxDuration = 300;

const one = (v: string | string[] | undefined) => (typeof v === "string" ? v : "");
const when = (s: string) => new Date(s).toLocaleString("en-ZA", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Johannesburg" });

export default async function DraftPage({ searchParams }: PageProps<"/admin/draft">) {
  const { supabase } = await requireStaff();
  const [sp, { data: topics }, { data: runs }] = await Promise.all([
    searchParams,
    supabase.from("topics").select("key, name_en").order("sort_order"),
    supabase.from("draft_runs").select("id, created_at, language, level, topic, requested, saved, input_tokens, output_tokens, error").order("id", { ascending: false }).limit(10),
  ]);
  const configured = aiConfigured();
  return (
    <>
      <section className="panel">
        <h1>Draft with AI</h1>
        <p>
          Claude writes new lessons from the writing guide in the brief. They are saved as <span className="badge draft">Draft</span> only: nothing goes live until
          you have read it, fixed anything that needs fixing, and pressed Publish.
        </p>
        {!configured && (
          <div className="message info">
            <strong>Not set up yet (Nog nie opgestel nie).</strong> AI drafting needs an Anthropic account with credit and its API key saved in Vercel as{" "}
            <code>ANTHROPIC_API_KEY</code>. Everything else in the admin area works without it.
          </div>
        )}
        <DraftForm
          action={draftWithAI}
          topics={topics ?? []}
          configured={configured}
          defaults={{ topic: one(sp.topic), language: one(sp.language) === "en" ? "en" : "af", level: Number(one(sp.level)) || 1, count: Number(one(sp.count)) || 3 }}
        />
      </section>
      {(runs ?? []).length > 0 && (
        <section className="panel">
          <h2>Recent runs</h2>
          <ul>
            {(runs ?? []).map((r) => (
              <li key={r.id}>
                {when(r.created_at)} · {r.language === "af" ? "Afrikaans" : "English"} Level {r.level} · {r.topic} · {r.saved} of {r.requested} saved · about US$
                {estimateCost(r.input_tokens, r.output_tokens).toFixed(2)}
                {r.error ? ` · ${r.error}` : ""}
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
