# Binary Ventures Website V2 Task Queue

This file is the single source of truth for active website work.

## Current

- [x] Set up Google Search Console for `https://binaryventures.in/`
- [x] Submit `https://binaryventures.in/sitemap.xml` in Google Search Console
- [x] Inspect key public URLs in Google Search Console and request indexing where needed
- [x] Add Google Search Console verification token to website env and verify `https://binaryventures.in/`
- [x] Add GA4 measurement ID to website env as `NEXT_PUBLIC_GA_MEASUREMENT_ID` (`G-R5ZYQW7GJV`)
- [ ] Confirm exact business location details for schema: business name, address, city, postal code, country, phone, opening hours, and Google Maps URL
  - Received:
    - Business name: `Binary Ventures Pvt Ltd`
    - Address: `Janeshwar Enclave, Lucknow, Uttar Pradesh, India`
    - City: `Lucknow`
    - Postal code: `226021`
    - Country: `India`
    - Phone: `7399006699`
    - Opening hours: `10:00 AM to 6:00 PM`
  - Still needed:
    - Google Maps URL
- [x] Confirm whether the India and Australia entries are staffed offices, service areas, or operating regions only
  - India: real office
  - Australia: real office
- [ ] Add public social profile URLs into structured data once final links are confirmed
  - Not available yet
- [ ] Decide whether Google Business Profile / local SEO setup is in scope for this site now
- [ ] Review Search Console data after verification and refine titles, descriptions, and weak pages based on real queries
- [ ] Publish more insight articles tied to service and use-case intent
- [ ] Expand service-page copy and proof blocks based on target keyword clusters
- [ ] Decide whether to add more use-case pages beyond the current `/solutions/*` set

## SEO Status

### Done

- [x] Added sitewide metadata foundation
- [x] Added canonical URLs, Open Graph tags, Twitter tags, and page-level metadata
- [x] Added structured data for Organization, WebSite, WebPage, breadcrumb, services, work, contact, and articles
- [x] Added `robots.txt`
- [x] Added `sitemap.xml`
- [x] Added generated social preview images
- [x] Added GA4-ready click tracking hooks pending measurement ID
- [x] Built real service landing pages under `/services/[slug]`
- [x] Built real case-study pages under `/work/[slug]`
- [x] Built supporting use-case pages under `/solutions/[slug]`
- [x] Tightened internal linking across Services, Work, Insights, and Use Cases
- [x] Added buyer-intent / use-case links under Services navigation
- [x] Updated reusable SEO guidance in `../SEO_GUIDELINE.md`
- [x] Ran local visual verification before publishing new service/use-case UI
- [x] Deployed the latest SEO/navigation changes live to Firebase Hosting

### Pending External Inputs

- [x] Google Search Console verification token
- [x] GA4 measurement ID (`G-R5ZYQW7GJV`)
- [ ] Exact business schema details
  - Partial details received; Google Maps URL still pending
- [ ] Location classification: office vs service area vs operating region
- [ ] Social profile URLs

### Ongoing SEO Work

- [ ] Search Console review loop
- [ ] Content expansion
- [ ] Local SEO / GBP decision
- [ ] CTR and metadata refinement

## Insights — Editorial Workflow

- [ ] Review newly discovered Notion topics with Status = `Trend Found`
- [ ] Approve one topic by changing Status to `Approved`
- [ ] Review generated drafts and set ready articles back to `Approved`

## Insights — Automation Layer

The staged automation flow is:

- `Find Insight Trends` creates Notion rows with Status = `Trend Found`
- You approve a topic with Status = `Approved`
- `Generate Insight Draft` creates a Markdown draft, checks `Generated Draft`, and sets Status = `Generated`
- You approve the reviewed draft by setting Status back to `Approved`
- `Publish Approved Insight` publishes the article, deploys Firebase, and sets Status = `Published`

Code present:

- [x] `scripts/find-insight-trends.mjs` — trend/news signals -> Gemini topic planning -> Notion `Trend Found`
- [x] `scripts/generate-insight-article.mjs` — Notion `Approved` with `Generated Draft` unchecked -> Gemini -> draft Markdown -> Notion `Generated`
- [x] `scripts/publish-approved-insight.mjs` — Notion `Approved` with `Generated Draft` checked -> Markdown `published` -> Notion `Published` after deploy
- [x] repo-root `.github/workflows/find-insight-trends.yml` — cron at 08:37 AM IST
- [x] repo-root `.github/workflows/daily-insight.yml` — polls every 5 minutes for approved topics
- [x] repo-root `.github/workflows/publish-approved-insight.yml` — polls every 5 minutes for publish approvals
- [x] repo-root `.github/workflows/firebase-deploy.yml` — deploy on website pushes to main
- [x] `Find Insight Trends` manually tested successfully; created 5 Notion `Trend Found` topics

## Backlog

- add more editorial guardrails after reviewing the first week of generated drafts
- decide whether the services preview should remain modal-driven or evolve into direct page links as the dedicated Services page is built
- deepen Services and Case Studies with more technical implementation detail
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
- built the first Insights automation layer: `scripts/generate-insight-article.mjs` (Notion → Gemini → draft Markdown + validation), repo-root `.github/workflows/daily-insight.yml`, repo-root `.github/workflows/firebase-deploy.yml` (push to main)
- upgraded Insights automation into a staged editorial flow: trend discovery, topic approval, draft generation, final publish approval, Firebase deploy, and Notion published status update
- fixed Insights launch blockers: added navigation discovery, corrected starter article Calendly URLs, moved workflows to repo root, made generated articles drafts by default, hid non-published article pages from static generation, added custom article typography, and added static category pages at `/insights/category/[slug]`
- implemented the core technical SEO layer for Website V2: metadata, canonicals, OG/Twitter tags, schema, robots, sitemap, social preview images, and tracking-ready analytics hooks
- built indexable service pages under `/services/[slug]` and connected them into sitemap and navigation
- built indexable case-study pages under `/work/[slug]` and connected them into sitemap and internal links
- built high-intent use-case pages under `/solutions/[slug]` and connected them into Services navigation as `Use Cases`
- expanded service pages with richer commercial-intent sections, related proof, related insights, and internal links
- created the reusable `Websites/SEO_GUIDELINE.md` reference and aligned it with the current navigation/content pattern
- visually verified the new Services / Use Cases UI locally across desktop and mobile before publishing
- deployed the updated Services / Use Cases navigation and SEO pages live to `https://binaryventures.in`
