// Texts of the eye-movement games, in Afrikaans and English (each game is fully in its own language).

import type { EyeGame } from "./eyes";

export const EYE_TEXT = {
  af: {
    vuurvliegie: {
      title: "Vang die vuurvliegie",
      how: "Volg die vuurvliegie met jou oë. Wanneer dit goud word, tik dit vinnig!",
      wait: "Wag tot dit goud is …",
      follow: "Volg die vuurvliegie met jou oë.",
      caught: "Gevang!",
      missed: "Te stadig, probeer weer!",
    },
    soek: {
      title: "Soek-en-vind",
      how: "Soek al die woorde of letters wat bo staan. Kyk van links na regs, ry vir ry.",
      find: "Soek al die",
      left: (n: number) => `Nog ${n} om te vind`,
    },
    springwoorde: {
      title: "Spring-woorde",
      how: "'n Woord spring vinnig êrens op die skerm op. Kyk mooi, en kies dan die woord wat jy gesien het.",
      ready: "Kyk mooi …",
      which: "Watter woord het jy gesien?",
      right: "Reg!",
      wrong: (w: string) => `Dit was „${w}”.`,
    },
    start: "Begin",
    done: "Mooi so!",
    result: (hits: number, tries: number) => `Jy het ${hits} uit ${tries} reg gekry.`,
    harder: "Volgende keer gaan dit 'n bietjie vinniger!",
    again: "Speel weer",
    back: "Terug na speletjies",
    playArea: "Speelarea",
  },
  en: {
    vuurvliegie: {
      title: "Catch the firefly",
      how: "Follow the firefly with your eyes. When it turns gold, tap it quickly!",
      wait: "Wait until it's gold …",
      follow: "Follow the firefly with your eyes.",
      caught: "Caught it!",
      missed: "Too slow, try again!",
    },
    soek: {
      title: "Find it",
      how: "Find all the words or letters shown at the top. Look from left to right, row by row.",
      find: "Find all the",
      left: (n: number) => `${n} more to find`,
    },
    springwoorde: {
      title: "Jumping words",
      how: "A word jumps up quickly somewhere on the screen. Look carefully, then choose the word you saw.",
      ready: "Look carefully …",
      which: "Which word did you see?",
      right: "Right!",
      wrong: (w: string) => `It was “${w}”.`,
    },
    start: "Start",
    done: "Well done!",
    result: (hits: number, tries: number) => `You got ${hits} out of ${tries}.`,
    harder: "Next time it will go a little faster!",
    again: "Play again",
    back: "Back to games",
    playArea: "Play area",
  },
};

export const GAME_ICONS: Record<EyeGame | "galgie", string> = { vuurvliegie: "✨", soek: "🔍", springwoorde: "🦘", galgie: "🎈" };
