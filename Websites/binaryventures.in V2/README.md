# Binary Ventures Website V2

This folder is the zero-based rebuild workspace for `binaryventures.in`.

Current phase:
- strategy
- content
- page structure
- implementation scaffold
- first shared UI integration

This is not a continuation of the current website's design system. The old site may be referenced for factual business information only.

## Current Goal

Move from strategy-only planning into V2 implementation without inheriting the old site's design patterns.

## Implementation Status

- Next.js App Router scaffold is now active in this folder
- Tailwind CSS v4 and TypeScript are configured
- shadcn-style structure is established through `components.json`
- default styles live in `src/app/globals.css`
- reusable UI components live in `src/components/ui`
- shared site shell pieces now live in `src/components/site`
- shared navigation and contact details now live in `src/content/site.ts`
- the first integrated shared component is `src/components/ui/header-3.tsx`
- the homepage hero prototype is integrated in `src/components/ui/hero-section-1.tsx`
- motion helper components are available in `src/components/ui/animated-group.tsx` and `src/components/ui/text-effect.tsx`
- the homepage proof/testimonial columns section is integrated in `src/components/ui/testimonials-columns-1.tsx`
- the homepage positioning/mockup section is integrated in `src/components/ui/section-with-mockup.tsx`
- the homepage services preview section is integrated in `src/components/ui/ai-models-preview.tsx`
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
- `docs/api_design.md`
- `docs/workflows.md`
