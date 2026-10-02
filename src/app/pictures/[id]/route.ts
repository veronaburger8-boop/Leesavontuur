import { createClient } from "@/lib/supabase/server";

/** A word-card picture. Pictures never change (a new picture gets a new id), so browsers may keep them. */
export async function GET(_req: Request, ctx: RouteContext<"/pictures/[id]">) {
  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/.test(id)) return new Response("Not found", { status: 404 });
  const supabase = await createClient();
  const { data } = await supabase.from("pictures").select("data, mime").eq("id", id).maybeSingle<{ data: string; mime: string }>();
  if (!data) return new Response("Not found", { status: 404 });
  return new Response(Buffer.from(data.data, "base64"), {
    headers: { "content-type": data.mime, "cache-control": "public, max-age=31536000, immutable", "x-content-type-options": "nosniff" },
  });
}
