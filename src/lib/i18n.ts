// Interface text for the public pages and the parent area, in Afrikaans and
// English. The parent area can be switched between the two (brief, section 8).
// The admin area is in English.

import { cookies } from "next/headers";

export type Locale = "af" | "en";
export const LOCALE_COOKIE = "lang";

export async function getLocale(): Promise<Locale> {
  const value = (await cookies()).get(LOCALE_COOKIE)?.value;
  return value === "en" ? "en" : "af";
}

const text = {
  siteTagline: { af: "Lees elke dag 'n bietjie beter.", en: "Read a little better every day." },
  switchLanguage: { af: "English", en: "Afrikaans" },
  switchLanguageLabel: { af: "Switch to English", en: "Skakel oor na Afrikaans" },
  logIn: { af: "Teken in", en: "Log in" },
  logOut: { af: "Teken uit", en: "Log out" },
  signUp: { af: "Skep 'n rekening", en: "Create an account" },
  parentArea: { af: "Ouerarea", en: "Parent area" },
  adminArea: { af: "Admin", en: "Admin" },
  privacyPolicy: { af: "Privaatheidsbeleid", en: "Privacy policy" },

  homeTitle: { af: "'n Leesprogram vir Suid-Afrikaanse kinders", en: "A reading program for South African children" },
  homeIntro: {
    af: "Kort daaglikse lesse in Afrikaans en Engels bou leesspoed, begrip, spelling, grammatika en woordeskat. Elke kind werk op hul eie vlak in elke taal.",
    en: "Short daily lessons in Afrikaans and English build reading speed, comprehension, spelling, grammar and vocabulary. Every child works at their own level in each language.",
  },
  homeParents: {
    af: "Net ouers skep rekeninge. Jy voeg jou kinders by, kies hul vlakke en sien hul vordering.",
    en: "Only parents create accounts. You add your children, choose their levels and see their progress.",
  },

  email: { af: "E-posadres", en: "Email address" },
  password: { af: "Wagwoord", en: "Password" },
  newPassword: { af: "Nuwe wagwoord", en: "New password" },
  passwordHint: { af: "Minstens 8 karakters.", en: "At least 8 characters." },
  yourName: { af: "Jou naam (opsioneel)", en: "Your name (optional)" },
  forgotPassword: { af: "Wagwoord vergeet?", en: "Forgot your password?" },
  noAccount: { af: "Nog nie 'n rekening nie?", en: "No account yet?" },
  haveAccount: { af: "Het jy reeds 'n rekening?", en: "Already have an account?" },
  acceptPrivacy: {
    af: "Ek het die privaatheidsbeleid gelees en aanvaar dit.",
    en: "I have read and accept the privacy policy.",
  },
  loginFailed: { af: "Die e-posadres of wagwoord is verkeerd.", en: "The email address or password is wrong." },
  signupFailed: { af: "Kon nie die rekening skep nie:", en: "Could not create the account:" },
  mustAcceptPrivacy: { af: "Aanvaar asseblief die privaatheidsbeleid.", en: "Please accept the privacy policy." },
  passwordTooShort: { af: "Die wagwoord moet minstens 8 karakters hê.", en: "The password must have at least 8 characters." },
  tooManyRequests: {
    af: "Ons het so pas vir jou 'n e-pos gestuur. Kyk in jou inkassie (en die gemorspos). As niks opdaag nie, wag 'n minuut en probeer weer.",
    en: "We've just sent you an email. Check your inbox (and spam folder). If nothing arrives, wait a minute and try again.",
  },
  checkEmail: {
    af: "Kyk in jou e-pos vir 'n skakel om jou rekening te bevestig.",
    en: "Check your email for a link to confirm your account.",
  },
  resetTitle: { af: "Kies 'n nuwe wagwoord", en: "Choose a new password" },
  resetIntro: {
    af: "Tik jou e-posadres. Ons stuur vir jou 'n skakel om 'n nuwe wagwoord te kies.",
    en: "Type your email address. We'll send you a link to choose a new password.",
  },
  sendLink: { af: "Stuur die skakel", en: "Send the link" },
  resetSent: {
    af: "As daar 'n rekening met hierdie e-posadres is, stuur ons nou 'n skakel. Kyk in jou e-pos.",
    en: "If there is an account with this email address, we're sending a link now. Check your email.",
  },
  savePassword: { af: "Stoor wagwoord", en: "Save password" },
  passwordSaved: { af: "Jou nuwe wagwoord is gestoor.", en: "Your new password has been saved." },
  linkExpired: {
    af: "Die skakel het verval of is reeds gebruik. Vra asseblief 'n nuwe een.",
    en: "The link has expired or was already used. Please ask for a new one.",
  },
  somethingWrong: { af: "Iets het skeefgeloop. Probeer asseblief weer.", en: "Something went wrong. Please try again." },

  hello: { af: "Hallo", en: "Hello" },
  yourChildren: { af: "Jou kinders", en: "Your children" },
  noChildren: {
    af: "Jy het nog nie 'n kind bygevoeg nie. Voeg jou eerste kind by om te begin.",
    en: "You haven't added a child yet. Add your first child to begin.",
  },
  addChild: { af: "Voeg 'n kind by", en: "Add a child" },
  editChild: { af: "Wysig", en: "Edit" },
  childName: { af: "Voornaam of bynaam", en: "First name or nickname" },
  childNameHint: {
    af: "Net 'n voornaam of bynaam. Moet asseblief nie 'n van gebruik nie.",
    en: "Just a first name or nickname. Please don't use a surname.",
  },
  grade: { af: "Graad (opsioneel)", en: "Grade (optional)" },
  gradeNone: { af: "Sê liewer nie", en: "Prefer not to say" },
  gradeR: { af: "Graad R", en: "Grade R" },
  gradeN: { af: "Graad", en: "Grade" },
  levels: { af: "Vlakke", en: "Levels" },
  levelIn: { af: "Vlak in", en: "Level in" },
  level: { af: "Vlak", en: "Level" },
  languageAf: { af: "Afrikaans", en: "Afrikaans" },
  languageEn: { af: "Engels", en: "English" },
  levelHint: {
    af: "Kies 'n beginvlak vir elke taal. Jy kan dit enige tyd verander. 'n Plasingstoets om die regte vlak te vind, kom binnekort.",
    en: "Choose a starting level for each language. You can change it at any time. A placement test to find the right level is coming soon.",
  },
  consentChild: {
    af: "Ek is hierdie kind se ouer of voog. Ek gee toestemming dat Leesavontuur hul voornaam, graad en leesresultate verwerk soos in die privaatheidsbeleid beskryf.",
    en: "I am this child's parent or guardian. I consent to Leesavontuur processing their first name, grade and reading results as described in the privacy policy.",
  },
  mustConsent: { af: "Gee asseblief toestemming om voort te gaan.", en: "Please give consent to continue." },
  nameRequired: { af: "Tik asseblief 'n naam (hoogstens 40 letters).", en: "Please type a name (at most 40 letters)." },
  save: { af: "Stoor", en: "Save" },
  saved: { af: "Gestoor.", en: "Saved." },
  cancel: { af: "Kanselleer", en: "Cancel" },
  back: { af: "Terug", en: "Back" },
  deleteChild: { af: "Verwyder hierdie kind", en: "Remove this child" },
  deleteChildWarning: {
    af: "Dit verwyder die kind en al hul resultate permanent. Dit kan nie ontdoen word nie.",
    en: "This permanently removes the child and all their results. It can't be undone.",
  },
  confirmDelete: { af: "Ek verstaan. Verwyder permanent.", en: "I understand. Remove permanently." },

  account: { af: "My rekening", en: "My account" },
  accountLanguage: { af: "Taal van die ouerarea", en: "Language of the parent area" },
  yourData: { af: "Jou data", en: "Your data" },
  downloadData: { af: "Laai al ons data oor jou gesin af", en: "Download all our data about your family" },
  downloadDataHint: {
    af: "'n Lêer met jou rekening, jou kinders en hul vlakke.",
    en: "A file with your account, your children and their levels.",
  },
  deleteAccount: { af: "Verwyder my rekening", en: "Delete my account" },
  deleteAccountWarning: {
    af: "Dit verwyder jou rekening, al jou kinders en al hul resultate permanent. Dit kan nie ontdoen word nie.",
    en: "This permanently deletes your account, all your children and all their results. It can't be undone.",
  },
  confirmDeleteAccount: { af: "Ek verstaan. Verwyder my rekening permanent.", en: "I understand. Delete my account permanently." },
  accountDeleted: { af: "Jou rekening is verwyder.", en: "Your account has been deleted." },
} as const;

export type TextKey = keyof typeof text;

export function translator(locale: Locale) {
  return (key: TextKey) => text[key][locale];
}
