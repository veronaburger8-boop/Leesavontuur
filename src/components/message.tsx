export function Message({ kind, children }: { kind: "ok" | "error" | "info"; children: React.ReactNode }) {
  if (!children) return null;
  return (
    <p className={`message ${kind}`} role={kind === "error" ? "alert" : "status"}>
      {children}
    </p>
  );
}
