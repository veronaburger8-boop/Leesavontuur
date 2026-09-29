import Link from "next/link";
import { Suspense } from "react";
import { logOut } from "@/app/actions";
import { LanguageSwitch } from "@/components/language-switch";
import { getSession, isStaff } from "@/lib/auth";
import { getLocale, translator } from "@/lib/i18n";

export async function SiteHeader() {
  const [session, locale] = await Promise.all([getSession(), getLocale()]);
  const t = translator(locale);
  return (
    <header className="site-header">
      <Link href="/" className="brand">
        Leesavontuur
      </Link>
      <nav className="site-nav" aria-label="Main">
        {session ? (
          <>
            <Link className="button small" href="/parent">
              {t("parentArea")}
            </Link>
            {isStaff(session.profile) && (
              <Link className="button small" href="/admin">
                {t("adminArea")}
              </Link>
            )}
            <form action={logOut}>
              <button className="small" type="submit">
                {t("logOut")}
              </button>
            </form>
          </>
        ) : (
          <Link className="button small" href="/login">
            {t("logIn")}
          </Link>
        )}
        <Suspense>
          <LanguageSwitch locale={locale} label={t("switchLanguageLabel")} text={t("switchLanguage")} />
        </Suspense>
      </nav>
    </header>
  );
}
