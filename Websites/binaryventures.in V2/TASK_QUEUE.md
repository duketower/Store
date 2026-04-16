# Binary Ventures Website V2 Task Queue

## Current — Dark Theme Visual Overhaul

Full plan: `docs/dark_theme_plan.md`

### Phase 1 — Color System Foundation
- [ ] Rewrite `src/app/globals.css` — replace all light oklch tokens with dark palette values
- [ ] Add gradient custom properties: `--gradient-brand`, `--gradient-warm`, `--gradient-hot`
- [ ] Add accent spot color properties: `--color-violet`, `--color-blue`, `--color-amber`, `--color-coral`, `--color-teal`, `--color-cyan`
- [ ] Add `.gradient-text`, `.gradient-border` utility classes

### Phase 2 — Header
- [ ] Update `src/components/site/site-header.tsx` — dark nav, gradient CTA button

### Phase 3 — Hero
- [ ] Update `src/components/ui/hero-section-1.tsx` — gradient text on headline, radial violet glow bg, review background image for dark compatibility

### Phase 4 — New Stat Strip
- [ ] Build `src/components/ui/stat-strip.tsx` — large-number metric block (4 stats, gradient labels)
- [ ] Wire into homepage between proof columns and positioning block

### Phase 5 — Remaining Section Passes
- [ ] `src/components/ui/testimonials-columns-1.tsx` — dark cards, purple glow section bg
- [ ] `src/components/ui/section-with-mockup.tsx` — confirm dark, no light bleed
- [ ] `src/components/ui/objection-cards.tsx` — gradient-border on hover, section glow
- [ ] `src/components/ui/pricing-preview.tsx` — gradient-border + teal glow on featured card, gradient price text
- [ ] `src/components/ui/ai-models-preview.tsx` — dark cards, per-category accent colors
- [ ] `src/components/ui/grid-feature-cards.tsx` — dark treatment, gradient step numbers
- [ ] `src/components/ui/pulse-beams.tsx` — gradient CTA button, radial violet+blue glow

### Phase 6 — Section Background Rhythm
- [ ] Apply alternating backgrounds per the rhythm defined in `docs/dark_theme_plan.md` Phase 5

### Phase 7 — Typography Pass
- [ ] Audit headline weights across all sections — `font-bold` / `font-extrabold` where needed
- [ ] Confirm body copy uses `text-foreground/70` pattern throughout

### Phase 8 — Review
- [ ] Full visual review on localhost at desktop and mobile breakpoints
- [ ] `npx tsc --noEmit` clean
- [ ] No light backgrounds bleeding through any section

## Backlog

- replace the temporary Contact-page booking route with a real scheduling link later
- add visual assets to the Work page case studies later
- decide whether the services preview should remain modal-driven or evolve into direct page links as the dedicated Services page is built
- deepen Services and Case Studies with more technical implementation detail
- add a Blog section for publishing useful company notes, service explainers, and technical/business guides; working categories are Guides, Ratings, and Strategies, but the structure should be tweaked beyond the NinjaPromo-style reference before writing begins, with room for additional sections
- add a region-aware website experience so visitors can see only the content, service framing, and pricing relevant to their country; explore a region dropdown, automatic country detection, or a combined approach with manual override
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
