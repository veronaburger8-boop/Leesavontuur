// Everything a child sees during a lesson, in the lesson's own language
// (brief, section 8: each sequence is fully in its own language).

import type { Language } from "@/lib/content/types";
import type { Band } from "./logic";

export const STEP_NAMES: Record<Language, string[]> = {
  af: ["Woordkaarte", "Oogoefening", "Getimede lees", "Begrip", "Woordherkenning", "Grammatika", "Woordeskat"],
  en: ["Word cards", "Eye exercise", "Timed reading", "Comprehension", "Word recognition", "Grammar", "Vocabulary"],
};

const text = {
  af: {
    level: "Vlak",
    start: "Begin die les",
    stepOf: (n: number, total: number, name: string) => `Stap ${n} van ${total}: ${name}`,
    done: "Les klaar!",
    // Word cards
    cardsIntro: "Leer eers hierdie moeilike woorde. Blaai met die pyltjies.",
    previous: "◀ Vorige",
    next: "Volgende ▶",
    ofN: (i: number, n: number) => `${i} van ${n}`,
    eg: "Bv.",
    otherLanguage: "Engels",
    toEye: "Na die oogoefening",
    // Eye exercise
    eyeIntro: "Kyk net mooi na die woorde. Jy hoef niks te klik nie.",
    eyeStart: "Begin",
    eyeDone: "Klaar met die oogoefening!",
    eyeSkipped: "Vandag lees jy eers self, sodat ons jou leesspoed leer ken. Die oogoefening kom volgende keer.",
    // Timed reading
    readIntro: "Lees die hele storie op jou eie tempo. Druk Klaar gelees wanneer jy klaar is.",
    startReading: "Begin lees",
    finished: "Klaar gelees",
    ownPace: "Lees op jou eie tempo.",
    page: (i: number, n: number) => `Bladsy ${i} van ${n}`,
    tooFastTitle: "Dit was baie vinnig!",
    tooFast: (wpm: number) => `${wpm} woorde per minuut. Het jy regtig elke woord gelees?`,
    readAgain: "Lees weer",
    continue: "Gaan voort",
    wpm: "woorde per minuut",
    readIn: (time: string, words: number) => `Jy het die storie in ${time} gelees (${words} woorde).`,
    // Questions
    compIntro: "Kies die regte antwoord. Jy kry twee kanse.",
    vocabIntro: "Watter woord pas in die sin?",
    questionOf: (i: number, n: number, score: number) => `Vraag ${i} van ${n} · punte: ${score}`,
    right: "Reg so!",
    rightSecond: "Reg, op die tweede probeer.",
    tryAgain: "Nie heeltemal nie. Probeer nog een keer.",
    shownGreen: "Die regte antwoord is groen gemerk.",
    nextQuestion: "Volgende vraag",
    finish: "Klaar",
    // Spelling
    spellIntro: "Die woord flits kort op die skerm. Tik dit dan so reg as moontlik.",
    ready: "Wys die woord",
    attempts: "Hier sien jy jou pogings.",
    attempt: (n: number) => `Probeer ${n}`,
    typeWord: "Tik die woord",
    check: "Kontroleer",
    lookAgain: "Nie heeltemal nie. Kyk weer mooi, die woord kom nog een keer.",
    rightSpelling: "Kyk mooi hoe die woord gespel word.",
    nextWord: "Volgende woord",
    wordOf: (i: number, n: number, score: number) => `Woord ${i} van ${n} · punte: ${score}`,
    // Grammar
    yourAnswer: "Jou antwoord",
    answerIs: (a: string) => `Die antwoord is: ${a}`,
    specialLetters: "Spesiale letters",
    // End
    report: "Jou verslag",
    comprehension: "Begrip",
    spelling: "Woordherkenning",
    grammar: "Grammatika",
    vocabulary: "Woordeskat",
    nextSpeed: (wpm: number) => `Volgende keer begin die oogoefening teen ${wpm} woorde per minuut.`,
    saving: "Besig om te stoor…",
    saved: "Jou verslag is gestoor.",
    saveFailed: "Kon nie die verslag stoor nie. Probeer asseblief weer.",
    retrySave: "Probeer weer stoor",
    backHome: "Terug",
    nextStep: (name: string) => `Volgende is: ${name}.`,
    goOn: "Gaan voort",
    showReport: "Wys my verslag",
    seeReport: "Kom kyk na jou verslag.",
  },
  en: {
    level: "Level",
    start: "Start the lesson",
    stepOf: (n: number, total: number, name: string) => `Step ${n} of ${total}: ${name}`,
    done: "Lesson done!",
    cardsIntro: "First learn these difficult words. Use the arrows to move between them.",
    previous: "◀ Back",
    next: "Next ▶",
    ofN: (i: number, n: number) => `${i} of ${n}`,
    eg: "e.g.",
    otherLanguage: "Afrikaans",
    toEye: "On to the eye exercise",
    eyeIntro: "Just watch the words carefully. You don't need to click anything.",
    eyeStart: "Start",
    eyeDone: "Eye exercise done!",
    eyeSkipped: "Today you read on your own first, so we can learn your reading speed. The eye exercise comes next time.",
    readIntro: "Read the whole story at your own pace. Press Finished when you're done.",
    startReading: "Start reading",
    finished: "Finished",
    ownPace: "Read at your own pace.",
    page: (i: number, n: number) => `Page ${i} of ${n}`,
    tooFastTitle: "That was very fast!",
    tooFast: (wpm: number) => `${wpm} words per minute. Did you really read every word?`,
    readAgain: "Read again",
    continue: "Continue",
    wpm: "words per minute",
    readIn: (time: string, words: number) => `You read the story in ${time} (${words} words).`,
    compIntro: "Choose the right answer. You get two tries.",
    vocabIntro: "Which word fits in the sentence?",
    questionOf: (i: number, n: number, score: number) => `Question ${i} of ${n} · points: ${score}`,
    right: "Well done!",
    rightSecond: "Right, on the second try.",
    tryAgain: "Not quite. Try once more.",
    shownGreen: "The right answer is marked in green.",
    nextQuestion: "Next question",
    finish: "Done",
    spellIntro: "The word flashes on the screen for a moment. Then type it as well as you can.",
    ready: "Show the word",
    attempts: "Your tries appear here.",
    attempt: (n: number) => `Try ${n}`,
    typeWord: "Type the word",
    check: "Check",
    lookAgain: "Not quite. Look carefully, the word comes once more.",
    rightSpelling: "Look carefully at how the word is spelt.",
    nextWord: "Next word",
    wordOf: (i: number, n: number, score: number) => `Word ${i} of ${n} · points: ${score}`,
    yourAnswer: "Your answer",
    answerIs: (a: string) => `The answer is: ${a}`,
    specialLetters: "Special letters",
    report: "Your report",
    comprehension: "Comprehension",
    spelling: "Word recognition",
    grammar: "Grammar",
    vocabulary: "Vocabulary",
    nextSpeed: (wpm: number) => `Next time the eye exercise starts at ${wpm} words per minute.`,
    saving: "Saving…",
    saved: "Your report has been saved.",
    saveFailed: "Couldn't save the report. Please try again.",
    retrySave: "Try saving again",
    backHome: "Back",
    nextStep: (name: string) => `Next up: ${name}.`,
    goOn: "Carry on",
    showReport: "Show my report",
    seeReport: "Come and see your report.",
  },
};

export type LessonText = (typeof text)["af"];
export const lessonText = (language: Language): LessonText => text[language];

// Encouraging messages between steps, by score band (brief, section 2).
// Draft wording for the owner to check.
const encouragement: Record<Language, Record<Band, (name: string) => string>> = {
  af: {
    perfect: (n) => `Uitstekend${n ? `, ${n}` : ""}! Alles reg!`,
    great: (n) => `Baie goed${n ? `, ${n}` : ""}!`,
    good: (n) => `Mooi so${n ? `, ${n}` : ""}! Jy leer elke dag.`,
    keepGoing: (n) => `Hou so aan${n ? `, ${n}` : ""}! Oefening maak meester.`,
    tryAgain: (n) => `Goed probeer${n ? `, ${n}` : ""}! Volgende keer gaan dit beter.`,
  },
  en: {
    perfect: (n) => `Excellent${n ? `, ${n}` : ""}! All correct!`,
    great: (n) => `Very good${n ? `, ${n}` : ""}!`,
    good: (n) => `Nice work${n ? `, ${n}` : ""}! You're learning every day.`,
    keepGoing: (n) => `Keep it up${n ? `, ${n}` : ""}! Practice makes perfect.`,
    tryAgain: (n) => `Good try${n ? `, ${n}` : ""}! It'll go better next time.`,
  },
};

export const encourage = (language: Language, b: Band, name: string) => encouragement[language][b](name);

/** The special letters that get their own buttons under every typing box. */
export const SPECIAL_LETTERS = ["ê", "ë", "é", "è", "ô", "ö", "û", "ï", "î", "'n"];
