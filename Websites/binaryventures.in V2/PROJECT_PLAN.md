# Binary Ventures Website V2 Plan

## Current Focus

Build the redesign foundation while standing up the V2 codebase in parallel so approved components can be integrated immediately.

## Phase 1 — Strategy and Content

- lock positioning
- define sitemap
- write page roles
- write core page copy
- define proof framing
- define component request plan

## Phase 2 — Visual Direction and Structure

- select component roles
- create page-by-page layout system
- define type, color, spacing, and motion system
- validate desktop and mobile visual hierarchy
- replace generic prototype content with V2-specific navigation and page sections

## Phase 3 — Implementation

- extend the V2 scaffold in this folder
- wire shared layout, navigation, and pages
- adapt approved components to the V2 system
- replace demo placeholder content with actual page builds

## Phase 3b — Visual System Finalisation (Dark Theme Overhaul)

This phase was added after NinjaPromo visual analysis (April 2026) confirmed the dark palette direction.

- rewrite the color token system in `globals.css` to the locked dark palette
- apply the primary brand gradient (`#D278FE → #2D69FB`) to buttons, headline accents, and featured elements
- build and wire the new homepage stat strip (large-number metric block)
- do a visual pass on every section component to confirm dark treatment and gradient accents
- enforce alternating section backgrounds for visual rhythm
- full desktop and mobile visual review before moving to Phase 4

Reference: `docs/dark_theme_plan.md`, `docs/visual_system_brief.md`, `DECISIONS.md` (Decision 008–009)

## Phase 4 — Launch Preparation

- polish copy
- add final case-study assets
- finalize CTA links
- review performance, SEO, and responsiveness
