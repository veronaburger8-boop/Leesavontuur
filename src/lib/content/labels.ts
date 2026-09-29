import type { Status } from "./types";

export const STATUS_LABELS: Record<Status, string> = {
  draft: "Draft",
  in_review: "In review",
  published: "Published",
  retired: "Retired",
};
