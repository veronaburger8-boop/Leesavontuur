"use client";

import { useActionState } from "react";
import { importContent, type ImportState } from "../actions";

const initial: ImportState = { done: false, added: [], replaced: [], skipped: [], errors: [], warnings: [] };

export function ImportForm() {
  const [state, action, pending] = useActionState(importContent, initial);
  return (
    <>
      <form action={action} className="form">
        <div className="field">
          <label htmlFor="file">File (.json)</label>
          <input id="file" name="file" type="file" accept=".json,application/json" required />
        </div>
        <div className="field">
          <label htmlFor="status">Status for the imported items</label>
          <select id="status" name="status" defaultValue="file">
            <option value="file">As written in the file</option>
            <option value="in_review">In review</option>
            <option value="draft">Draft</option>
          </select>
        </div>
        <label className="check">
          <input type="checkbox" name="replace" value="yes" />
          <span>Replace items that already exist (this overwrites any changes made in the library)</span>
        </label>
        <div>
          <button className="primary" type="submit" disabled={pending}>
            {pending ? "Importing…" : "Import"}
          </button>
        </div>
      </form>
      {state.done && (
        <div role="status" style={{ marginTop: 20 }}>
          {state.message && <p className={`message ${state.errors.length ? "error" : "ok"}`}>{state.message}</p>}
          <ul>
            <li>Added: {state.added.length}</li>
            <li>Replaced: {state.replaced.length}</li>
            <li>Skipped because they already exist: {state.skipped.length}</li>
            <li>Not imported because of errors: {state.errors.length}</li>
          </ul>
          {state.errors.length > 0 && (
            <>
              <h2>Errors</h2>
              <ul>
                {state.errors.map((e) => (
                  <li key={`${e.index}-${e.id}`}>
                    <strong>{e.id ?? `Item ${e.index + 1}`}</strong>: {e.messages.join("; ")}
                  </li>
                ))}
              </ul>
            </>
          )}
          {state.warnings.length > 0 && (
            <>
              <h2>Saved as &quot;In review&quot; because of these problems</h2>
              <ul>
                {state.warnings.map((w) => (
                  <li key={w.id}>
                    <strong>{w.id}</strong>: {w.messages.join("; ")}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </>
  );
}
