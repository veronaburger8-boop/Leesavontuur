import { saveArticle } from "../actions";

export interface ArticleFields {
  id?: number;
  language: "af" | "en";
  title: string;
  slug: string;
  summary: string;
  body: string;
  sort_order: number;
}

export function ArticleForm({ a }: { a: ArticleFields }) {
  return (
    <form action={saveArticle} className="form">
      {a.id && <input type="hidden" name="id" value={a.id} />}
      <div className="row">
        <div>
          <label htmlFor="language">Language</label>
          <select id="language" name="language" defaultValue={a.language} style={{ width: "auto" }}>
            <option value="af">Afrikaans</option>
            <option value="en">English</option>
          </select>
        </div>
        <div>
          <label htmlFor="sort_order">Order in the list</label>
          <input id="sort_order" name="sort_order" type="number" min={0} max={999} defaultValue={a.sort_order} style={{ width: 100 }} />
        </div>
      </div>
      <div className="field">
        <label htmlFor="title">Title</label>
        <input id="title" name="title" type="text" required maxLength={120} defaultValue={a.title} lang={a.language} />
      </div>
      <div className="field">
        <label htmlFor="slug">Web address name (optional)</label>
        <input id="slug" name="slug" type="text" maxLength={80} defaultValue={a.slug} aria-describedby="slug-hint" />
        <span className="hint" id="slug-hint">
          Made from the title if left empty, e.g. /articles/tien-wenke-vir-ouers
        </span>
      </div>
      <div className="field">
        <label htmlFor="summary">Summary (one or two sentences)</label>
        <textarea id="summary" name="summary" maxLength={300} rows={2} defaultValue={a.summary} lang={a.language} />
      </div>
      <div className="field">
        <label htmlFor="body">Text</label>
        <textarea id="body" name="body" rows={20} maxLength={20000} defaultValue={a.body} lang={a.language} aria-describedby="body-hint" />
        <span className="hint" id="body-hint">
          Leave an empty line between paragraphs. Start a line with “## ” for a heading and “- ” for a list item. Use **bold** and *italic*.
        </span>
      </div>
      <div>
        <button className="primary" type="submit">
          Save
        </button>
      </div>
    </form>
  );
}
