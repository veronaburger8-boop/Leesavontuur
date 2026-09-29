// Makes an existing account an admin (or reviewer, or back to parent).
//
// Usage: npm run make-admin -- someone@example.com [admin|reviewer|parent]
//
// Reads NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY from .env.local.
// The person must have signed up on the site first.

import { createClient } from "@supabase/supabase-js";

async function main() {
  const [email, role = "admin"] = process.argv.slice(2);
  if (!email || !["admin", "reviewer", "parent"].includes(role)) {
    console.error("Usage: npm run make-admin -- someone@example.com [admin|reviewer|parent]");
    process.exit(1);
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in .env.local first.");
  const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

  for (let page = 1; ; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const user = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (user) {
      const { error: updateError } = await supabase.from("profiles").update({ role }).eq("id", user.id);
      if (updateError) throw updateError;
      console.log(`${email} is now: ${role}`);
      return;
    }
    if (data.users.length < 200) break;
  }
  console.error(`No account found for ${email}. Sign up on the site first.`);
  process.exit(1);
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
