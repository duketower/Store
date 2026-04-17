# Binary Ventures Website V2 Task Queue

## Current

- [ ] Run a focused desktop and mobile screenshot review across all live pages when requested
- [ ] Prioritize practical navigation, spacing, service-flow, and content fixes from that review

## Backlog

- replace the temporary Contact-page booking route with a real scheduling link later
- add visual assets to the Work page case studies later
- decide whether the services preview should remain modal-driven or evolve into direct page links as the dedicated Services page is built
- deepen Services and Case Studies with more technical implementation detail
- add a Blog section for publishing useful company notes, service explainers, and technical/business guides; working categories are Guides, Ratings, and Strategies, but the structure should be tweaked beyond the NinjaPromo-style reference before writing begins, with room for additional sections
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
