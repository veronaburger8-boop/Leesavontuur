"use client";

import { useEffect, useState } from "react";
import type { Locale } from "@/lib/i18n";

/*
 * iPhones show their menus in English (iOS has no Afrikaans), so the
 * Afrikaans steps name the buttons exactly as the phone shows them, in
 * quotation marks, with the Afrikaans meaning after it.
 */
const text = {
  af: {
    title: "Kry Leesavontuur as 'n app",
    lead: "Dan is Mika op jou foon se tuisskerm, en jy maak Leesavontuur met een tik oop.",
    install: "📲 Installeer die app",
    show: "📲 Wys my hoe (4 maklike stappe)",
    hide: "Maak toe",
    later: "Nie nou nie",
    done: "Leesavontuur is geïnstalleer. Kyk vir Mika op jou tuisskerm!",
    inApp:
      "Jy is nou binne 'n ander app (soos Facebook of Instagram). Maak eers hierdie bladsy in Safari oop: tik op die drie kolletjies ••• en dan op “Open in Safari” (Maak in Safari oop).",
    safari: [
      {
        icon: "share",
        main: "Tik op die Deel-knoppie: 'n vierkantjie met 'n pyltjie wat boontoe wys.",
        hint: "Dit is onder op die skerm. Sien jy dit nie? Tik eers op die drie kolletjies ••• onder regs, en dan op “Share” (Deel).",
      },
      {
        icon: "add",
        main: "Rol af in die lys wat oopmaak en tik op “Add to Home Screen” (Voeg by tuisskerm).",
        hint: "Sien jy dit nie? Tik op “View More” (Wys meer) en soek dit daar.",
      },
      { icon: "check", main: "Tik regs bo op “Add” (Voeg by).", hint: "" },
      { icon: "mika", main: "Klaar! Mika is nou op jou tuisskerm. Tik op Mika om Leesavontuur oop te maak.", hint: "" },
    ],
    chrome: [
      {
        icon: "share",
        main: "Tik bo regs in die adresbalk op die Deel-knoppie: 'n vierkantjie met 'n pyltjie wat boontoe wys.",
        hint: "",
      },
      {
        icon: "add",
        main: "Rol af in die lys en tik op “Add to Home Screen” (Voeg by tuisskerm).",
        hint: "Sien jy dit nie? Maak die bladsy eerder in Safari oop en probeer weer.",
      },
      { icon: "check", main: "Tik regs bo op “Add” (Voeg by).", hint: "" },
      { icon: "mika", main: "Klaar! Mika is nou op jou tuisskerm. Tik op Mika om Leesavontuur oop te maak.", hint: "" },
    ],
  },
  en: {
    title: "Get Leesavontuur as an app",
    lead: "Mika then sits on your phone's home screen, and Leesavontuur opens with one tap.",
    install: "📲 Install the app",
    show: "📲 Show me how (4 easy steps)",
    hide: "Close",
    later: "Not now",
    done: "Leesavontuur is installed. Look for Mika on your home screen!",
    inApp:
      "You are inside another app (such as Facebook or Instagram). First open this page in Safari: tap the three dots ••• and then “Open in Safari”.",
    safari: [
      {
        icon: "share",
        main: "Tap the Share button: a little square with an arrow pointing up.",
        hint: "It is at the bottom of the screen. Can't see it? First tap the three dots ••• at the bottom right, then “Share”.",
      },
      {
        icon: "add",
        main: "Scroll down in the list that opens and tap “Add to Home Screen”.",
        hint: "Can't see it? Tap “View More” and look for it there.",
      },
      { icon: "check", main: "Tap “Add” at the top right.", hint: "" },
      { icon: "mika", main: "Done! Mika is now on your home screen. Tap Mika to open Leesavontuur.", hint: "" },
    ],
    chrome: [
      { icon: "share", main: "Tap the Share button at the top right of the address bar: a little square with an arrow pointing up.", hint: "" },
      {
        icon: "add",
        main: "Scroll down in the list and tap “Add to Home Screen”.",
        hint: "Can't see it? Open this page in Safari instead and try again.",
      },
      { icon: "check", main: "Tap “Add” at the top right.", hint: "" },
      { icon: "mika", main: "Done! Mika is now on your home screen. Tap Mika to open Leesavontuur.", hint: "" },
    ],
  },
};

type Step = { icon: string; main: string; hint: string };

interface InstallPrompt extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type Mode = "none" | "prompt" | "ios" | "installed";
type IosBrowser = "safari" | "chrome" | "in-app";

const HIDE_KEY = "install-app-hidden";

/**
 * "Install the app": on Android and computers the browser's own install
 * prompt; on iPhone and iPad (which have no prompt) a card that shows the
 * steps to add it to the home screen. Nothing shows once it runs as an
 * installed app, or after the parent taps "Not now". Adding `?install=iphone`
 * to the address shows the iPhone steps on any device (for checking them).
 */
export function InstallApp({ locale }: { locale: Locale }) {
  const t = text[locale];
  const [mode, setMode] = useState<Mode>("none");
  const [browser, setBrowser] = useState<IosBrowser>("safari");
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (standalone) return;
    const preview = new URLSearchParams(window.location.search).get("install") === "iphone";
    let hidden = false;
    try {
      hidden = window.localStorage.getItem(HIDE_KEY) === "1";
    } catch {}
    if (hidden && !preview) return;
    const ua = navigator.userAgent;
    const ios = preview || /iphone|ipad|ipod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPrompt(e as InstallPrompt);
      setMode("prompt");
    };
    const onInstalled = () => setMode("installed");
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    // iPhone and iPad have no install prompt: show the steps instead (after the page has settled).
    const timer = ios
      ? window.setTimeout(() => {
          setBrowser(/FBAN|FBAV|Instagram|Line\/|LinkedInApp|Snapchat|TikTok/i.test(ua) ? "in-app" : /CriOS|EdgiOS|FxiOS/i.test(ua) ? "chrome" : "safari");
          setMode("ios");
          if (preview) setOpen(true);
        }, 0)
      : undefined;
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  const later = () => {
    try {
      window.localStorage.setItem(HIDE_KEY, "1");
    } catch {}
    setMode("none");
  };

  if (mode === "installed")
    return (
      <div className="install-app" role="status">
        <p className="install-done">{t.done}</p>
      </div>
    );
  if (mode === "prompt" && prompt)
    return (
      <div className="install-app">
        <p className="install-title">{t.title}</p>
        <p className="install-lead">{t.lead}</p>
        <div className="install-buttons">
          <button
            type="button"
            className="primary"
            onClick={async () => {
              await prompt.prompt();
              const { outcome } = await prompt.userChoice;
              setPrompt(null);
              setMode(outcome === "accepted" ? "installed" : "none");
            }}
          >
            {t.install}
          </button>
          <button type="button" className="link-button" onClick={later}>
            {t.later}
          </button>
        </div>
      </div>
    );
  if (mode !== "ios") return null;

  const steps: Step[] = browser === "chrome" ? t.chrome : t.safari;
  return (
    <div className="install-app">
      <p className="install-title">{t.title}</p>
      <p className="install-lead">{t.lead}</p>
      {!open ? (
        <div className="install-buttons">
          <button type="button" className="primary" aria-expanded={false} aria-controls="install-steps" onClick={() => setOpen(true)}>
            {t.show}
          </button>
          <button type="button" className="link-button" onClick={later}>
            {t.later}
          </button>
        </div>
      ) : (
        <>
          {browser === "in-app" && <p className="install-warning">{t.inApp}</p>}
          <ol className="install-steps" id="install-steps">
            {steps.map((s, i) => (
              <li key={i}>
                <span className="install-number" aria-hidden="true">
                  {i + 1}
                </span>
                <StepIcon name={s.icon} />
                <span className="install-text">
                  {s.main}
                  {s.hint && <span className="install-hint">{s.hint}</span>}
                </span>
              </li>
            ))}
          </ol>
          <div className="install-buttons">
            <button type="button" aria-expanded={true} aria-controls="install-steps" onClick={() => setOpen(false)}>
              {t.hide}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/** Small drawings of the buttons the parent looks for on the iPhone. */
function StepIcon({ name }: { name: string }) {
  const common = { width: 34, height: 34, viewBox: "0 0 34 34", "aria-hidden": true, className: "install-icon" } as const;
  if (name === "share")
    return (
      <svg {...common}>
        <path d="M11 14 H8 V30 H26 V14 H23" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" />
        <path d="M17 21 V4 M11 10 L17 4 L23 10" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  if (name === "add")
    return (
      <svg {...common}>
        <rect x="5" y="5" width="24" height="24" rx="6" fill="none" stroke="currentColor" strokeWidth="2.4" />
        <path d="M17 11 V23 M11 17 H23" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
    );
  if (name === "check")
    return (
      <svg {...common}>
        <path d="M7 18 L14 25 L27 9" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/icons/icon-192.png" alt="" width={34} height={34} className="install-icon install-mika" />
  );
}

/** Registers the offline helper (production only, so development stays simple). */
export function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {});
  }, []);
  return null;
}
