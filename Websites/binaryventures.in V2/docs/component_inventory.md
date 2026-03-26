# Binary Ventures Website V2 Component Inventory

This document tracks external or user-supplied components that have been reviewed, integrated, adapted, or intentionally deferred.

Use this file when:

- replacing a section later because the look no longer feels right
- remembering which source component was used for a homepage block
- checking whether a component was integrated as-is or adapted for Binary Ventures

## Rule

Whenever a user-supplied component is added, replaced, removed, or intentionally deferred, update this file in the same task.

## Current Homepage Order

1. Shared header
2. Hero
3. Proof
4. Positioning
5. Services
6. Process
7. Final CTA

## Integrated Components

| Original Component | Current File | Current Role | Status | Notes |
| --- | --- | --- | --- | --- |
| `header-3.tsx` | `src/components/ui/header-3.tsx` | Shared site header prototype | Integrated | Still partially generic and should be refined further as real routes/pages are built |
| `hero-section-1.tsx` | `src/components/ui/hero-section-1.tsx` | Homepage hero | Integrated | Adapted to Binary Ventures messaging, nav labels, CTAs, and imagery |
| `testimonials-columns-1.tsx` | `src/components/ui/testimonials-columns-1.tsx` | Homepage proof strip | Integrated | Converted from testimonials into anonymized proof/outcome cards |
| `section-with-mockup.tsx` | `src/components/ui/section-with-mockup.tsx` | Homepage positioning block | Integrated | Adapted to explain the end-to-end setup model |
| `ai-models-preview.tsx` | `src/components/ui/ai-models-preview.tsx` | Homepage services preview | Integrated | Converted from AI model cards into Binary Ventures service pillars with modal details |
| `grid-feature-cards.tsx` | `src/components/ui/grid-feature-cards.tsx` | Homepage process block | Integrated | Converted from generic feature cards into a working-method section |
| `pulse-beams.tsx` | `src/components/ui/pulse-beams.tsx` | Homepage final CTA | Integrated | Converted from a full-screen effect demo into a shorter CTA section with real homepage actions |

## Support Components Added For Imported Sections

| Original Component | Current File | Role | Status | Notes |
| --- | --- | --- | --- | --- |
| `shadcn/button` | `src/components/ui/button.tsx` | Shared button primitive | Integrated | Used by multiple sections |
| `shadcn/navigation-menu` | `src/components/ui/navigation-menu.tsx` | Shared navigation primitive | Integrated | Used by the shared header |
| `menu-toggle-icon` | `src/components/ui/menu-toggle-icon.tsx` | Mobile nav icon | Integrated | Used by the shared header |
| `animated-group` | `src/components/ui/animated-group.tsx` | Motion helper | Integrated | Supports the hero and future motion sections |
| `text-effect` | `src/components/ui/text-effect.tsx` | Motion helper | Integrated | Available for future headings and copy reveals |

## Reviewed But Not Yet Integrated

| Original Component | Recommended Future Role | Status | Notes |
| --- | --- | --- | --- |
| `project-showcase.tsx` | Homepage Selected Work preview or `/work` page block | Deferred | Good fit for anonymized case studies, not a good fit for the process section |

## Replacement Notes

- Swapping a component later is allowed and expected if the final look does not feel right
- When replacing a section, keep the section role stable first, then compare alternative components for that same role
- Preserve the V2 palette and semantic tokens in `src/app/globals.css` when adapting replacements
