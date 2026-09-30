import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleBody } from "@/components/article-body";
import { Message } from "@/components/message";
import { requireStaff } from "@/lib/auth";
import { setArticleStatus } from "../../actions";
import { ArticleForm, type ArticleFields } from "../article-form";

export const metadata = { title: "Article" };

export default async function EditArticle({ params, searchParams }: PageProps<"/admin/articles/[id]">) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const { supabase } = await requireStaff();
  const { data } = await supabase.from("articles").select("id, language, title, slug, summary, body, sort_order, status").eq("id", Number(id)).maybeSingle();
  if (!data) notFound();
  const a = data as ArticleFields & { id: number; status: "draft" | "published" };
  return (
    <>
      <section className="panel">
        <p>
          <Link href="/admin/articles">← Articles</Link>
        </p>
        <h1 lang={a.language}>{a.title}</h1>
        <p>
          Status: <span className={`badge ${a.status}`}>{a.status === "published" ? "Published" : "Draft"}</span>
          {a.status === "published" ? (
            <>
              {" "}
              – anyone can read it at <Link href={`/articles/${a.slug}`}>/articles/{a.slug}</Link>.
            </>
          ) : (
            " – only staff can see it."
          )}
        </p>
        <Message kind="ok">{sp.saved ? "Saved." : sp.status === "published" ? "Published." : sp.status === "draft" ? "Taken off the site (Draft)." : null}</Message>
        <Message kind="error">
          {sp.error === "title" ? "Please give the article a title." : sp.error === "slug" ? "Another article already uses that web address name." : sp.error ? "That didn't work." : null}
        </Message>
        <form action={setArticleStatus}>
          <input type="hidden" name="id" value={a.id} />
          <input type="hidden" name="status" value={a.status === "published" ? "draft" : "published"} />
          <button className={a.status === "published" ? "" : "primary"} type="submit">
            {a.status === "published" ? "Take off the site" : "Publish"}
          </button>
        </form>
      </section>
      <section className="panel">
        <h2>Edit</h2>
        <ArticleForm a={a} />
      </section>
      <section className="panel" lang={a.language}>
        <h2>Preview</h2>
        <p className="sub">{a.summary}</p>
        <ArticleBody body={a.body} />
      </section>
    </>
  );
}
