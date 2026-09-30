import Link from "next/link";
import { Message } from "@/components/message";
import { requireAccount, safeNext } from "@/lib/auth";
import { getLocale, translator } from "@/lib/i18n";
import { unlockWithPassword, unlockWithPin } from "./actions";

export const metadata = { title: "Parent area" };

/** Opens the parent area again after a child has used the device. */
export default async function UnlockPage({ searchParams }: PageProps<"/unlock">) {
  const { supabase } = await requireAccount("/unlock");
  const [{ next, error }, locale, { data: hasPin }] = await Promise.all([searchParams, getLocale(), supabase.rpc("has_parent_pin")]);
  const t = translator(locale);
  const target = safeNext(typeof next === "string" ? next : undefined);
  return (
    <main>
      <section className="panel">
        <h1>{t("unlockTitle")} 🔒</h1>
        <p>{hasPin ? t("unlockIntro") : t("unlockIntroPassword")}</p>
        <Message kind="error">
          {error === "pin" ? t("wrongPin") : error === "locked" ? t("pinLocked") : error === "password" ? t("wrongPassword") : null}
        </Message>
        {hasPin ? (
          <form action={unlockWithPin} className="form">
            <input type="hidden" name="next" value={target} />
            <div className="field">
              <label htmlFor="pin">{t("pin")}</label>
              <input id="pin" name="pin" type="password" inputMode="numeric" pattern="[0-9]{4}" maxLength={4} autoComplete="off" required autoFocus style={{ maxWidth: 180, fontSize: 28, letterSpacing: 8 }} />
            </div>
            <div className="row">
              <button className="primary" type="submit">
                {t("unlock")}
              </button>
              <Link className="button" href="/learn">
                {t("backToReading")}
              </Link>
            </div>
          </form>
        ) : (
          <form action={unlockWithPassword} className="form">
            <input type="hidden" name="next" value={target} />
            <div className="field">
              <label htmlFor="password">{t("password")}</label>
              <input id="password" name="password" type="password" autoComplete="current-password" required autoFocus />
            </div>
            <div className="row">
              <button className="primary" type="submit">
                {t("unlock")}
              </button>
            </div>
          </form>
        )}
      </section>
    </main>
  );
}
