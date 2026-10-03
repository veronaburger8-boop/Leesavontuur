# Launch checklist

Things to do before real families use Leesavontuur. Prices are rough; check the provider's own pricing page before paying.

Suggested order: 1 → 2 → 3 → 5 → 4 → 6 → 7, with 8–11 alongside.

## A. Decide first

- [x] **1. Pricing**: decided. A free pilot with invited families (14 days' notice before it ends); after that, one free lesson per child for new families, then R99 per family per month (option B). Still to do before charging: the owner's PayFast account (verified, with recurring billing) and its details in Vercel, then the paid hosting plans (4). The subscription part of the site is built and works in PayFast's practice mode (README, "Payments"); the owner runs `20261005080000_subscriptions.sql` first.
- [x] **2. Final name**: decided. The name stays "Leesavontuur".

## B. Sign up or buy (costs money)

- [x] **3. Domain name**: done. `leesavontuur.co.za` (registered at registerdomain.co.za) uses Vercel's nameservers, so DNS records are managed in Vercel → Domains. The site's address is `https://www.leesavontuur.co.za` (the bare domain redirects there). `NEXT_PUBLIC_SITE_URL` is set in Vercel; Supabase's Site URL and Redirect URLs point to the new address (the old `leesavontuur-rho.vercel.app` stays as a spare).
- [ ] **4. Hosting plans**: Vercel's free plan is non-commercial only (Pro about US$20/month if charging). Supabase free pauses inactive projects and has no daily backups (Pro about US$25/month with daily backups).
- [x] **5. Email service**: done. Resend (free plan, account leesavontuur194@gmail.com, region Ireland) verified for `leesavontuur.co.za` (DNS records added in Vercel automatically). Supabase sends sign-up and password emails through Resend SMTP as "Leesavontuur <noreply@leesavontuur.co.za>". Optional later: a DMARC record.

## C. Check

- [ ] **6. POPIA and privacy**: the owner checked the privacy policy and terms; the "Draft" notes were removed (version 2026-10-03). The privacy policy now lists everything the site stores, the service providers (Supabase and Resend in Ireland, Vercel), the transfer abroad, cookies, retention and the right to complain to the Information Regulator; new Terms of use (af/en) at /terms cover the pilot, R99/month, cancelling and the Consumer Protection Act. Still to do (owner): register as Information Officer with the Information Regulator (eServices on inforegulator.org.za). Add how payments are handled to the privacy policy when charging starts.
- [x] **7. Security settings**: done. "Confirm email" on in Supabase; two-step login (authenticator app) on Supabase, GitHub, Vercel and Resend; recovery codes stored offline. registerdomain.co.za has no two-step login: use a strong unique password and keep Registrar Lock on.
- [ ] **8. Testing with real children** (checklist in the README).

## D. Content

- [x] **9.** The 4 lessons with shortened options were fixed by the owner in the site's editor. Note: `content/lessons.json` still has the old options, so never re-import it with "replace" switched on.
- [ ] **10.** Rewrite and publish the "Oor lees" articles.
- [ ] **11.** Pictures for the Level 1–2 word cards: illustrated, photos or generated, and who makes them?
