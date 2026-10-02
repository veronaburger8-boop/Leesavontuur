import Link from "next/link";
import { getLocale } from "@/lib/i18n";
import { PRIVACY_VERSION } from "@/lib/site";

export const metadata = { title: "Terms of use" };

// DRAFT – to be checked by someone qualified (Consumer Protection Act, POPIA,
// ECT Act) before paid subscriptions start. Prices and periods come from the
// owner's decisions in PROJECT-BRIEF.md.

const EMAIL = "leesavontuur194@gmail.com";
const mail = <a href={`mailto:${EMAIL}`}>{EMAIL}</a>;

const af = (
  <>
    <h1>Gebruiksvoorwaardes</h1>
    <p className="message info">Konsep – hierdie voorwaardes moet nog deur iemand met regskennis nagegaan word.</p>

    <h2>Oor Leesavontuur</h2>
    <p>
      Leesavontuur (www.leesavontuur.co.za) bied kort daaglikse leeslesse en leesspeletjies in Afrikaans en Engels vir kinders aan. Deur &apos;n rekening te
      skep, stem jy in tot hierdie voorwaardes en ons <Link href="/privacy">privaatheidsbeleid</Link>. Kontak: {mail}.
    </p>

    <h2>Wie &apos;n rekening kan skep</h2>
    <p>
      Net volwassenes (18 jaar of ouer) wat die ouer of voog is van die kinders wat hulle byvoeg. Een rekening is vir een gesin, met tot twee kinders. Hou jou
      wagwoord en ouer-PIN geheim; jy is verantwoordelik vir wat met jou rekening gedoen word.
    </p>

    <h2>Die gratis proeftydperk en intekening</h2>
    <ul>
      <li>Tydens die loodsfase (proefprojek) is Leesavontuur gratis vir genooide gesinne.</li>
      <li>
        Daarna kos Leesavontuur <strong>R99 per gesin per maand</strong>. Ons sal jou minstens 14 dae vooraf laat weet voordat enige betaling begin, en jy
        betaal niks tensy jy self &apos;n intekening begin.
      </li>
      <li>Jy kan jou intekening enige tyd kanselleer; dit loop dan aan die einde van die betaalde maand af. Daar is geen kansellasiefooi nie.</li>
      <li>As ons die prys verander, laat weet ons jou minstens 30 dae vooraf.</li>
    </ul>

    <h2>Hoe om die program te gebruik</h2>
    <ul>
      <li>Die program is vir jou gesin se persoonlike gebruik, nie vir skole of klasse nie, tensy ons skriftelik anders ooreenkom.</li>
      <li>Moenie rekeninge deel, die webwerf probeer ontwrig, of ander mense se inligting probeer sien nie.</li>
      <li>Moenie persoonlike inligting in onderwerp-versoeke insluit nie.</li>
    </ul>

    <h2>Die inhoud</h2>
    <p>
      Die lesse, speletjies, artikels, prente en die maskot Mika behoort aan Leesavontuur. Jy mag dit gebruik om saam met jou kinders te lees en verslae vir
      jouself te druk, maar nie kopieer, verkoop of elders publiseer nie.
    </p>

    <h2>Wat ons belowe, en wat nie</h2>
    <p>
      Ons doen ons bes om lesse akkuraat en die webwerf beskikbaar te hou, maar ons kan nie belowe dat dit altyd sonder foute of onderbrekings sal werk nie.
      Leesavontuur ondersteun lees; dit is nie &apos;n diagnose of terapie nie. As jy bekommerd is oor jou kind se lees, sig of gehoor, raadpleeg &apos;n
      onderwyser of professionele persoon. Ons is nie aanspreeklik vir indirekte verliese nie, tot die mate wat die wet toelaat. Niks in hierdie voorwaardes
      beperk jou regte onder die Wet op Verbruikersbeskerming nie.
    </p>

    <h2>Beëindiging</h2>
    <p>
      Jy kan jou rekening enige tyd onder &quot;My rekening&quot; verwyder. Ons kan &apos;n rekening opskort of sluit as hierdie voorwaardes ernstig
      oortree word; ons sal jou eers laat weet waar dit moontlik is.
    </p>

    <h2>Veranderinge en toepaslike reg</h2>
    <p>
      As ons hierdie voorwaardes verander, plaas ons die nuwe weergawe hier en laat weet ons jou van belangrike veranderinge. Die reg van Suid-Afrika is van
      toepassing.
    </p>
  </>
);

const en = (
  <>
    <h1>Terms of use</h1>
    <p className="message info">Draft – these terms still have to be checked by someone with legal knowledge.</p>

    <h2>About Leesavontuur</h2>
    <p>
      Leesavontuur (www.leesavontuur.co.za) offers short daily reading lessons and reading games in Afrikaans and English for children. By creating an
      account, you agree to these terms and our <Link href="/privacy">privacy policy</Link>. Contact: {mail}.
    </p>

    <h2>Who can create an account</h2>
    <p>
      Only adults (18 or older) who are the parent or guardian of the children they add. One account is for one family, with up to two children. Keep your
      password and parent PIN secret; you are responsible for what is done with your account.
    </p>

    <h2>The free pilot and subscription</h2>
    <ul>
      <li>During the pilot, Leesavontuur is free for invited families.</li>
      <li>
        After that, Leesavontuur costs <strong>R99 per family per month</strong>. We will tell you at least 14 days before any payment starts, and you pay
        nothing unless you start a subscription yourself.
      </li>
      <li>You can cancel your subscription at any time; it then ends at the end of the paid month. There is no cancellation fee.</li>
      <li>If we change the price, we will tell you at least 30 days in advance.</li>
    </ul>

    <h2>How to use the program</h2>
    <ul>
      <li>The program is for your family&apos;s personal use, not for schools or classes, unless we agree otherwise in writing.</li>
      <li>Don&apos;t share accounts, try to disrupt the website, or try to see other people&apos;s information.</li>
      <li>Don&apos;t include personal information in topic requests.</li>
    </ul>

    <h2>The content</h2>
    <p>
      The lessons, games, articles, pictures and the mascot Mika belong to Leesavontuur. You may use them to read with your children and print reports for
      yourself, but not copy, sell or publish them elsewhere.
    </p>

    <h2>What we promise, and what we don&apos;t</h2>
    <p>
      We do our best to keep lessons accurate and the website available, but we can&apos;t promise it will always work without errors or interruptions.
      Leesavontuur supports reading; it is not a diagnosis or therapy. If you are worried about your child&apos;s reading, eyesight or hearing, consult a
      teacher or professional. We are not liable for indirect losses, to the extent the law allows. Nothing in these terms limits your rights under the
      Consumer Protection Act.
    </p>

    <h2>Ending</h2>
    <p>
      You can delete your account at any time under &quot;My account&quot;. We may suspend or close an account if these terms are seriously broken; where
      possible, we will tell you first.
    </p>

    <h2>Changes and applicable law</h2>
    <p>If we change these terms, we post the new version here and tell you about important changes. South African law applies.</p>
  </>
);

export default async function TermsPage() {
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
