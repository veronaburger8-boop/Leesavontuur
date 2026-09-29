import { setLocale } from "@/app/actions";
import { Message } from "@/components/message";
import { requireAccount } from "@/lib/auth";
import { getLocale, translator } from "@/lib/i18n";
import { deleteAccount } from "../actions";

export const metadata = { title: "My account" };

export default async function AccountPage({ searchParams }: PageProps<"/parent/account">) {
  const { user } = await requireAccount("/parent/account");
  const [{ error }, locale] = await Promise.all([searchParams, getLocale()]);
  const t = translator(locale);
  return (
    <main>
      <section className="panel">
        <h1>{t("account")}</h1>
        <p>
          {t("email")}: <strong>{user.email}</strong>
        </p>
        <h2>{t("accountLanguage")}</h2>
        <form action={setLocale} className="row">
          <input type="hidden" name="back" value="/parent/account" />
          <select name="locale" defaultValue={locale} aria-label={t("accountLanguage")} style={{ width: "auto" }}>
            <option value="af">Afrikaans</option>
            <option value="en">English</option>
          </select>
          <button type="submit">{t("save")}</button>
        </form>
      </section>
      <section className="panel">
        <h2>{t("yourData")}</h2>
        <p>{t("downloadDataHint")}</p>
        <a className="button" href="/parent/export" download>
          {t("downloadData")}
        </a>
      </section>
      <section className="panel">
        <h2>{t("deleteAccount")}</h2>
        <Message kind="error">{error ? t("somethingWrong") : null}</Message>
        <p>{t("deleteAccountWarning")}</p>
        <form action={deleteAccount} className="form">
          <label className="check">
            <input type="checkbox" name="confirm" value="yes" required />
            <span>{t("confirmDeleteAccount")}</span>
          </label>
          <div>
            <button className="danger primary" type="submit">
              {t("deleteAccount")}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
