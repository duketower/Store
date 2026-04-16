# Binary Ventures Website V2 Decisions

## Decision 001

V2 is a zero-based redesign.

Reason:
- the new site must not inherit the visual or structural patterns of the current website

## Decision 002

The site will be multi-page, not single-page.

Reason:
- a premium high-trust company site benefits from proper page depth and shared navigation

## Decision 003

The homepage will be company-first, not founder-first.

Reason:
- visitors should trust the business offer immediately
- founder presence can appear later in About and supporting sections

## Decision 004

The main positioning is complete business tech setup.

Reason:
- it unifies websites, web apps, bots, automation, POS, and systems under one stronger promise

## Decision 005

Case studies will be anonymized unless permission is granted.

Reason:
- client confidentiality and practical publishing limits

## Decision 006

The tone will be direct and refined, and the visual direction will be bold premium tech.

Reason:
- this best matches the target market and desired trust level

## Decision 007

V2 will use a Next.js App Router + Tailwind CSS + TypeScript stack with shadcn-style component paths.

Reason:
- it keeps the new site aligned with the existing technical ecosystem without inheriting old design code
- future copied components work cleanly when `@/components/ui/*` and `@/lib/utils` already exist
- a stable UI path makes future Claude and Codex integrations more reliable

## Decision 008

V2 will use a dark-only theme. There is no light mode or theme toggle.

Reason:
- the visual direction is bold premium tech — a dark foundation matches this intent
- the NinjaPromo color system analysis confirmed the dark palette is the right call for the target aesthetic
- a single theme reduces implementation complexity and prevents visual inconsistency across components

Reference: `docs/dark_theme_plan.md` for the full palette, gradient definitions, and implementation phases.

## Decision 009

The primary brand gradient is `linear-gradient(270deg, #D278FE 0%, #2D69FB 100%)` — violet to cobalt blue.

Reason:
- sourced directly from NinjaPromo's CSS as the benchmark for this aesthetic
- applied to CTA buttons, gradient text on key headlines, and gradient borders on featured elements
- secondary warm gradients (`#fba05a → #f66979`) are used only for metric/stat label accents
