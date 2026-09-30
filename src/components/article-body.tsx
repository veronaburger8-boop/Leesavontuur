import { type Inline, parseArticle } from "@/lib/articles/format";

function Text({ parts }: { parts: Inline[] }) {
  return (
    <>
      {parts.map((p, i) => (p.bold ? <strong key={i}>{p.text}</strong> : p.italic ? <em key={i}>{p.text}</em> : <span key={i}>{p.text}</span>))}
    </>
  );
}

/** An article's text, rendered from the simple article format (no raw HTML). */
export function ArticleBody({ body }: { body: string }) {
  return (
    <div className="article-body">
      {parseArticle(body).map((b, i) =>
        b.kind === "heading" ? (
          <h2 key={i}>
            <Text parts={b.text} />
          </h2>
        ) : b.kind === "list" ? (
          <ul key={i}>
            {b.items.map((item, j) => (
              <li key={j}>
                <Text parts={item} />
              </li>
            ))}
          </ul>
        ) : (
          <p key={i}>
            <Text parts={b.text} />
          </p>
        ),
      )}
    </div>
  );
}
