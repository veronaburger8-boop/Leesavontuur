import Link from "next/link";
import { Meerkat } from "@/components/art/meerkat";
import { Landing } from "@/components/landing";
import { Message } from "@/components/message";
import { getSession } from "@/lib/auth";
import { getLocale, translator } from "@/lib/i18n";
import { lessonSample } from "@/lib/landing-sample";

export const metadata = {
  description:
    "Leesavontuur: kort daaglikse leeslesse en oogspeletjies in Afrikaans en Engels vir Suid-Afrikaanse kinders. Short daily reading lessons and eye games in Afrikaans and English.",
};

export default async function Home({ searchParams }: PageProps<"/">) {
  const [session, locale, { deleted }] = await Promise.all([getSession(), getLocale(), searchParams]);
  const t = translator(locale);
  if (!session) {
    // First-time visitors get the welcome page.
    const sample = await lessonSample(locale);
    return (
      <>
        {deleted && (
          <div className="landing-note">
            <Message kind="ok">{t("accountDeleted")}</Message>
          </div>
        )}
        <Landing locale={locale} sample={sample} />
      </>
    );
  }
  return (
    <main>
      <Message kind="ok">{deleted ? t("accountDeleted") : null}</Message>
      <section className="panel home-hero">
        <Meerkat size={150} title={t("mascotName")} className="hero-mascot" />
        <h1>{t("homeTitle")}</h1>
        <p className="sub">{t("siteTagline")}</p>
        <p>{t("homeIntro")}</p>
        <p>{t("homeParents")}</p>
        <div className="row">
          <Link className="button primary" href="/parent">
            {t("parentArea")}
          </Link>
          <Link className="button" href="/articles">
            {t("aboutReading")}
          </Link>
        </div>
      </section>
    </main>
  );
}
