"use client";

/** Opens the browser's print window, where the report can also be saved as a PDF. */
export function PrintButton({ label }: { label: string }) {
  return (
    <button type="button" className="primary no-print" onClick={() => window.print()}>
      {label}
    </button>
  );
}
