import Link from "next/link";
import "@fontsource/andika/400.css";
import "@fontsource/atkinson-hyperlegible/400.css";
import "@fontsource/atkinson-hyperlegible/700.css";
import "@fontsource/baloo-2/600.css";
import "@fontsource/baloo-2/800.css";
import "./globals.css";
import type { Metadata, Viewport } from "next";
import { ServiceWorker } from "@/components/install-app";
import { SiteHeader } from "@/components/site-header";
import { getLocale, translator } from "@/lib/i18n";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.leesavontuur.co.za").replace(/\/$/, "");
const DESCRIPTION =
  "Leesavontuur is 'n aanlyn leesprogram in Afrikaans en Engels vir Suid-Afrikaanse kinders: kort daaglikse lesse, oogspeletjies en verslae vir ouers. An online reading program in Afrikaans and English for South African children.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Leesavontuur – leesprogram in Afrikaans en Engels vir kinders", template: "%s · Leesavontuur" },
  description: DESCRIPTION,
  applicationName: "Leesavontuur",
  keywords: ["leesprogram", "Afrikaans lees", "leeshulp vir kinders", "reading program South Africa", "Afrikaans and English reading", "graad 1 lees", "leesspoed"],
  openGraph: {
    type: "website",
    siteName: "Leesavontuur",
    title: "Leesavontuur – lees elke dag 'n bietjie",
    description: DESCRIPTION,
    url: "/",
    locale: "af_ZA",
    alternateLocale: ["en_ZA"],
  },
  twitter: { card: "summary_large_image" },
  // Installed on an iPhone or iPad, it opens full screen like an app.
  appleWebApp: { capable: true, title: "Leesavontuur", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#d6ecf8" },
    { media: "(prefers-color-scheme: dark)", color: "#10202b" },
  ],
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();
  const t = translator(locale);
  return (
    <html lang={locale}>
      <body>
        <ServiceWorker />
        <SiteHeader />
        {children}
        <footer className="site-footer">
          <Link href="/articles">{t("aboutReading")}</Link>
          <Link href="/privacy">{t("privacyPolicy")}</Link>
          <Link href="/terms">{t("termsOfUse")}</Link>
        </footer>
        <div className="grass" aria-hidden="true" />
      </body>
    </html>
  );
}
