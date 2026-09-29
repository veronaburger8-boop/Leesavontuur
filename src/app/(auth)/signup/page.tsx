import Link from "next/link";
import { Message } from "@/components/message";
import { getLocale, translator } from "@/lib/i18n";
import { signUp } from "../actions";

export const metadata = { title: "Sign up" };

export default async function SignupPage({ searchParams }: PageProps<"/signup">) {
  const { error, detail, sent } = await searchParams;
  const t = translator(await getLocale());
  const errorText =
    error === "privacy"
      ? t("mustAcceptPrivacy")
      : error === "password"
        ? t("passwordTooShort")
        : error === "signup"
          ? `${t("signupFailed")} ${typeof detail === "string" ? detail : ""}`
          : null;
  return (
    <main>
      <section className="panel">
        <h1>{t("signUp")}</h1>
        <p className="sub">{t("homeParents")}</p>
        <Message kind="error">{errorText}</Message>
        {sent ? (
          <Message kind="ok">{t("checkEmail")}</Message>
        ) : (
          <form action={signUp} className="form">
            <div className="field">
              <label htmlFor="name">{t("yourName")}</label>
              <input id="name" name="name" type="text" autoComplete="given-name" maxLength={80} />
            </div>
            <div className="field">
              <label htmlFor="email">{t("email")}</label>
              <input id="email" name="email" type="email" autoComplete="email" required />
            </div>
            <div className="field">
              <label htmlFor="password">{t("password")}</label>
              <input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required aria-describedby="password-hint" />
              <span className="hint" id="password-hint">
                {t("passwordHint")}
              </span>
            </div>
            <label className="check">
              <input type="checkbox" name="privacy" value="yes" required />
              <span>
                {t("acceptPrivacy")}{" "}
                <Link href="/privacy" target="_blank">
                  {t("privacyPolicy")}
                </Link>
              </span>
            </label>
            <div>
              <button className="primary" type="submit">
                {t("signUp")}
              </button>
            </div>
          </form>
        )}
        <p style={{ marginTop: 24 }}>
          {t("haveAccount")} <Link href="/login">{t("logIn")}</Link>
        </p>
      </section>
    </main>
  );
}
