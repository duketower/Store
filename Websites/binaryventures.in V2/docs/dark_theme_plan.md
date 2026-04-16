# Dark Theme Visual Overhaul Plan

Inspired by the NinjaPromo color and visual system analysis (April 2026).

This document defines the full implementation plan for shifting BinaryVentures V2 from its current light foundation to a dark, gradient-accented premium tech aesthetic.

---

## What We Are Adapting (and Why)

NinjaPromo uses a dark theme with a carefully controlled palette:
- Deep near-black background with a blue undertone
- One primary brand gradient (purple → blue)
- Secondary warm gradients for metric accents
- White text hierarchy using opacity variants
- Subtle white-on-dark borders and card separations
- Gradient text for headline impact
- Gradient borders using `padding-box / border-box` layering

This matches the "bold premium tech" direction already defined in the BV V2 visual system brief. The current light theme is a placeholder palette — this plan finalises the actual visual direction.

---

## Exact Source Colors (from NinjaPromo CSS)

### Background Stack
| Role | Value |
|---|---|
| Primary page background | `#070A12` |
| Card background | `#121212` |
| Secondary/elevated background | `#1e212d` |

### Primary Brand Gradient
```
linear-gradient(270deg, #D278FE 0%, #2D69FB 100%)
```
- `#D278FE` — vivid violet / pink-purple
- `#2D69FB` — electric cobalt blue

### Secondary Gradients (metric accents)
```
linear-gradient(270deg, #fba05a 0%, #f66979 100%)   ← orange to coral
linear-gradient(270deg, #f66979 0%, #d278fe 100%)   ← coral to purple
```

### Accent Spot Colors
| Color | Hex | Role |
|---|---|---|
| Warm amber | `#fba05a` | Metric label accents |
| Coral | `#f66979` | Secondary label accents |
| Teal/mint | `#00E5A8` | Spot accents, highlights |
| Cyan | `#22D3EE` | Highlights, icon accents |

### Text Hierarchy
| Role | Value |
|---|---|
| Primary text | `#ffffff` |
| Secondary text | `rgba(255,255,255, 0.70)` |
| Muted text | `rgba(255,255,255, 0.42)` |
| Disabled/faint | `#B3B3B3` |

### Borders and Surfaces
| Role | Value |
|---|---|
| Default card border | `rgba(255,255,255, 0.08)` |
| Stronger border | `rgba(255,255,255, 0.12)` |
| Card tint (purple) | `rgba(210,120,254, 0.08)` |
| Card tint (blue) | `rgba(45,105,251, 0.15)` |
| Surface glow | `rgba(210,120,254, 0.15–0.20)` |

---

## Phase 1 — Color System Foundation

**File:** `src/app/globals.css`

Replace the current light oklch tokens with the dark palette. Add new custom properties for gradients and accents.

### Token Mapping

| Token | Current Value | New Value |
|---|---|---|
| `--background` | near-white | `#070A12` |
| `--foreground` | near-black | `#ffffff` |
| `--card` | near-white | `#121212` |
| `--card-foreground` | near-black | `#ffffff` |
| `--popover` | near-white | `#1e212d` |
| `--popover-foreground` | near-black | `#ffffff` |
| `--primary` | dark neutral | `#D278FE` (violet) |
| `--primary-foreground` | near-white | `#ffffff` |
| `--secondary` | light neutral | `#1e212d` |
| `--secondary-foreground` | dark neutral | `rgba(255,255,255,0.70)` |
| `--muted` | light neutral | `rgba(255,255,255,0.06)` |
| `--muted-foreground` | medium neutral | `rgba(255,255,255,0.42)` |
| `--accent` | light neutral | `rgba(210,120,254,0.12)` |
| `--accent-foreground` | dark neutral | `#ffffff` |
| `--border` | light grey | `rgba(255,255,255,0.08)` |
| `--input` | light grey | `rgba(255,255,255,0.08)` |
| `--ring` | medium neutral | `#D278FE` |

### New Custom Properties to Add

```css
--gradient-brand: linear-gradient(270deg, #D278FE 0%, #2D69FB 100%);
--gradient-brand-text: linear-gradient(90deg, #D278FE 0%, #2D69FB 100%);
--gradient-warm: linear-gradient(270deg, #fba05a 0%, #f66979 100%);
--gradient-hot: linear-gradient(270deg, #f66979 0%, #d278fe 100%);
--color-violet: #D278FE;
--color-blue: #2D69FB;
--color-amber: #fba05a;
--color-coral: #f66979;
--color-teal: #00E5A8;
--color-cyan: #22D3EE;
```

---

## Phase 2 — Utility Classes

**File:** `src/app/globals.css`

Add utility classes for patterns used repeatedly across components.

### Gradient Text
```css
.gradient-text {
  background: var(--gradient-brand-text);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

### Gradient Border
```css
.gradient-border {
  border: 1px solid transparent;
  background:
    linear-gradient(var(--card), var(--card)) padding-box,
    var(--gradient-brand) border-box;
}
```

### Gradient Background Button
Applied on the primary CTA button: `background: var(--gradient-brand)` with `border: none`.

---

## Phase 3 — Component Visual Passes

Each component needs a visual pass to match the dark system. Most tokens (`bg-background`, `text-foreground`, `bg-card`, `border-border`) will update automatically once globals.css changes. The manual work is adding gradient accents, glow backgrounds, and gradient text where appropriate.

### 3.1 `src/components/site/site-header.tsx`
- Background: dark sticky header with `bg-background/80 backdrop-blur`
- Primary CTA ("Book a Call"): replace solid button with gradient background button
- Nav links: `text-foreground/70` hover to `text-foreground`

### 3.2 `src/components/ui/hero-section-1.tsx`
- Headline: apply `gradient-text` class to key words (e.g. "technology")
- Background: radial glow using `rgba(210,120,254,0.08)` at top-center
- Background image: confirm it works on dark — the current Unsplash image may need replacing
- CTA buttons: primary uses gradient, secondary uses gradient-border treatment

### 3.3 `src/components/ui/testimonials-columns-1.tsx` (Proof Section)
- Cards: `bg-card` (now `#121212`) with `border-border` (now `rgba(255,255,255,0.08)`)
- Radial glow heading area: use `rgba(210,120,254,0.12)` at section top
- Proof item names: style with `gradient-text` or `text-[#D278FE]`

### 3.4 `src/components/ui/section-with-mockup.tsx` (Positioning Block)
- Background: confirm dark — may need explicit `bg-background` to prevent light bleed
- Image frames: dark border treatment
- Body text: use `text-foreground/70` for supporting copy

### 3.5 `src/components/ui/objection-cards.tsx`
- Cards: `bg-card` with gradient-border on hover
- Section radial bg: `rgba(210,120,254,0.07)` at top
- Question text: `text-foreground`, answer: `text-foreground/70`

### 3.6 `src/components/ui/pricing-preview.tsx`
- Accent card: replace current gradient hint with proper `gradient-border` + `rgba(210,120,254,0.08)` background
- Price: apply `gradient-text` to the featured "From $1,500" price
- Section radial bg: teal glow variant — `rgba(0,229,168,0.07)` at top

### 3.7 `src/components/ui/ai-models-preview.tsx` (Services Preview)
- Cards: dark with `rgba(255,255,255,0.08)` border
- Service category accents: use spot colors (`#D278FE`, `#00E5A8`, `#fba05a`) per category
- CTA link: gradient-text or accent color

### 3.8 `src/components/ui/grid-feature-cards.tsx` (Process Section)
- Cards: dark card treatment, numbered steps with `gradient-text` on numbers
- Background: secondary bg `#1e212d` tint for visual separation

### 3.9 `src/components/ui/pulse-beams.tsx` (Final CTA)
- CTA button: gradient background button
- Background: radial glow combining violet and blue at center

---

## Phase 4 — New Metric / Stat Block

Inspired by NinjaPromo's large-number proof section. Add a stat callout strip between the hero and the proof columns.

**New file:** `src/components/ui/stat-strip.tsx`

### Stats to display
| Number | Label | Gradient |
|---|---|---|
| 3+ | Years of active client work | amber → coral |
| 10+ | Staff using systems daily | coral → violet |
| 2+ | Years on longest managed site | violet → blue |
| 5+ | Service areas in one studio | teal spot |

### Visual treatment
- Dark section background
- Large bold number (`text-5xl font-bold`) with `gradient-text` class
- Small label underneath using warm gradient or accent colour
- 4-column grid desktop, 2-column mobile

### Placement
Between `<ProofColumnsSection />` and `<SectionWithMockup />` in the homepage order.

---

## Phase 5 — Section Background Rhythm

Currently all sections use the same `bg-background`. Once dark, they need visual separation. Use alternating section backgrounds:

| Section | Background |
|---|---|
| Hero | `#070A12` + radial violet glow |
| Service pillars | `#070A12` |
| Proof columns | `#070A12` + radial violet glow at top |
| Stat strip | `#121212` (elevated) |
| Positioning block | `#070A12` |
| Objection cards | `#121212` (elevated) |
| Services preview | `#070A12` |
| Pricing preview | `#121212` (elevated) |
| Process section | `#070A12` |
| Final CTA | `#121212` + radial violet+blue glow |

---

## Phase 6 — Typography Refinements

- Hero headline: increase font weight to `font-bold` or `font-extrabold`
- Section headers: ensure `font-bold` and `tracking-tight` are consistent
- Metric numbers (stat strip): `font-black` for maximum impact
- Body copy: `text-foreground/70` for all supporting paragraph text

---

## Implementation Order

1. Phase 1 — globals.css token rewrite (unblocks all auto-updating tokens)
2. Phase 2 — utility classes in globals.css
3. Phase 3.1 — site header (visible on every page)
4. Phase 3.2 — hero section (first impression)
5. Phase 4 — stat strip (new component)
6. Phase 3.3 — proof columns
7. Phase 3.4 to 3.9 — remaining section passes
8. Phase 5 — section background rhythm review
9. Phase 6 — typography pass
10. Full visual review on localhost, then mobile

---

## Risk Notes

- The current `dark:` Tailwind variants in some components assume a separate dark mode class on `<html>`. Since we are making the site dark-only (no light/dark toggle), we need to confirm any `dark:` variants are either removed or treated as default.
- The background images currently used in the hero (Unsplash) may wash out against the dark. They should be reviewed and replaced with dark-friendly imagery or removed in favour of the glow bg alone.
- `text-black` or hardcoded light colors in any component will need a manual pass — these will not update automatically from token changes.

---

## Definition of Done

- Every page route renders correctly in the dark theme at desktop and mobile
- No light background bleeding through any section
- Primary CTA uses the gradient button treatment
- At least one headline per page uses the gradient-text treatment
- Metric stat strip is live on homepage
- All section backgrounds follow the alternating rhythm
- No TypeScript errors (`npx tsc --noEmit` clean)
