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
        <Link className="button small" href="/admin/settings">
          Settings
        </Link>
      </nav>
      {children}
    </main>
  );
}
