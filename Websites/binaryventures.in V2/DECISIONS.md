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
