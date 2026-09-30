import Link from "next/link";
import "@fontsource/andika/400.css";
import "@fontsource/atkinson-hyperlegible/400.css";
import "@fontsource/atkinson-hyperlegible/700.css";
import "@fontsource/baloo-2/600.css";
import "@fontsource/baloo-2/800.css";
import "./globals.css";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { getLocale, translator } from "@/lib/i18n";

export const metadata: Metadata = {
  title: { default: "Leesavontuur", template: "%s · Leesavontuur" },
  description: "A reading program in Afrikaans and English for South African children.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();
  const t = translator(locale);
  return (
    <html lang={locale}>
      <body>
        <SiteHeader />
        {children}
        <footer className="site-footer">
          <Link href="/articles">{t("aboutReading")}</Link>
          <a href="/privacy">{t("privacyPolicy")}</a>
        </footer>
        <div className="grass" aria-hidden="true" />
      </body>
    </html>
  );
}
