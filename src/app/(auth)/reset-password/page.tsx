import Link from "next/link";
import { redirect } from "next/navigation";
import { Message } from "@/components/message";
import { getSession } from "@/lib/auth";
import { getLocale, translator } from "@/lib/i18n";
import { updatePassword } from "../actions";

export const metadata = { title: "New password" };

export default async function ResetPasswordPage({ searchParams }: PageProps<"/reset-password">) {
  const { error, saved } = await searchParams;
  const t = translator(await getLocale());
  // The link in the email signs the parent in; without it there is nothing to reset.
  if (!(await getSession())) redirect("/login?error=link");
  return (
    <main>
      <section className="panel">
        <h1>{t("resetTitle")}</h1>
        <Message kind="error">{error === "password" ? t("passwordTooShort") : error ? t("somethingWrong") : null}</Message>
        {saved ? (
          <>
            <Message kind="ok">{t("passwordSaved")}</Message>
            <Link className="button primary" href="/parent">
              {t("parentArea")}
            </Link>
          </>
        ) : (
          <form action={updatePassword} className="form">
            <div className="field">
              <label htmlFor="password">{t("newPassword")}</label>
              <input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
              <span className="hint">{t("passwordHint")}</span>
            </div>
            <div>
              <button className="primary" type="submit">
                {t("savePassword")}
              </button>
            </div>
          </form>
        )}
      </section>
    </main>
  );
}
