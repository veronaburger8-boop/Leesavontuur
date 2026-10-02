"use client";

import { useState, useTransition } from "react";
import type { PictureResult } from "../actions";
import type { PictureEntry } from "@/lib/pictures/cards";
import { parsePictureFile } from "@/lib/pictures/cards";

/**
 * Import a pictures file: shows every picture first, so the admin can untick
 * any that aren't good enough, then saves only the ticked ones.
 */
export function ImportPictures({ action, lessonTitles }: { action: (entries: PictureEntry[]) => Promise<PictureResult[]>; lessonTitles: Record<string, string> }) {
  const [entries, setEntries] = useState<PictureEntry[]>([]);
  const [problems, setProblems] = useState<string[]>([]);
  const [skip, setSkip] = useState<Set<number>>(new Set());
  const [results, setResults] = useState<PictureResult[] | null>(null);
  const [pending, start] = useTransition();

  const read = async (file: File | undefined) => {
    setResults(null);
    setSkip(new Set());
    if (!file) return;
    try {
      const parsed = parsePictureFile(JSON.parse(await file.text()));
      setEntries(parsed.entries);
      setProblems(parsed.problems);
    } catch {
      setEntries([]);
      setProblems(["The file is not a valid pictures file."]);
    }
  };
  const chosen = entries.filter((_, i) => !skip.has(i));

  return (
    <div className="form">
      <div className="field">
        <label htmlFor="pictures-file">Pictures file (.json)</label>
        <input id="pictures-file" type="file" accept=".json,application/json" onChange={(e) => read(e.target.files?.[0])} />
      </div>
      {problems.length > 0 && (
        <div className="message error">
          <ul>
            {problems.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
      )}
      {entries.length > 0 && !results && (
        <>
          <p>
            Untick any picture that isn&apos;t right. <strong>{chosen.length}</strong> of {entries.length} will be saved.
          </p>
          <div className="picture-grid">
            {entries.map((e, i) => (
              <label key={i} className={`picture-pick${skip.has(i) ? " off" : ""}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={e.url} alt={e.word} loading="lazy" />
                <span>
                  <input
                    type="checkbox"
                    checked={!skip.has(i)}
                    onChange={() => setSkip((s) => (s.has(i) ? new Set([...s].filter((x) => x !== i)) : new Set(s).add(i)))}
                  />{" "}
                  <strong>{e.word}</strong>
                </span>
                <span className="sub">{lessonTitles[e.lessonId] ?? `⚠ unknown lesson ${e.lessonId}`}</span>
              </label>
            ))}
          </div>
          <div>
            <button className="primary" type="button" disabled={pending || chosen.length === 0} onClick={() => start(async () => setResults(await action(chosen)))}>
              {pending ? "Saving… (about a second per picture)" : `Save ${chosen.length} picture${chosen.length === 1 ? "" : "s"}`}
            </button>
          </div>
        </>
      )}
      {results && (
        <div aria-live="polite">
          <p className="message ok">
            Saved {results.filter((r) => r.ok).length} of {results.length}.
          </p>
          {results.some((r) => !r.ok) && (
            <div className="message error">
              <ul>
                {results
                  .filter((r) => !r.ok)
                  .map((r, i) => (
                    <li key={i}>
                      {r.word} ({lessonTitles[r.lessonId] ?? r.lessonId}): {r.error}
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
