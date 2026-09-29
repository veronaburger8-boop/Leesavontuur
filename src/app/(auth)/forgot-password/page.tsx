import { Message } from "@/components/message";
import { getLocale, translator } from "@/lib/i18n";
import { requestPasswordReset } from "../actions";

export const metadata = { title: "Forgot password" };

export default async function ForgotPasswordPage({ searchParams }: PageProps<"/forgot-password">) {
  const { sent } = await searchParams;
  const t = translator(await getLocale());
  return (
    <main>
      <section className="panel">
        <h1>{t("forgotPassword")}</h1>
        {sent ? (
          <Message kind="ok">{t("resetSent")}</Message>
        ) : (
          <form action={requestPasswordReset} className="form">
            <p>{t("resetIntro")}</p>
            <div className="field">
              <label htmlFor="email">{t("email")}</label>
              <input id="email" name="email" type="email" autoComplete="email" required />
            </div>
            <div>
              <button className="primary" type="submit">
                {t("sendLink")}
              </button>
            </div>
          </form>
        )}
      </section>
    </main>
  );
}
