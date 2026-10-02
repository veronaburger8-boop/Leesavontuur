import Link from "next/link";
import { getLocale } from "@/lib/i18n";
import { PRIVACY_VERSION } from "@/lib/site";

export const metadata = { title: "Privacy policy" };

// DRAFT – must be checked by someone qualified in POPIA before launch
// (brief, section 10). It describes what the site actually stores: keep it in
// step with the database when features change, and change PRIVACY_VERSION.

const EMAIL = "leesavontuur194@gmail.com";
const mail = <a href={`mailto:${EMAIL}`}>{EMAIL}</a>;

const af = (
  <>
    <h1>Privaatheidsbeleid</h1>
    <p className="message info">Konsep – hierdie beleid moet nog deur iemand met kennis van POPIA nagegaan word.</p>

    <h2>Wie ons is</h2>
    <p>
      Leesavontuur (www.leesavontuur.co.za) is &apos;n leesprogram vir Suid-Afrikaanse kinders. Ons is die verantwoordelike party vir jou en jou kind se
      persoonlike inligting. Vrae, versoeke of klagtes oor privaatheid: skryf aan ons Inligtingsbeampte by {mail}.
    </p>

    <h2>Wat ons oor jou kind bewaar</h2>
    <p>Net wat die program nodig het om te werk:</p>
    <ul>
      <li>&apos;n voornaam of bynaam, en as jy wil, die graad;</li>
      <li>die vlak in elke taal en gunsteling-onderwerpe;</li>
      <li>lesresultate: datum, leesspoed (woorde per minuut) en punte vir begrip, woordherkenning, grammatika en woordeskat;</li>
      <li>plasingstoetse, versoeke om na die volgende vlak te gaan, en jou besluite daaroor;</li>
      <li>speletjies: hoe lank gespeel is, hoeveel reg was, en die moeilikheidsvlak van elke speletjie.</li>
    </ul>
    <p>Ons vra nie vir vanne, geboortedatums, foto&apos;s, skole, adresse of ID-nommers nie. Die oogspeletjies gebruik nie die kamera nie.</p>

    <h2>Wat ons oor jou bewaar</h2>
    <ul>
      <li>jou e-posadres, &apos;n wagwoord (versleutel) en, as jy wil, jou naam;</li>
      <li>jou taalkeuse en, as jy een kies, &apos;n ouer-PIN (versleutel);</li>
      <li>wanneer jy die privaatheidsbeleid aanvaar het, en watter weergawe;</li>
      <li>onderwerpe wat jy versoek, en kennisgewings aan jou.</li>
    </ul>

    <h2>Waarom ons dit gebruik</h2>
    <p>
      Net om die leesprogram aan te bied: om die regte les op die regte vlak te kies, die oogoefening by jou kind se spoed aan te pas, vir jou verslae te wys,
      jou aan te meld en vir jou noodsaaklike e-posse te stuur (soos om jou e-posadres te bevestig of jou wagwoord te herstel). Ons gebruik dit nie vir
      advertensies of bemarking nie.
    </p>

    <h2>Toestemming vir kinders</h2>
    <p>
      Net ouers of voogde skep rekeninge. Wanneer jy &apos;n kind byvoeg, bevestig jy dat jy die ouer of voog is en gee jy toestemming dat ons jou kind se
      inligting verwerk soos hier beskryf. Jy kan hierdie toestemming enige tyd terugtrek deur die kind te verwyder.
    </p>

    <h2>Wie ons help (diensverskaffers)</h2>
    <p>Ons verkoop of deel nie jou data nie. Ons gebruik wel hierdie diensverskaffers om die webwerf te laat werk:</p>
    <ul>
      <li>
        <strong>Supabase</strong> – die databasis en aanmelding. Die data word in <strong>Ierland (Europese Unie)</strong> gestoor.
      </li>
      <li>
        <strong>Vercel</strong> – bedien die webwerf. Dit verwerk tegniese inligting soos jou IP-adres om bladsye te wys en die webwerf te beveilig.
      </li>
      <li>
        <strong>Resend</strong> – stuur die e-posse van die webwerf, vanaf Ierland (Europese Unie).
      </li>
    </ul>
    <p>
      Omdat hierdie dienste buite Suid-Afrika werk, word jou inligting na die buiteland gestuur. Dit gebeur net na lande en dienste wat inligting minstens so
      goed beskerm as wat POPIA vereis (die Europese Unie se databeskermingswet, die GDPR, is van toepassing). Wanneer ons nuwe lesse met behulp van KI
      opstel, stuur ons geen persoonlike inligting nie.
    </p>

    <h2>Koekies</h2>
    <p>
      Ons gebruik net koekies wat die webwerf nodig het: om jou aangemeld te hou, jou taalkeuse te onthou, en om te weet wanneer &apos;n kind lees (sodat die
      ouerarea gesluit is). Geen advertensie- of opsporingskoekies nie, en geen webwerf-statistiek wat jou volg nie.
    </p>

    <h2>Hoe ons dit beskerm</h2>
    <p>
      Alles word oor &apos;n versleutelde verbinding (https) gestuur. Toegangsreëls in die databasis sorg dat elke ouer net sy of haar eie kinders sien.
      Ons span sien nie kinders se name nie. Wagwoorde en PIN&apos;s word net versleuteld bewaar.
    </p>

    <h2>Hoe lank ons dit bewaar</h2>
    <p>
      Solank jou rekening bestaan. As jy &apos;n kind of jou rekening verwyder, word die inligting dadelik uit die databasis verwyder; rugsteunkopieë word
      binne ongeveer 30 dae oorskryf.
    </p>

    <h2>Jou regte</h2>
    <ul>
      <li>Laai enige tyd al ons data oor jou gesin af, onder &quot;My rekening&quot; in die ouerarea.</li>
      <li>Verander jou kind se besonderhede onder &quot;Wysig&quot;, of verwyder &apos;n kind of jou hele rekening.</li>
      <li>Vra ons by {mail} om inligting reg te stel, of beswaar te maak teen hoe ons dit gebruik.</li>
      <li>
        As jy nie tevrede is met ons antwoord nie, kan jy &apos;n klagte by die Inligtingsreguleerder indien:{" "}
        <a href="https://inforegulator.org.za" target="_blank" rel="noreferrer">
          inforegulator.org.za
        </a>
        .
      </li>
    </ul>

    <h2>Onderwerp-versoeke</h2>
    <p>Wanneer jy &apos;n nuwe onderwerp versoek, moet asseblief nie persoonlike inligting in die versoek insluit nie.</p>

    <h2>Veranderinge</h2>
    <p>
      As ons hierdie beleid verander, plaas ons die nuwe weergawe hier. Wanneer betaalde intekeninge begin, sal ons hierdie beleid aanvul met hoe betalings
      hanteer word. Sien ook ons <Link href="/terms">gebruiksvoorwaardes</Link>.
    </p>
  </>
);

const en = (
  <>
    <h1>Privacy policy</h1>
    <p className="message info">Draft – this policy still has to be checked by someone qualified in POPIA.</p>

    <h2>Who we are</h2>
    <p>
      Leesavontuur (www.leesavontuur.co.za) is a reading program for South African children. We are the responsible party for your and your child&apos;s
      personal information. Questions, requests or complaints about privacy: write to our Information Officer at {mail}.
    </p>

    <h2>What we keep about your child</h2>
    <p>Only what the program needs to work:</p>
    <ul>
      <li>a first name or nickname and, if you like, the grade;</li>
      <li>the level in each language and favourite topics;</li>
      <li>lesson results: date, reading speed (words per minute) and scores for comprehension, word recognition, grammar and vocabulary;</li>
      <li>placement tests, requests to move to the next level, and your decisions about them;</li>
      <li>games: how long was played, how many were right, and the difficulty level of each game.</li>
    </ul>
    <p>We don&apos;t ask for surnames, dates of birth, photos, schools, addresses or ID numbers. The eye games don&apos;t use the camera.</p>

    <h2>What we keep about you</h2>
    <ul>
      <li>your email address, a password (encrypted) and, if you like, your name;</li>
      <li>your language choice and, if you choose one, a parent PIN (encrypted);</li>
      <li>when you accepted the privacy policy, and which version;</li>
      <li>topics you request, and notifications to you.</li>
    </ul>

    <h2>Why we use it</h2>
    <p>
      Only to provide the reading program: to choose the right lesson at the right level, match the eye exercise to your child&apos;s speed, show you
      reports, log you in and send you essential emails (such as confirming your email address or resetting your password). We don&apos;t use it for
      advertising or marketing.
    </p>

    <h2>Consent for children</h2>
    <p>
      Only parents or guardians create accounts. When you add a child, you confirm that you are the parent or guardian and give consent for us to process
      your child&apos;s information as described here. You can withdraw this consent at any time by removing the child.
    </p>

    <h2>Who helps us (service providers)</h2>
    <p>We don&apos;t sell or share your data. We do use these service providers to run the website:</p>
    <ul>
      <li>
        <strong>Supabase</strong> – the database and logins. The data is stored in <strong>Ireland (European Union)</strong>.
      </li>
      <li>
        <strong>Vercel</strong> – serves the website. It processes technical information such as your IP address to show pages and keep the site secure.
      </li>
      <li>
        <strong>Resend</strong> – sends the website&apos;s emails, from Ireland (European Union).
      </li>
    </ul>
    <p>
      Because these services operate outside South Africa, your information is transferred abroad. This only happens to countries and services that
      protect information at least as well as POPIA requires (the European Union&apos;s data protection law, the GDPR, applies). When we draft new lessons
      with the help of AI, we send no personal information.
    </p>

    <h2>Cookies</h2>
    <p>
      We only use cookies the website needs: to keep you logged in, remember your language, and know when a child is reading (so the parent area is
      locked). No advertising or tracking cookies, and no website statistics that follow you.
    </p>

    <h2>How we protect it</h2>
    <p>
      Everything is sent over an encrypted connection (https). Access rules in the database make sure each parent sees only their own children. Our team
      doesn&apos;t see children&apos;s names. Passwords and PINs are only stored encrypted.
    </p>

    <h2>How long we keep it</h2>
    <p>
      For as long as your account exists. When you remove a child or your account, the information is deleted from the database straight away; backup
      copies are overwritten within about 30 days.
    </p>

    <h2>Your rights</h2>
    <ul>
      <li>Download all our data about your family at any time, under &quot;My account&quot; in the parent area.</li>
      <li>Change your child&apos;s details under &quot;Edit&quot;, or remove a child or your whole account.</li>
      <li>Ask us at {mail} to correct information, or object to how we use it.</li>
      <li>
        If you are not satisfied with our answer, you can complain to the Information Regulator:{" "}
        <a href="https://inforegulator.org.za" target="_blank" rel="noreferrer">
          inforegulator.org.za
        </a>
        .
      </li>
    </ul>

    <h2>Topic requests</h2>
    <p>When you request a new topic, please don&apos;t include personal information in the request.</p>

    <h2>Changes</h2>
    <p>
      If we change this policy, we post the new version here. When paid subscriptions start, we will add how payments are handled. See also our{" "}
      <Link href="/terms">terms of use</Link>.
    </p>
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
