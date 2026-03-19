# Build Plan: binaryventures.in Website
## Reference: https://webdesigner-tecklenburg.de (exact mirror with Binary Ventures content)

---

## Context
Build a pixel-faithful clone of webdesigner-tecklenburg.de, replacing all content/branding with Binary Ventures Pvt Ltd.
Stack: Next.js (App Router) + TypeScript + Tailwind CSS + GSAP.
All files live inside `Website/` — nothing outside.

---

## STEP 1 — Scaffold the Project

```bash
cd "Website/"
npx create-next-app@latest . --typescript --tailwind --app --src-dir --no-eslint --import-alias "@/*"
```

Then move config files into `config/`:
- `next.config.ts` → `config/next.config.ts`
- `tailwind.config.ts` → `config/tailwind.config.ts`
- `tsconfig.json` → `config/tsconfig.json`
- `postcss.config.mjs` → `config/postcss.config.mjs`

Update `package.json` scripts to point Next.js at the config subfolder.

Delete boilerplate: `src/app/page.tsx` contents, `globals.css` contents (keep file).

---

## STEP 2 — Install Dependencies

```bash
npm install gsap @gsap/react               # animations + ScrollTrigger for parallax
npm install @studio-freight/lenis          # smooth scroll (confirmed by reference site)
npm install mouse-follower                  # custom cursor (same lib as reference)
```

> Reference site explicitly uses: **gsap · scroll animation · lenis · parallax**
> ScrollTrigger (bundled with GSAP) handles all parallax — no separate parallax library needed.

---

## STEP 3 — Design Tokens (Tailwind + CSS Variables)

**File:** `src/app/globals.css`

CSS variables to define:
```css
--color-bg: #141414;
--color-card: #0F0F0F;
--color-accent: #E5097F;       /* neon pink — all glows, hovers, CTAs */
--color-blue: #309EFF;         /* secondary accent */
--color-text: #FFFFFF;
--color-text-secondary: rgba(255,255,255,0.6);
--color-border: rgba(255,255,255,0.1);
```

**File:** `config/tailwind.config.ts` — extend with:
- `colors.accent`, `colors.bg`, `colors.card`
- `fontFamily.heading` = `'Neue Machina', sans-serif`
- `fontFamily.body` = `'Inter', sans-serif`

**Fonts to load** (Google Fonts + self-hosted):
- `Inter` — Google Fonts (weights 400, 500, 600)
- `Neue Machina` — from Pangram Pangram or self-host as woff2 (weights 100, 600, 700)
- Load in `src/app/layout.tsx`

---

## STEP 4 — Global Layout & Preloader

**File:** `src/app/layout.tsx`
- Set `<html>` background to `#141414`
- Wrap children with `<SmoothScroll>` provider (Lenis)
- Mount `<CustomCursor />` globally
- Mount `<Preloader />` globally (pink gradient bar, full-screen, fades out on load)

**File:** `src/components/layout/Preloader.tsx`
- Full-screen fixed overlay, `z-index: 999999`
- Loading bar: `linear-gradient(90deg, #ff00c8, #ff3eff, #ff7bff, #ff00c8)` animated
- Slides in from top, exits with opacity fade after 1.2s

**File:** `src/lib/useSmoothScroll.ts`
- Lenis initialization hook, exposed via context

---

## STEP 5 — Navigation

**File:** `src/components/layout/Navbar.tsx`
- Fixed position, `z-index: 6`
- Left: Binary Ventures logo (SVG or text-based)
- Right: Hamburger menu button — fixed top-right desktop, bottom-left mobile (80×80px)
- Menu button triggers offcanvas

**File:** `src/components/layout/OffcanvasMenu.tsx`
- Full-screen fixed overlay, `z-index: 1150`
- Background: `rgba(10,10,10,0.3)` + `backdrop-filter: blur(12px)`
- Menu items (map from `src/data/navigation.ts`):
  1. Websites & Web Apps
  2. Automation & Workflows
  3. Lead Generation
  4. AI-Powered Tools
  5. Work Delivered
  6. About
  7. Contact
- Each item: staggered fade-in `translateY(20px) → 0`, hover color `#E5097F` with text-shadow glow
- GSAP stagger animation on open

---

## STEP 6 — Hero Section

**File:** `src/components/sections/Hero.tsx`

Layout: 50/50 split desktop (text left, visual right), single column mobile

**Left side:**
- Overline label: "Binary Ventures · binaryventures.in"
- H1 (Neue Machina, weight 100): *"Next Level Digital"* or similar punchy line
- Subheadline: "We build your vision — websites, automations, AI tools"
- Body: Short 1-liner about Binary Ventures
- CTA Button: "Let's Talk" → `#contact`
- Animated glowing underline under H1 (neon pink gradient, infinite pulse)
- Words animate in: staggered `translateY(60px) → 0` + blur via GSAP

**Right side:**
- Animated blob: CSS/SVG shape, `blur(100px)`, pulsing glow `10s ease-in-out infinite`
- OR: a looping animation/video if available
- Radial gradient background behind blob: `#1A1030 → #050509 → #020107`

**Background:** `#141414`, blob at `z-index: -5`

---

## STEP 7 — Services Slider Section

**File:** `src/components/sections/ServicesSlider.tsx`
**File:** `src/data/services.ts`

Layout: Horizontal scrollable slider, `100vh` height, overflow-x scroll

**4 Service Cards (same card spec as reference):**
```
Width: 450px desktop / 80vw tablet / 88vw mobile
Height: 320px
Border-radius: 18px
Background: rgba(15,15,15,0.35) + backdrop-filter: blur(12px)
Border: 1px solid rgba(255,255,255,0.1)
Shadow: 0 0 25px rgba(0,0,0,0.35)
Gap: 40px
```

**Focused/hover state:**
- Scale: 1.08
- Box-shadow: `0 0 45px rgba(229,9,127,0.35), 0 0 10px rgba(229,9,127,0.2)` (pink glow)
- Background darkens to `rgba(25,25,25,0.6)`
- Transition: 0.35s ease

**Cards content (from `src/data/services.ts`):**
1. Websites & Web Apps — "Fast, modern, conversion-focused websites and web applications built for real results"
2. Automation & Workflows — "Automate repetitive processes on any platform — n8n, Zapier, bots, custom scripts"
3. Lead Generation & Scraping — "Automated lead capture pipelines from Google Maps, LinkedIn, and more"
4. AI-Powered Tools — "Custom Claude/LLM integrations that make your business faster and smarter"

**Mobile:** Convert to vertical stack at 1024px. Add swipe hint animation.

---

## STEP 8 — Work Delivered Showcase Sections

**File:** `src/components/sections/WorkShowcase.tsx` (reusable)
**File:** `src/data/work.ts`

One full-width section per work item (like the reference's Grafik/Webdesign/Fotografie sections).
Pattern: full bleed, text + image/mockup side by side, alternating left/right.

**Padding:** `18vh 6vw` desktop, `14vh 5vw` mobile
**Images:** Desktop and mobile variants, swap at 768px

**Work items to showcase (from projects reference list):**
1. Zero One POS — "Offline-first POS for a 24/7 retail store" + mockup screenshot
2. The Digital Experts / any client site — "Marketing agency website, live and generating leads"
3. Data Scraping Toolkit — "Automated lead pipeline — thousands of leads from Google Maps"
4. Job Tailor — "AI resume tailor → PDF in 60 seconds"

Each card: context + what was built + outcome. No project names as headings — lead with outcome.

---

## STEP 9 — About Section

**File:** `src/components/sections/About.tsx`

- Who Binary Ventures is
- Founder background (brief)
- What drives the work
- Same glassmorphism card styling

---

## STEP 10 — Contact Section

**File:** `src/components/sections/Contact.tsx`

**Layout:** Two-column grid desktop, single column mobile

**Left:** Contact form
- Name, Email, Message fields
- Submit button: "Get in Touch" (pill-shaped, accent color)
- Input focus: border glow with `#E5097F`
- Form background: `rgba(255,255,255,0.03)`, border-radius: 14px

**Right:** Info cards (glassmorphism)
- Company: Binary Ventures Pvt Ltd
- Domain: binaryventures.in
- Email: (to be filled)
- Location: India

---

## STEP 11 — Footer

**File:** `src/components/layout/Footer.tsx`

**Layout:** Three-column grid desktop → single column mobile
**Height:** 70vh, padding top 100px, bottom 60px

Column 1: Binary Ventures logo/name
Column 2: Quick links (same nav items)
Column 3: Legal (Privacy Policy, Terms)

Heading color: `#E5097F`
Text: `rgba(255,255,255,0.6)`
Copyright: "© 2025 Binary Ventures Pvt Ltd. All rights reserved."

---

## STEP 12 — Micro-interactions & Animations

**File:** `src/components/ui/CustomCursor.tsx`
- Circular glow cursor following mouse via GSAP
- Changes color on hover over interactive elements
- Magnetic pull: buttons with `data-magnetic` attribute shift ±30% toward cursor

**File:** `src/components/ui/BackToTop.tsx`
- Fixed bottom-right (40px offset)
- Glassmorphic pill button
- Fades in after scrolling 400px

**File:** `src/components/ui/SectionIndicator.tsx`
- Fixed top-center
- Shows current section name + pink progress bar
- Fades in/out based on scroll

**GSAP setup (all animations):**
- Blob pulse: `gsap.to(blob, { scale: 1.1, duration: 5, yoyo: true, repeat: -1, ease: 'sine.inOut' })`
- Text word reveal: wrap each word in `<span>`, stagger `translateY(60px) → 0` + blur
- Card focus: CSS transitions only (no GSAP needed)
- Scroll-triggered section entrance: `gsap.ScrollTrigger` on each section
- **Parallax:** `gsap.to(el, { yPercent: -20, ease: 'none', scrollTrigger: { scrub: true } })` — apply to hero blob, showcase images, and section backgrounds
- Lenis feeds scroll position into GSAP ScrollTrigger via `lenis.on('scroll', ScrollTrigger.update)`

---

## STEP 13 — Content Data Files

All content lives in `src/data/` as TypeScript files — never hardcoded in components.

```
src/data/
├── navigation.ts      ← menu items
├── services.ts        ← 4 service cards
├── work.ts            ← work showcase items (outcome, what built, image path)
├── about.ts           ← company story text
└── contact.ts         ← contact info
```

---

## STEP 14 — Responsive Polish

Breakpoints (align with reference):
- `1024px` — services slider → vertical stack
- `768px`  — two-column grids → single column, image variants swap
- `600px`  — reduced padding (6vw), card widths 88vw, menu reposition

Use `clamp()` for all font sizes — never fixed px for headings.

---

## STEP 15 — Deployment

```bash
npm run build
```

Deploy to Firebase Hosting at `binaryventures.in`:
```bash
firebase init hosting   # inside Website/
firebase deploy
```

Or deploy to Vercel if preferred (zero config for Next.js).
Update Cloudflare DNS to point `binaryventures.in` to hosting.

---

## Files to Create (in order)

```
src/app/globals.css
src/app/layout.tsx
src/app/page.tsx
src/components/layout/Navbar.tsx
src/components/layout/OffcanvasMenu.tsx
src/components/layout/Footer.tsx
src/components/layout/Preloader.tsx
src/components/sections/Hero.tsx
src/components/sections/ServicesSlider.tsx
src/components/sections/WorkShowcase.tsx
src/components/sections/About.tsx
src/components/sections/Contact.tsx
src/components/ui/CustomCursor.tsx
src/components/ui/BackToTop.tsx
src/components/ui/SectionIndicator.tsx
src/data/navigation.ts
src/data/services.ts
src/data/work.ts
src/data/about.ts
src/data/contact.ts
src/lib/useSmoothScroll.ts
src/types/index.ts
config/next.config.ts
config/tailwind.config.ts
config/tsconfig.json
```

---

## Verification

After each step:
1. `npm run dev` — visually check section matches reference screenshot
2. Check mobile at 375px and 768px breakpoints in browser devtools
3. Confirm GSAP animations fire on scroll
4. Final: deploy to Firebase and check `binaryventures.in` live
