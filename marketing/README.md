# Marketing

- `posts/`: Facebook / Instagram pictures (1080 × 1350), the Facebook cover and the profile picture.
- `pack/index.html`: the marketing pack page (captions in Afrikaans and English, posting plan, page setup, Google Search Console steps). Published as a private claude.ai page for the owner.
- `build/`: how the pictures are made. `posts.mjs` holds the wording; run `npx tsx marketing/build/mika.tsx` once, then `node marketing/build/render.mjs` (needs Playwright).

Rules: only true facts from the website, no invented reviews or numbers, no photos of real children without written consent.
