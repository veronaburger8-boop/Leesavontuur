import Link from "next/link";
import { Meerkat } from "@/components/art/meerkat";
import { LandingTry } from "@/components/landing-try";
import { Reveal } from "@/components/reveal";
import type { Locale } from "@/lib/i18n";
import { landingText } from "@/lib/landing-text";
import type { LessonSample } from "@/lib/landing-sample";

/** Screenshot of the real site (made with the "Lia" demo family), in the visitor's language. */
function Shot({ name, alt, locale, priority }: { name: string; alt: string; locale: Locale; priority?: boolean }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img className="shot" src={`/landing/${name}-${locale}.webp`} alt={alt} loading={priority ? "eager" : "lazy"} decoding="async" />
  );
}

/** The screens that take turns in the hero's browser frame (cross-fading in CSS). */
const HERO_SHOTS = ["child-home", "reading", "galgie", "chart"];

/** The welcome page for visitors who aren't signed in. */
export function Landing({ locale, sample }: { locale: Locale; sample: LessonSample | null }) {
  const t = landingText(locale);
  return (
    <main className="wide landing">
      <Reveal />
      <section className="landing-scene">
        <div className="scene-sky" aria-hidden="true">
          <span className="sun" />
          <span className="cloud c1" />
          <span className="cloud c2" />
          <span className="float-balloon b1" />
          <span className="float-balloon b2" />
          <span className="float-balloon b3" />
        </div>
        <div className="landing-hero">
          <div className="landing-hero-text">
            <p className="pill">{t.pill}</p>
            <h1>{t.title}</h1>
            <p className="lead">{t.lead}</p>
            <div className="row">
              <Link className="button primary big" href="/signup">
                {t.join}
              </Link>
              <Link className="button" href="/login">
                {t.logIn}
              </Link>
            </div>
          </div>
          <div className="landing-hero-shot">
            <div className="browser" role="img" aria-label={t.phoneAlt}>
              <div className="browser-bar" aria-hidden="true">
                <span />
                <span />
                <span />
                <em>leesavontuur.co.za</em>
              </div>
              <div className="browser-screens" aria-hidden="true">
                {HERO_SHOTS.map((name, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={name} src={`/landing/${name}-${locale}.webp`} alt="" loading={i === 0 ? "eager" : "lazy"} decoding="async" />
                ))}
              </div>
            </div>
            <div className="hero-mika">
              <p className="bubble">{t.mikaHello}</p>
              <Meerkat size={104} pose="wave" />
            </div>
          </div>
        </div>
        <div className="scene-grass" aria-hidden="true" />
      </section>

      <ul className="stats reveal">
        {t.stats.map((x) => (
          <li key={x.label}>
            <strong>{x.n}</strong> {x.label}
          </li>
        ))}
      </ul>

      <section className="panel reveal" aria-labelledby="how">
        <h2 id="how">{t.howTitle}</h2>
        <ol className="steps">
          {t.steps.map((s, i) => (
            <li key={s.title}>
              <span className="step-number" aria-hidden="true">
                {i + 1}
              </span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="panel reveal" aria-labelledby="try">
        <h2 id="try">{t.tryTitle}</h2>
        <p className="sub">{t.tryIntro}</p>
        <LandingTry locale={locale} sample={sample} />
      </section>

      <section className="panel reveal" aria-labelledby="inside">
        <h2 id="inside">{t.insideTitle}</h2>
        <div className="features">
          {t.features.map((f) => (
            <article key={f.title} className={`feature${f.shot ? "" : " feature-text"}`}>
              {f.shot ? <Shot name={f.shot} alt={f.alt} locale={locale} /> : <Meerkat size={90} />}
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </article>
          ))}
        </div>
        <p className="sub topics-line">{t.topics}</p>
      </section>

      <section className="panel reveal" aria-labelledby="parents">
        <h2 id="parents">{t.parentsTitle}</h2>
        <ul className="trust">
          {t.parents.map((p) => (
            <li key={p.title}>
              <h3>{p.title}</h3>
              <p>{p.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="panel price reveal" aria-labelledby="price">
        <h2 id="price">{t.priceTitle}</h2>
        <p className="price-big">
          {t.priceFree} <span>{t.priceFreeText}</span>
        </p>
        <p className="price-then">{t.priceThen}</p>
        <ul>
          {t.pricePoints.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
        <p className="price-join">
          <Link className="button primary big" href="/signup">
            {t.join}
          </Link>
        </p>
      </section>

      <section className="panel reveal" aria-labelledby="faq">
        <h2 id="faq">{t.faqTitle}</h2>
        <div className="faq">
          {t.faq.map((f) => (
            <details key={f.q}>
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="panel landing-end reveal">
        <Meerkat size={110} pose="cheer" className="mika-bounce" />
        <h2>{t.endTitle}</h2>
        <p>{t.endText}</p>
        <Link className="button primary big" href="/signup">
          {t.join}
        </Link>
      </section>
    </main>
  );
}
