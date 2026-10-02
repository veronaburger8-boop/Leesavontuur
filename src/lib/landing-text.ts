// The words on the welcome page for first-time visitors, in Afrikaans and
// English. The owner can change any of this wording: keep both languages in step.

import type { Locale } from "@/lib/i18n";

const af = {
  pill: "Gratis tydens die loodsprojek",
  title: "Lees elke dag 'n bietjie, en kyk hoe jou kind groei",
  lead: "Leesavontuur is 'n leesprogram in Afrikaans en Engels vir Suid-Afrikaanse kinders. Kort daaglikse lesse, oogspeletjies en woordkaarte met prente bou leesspoed, begrip en woordeskat – elke kind op sy of haar eie vlak.",
  join: "Sluit aan by die loodsprojek",
  logIn: "Ek het reeds 'n rekening",
  heroShotAlt: "'n Kind se tuisblad op Leesavontuur, met Mika die meerkat, die speletjies, en die lesse in Afrikaans en Engels.",

  howTitle: "Hoe werk dit?",
  steps: [
    { title: "Skep 'n rekening", text: "Voeg jou kind by (net 'n voornaam is nodig) en kies 'n vlak, of laat 'n kort plasingstoets die vlak kies." },
    { title: "'n Kort les elke dag", text: "Woordkaarte, 'n oogoefening, getimede lees en vrae. Jou kind werk alleen of saam met jou." },
    { title: "Sien die vordering", text: "Jou verslae wys leesspoed en punte vir elke les. Jy besluit wanneer jou kind 'n vlak opskuif." },
  ],

  insideTitle: "Wat is binne?",
  features: [
    {
      shot: null as string | null,
      title: "Twee tale, elk op sy eie vlak",
      text: "100 lesse in Afrikaans en Engels oor vyf vlakke. Jou kind kan byvoorbeeld op Vlak 3 in Afrikaans en Vlak 1 in Engels wees.",
      alt: "",
    },
    {
      shot: "reading",
      title: "Elke les in sewe stappe",
      text: "Woordkaarte, 'n oogoefening, getimede lees, begripsvrae, woordherkenning, grammatika en woordeskat – in groot, rustige letters.",
      alt: "Die getimede lees-stap van 'n les, met die leesstuk in groot letters.",
    },
    {
      shot: "galgie",
      title: "Speletjies wat die oë oefen",
      text: "Galgie met ballonne, Vang die vuurvliegie, Soek-en-vind en Spring-woorde oefen die oë om vinnig en glad te lees.",
      alt: "Die Galgie-speletjie: Mika die meerkat met drie ballonne, en 'n woord om te raai.",
    },
    {
      shot: "chart",
      title: "Verslae vir ouers",
      text: "Elke les se leesspoed en punte in 'n tabel, met 'n grafiek wat wys hoe die leesspoed groei. Druk dit of stoor dit as PDF.",
      alt: "'n Grafiek van 'n kind se leesspoed wat oor drie weke van 38 tot 53 woorde per minuut styg.",
    },
  ],
  topics: "Kinders kies hul gunsteling-onderwerpe: diere, die natuur, sport, die ruimte, kos, avontuur, my liggaam en hoe dinge werk.",

  sampleTitle: "Kom loer in 'n les",
  sampleIntro: (title: string) => `'n Woordkaart en die begin van die leesstuk “${title}” (Vlak 1).`,
  otherLanguage: "Engels",
  eg: "Bv.",

  parentsTitle: "Vir ouers",
  parents: [
    { title: "Gemaak in Suid-Afrika", text: "Vir Suid-Afrikaanse kinders, met Afrikaans en Engels wat presies reg is." },
    { title: "Veilig en privaat", text: "Geen advertensies en geen opsporing nie. Ons vra net 'n voornaam vir jou kind." },
    { title: "Jy is in beheer", text: "Die ouerarea is met 'n PIN gesluit. Niks skuif sonder jou besluit 'n vlak op nie." },
  ],

  priceTitle: "Prys",
  priceFree: "Gratis",
  priceFreeText: "tydens die loodsprojek",
  priceThen: "Daarna R99 per gesin per maand",
  pricePoints: [
    "Tot twee kinders per gesin",
    "Ons laat jou minstens 14 dae vooraf weet voordat enige betaling begin",
    "Jy betaal niks tensy jy self 'n intekening begin",
    "Kanselleer enige tyd",
  ],

  faqTitle: "Vrae",
  faq: [
    {
      q: "Vir watter ouderdom is Leesavontuur?",
      a: "Vir kinders wat leer lees tot kinders wat al selfversekerd lees. Daar is vyf vlakke in elke taal. Jy kies die vlak, of laat 'n kort plasingstoets help.",
    },
    {
      q: "Hoe lank vat 'n les?",
      a: "Ongeveer 15 minute, afhangende van jou kind. Een les per dag is genoeg.",
    },
    {
      q: "Werk dit op 'n selfoon of tablet?",
      a: "Ja. Leesavontuur werk in die webblaaier op 'n rekenaar, tablet of selfoon. Jy hoef niks af te laai nie.",
    },
    {
      q: "Kan my kind in albei tale lees?",
      a: "Ja. Afrikaans en Engels is twee aparte reekse, elk met sy eie vlak, leesspoed en verslae.",
    },
    {
      q: "Wat gebeur ná die loodsprojek?",
      a: "Ons laat jou minstens 14 dae vooraf weet. As jy wil aanhou, begin jy self 'n intekening van R99 per maand. Indien nie, betaal jy niks.",
    },
  ],

  endTitle: "Gereed vir die leesavontuur?",
  endText: "Skep 'n gratis rekening en begin vandag.",
};

const en: typeof af = {
  pill: "Free during the pilot",
  title: "A little reading every day, and watch your child grow",
  lead: "Leesavontuur is a reading program in Afrikaans and English for South African children. Short daily lessons, eye games and word cards with pictures build reading speed, comprehension and vocabulary – every child at their own level.",
  join: "Join the pilot",
  logIn: "I already have an account",
  heroShotAlt: "A child's home screen on Leesavontuur, with Mika the meerkat, the games, and the lessons in Afrikaans and English.",

  howTitle: "How does it work?",
  steps: [
    { title: "Create an account", text: "Add your child (only a first name is needed) and choose a level, or let a short placement test choose it." },
    { title: "A short lesson every day", text: "Word cards, an eye exercise, timed reading and questions. Your child works alone or with you." },
    { title: "See the progress", text: "Your reports show reading speed and scores for every lesson. You decide when your child moves up a level." },
  ],

  insideTitle: "What's inside?",
  features: [
    {
      shot: null,
      title: "Two languages, each at its own level",
      text: "100 lessons in Afrikaans and English across five levels. Your child can, for example, be at Level 3 in Afrikaans and Level 1 in English.",
      alt: "",
    },
    {
      shot: "reading",
      title: "Every lesson in seven steps",
      text: "Word cards, an eye exercise, timed reading, comprehension questions, word recognition, grammar and vocabulary – in large, calm letters.",
      alt: "The timed reading step of a lesson, with the passage in large letters.",
    },
    {
      shot: "galgie",
      title: "Games that train the eyes",
      text: "Hangman with balloons, Catch the firefly, Find it and Jumping words train the eyes to read quickly and smoothly.",
      alt: "The Hangman game: Mika the meerkat with three balloons, and a word to guess.",
    },
    {
      shot: "chart",
      title: "Reports for parents",
      text: "Every lesson's reading speed and scores in a table, with a chart that shows how reading speed grows. Print it or save it as a PDF.",
      alt: "A chart of a child's reading speed rising from 38 to 53 words per minute over three weeks.",
    },
  ],
  topics: "Children choose their favourite topics: animals, nature, sport, space, food, adventure, my body and how things work.",

  sampleTitle: "Take a peek inside a lesson",
  sampleIntro: (title: string) => `A word card and the start of the passage “${title}” (Level 1).`,
  otherLanguage: "Afrikaans",
  eg: "e.g.",

  parentsTitle: "For parents",
  parents: [
    { title: "Made in South Africa", text: "For South African children, with Afrikaans and English that are exactly right." },
    { title: "Safe and private", text: "No advertising and no tracking. We only ask for your child's first name." },
    { title: "You're in control", text: "The parent area is locked with a PIN. Nothing moves up a level without your decision." },
  ],

  priceTitle: "Price",
  priceFree: "Free",
  priceFreeText: "during the pilot",
  priceThen: "Then R99 per family per month",
  pricePoints: [
    "Up to two children per family",
    "We tell you at least 14 days before any payment starts",
    "You pay nothing unless you start a subscription yourself",
    "Cancel any time",
  ],

  faqTitle: "Questions",
  faq: [
    {
      q: "What age is Leesavontuur for?",
      a: "For children who are learning to read up to children who already read confidently. There are five levels in each language. You choose the level, or let a short placement test help.",
    },
    {
      q: "How long does a lesson take?",
      a: "About 15 minutes, depending on your child. One lesson a day is enough.",
    },
    {
      q: "Does it work on a phone or tablet?",
      a: "Yes. Leesavontuur works in the web browser on a computer, tablet or phone. There's nothing to download.",
    },
    {
      q: "Can my child read in both languages?",
      a: "Yes. Afrikaans and English are two separate sequences, each with its own level, reading speed and reports.",
    },
    {
      q: "What happens after the pilot?",
      a: "We tell you at least 14 days in advance. If you want to carry on, you start a subscription of R99 per month yourself. If not, you pay nothing.",
    },
  ],

  endTitle: "Ready for the reading adventure?",
  endText: "Create a free account and start today.",
};

export function landingText(locale: Locale) {
  return locale === "en" ? en : af;
}
