# Binary Ventures Website V2

This folder is the zero-based rebuild workspace for `binaryventures.in`.

Current phase:
- core multi-page implementation
- content and route structure
- visual refinement and proof expansion next

This is not a continuation of the current website's design system. The old site may be referenced for factual business information only.

## Current Goal

Move from core implementation into visual refinement, proof enrichment, and launch polish without inheriting the old site's design patterns.

## Implementation Status

- Next.js App Router scaffold is now active in this folder
- Tailwind CSS v4 and TypeScript are configured
- shadcn-style structure is established through `components.json`
- default styles live in `src/app/globals.css`
- reusable UI components live in `src/components/ui`
- shared site shell pieces now live in `src/components/site`
- shared navigation and contact details now live in `src/content/site.ts`
- grouped service architecture, pricing anchors, and engagement models now live in `src/content/services.ts`
- about page content now lives in `src/content/about.ts`
- contact page content now lives in `src/content/contact.ts`
- the first real secondary route is now live at `src/app/work/page.tsx`
- the second real secondary route is now live at `src/app/services/page.tsx`
- the third real secondary route is now live at `src/app/about/page.tsx`
- the fourth real secondary route is now live at `src/app/contact/page.tsx`
- the Work page composition and content live in `src/components/work/work-page.tsx` and `src/content/work.ts`
- the Services page composition lives in `src/components/services/services-page.tsx`
- Services and Case Studies now include structured technical capability layers instead of only high-level marketing copy
- the About page composition lives in `src/components/about/about-page.tsx`
- the Contact page composition lives in `src/components/contact/contact-page.tsx`
- a reusable site footer is available in `src/components/site/site-footer.tsx`
- the first integrated shared component is `src/components/ui/header-3.tsx`
- the homepage hero prototype is integrated in `src/components/ui/hero-section-1.tsx`
- motion helper components are available in `src/components/ui/animated-group.tsx` and `src/components/ui/text-effect.tsx`
- the homepage proof/testimonial columns section is integrated in `src/components/ui/testimonials-columns-1.tsx`
- the homepage positioning/mockup section is integrated in `src/components/ui/section-with-mockup.tsx`
- the homepage services preview section is integrated in `src/components/ui/ai-models-preview.tsx`
- the service architecture is now grouped across core builds, AI and automation, launch infrastructure, and brand/presence support
- the homepage process section is integrated in `src/components/ui/grid-feature-cards.tsx`
- the homepage final CTA section is integrated in `src/components/ui/pulse-beams.tsx`
- the existing `src/app/globals.css` token system remains the source of truth; external theme resets are adapted selectively instead of overwritten wholesale

## Local Development

```bash
npm install
npm run dev
```

## Key Docs

- `CLAUDE.md`
- `ARCHITECTURE.md`
- `PROJECT_PLAN.md`
- `TASK_QUEUE.md`
- `DECISIONS.md`
- `docs/product_spec.md`
- `docs/site_strategy.md`
- `docs/sitemap.md`
- `docs/page_copy.md`
- `docs/page_design_brief.md`
- `docs/visual_system_brief.md`
- `docs/component_request_plan.md`
- `docs/component_inventory.md`
- `docs/reference_websites.md`
- `docs/adelaide_seo_report.md`
- `docs/service_expansion_strategy.md`
- `docs/api_design.md`
- `docs/workflows.md`
