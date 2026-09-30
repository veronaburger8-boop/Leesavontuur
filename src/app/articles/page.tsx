import Link from "next/link";
import { Meerkat } from "@/components/art/meerkat";
import { readingMinutes } from "@/lib/articles/format";
import { getLocale, translator } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Oor lees · About reading" };

interface ArticleRow {
  slug: string;
  language: "af" | "en";
  title: string;
  summary: string;
  body: string;
}

/** "About reading": public articles (brief, section 12). Only published articles can be read. */
export default async function ArticlesPage() {
  const [supabase, locale] = await Promise.all([createClient(), getLocale()]);
  const t = translator(locale);
  const { data } = await supabase
    .from("articles")
    .select("slug, language, title, summary, body")
    .eq("status", "published")
    .order("sort_order")
    .order("published_at", { ascending: false });
  const all = (data ?? []) as ArticleRow[];
  const mine = all.filter((a) => a.language === locale);
  const other = all.filter((a) => a.language !== locale);
  return (
    <main>
      <section className="panel home-hero">
        <Meerkat size={110} className="hero-mascot" />
        <h1>{t("aboutReading")}</h1>
        <p className="sub">{t("aboutReadingIntro")}</p>
        {mine.length === 0 && other.length === 0 && <p>{t("noArticles")}</p>}
        <ul className="article-list">
          {mine.map((a) => (
            <li key={a.slug}>
              <Link href={`/articles/${a.slug}`} lang={a.language}>
                <h2>{a.title}</h2>
                <p>{a.summary}</p>
                <span className="sub">{readingMinutes(a.body)} min</span>
              </Link>
            </li>
          ))}
        </ul>
        {other.length > 0 && (
          <>
            <h2 style={{ fontSize: 18, marginTop: 20 }}>{t("otherLanguageArticles")}</h2>
            <ul>
              {other.map((a) => (
                <li key={a.slug}>
                  <Link href={`/articles/${a.slug}`} lang={a.language}>
                    {a.title}
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </main>
  );
}
