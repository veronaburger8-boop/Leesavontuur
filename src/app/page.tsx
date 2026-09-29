import Link from "next/link";
import { Message } from "@/components/message";
import { getSession } from "@/lib/auth";
import { getLocale, translator } from "@/lib/i18n";

export default async function Home({ searchParams }: PageProps<"/">) {
  const [session, locale, { deleted }] = await Promise.all([getSession(), getLocale(), searchParams]);
  const t = translator(locale);
  return (
    <main>
      <Message kind="ok">{deleted ? t("accountDeleted") : null}</Message>
      <section className="panel">
        <h1>{t("homeTitle")}</h1>
        <p className="sub">{t("siteTagline")}</p>
        <p>{t("homeIntro")}</p>
        <p>{t("homeParents")}</p>
        <div className="row">
          {session ? (
            <Link className="button primary" href="/parent">
              {t("parentArea")}
            </Link>
          ) : (
            <>
              <Link className="button primary" href="/signup">
                {t("signUp")}
              </Link>
              <Link className="button" href="/login">
                {t("logIn")}
              </Link>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
