import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleBody } from "@/components/article-body";
import { JsonLd, ORGANIZATION, SITE_URL } from "@/components/json-ld";
import { getLocale, translator } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";

async function getArticle(slug: string) {
  const supabase = await createClient();
  // Published only: an admin previews drafts in the admin area instead.
  const { data } = await supabase
    .from("articles")
    .select("slug, language, title, summary, body, published_at, updated_at")
    .eq("slug", slug)
    .eq("status", "published")
    .order("language")
    .limit(1)
    .maybeSingle();
  return data as { slug: string; language: "af" | "en"; title: string; summary: string; body: string; published_at: string; updated_at: string } | null;
}

export async function generateMetadata({ params }: PageProps<"/articles/[slug]">) {
  const a = await getArticle((await params).slug);
  if (!a) return {};
  return {
    title: a.title,
    description: a.summary,
    alternates: { canonical: `/articles/${a.slug}` },
    openGraph: { type: "article", title: a.title, description: a.summary, url: `/articles/${a.slug}`, publishedTime: a.published_at, locale: a.language === "en" ? "en_ZA" : "af_ZA" },
  };
}

export default async function ArticlePage({ params }: PageProps<"/articles/[slug]">) {
  const [{ slug }, locale] = await Promise.all([params, getLocale()]);
  const a = await getArticle(slug);
  if (!a) notFound();
  const t = translator(locale);
  return (
    <main>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: a.title,
          description: a.summary,
          inLanguage: a.language,
          datePublished: a.published_at,
          dateModified: a.updated_at,
          mainEntityOfPage: `${SITE_URL}/articles/${a.slug}`,
          image: `${SITE_URL}/opengraph-image`,
          author: { "@id": ORGANIZATION["@id"] },
          publisher: ORGANIZATION,
        }}
      />
      <article className="panel" lang={a.language}>
        <p>
          <Link href="/articles">← {t("allArticles")}</Link>
        </p>
        <h1>{a.title}</h1>
        <p className="sub">{a.summary}</p>
        <ArticleBody body={a.body} />
      </article>
    </main>
  );
}
