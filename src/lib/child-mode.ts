// Child mode: once a child starts reading on this device, the parent area and
// admin area need the parent's PIN (or password) again (brief, section 5).

export const CHILD_COOKIE = "child_mode";

/** Paths a child may use without the PIN. */
export const isChildPath = (path: string) => path === "/learn" || path.startsWith("/learn/");

/** Paths that need the parent to unlock child mode first. */
export const isParentPath = (path: string) =>
  path === "/parent" || path.startsWith("/parent/") || path === "/admin" || path.startsWith("/admin/");
