"use client";

import type { Language } from "@/lib/content/types";
import type { EyeGame } from "@/lib/games/eyes";
import { EyeShell } from "./eye-shell";
import { FindIt } from "./find-it";
import { Firefly } from "./firefly";
import { JumpingWords } from "./jumping-words";

/** Picks the game; a new round number restarts it fresh for "Play again". */
export function EyeGamePlayer({
  game,
  language,
  step,
  words,
  backHref,
  onFinish,
}: {
  game: EyeGame;
  language: Language;
  step: number;
  words: string[];
  backHref: string;
  onFinish: (seconds: number, tries: number, hits: number) => Promise<boolean>;
}) {
  return (
    <EyeShell
      game={game}
      language={language}
      backHref={backHref}
      onFinish={onFinish}
      renderGame={({ finish }) =>
        game === "vuurvliegie" ? (
          <Firefly step={step} language={language} finish={finish} />
        ) : game === "soek" ? (
          <FindIt step={step} words={words} language={language} finish={finish} />
        ) : (
          <JumpingWords step={step} words={words} language={language} finish={finish} />
        )
      }
    />
  );
}
