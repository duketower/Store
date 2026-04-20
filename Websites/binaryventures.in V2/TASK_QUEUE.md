# Binary Ventures Website V2 Task Queue

## Current

- [ ] Continue launch polish from live device review when new feedback is available

## Insights — Automation Layer: Manual Setup Required

Code is done. These steps require manual action before the pipeline can run:

- [ ] **You** — Create Notion database `Binary Ventures Insights Pipeline` with properties from `docs/insights_automation_guide.md` section 8
- [ ] **You** — Create Notion internal integration at notion.so/my-integrations, share DB with it, copy token
- [ ] **You** — Create Gemini API key at aistudio.google.com
- [ ] **You** — Add GitHub secrets to the repo: `NOTION_TOKEN`, `NOTION_DATABASE_ID`, `GEMINI_API_KEY`, `FIREBASE_SERVICE_ACCOUNT`
- [ ] **You** — Add at least one Notion item with Status = `Approved` to test the pipeline
- [ ] **You** — Run the Daily Insight workflow manually via GitHub Actions → workflow_dispatch
- [ ] **You** — Submit `https://binaryventures.in/sitemap.xml` in Google Search Console
- [ ] **You** — Monitor Search Console for two weeks before enabling auto-publish

Code already committed:
- [x] `scripts/generate-insight-article.mjs` — Notion → Gemini → Markdown, with quality validation
- [x] `.github/workflows/daily-insight.yml` — cron at 10:07 AM IST, build, commit, push, deploy
- [x] `.github/workflows/firebase-deploy.yml` — deploy on every push to main (paths: Websites/binaryventures.in V2/**)

## Backlog

- decide whether the services preview should remain modal-driven or evolve into direct page links as the dedicated Services page is built
- deepen Services and Case Studies with more technical implementation detail
- Insights section is live with 3 starter articles — automation layer is the next phase (see In Progress block above)
- add more articles to `src/content/insights/articles/` following the frontmatter format in `docs/insights_automation_guide.md`
- add a region-aware website experience using the plan in `docs/regional_pricing_strategy.md`; start with `/au` pages, regional pricing data, a region selector, and SEO-friendly `hreflang` rather than forced IP redirects
- save the AU/US reference website shortlist into project docs for later review
- enrich the simple pricing cards with the useful detail from the reverted pricing experiment
- tighten the homepage mobile header and hero spacing after live device review
- normalize the secondary page mobile spacing after the shared header fix
- convert the service pillars detail modal into a mobile-safe scrollable sheet
- implement the site-side Adelaide SEO foundations after strategy approval
- decide whether to add the supporting setup services as a secondary Services-page section or implement them directly into the current content model
- review the grouped services architecture on live mobile after deploy

## Done

- created a separate V2 workspace
- locked core strategic direction through discovery
- wrote the first-pass site strategy, sitemap, and page copy
- refined the V2 messaging into a sharper second-pass copy draft
- created page-level design and visual system briefs
- created the V2 Next.js + Tailwind CSS + TypeScript scaffold
- added shadcn-compatible component aliases and utilities
- integrated and verified the first shared header prototype
- integrated and verified the first homepage hero prototype
- integrated and verified the first homepage proof/testimonial columns section
- integrated and verified the homepage positioning/mockup section
- integrated and verified the homepage services preview section
- integrated and verified the homepage process section
- integrated and verified the homepage final CTA section
- defined the first public pricing anchors and contact email
- built and verified the first real secondary page at `/work`
- built and verified the real `/services` page with synced pricing and engagement models
- built the real `/about` page from the approved founder-led positioning content
- built the real `/contact` page with dual-location details and enquiry guidance
- polished the core site metadata and project framing after the main routes were added
- fixed the homepage hydration mismatch caused by random decorative grid patterns
- refined the shared CTA button styling after homepage visual review
- improved the mobile header offset and hero responsiveness without changing the desktop structure
- aligned the secondary page mobile hero spacing and CTA button behavior with the shared header changes
- fixed the service pillars detail overlay so it scrolls cleanly on mobile without clipping behind the header
- ignored generated Firebase cache artifacts to keep the V2 workspace clean after deploys
- created and saved a detailed Adelaide SEO strategy report with official Google source references
- created and saved a detailed service expansion strategy for adding adjacent services without breaking the current visual system
- restructured the services architecture into grouped categories with visible pricing for the expanded offer set
- rebuilt the Services page around grouped sections so the expanded offer set does not feel buried
- updated the homepage service preview and Contact page so the grouped services stay visible outside the Services route
- ignored generated Firebase deploy logs to keep the V2 workspace clean after deploys
- removed low-value category strips from Case Studies and simplified the Services page structure after live review
- tightened the Case Studies page spacing after removing the decorative category strip
- ran a focused desktop and mobile route audit across all live pages
- fixed duplicated metadata titles on secondary pages
- replaced the stale homepage `Demo` wrapper with a named Home page component
- improved document dark-theme hints, focus states, reduced-motion handling, and image loading hints
- converted the homepage service preview cards into semantic keyboard-accessible buttons
- changed Book a Call CTAs from a circular Contact route to a prefilled email booking fallback
- verified mobile menu, service modal, and Services hash links in-browser
- added visual proof panels, surfaced metrics, and strengthened anonymized case-study cards on the Work page
- reviewed all public pages across desktop, tablet, and mobile
- made homepage scroll-reveal sections visible by default so full-page captures and slow devices do not show blank content bands
- replaced the email-based booking fallback with the real Calendly scheduling URL
- implemented the Insights section: `/insights` listing page, `/insights/[slug]` article page, Markdown article loader (`src/lib/insights.ts`), 3 starter articles, and sitemap generation (`src/app/sitemap.ts`); build verified clean
- built the full Insights automation layer: `scripts/generate-insight-article.mjs` (Notion → Gemini → Markdown + validation), `.github/workflows/daily-insight.yml` (cron 10:07 AM IST), `.github/workflows/firebase-deploy.yml` (push to main); awaiting manual secret setup to activate
