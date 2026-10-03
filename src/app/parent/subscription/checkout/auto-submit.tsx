"use client";

import { useEffect } from "react";

/** Submits the PayFast form once the page has loaded (the button stays as a fallback). */
export function AutoSubmit({ formId }: { formId: string }) {
  useEffect(() => {
    const form = document.getElementById(formId);
    if (form instanceof HTMLFormElement) form.requestSubmit();
  }, [formId]);
  return null;
}
