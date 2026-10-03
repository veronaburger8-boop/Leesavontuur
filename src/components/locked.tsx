import Link from "next/link";
import { Meerkat } from "@/components/art/meerkat";
import type { Language } from "@/lib/content/types";

const text = {
  af: {
    title: "Jy het jou gratis les klaar gelees. Mooi so!",
    ask: "Vra vir Ma of Pa om in te teken, dan kan jy verder lees en speel.",
    back: "Terug",
  },
  en: {
    title: "You've finished your free lesson. Well done!",
    ask: "Ask Mom or Dad to subscribe, then you can keep reading and playing.",
    back: "Back",
  },
};

/** Shown to a child once the free lesson is used and the family has no subscription yet. */
export function Locked({ languages, back, mascot = true }: { languages: Language[]; back?: string; mascot?: boolean }) {
  return (
    <section className={`celebrate locked${mascot ? " panel" : ""}`}>
      {mascot && <Meerkat size={90} pose="cheer" className="celebrate-mika" />}
      {languages.map((l) => (
        <div key={l} lang={l}>
          <h2>{text[l].title}</h2>
          <p>{text[l].ask}</p>
        </div>
      ))}
      {back && (
        <Link className="button" href={back}>
          {languages.map((l) => text[l].back).join(" · ")}
        </Link>
      )}
    </section>
  );
}
