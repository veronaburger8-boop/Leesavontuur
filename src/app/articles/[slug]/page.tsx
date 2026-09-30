import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleBody } from "@/components/article-body";
import { getLocale, translator } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";

async function getArticle(slug: string) {
  const supabase = await createClient();
  // Published only: an admin previews drafts in the admin area instead.
  const { data } = await supabase
    .from("articles")
    .select("slug, language, title, summary, body, published_at")
    .eq("slug", slug)
    .eq("status", "published")
    .order("language")
    .limit(1)
    .maybeSingle();
  return data as { slug: string; language: "af" | "en"; title: string; summary: string; body: string; published_at: string } | null;
}

export async function generateMetadata({ params }: PageProps<"/articles/[slug]">) {
  const a = await getArticle((await params).slug);
  return a ? { title: a.title, description: a.summary } : {};
}

export default async function ArticlePage({ params }: PageProps<"/articles/[slug]">) {
  const [{ slug }, locale] = await Promise.all([params, getLocale()]);
  const a = await getArticle(slug);
  if (!a) notFound();
  const t = translator(locale);
  return (
    <main>
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
