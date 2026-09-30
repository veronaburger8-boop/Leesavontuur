import Link from "next/link";
import { Message } from "@/components/message";
import { requireStaff } from "@/lib/auth";
import { ArticleForm } from "../article-form";

export const metadata = { title: "New article" };

export default async function NewArticle({ searchParams }: PageProps<"/admin/articles/new">) {
  await requireStaff();
  const { error } = await searchParams;
  return (
    <section className="panel">
      <p>
        <Link href="/admin/articles">← Articles</Link>
      </p>
      <h1>New article</h1>
      <Message kind="error">
        {error === "title" ? "Please give the article a title." : error === "slug" ? "Another article already uses that web address name." : error ? "Not saved." : null}
      </Message>
      <ArticleForm a={{ language: "af", title: "", slug: "", summary: "", body: "", sort_order: 10 }} />
    </section>
  );
}
