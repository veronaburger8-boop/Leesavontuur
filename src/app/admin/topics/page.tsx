import { Message } from "@/components/message";
import { requireStaff } from "@/lib/auth";
import { addTopic, setTopicActive } from "../actions";

export const metadata = { title: "Topics" };

export default async function TopicsPage({ searchParams }: PageProps<"/admin/topics">) {
  const { supabase } = await requireStaff();
  const [sp, { data: topics }, { data: lessons }] = await Promise.all([
    searchParams,
    supabase.from("topics").select("key, name_en, name_af, active").order("sort_order"),
    supabase.from("content_items").select("topic, status").eq("type", "lesson"),
  ]);
  const count = (key: string, published: boolean) => (lessons ?? []).filter((l) => l.topic === key && (l.status === "published") === published).length;
  return (
    <section className="panel">
      <h1>Topics</h1>
      <p className="sub">Children can choose a topic once it has at least one published lesson. Hidden topics can&apos;t be chosen.</p>
      <Message kind="ok">{sp.added ? "Topic added." : null}</Message>
      <Message kind="error">
        {sp.error === "names" ? "Please give both names." : sp.error === "exists" ? "That topic already exists." : sp.error ? "That didn't work." : null}
      </Message>
      <div className="table-wrap">
        <table className="report-table">
          <thead>
            <tr>
              <th>English</th>
              <th>Afrikaans</th>
              <th>Published lessons</th>
              <th>Not yet published</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {(topics ?? []).map((t) => (
              <tr key={t.key}>
                <td>{t.name_en}</td>
                <td lang="af">{t.name_af}</td>
                <td>{count(t.key, true)}</td>
                <td>{count(t.key, false)}</td>
                <td>
                  <form action={setTopicActive}>
                    <input type="hidden" name="key" value={t.key} />
                    <input type="hidden" name="active" value={t.active ? "no" : "yes"} />
                    <button className="small" type="submit">
                      {t.active ? "Hide" : "Show"}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h2 style={{ marginTop: 18 }}>Add a topic</h2>
      <form action={addTopic} className="form">
        <div className="row">
          <div style={{ flex: "1 1 200px" }}>
            <label htmlFor="name_en">English name</label>
            <input id="name_en" name="name_en" type="text" required maxLength={60} />
          </div>
          <div style={{ flex: "1 1 200px" }}>
            <label htmlFor="name_af">Afrikaans name</label>
            <input id="name_af" name="name_af" type="text" required maxLength={60} />
          </div>
        </div>
        <div>
          <button className="primary" type="submit">
            Add topic
          </button>
        </div>
      </form>
    </section>
  );
}
