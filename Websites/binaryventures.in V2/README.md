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
- the first integrated shared component is `src/components/ui/header-3.tsx`

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
- `docs/api_design.md`
- `docs/workflows.md`
