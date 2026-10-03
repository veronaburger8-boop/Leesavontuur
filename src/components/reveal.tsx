"use client";

import { useEffect } from "react";

/**
 * Sections marked `.reveal` slide in gently as they scroll into view. Until
 * this runs (or without JavaScript, or with "reduce motion") everything simply
 * shows, so nothing can stay hidden.
 */
export function Reveal() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
    const els = [...document.querySelectorAll<HTMLElement>(".reveal")];
    const fold = window.innerHeight;
    for (const el of els) if (el.getBoundingClientRect().top < fold) el.classList.add("in");
    document.documentElement.classList.add("reveal-ready");
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries)
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    els.filter((el) => !el.classList.contains("in")).forEach((el) => io.observe(el));
    return () => {
      io.disconnect();
      document.documentElement.classList.remove("reveal-ready");
    };
  }, []);
  return null;
}
