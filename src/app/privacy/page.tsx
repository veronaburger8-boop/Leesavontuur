import { getLocale } from "@/lib/i18n";
import { PRIVACY_VERSION } from "@/lib/site";

export const metadata = { title: "Privacy policy" };

// DRAFT – must be checked by someone qualified in POPIA before launch
// (brief, section 10).

const af = (
  <>
    <h1>Privaatheidsbeleid</h1>
    <p className="message info">Konsep – hierdie beleid moet nog deur iemand met kennis van POPIA nagegaan word.</p>
    <h2>Wie ons is</h2>
    <p>Leesavontuur is &apos;n leesprogram vir kinders. Kontak: <a href="mailto:leesavontuur194@gmail.com">leesavontuur194@gmail.com</a>.</p>
    <h2>Wat ons oor jou kind bewaar</h2>
    <p>Net wat ons nodig het om die program te laat werk: &apos;n voornaam of bynaam, opsioneel &apos;n graad, die vlakke in elke taal, leesspoed en punte, en gunsteling-onderwerpe. Ons vra nie vir vanne, foto&apos;s, skole of ID-nommers nie.</p>
    <h2>Wat ons oor jou bewaar</h2>
    <p>Jou e-posadres, &apos;n wagwoord (versleutel) en, as jy wil, jou naam.</p>
    <h2>Toestemming</h2>
    <p>Net ouers of voogde skep rekeninge. Wanneer jy &apos;n kind byvoeg, gee jy toestemming dat ons hul inligting verwerk soos hier beskryf.</p>
    <h2>Wat ons nie doen nie</h2>
    <p>Geen advertensies nie. Ons verkoop of deel nie jou of jou kind se data met ander nie.</p>
    <h2>Jou regte</h2>
    <p>Jy kan enige tyd al ons data oor jou gesin aflaai, &apos;n kind verwyder of jou hele rekening verwyder, onder &quot;My rekening&quot; in die ouerarea.</p>
    <h2>Onderwerp-versoeke</h2>
    <p>Wanneer jy &apos;n nuwe onderwerp versoek, moet asseblief nie persoonlike inligting in die versoek insluit nie.</p>
  </>
);

const en = (
  <>
    <h1>Privacy policy</h1>
    <p className="message info">Draft – this policy still has to be checked by someone qualified in POPIA.</p>
    <h2>Who we are</h2>
    <p>Leesavontuur is a reading program for children. Contact: <a href="mailto:leesavontuur194@gmail.com">leesavontuur194@gmail.com</a>.</p>
    <h2>What we keep about your child</h2>
    <p>Only what the program needs to work: a first name or nickname, optionally a grade, their level in each language, reading speed and scores, and favourite topics. We don&apos;t ask for surnames, photos, schools or ID numbers.</p>
    <h2>What we keep about you</h2>
    <p>Your email address, a password (encrypted) and, if you like, your name.</p>
    <h2>Consent</h2>
    <p>Only parents or guardians create accounts. When you add a child, you give consent for us to process their information as described here.</p>
    <h2>What we don&apos;t do</h2>
    <p>No advertising. We don&apos;t sell or share your or your child&apos;s data with others.</p>
    <h2>Your rights</h2>
    <p>At any time you can download all our data about your family, remove a child or delete your whole account, under &quot;My account&quot; in the parent area.</p>
    <h2>Topic requests</h2>
    <p>When you request a new topic, please don&apos;t include personal information in the request.</p>
  </>
);

export default async function PrivacyPage() {
  const locale = await getLocale();
  return (
    <main>
      <article className="panel">
        {locale === "af" ? af : en}
        <p className="sub">Version {PRIVACY_VERSION}</p>
      </article>
    </main>
  );
}
