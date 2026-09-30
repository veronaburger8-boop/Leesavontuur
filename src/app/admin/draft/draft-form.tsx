"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { DraftState } from "../actions";

export function DraftForm({
  action,
  topics,
  defaults,
  configured,
}: {
  action: (prev: DraftState, formData: FormData) => Promise<DraftState>;
  topics: { key: string; name_en: string }[];
  defaults: { topic: string; language: string; level: number; count: number };
  configured: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, { done: false, saved: [], errors: [], cost: null });
  return (
    <>
      <form action={formAction} className="form">
        <div className="row">
          <div>
            <label htmlFor="language">Language</label>
            <select id="language" name="language" defaultValue={defaults.language} style={{ width: "auto" }}>
              <option value="af">Afrikaans</option>
              <option value="en">English</option>
            </select>
          </div>
          <div>
            <label htmlFor="level">Level</label>
            <select id="level" name="level" defaultValue={defaults.level} style={{ width: "auto" }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  Level {n}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="topic">Topic</label>
            <select id="topic" name="topic" defaultValue={defaults.topic} style={{ width: "auto" }} required>
              <option value="">Choose…</option>
              {topics.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.name_en}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="count">How many</label>
            <select id="count" name="count" defaultValue={defaults.count} style={{ width: "auto" }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <button className="primary" type="submit" disabled={!configured || pending}>
            {pending ? "Drafting… (this takes a few minutes)" : "Draft passages"}
          </button>
        </div>
      </form>
      <div aria-live="polite">
        {state.done && state.saved.length > 0 && (
          <div className="message ok" style={{ marginTop: 14 }}>
            <strong>Saved as drafts:</strong>
            <ul>
              {state.saved.map((s) => (
                <li key={s.id}>
                  <Link href={`/admin/content/${s.id}`}>{s.title}</Link>
                  {s.warnings.length ? ` – ${s.warnings.join(" ")}` : ""}
                </li>
              ))}
            </ul>
          </div>
        )}
        {state.errors.length > 0 && (
          <div className="message error" style={{ marginTop: 14 }}>
            <ul>
              {state.errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </div>
        )}
        {state.cost !== null && <p className="sub">Estimated cost of this run: US${state.cost.toFixed(2)}</p>}
      </div>
    </>
  );
}
