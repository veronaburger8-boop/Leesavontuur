"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { setLocale } from "@/app/actions";
import type { Locale } from "@/lib/i18n";

/** Switches the interface language and returns to the current page. */
export function LanguageSwitch({ locale, label, text }: { locale: Locale; label: string; text: string }) {
  const pathname = usePathname();
  const query = useSearchParams().toString();
  const other = locale === "af" ? "en" : "af";
  return (
    <form action={setLocale}>
      <input type="hidden" name="locale" value={other} />
      <input type="hidden" name="back" value={query ? `${pathname}?${query}` : pathname} />
      <button className="small" type="submit" aria-label={label} lang={other}>
        {text}
      </button>
    </form>
  );
}
