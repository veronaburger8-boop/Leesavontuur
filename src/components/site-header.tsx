import Link from "next/link";
import { headers } from "next/headers";
import { logOut, setLocale } from "@/app/actions";
import { getSession, isStaff } from "@/lib/auth";
import { getLocale, translator } from "@/lib/i18n";

export async function SiteHeader() {
  const [session, locale] = await Promise.all([getSession(), getLocale()]);
  const t = translator(locale);
  const path = (await headers()).get("x-pathname") ?? "/";
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
        <form action={setLocale}>
          <input type="hidden" name="locale" value={locale === "af" ? "en" : "af"} />
          <input type="hidden" name="back" value={path} />
          <button className="small" type="submit" aria-label={t("switchLanguageLabel")} lang={locale === "af" ? "en" : "af"}>
            {t("switchLanguage")}
          </button>
        </form>
      </nav>
    </header>
  );
}
