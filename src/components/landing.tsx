import Link from "next/link";
import { Meerkat } from "@/components/art/meerkat";
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

/** The welcome page for visitors who aren't signed in. */
export function Landing({ locale, sample }: { locale: Locale; sample: LessonSample | null }) {
  const t = landingText(locale);
  return (
    <main className="wide landing">
      <section className="panel landing-hero">
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
          <Shot name="child-home" alt={t.heroShotAlt} locale={locale} priority />
        </div>
      </section>

      <section className="panel" aria-labelledby="how">
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

      <section className="panel" aria-labelledby="inside">
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

      {sample && (
        <section className="panel" aria-labelledby="sample">
          <h2 id="sample">{t.sampleTitle}</h2>
          <p className="sub">{t.sampleIntro(sample.title)}</p>
          <div className="sample">
            <div className="wordcard">
              <div className="card-word">{sample.card.word}</div>
              {sample.card.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={sample.card.image} alt={sample.card.imageNote ?? ""} width={180} height={180} loading="lazy" />
              )}
              {sample.card.definitions.map((d) => (
                <p key={d} className="reading-sm">
                  {d}
                </p>
              ))}
              {sample.card.example && (
                <p className="reading-sm">
                  <em>{t.eg}</em> {sample.card.example}
                </p>
              )}
              <p className="translation">
                {t.otherLanguage}: “{sample.card.translation}”
              </p>
            </div>
            <div className="sample-passage" lang={locale === "en" ? "en" : "af"}>
              <h3>{sample.title}</h3>
              {sample.lines.map((l, i) => (
                <p key={i} className="reading-sm">
                  {l}
                </p>
              ))}
              <p className="reading-sm" aria-hidden="true">
                …
              </p>
            </div>
          </div>
        </section>
      )}

      <section className="panel" aria-labelledby="parents">
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

      <section className="panel price" aria-labelledby="price">
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

      <section className="panel" aria-labelledby="faq">
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

      <section className="panel landing-end">
        <Meerkat size={110} />
        <h2>{t.endTitle}</h2>
        <p>{t.endText}</p>
        <Link className="button primary big" href="/signup">
          {t.join}
        </Link>
      </section>
    </main>
  );
}
