import Link from "next/link";
import { Message } from "@/components/message";
import { requireStaff } from "@/lib/auth";
import type { Lesson, Status } from "@/lib/content/types";
import { importPictures, removePicture, uploadPicture } from "../actions";
import { ImportPictures } from "./import-pictures";

export const metadata = { title: "Pictures" };
// Saving a batch of pictures can take a minute or two.
export const maxDuration = 300;

interface Row {
  id: string;
  level: number;
  language: "af" | "en";
  title: string;
  status: Status;
  sequence: number | null;
  data: Omit<Lesson, "status">;
}

export default async function PicturesPage({ searchParams }: PageProps<"/admin/pictures">) {
  const { supabase } = await requireStaff();
  const [sp, { data }] = await Promise.all([
    searchParams,
    supabase.from("content_items").select("id, level, language, title, status, sequence, data").eq("type", "lesson").lte("level", 2).neq("status", "retired").order("language").order("level").order("sequence"),
  ]);
  const lessons = (data ?? []) as Row[];
  const show = sp.show === "all" ? "all" : "missing";
  const cards = lessons.flatMap((l) => l.data.wordCards.map((c) => ({ lesson: l, card: c })));
  const missing = cards.filter((x) => !x.card.image).length;
  const titles = Object.fromEntries(lessons.map((l) => [l.id, `${l.title} (${l.language === "af" ? "Afr" : "Eng"} L${l.level})`]));

  return (
    <>
      <section className="panel">
        <h1>Word-card pictures</h1>
        <p className="sub">
          Levels 1 and 2: <strong>{cards.length - missing}</strong> of {cards.length} word cards have a picture. Pictures show on the word cards straight away,
          also in published lessons.
        </p>
        <Message kind="ok">{sp.saved ? "Picture saved." : sp.removed ? "Picture removed." : null}</Message>
        <Message kind="error">{sp.error === "file" ? "Choose a picture file (PNG, JPG or WebP, at most 4 MB)." : sp.error ? "That didn't work. Please try again." : null}</Message>
        <h2>Import a pictures file</h2>
        <p className="sub">A file with pictures made by the image generator. You see every picture first and can untick any that aren&apos;t right.</p>
        <ImportPictures action={importPictures} lessonTitles={titles} />
      </section>

      <section className="panel">
        <h2>Word cards</h2>
        <div className="row" style={{ marginBottom: 12 }}>
          <Link className={`button small${show === "missing" ? " primary" : ""}`} href="/admin/pictures?show=missing">
            Without a picture ({missing})
          </Link>
          <Link className={`button small${show === "all" ? " primary" : ""}`} href="/admin/pictures?show=all">
            All ({cards.length})
          </Link>
        </div>
        {lessons.map((l) => {
          const list = l.data.wordCards.filter((c) => show === "all" || !c.image);
          if (!list.length) return null;
          return (
            <div key={l.id} id={l.id} className="picture-lesson">
              <h3 lang={l.language}>
                <Link href={`/admin/content/${l.id}`}>{l.title}</Link>{" "}
                <span className="sub" style={{ fontSize: 15 }}>
                  {l.language === "af" ? "Afrikaans" : "English"} · Level {l.level}
                </span>
              </h3>
              <ul className="picture-cards">
                {list.map((c) => (
                  <li key={c.word}>
                    <div className="picture-thumb">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {c.image ? <img src={c.image} alt={c.word} /> : <span aria-hidden="true">—</span>}
                    </div>
                    <div>
                      <strong lang={l.language}>{c.word}</strong>
                      <div className="sub" style={{ fontSize: 14 }}>
                        {c.imageNote ?? "No picture idea"}
                      </div>
                      {c.image ? (
                        <form action={removePicture}>
                          <input type="hidden" name="lessonId" value={l.id} />
                          <input type="hidden" name="word" value={c.word} />
                          <input type="hidden" name="show" value={show} />
                          <button className="small" type="submit">
                            Remove picture
                          </button>
                        </form>
                      ) : (
                        <form action={uploadPicture} className="row">
                          <input type="hidden" name="lessonId" value={l.id} />
                          <input type="hidden" name="word" value={c.word} />
                          <input type="hidden" name="show" value={show} />
                          <label className="sr-only" htmlFor={`f-${l.id}-${c.word}`}>
                            Picture for {c.word}
                          </label>
                          <input id={`f-${l.id}-${c.word}`} name="file" type="file" accept="image/png,image/jpeg,image/webp" required style={{ maxWidth: 230 }} />
                          <button className="small" type="submit">
                            Upload
                          </button>
                        </form>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </section>
    </>
  );
}
