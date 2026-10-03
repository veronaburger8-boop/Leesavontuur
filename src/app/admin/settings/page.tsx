import { requireStaff } from "@/lib/auth";
import { saveSettings } from "../actions";

export const metadata = { title: "Settings" };

/** Thresholds for level prompts, challenge lessons and parent suggestions (brief, section 3). */
export default async function SettingsPage({ searchParams }: PageProps<"/admin/settings">) {
  const { supabase, profile } = await requireStaff();
  const [{ saved, error }, { data }] = await Promise.all([
    searchParams,
    supabase.from("app_settings").select("key, value, description").not("key", "in", "(billing_on,free_lessons)").order("key"),
  ]);
  const canEdit = profile.role === "admin";
  return (
    <section className="panel">
      <h1>Settings</h1>
      <p className="sub">These numbers decide when children are asked &quot;Ready for the next level?&quot; and when parents get level suggestions. Levels never change without the parent.</p>
      {saved && <p className="message ok">Saved.</p>}
      {error && <p className="message error">Please enter whole numbers from 0 to 100.</p>}
      <form action={saveSettings} className="form" style={{ maxWidth: 720 }}>
        {(data ?? []).map((s) => (
          <div key={s.key} className="field">
            <label htmlFor={s.key}>{s.description}</label>
            <input id={s.key} name={s.key} type="text" inputMode="numeric" defaultValue={Number(s.value)} disabled={!canEdit} style={{ maxWidth: 140 }} />
          </div>
        ))}
        {canEdit && (
          <div>
            <button className="primary" type="submit">
              Save
            </button>
          </div>
        )}
      </form>
    </section>
  );
}
