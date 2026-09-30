import Link from "next/link";
import { requireStaff } from "@/lib/auth";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  await requireStaff();
  return (
    <main className="wide" lang="en">
      <nav className="row" aria-label="Admin" style={{ marginBottom: 14 }}>
        <Link className="button small" href="/admin">
          Content library
        </Link>
        <Link className="button small" href="/admin/import">
          Import
        </Link>
        <Link className="button small" href="/admin/content/new">
          Write a lesson
        </Link>
        <Link className="button small" href="/admin/draft">
          Draft with AI
        </Link>
        <Link className="button small" href="/admin/requests">
          Requests
        </Link>
        <Link className="button small" href="/admin/topics">
          Topics
        </Link>
        <Link className="button small" href="/admin/articles">
          Articles
        </Link>
        <Link className="button small" href="/admin/settings">
          Settings
        </Link>
      </nav>
      {children}
    </main>
  );
}
