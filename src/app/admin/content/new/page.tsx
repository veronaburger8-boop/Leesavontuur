import { LessonEditor } from "@/components/admin/lesson-editor";
import { requireStaff } from "@/lib/auth";
import { emptyForm } from "@/lib/content/editor";
import { saveContentForm } from "../../actions";

export const metadata = { title: "Write a lesson" };

const one = (v: string | string[] | undefined) => (typeof v === "string" ? v : "");

export default async function NewContentPage({ searchParams }: PageProps<"/admin/content/new">) {
  const { supabase } = await requireStaff();
  const [sp, { data: topics }] = await Promise.all([searchParams, supabase.from("topics").select("key, name_en").order("sort_order")]);
  const level = Math.min(15, Math.max(1, Number(one(sp.level)) || 1));
  const language = one(sp.language) === "en" ? "en" : "af";
  return (
    <>
      <section className="panel">
        <h1>Write a lesson</h1>
        <p className="sub">
          Fill in every part. The checks at the bottom update as you type. It is saved as a <span className="badge draft">Draft</span>; children only see it
          once you publish it.
        </p>
      </section>
      <LessonEditor initial={emptyForm("lesson", language, level, one(sp.topic))} mode="new" topics={topics ?? []} published={false} action={saveContentForm} />
    </>
  );
}
