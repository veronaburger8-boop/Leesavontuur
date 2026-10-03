import { requireStaff } from "@/lib/auth";
import { payfastConfig } from "@/lib/payfast";
import { createAdminClient } from "@/lib/supabase/admin";
import { setBilling, setPilot } from "./actions";

export const metadata = { title: "Families" };

interface Sub {
  parent_id: string;
  status: string;
  pilot: boolean;
  paid_until: string | null;
}

const when = (s: string | null) =>
  s ? new Date(s).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric", timeZone: "Africa/Johannesburg" }) : "–";

/**
 * Charging on/off, and each family's subscription. Children's names are not
 * shown here: only how many children a family has.
 */
export default async function FamiliesPage({ searchParams }: PageProps<"/admin/families">) {
  const { profile } = await requireStaff();
  const sp = await searchParams;
  if (profile.role !== "admin")
    return (
      <section className="panel">
        <h1>Families</h1>
        <p>Only the admin can see families and payments.</p>
      </section>
    );
  const admin = createAdminClient();
  const [{ data: setting }, { data: parents }, { data: users }, { data: learners }, { data: subs }, { data: events }] = await Promise.all([
    admin.from("app_settings").select("value").eq("key", "billing_on").single(),
    admin.from("profiles").select("id, display_name, role, created_at").order("created_at", { ascending: false }),
    admin.auth.admin.listUsers({ perPage: 1000 }),
    admin.from("learners").select("parent_id"),
    admin.from("subscriptions").select("parent_id, status, pilot, paid_until"),
    admin.from("payment_events").select("parent_id, payment_status, amount_cents, received_at").order("received_at", { ascending: false }).limit(20),
  ]);
  const billingOn = Number(setting?.value) === 1;
  const email = new Map((users?.users ?? []).map((u) => [u.id, u.email ?? ""]));
  const children = (id: string) => (learners ?? []).filter((l) => l.parent_id === id).length;
  const subOf = new Map(((subs ?? []) as Sub[]).map((s) => [s.parent_id, s]));
  const live = payfastConfig().live;
  const families = parents ?? [];
  const paying = families.filter((p) => {
    const s = subOf.get(p.id);
    return s?.paid_until && new Date(s.paid_until) > new Date() && !s.pilot;
  }).length;

  return (
    <>
      <section className="panel">
        <h1>Families</h1>
        {sp.saved && <p className="message ok">Saved.</p>}
        {sp.error && <p className="message error">{sp.error === "confirm" ? "Tick the box to confirm." : "Something went wrong."}</p>}
        <p>
          {families.length} families · {paying} paying · {families.filter((p) => subOf.get(p.id)?.pilot).length} pilot families
        </p>
        <p className={`message ${live ? "ok" : "info"}`}>
          PayFast: {live ? "live (real payments)" : "practice mode (sandbox): no real money is taken. Switch to live in Vercel when your PayFast account is ready."}
        </p>
        <h2>Charging</h2>
        {billingOn ? (
          <>
            <p className="message ok">Charging is ON: every child gets one free lesson; then the family needs a subscription (pilot families stay free).</p>
            <form action={setBilling}>
              <input type="hidden" name="on" value="0" />
              <button type="submit">Switch charging off (everything free)</button>
            </form>
          </>
        ) : (
          <>
            <p className="message info">Charging is OFF (the pilot): everything is free for everyone.</p>
            <p className="sub">Before switching on: mark the pilot families below, and give them at least 14 days&apos; notice (terms of use).</p>
            <form action={setBilling} className="form">
              <input type="hidden" name="on" value="1" />
              <label className="check">
                <input type="checkbox" name="confirm" value="yes" required />
                <span>I have told the pilot families at least 14 days ago, and marked the families who stay free.</span>
              </label>
              <div>
                <button className="primary" type="submit">
                  Switch charging on
                </button>
              </div>
            </form>
          </>
        )}
      </section>

      <section className="panel">
        <h2>All families</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Email</th>
                <th>Children</th>
                <th>Joined</th>
                <th>Subscription</th>
                <th>Paid until</th>
                <th>Pilot family</th>
              </tr>
            </thead>
            <tbody>
              {families.map((p) => {
                const s = subOf.get(p.id);
                return (
                  <tr key={p.id}>
                    <td>
                      {email.get(p.id)}
                      {(p.display_name || p.role !== "parent") && (
                        <span className="sub" style={{ display: "block", margin: 0 }}>
                          {[p.display_name, p.role !== "parent" ? p.role : null].filter(Boolean).join(" · ")}
                        </span>
                      )}
                    </td>
                    <td>{children(p.id)}</td>
                    <td>{when(p.created_at)}</td>
                    <td>{s?.status && s.status !== "none" ? s.status : "–"}</td>
                    <td>{when(s?.paid_until ?? null)}</td>
                    <td>
                      <form action={setPilot}>
                        <input type="hidden" name="parent" value={p.id} />
                        <input type="hidden" name="pilot" value={s?.pilot ? "0" : "1"} />
                        <button className={`small${s?.pilot ? " primary" : ""}`} type="submit" aria-label={`${s?.pilot ? "Remove pilot" : "Make pilot family"}: ${email.get(p.id)}`}>
                          {s?.pilot ? "✓ Pilot" : "Make pilot"}
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <h2>Latest payments</h2>
        {(events ?? []).length === 0 ? (
          <p className="sub">No payments yet.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Family</th>
                  <th>Status</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {(events ?? []).map((e, i) => (
                  <tr key={i}>
                    <td>{when(e.received_at)}</td>
                    <td>{e.parent_id ? email.get(e.parent_id) : "–"}</td>
                    <td>{e.payment_status}</td>
                    <td>{e.amount_cents === null ? "–" : `R${(e.amount_cents / 100).toFixed(2)}`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
