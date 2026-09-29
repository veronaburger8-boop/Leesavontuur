import Link from "next/link";
import { Message } from "@/components/message";
import { getLocale, translator } from "@/lib/i18n";
import { logIn } from "../actions";

export const metadata = { title: "Log in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { error, next } = await searchParams;
  const t = translator(await getLocale());
  return (
    <main>
      <section className="panel">
        <h1>{t("logIn")}</h1>
        <Message kind="error">{error === "login" ? t("loginFailed") : error === "link" ? t("linkExpired") : null}</Message>
        <form action={logIn} className="form">
          <input type="hidden" name="next" value={typeof next === "string" ? next : "/parent"} />
          <div className="field">
            <label htmlFor="email">{t("email")}</label>
            <input id="email" name="email" type="email" autoComplete="email" required />
          </div>
          <div className="field">
            <label htmlFor="password">{t("password")}</label>
            <input id="password" name="password" type="password" autoComplete="current-password" required />
          </div>
          <div className="row">
            <button className="primary" type="submit">
              {t("logIn")}
            </button>
            <Link href="/forgot-password">{t("forgotPassword")}</Link>
          </div>
        </form>
        <p style={{ marginTop: 24 }}>
          {t("noAccount")} <Link href="/signup">{t("signUp")}</Link>
        </p>
      </section>
    </main>
  );
}
