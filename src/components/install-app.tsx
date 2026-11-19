"use client";

import { useEffect, useState } from "react";
import type { Locale } from "@/lib/i18n";

const text = {
  af: {
    install: "📲 Installeer die app",
    ios: "Kry Leesavontuur as 'n app: tik op Deel",
    iosThen: "en dan op “Voeg by tuisskerm”.",
    done: "Leesavontuur is geïnstalleer. Kyk vir Mika op jou tuisskerm!",
  },
  en: {
    install: "📲 Install the app",
    ios: "Get Leesavontuur as an app: tap Share",
    iosThen: "then “Add to Home Screen”.",
    done: "Leesavontuur is installed. Look for Mika on your home screen!",
  },
};

interface InstallPrompt extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type Mode = "none" | "prompt" | "ios" | "installed";

/**
 * "Install the app": on Android and computers the browser's own install
 * prompt; on iPhone and iPad (which have no prompt) the two taps to add it to
 * the home screen. Nothing shows once it runs as an installed app.
 */
export function InstallApp({ locale }: { locale: Locale }) {
  const t = text[locale];
  const [mode, setMode] = useState<Mode>("none");
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (standalone) return;
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPrompt(e as InstallPrompt);
      setMode("prompt");
    };
    const onInstalled = () => setMode("installed");
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    // iPhone and iPad have no install prompt: show the steps instead (after the page has settled).
    const timer = ios ? window.setTimeout(() => setMode("ios"), 0) : undefined;
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  if (mode === "prompt" && prompt)
    return (
      <p className="install-app">
        <button
          type="button"
          onClick={async () => {
            await prompt.prompt();
            const { outcome } = await prompt.userChoice;
            setPrompt(null);
            setMode(outcome === "accepted" ? "installed" : "none");
          }}
        >
          {t.install}
        </button>
      </p>
    );
  if (mode === "ios")
    return (
      <p className="install-app sub">
        {t.ios}{" "}
        <span aria-hidden="true" className="share-icon">
          ⬆
        </span>{" "}
        {t.iosThen}
      </p>
    );
  if (mode === "installed") return <p className="install-app sub">{t.done}</p>;
  return null;
}

/** Registers the offline helper (production only, so development stays simple). */
export function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {});
  }, []);
  return null;
}
