import Link from "next/link";
import { requireStaff } from "@/lib/auth";

export const metadata = { title: "Articles" };

export default async function AdminArticles() {
  const { supabase } = await requireStaff();
  const { data } = await supabase.from("articles").select("id, language, title, status, sort_order, updated_at").order("language").order("sort_order");
  return (
    <section className="panel">
      <h1>About reading: articles</h1>
      <p className="sub">
        Public articles for parents and visitors. Only <span className="badge published">Published</span> articles can be seen on the site. The starter drafts were written
        with Claude&apos;s help: please rewrite them in your own words and check every fact before publishing.
      </p>
      <p>
        <Link className="button primary" href="/admin/articles/new">
          + New article
        </Link>
      </p>
      <div className="table-wrap">
        <table className="report-table">
          <thead>
            <tr>
              <th>Language</th>
              <th>Title</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((a) => (
              <tr key={a.id}>
                <td>{a.language === "af" ? "Afrikaans" : "English"}</td>
                <td lang={a.language}>
                  <Link href={`/admin/articles/${a.id}`}>{a.title}</Link>
                </td>
                <td>
                  <span className={`badge ${a.status}`}>{a.status === "published" ? "Published" : "Draft"}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
