# Binary Ventures — Website

Marketing and portfolio website for **Binary Ventures Pvt Ltd** at **binaryventures.in**.

Markets capabilities, showcases work delivered, and drives client inquiries.

**Stack:** Next.js (App Router) · TypeScript · Tailwind CSS · GSAP · Lenis

---

## How to Run

```bash
cd Website/
node node_modules/next/dist/bin/next dev    # dev server at localhost:3000
node node_modules/next/dist/bin/next build  # production build
```

> `npx next` may fail due to the parent repo having a `package-lock.json` at the Store root. Use the direct node path above.

## Fonts Setup (One-time)

Fonts are already in `public/fonts/` as `.otf` files:
- `NeueMachina-Light.otf`
- `NeueMachina-Regular.otf`
- `NeueMachina-Ultrabold.otf`

---

## Folder Structure

```
Website/
├── CLAUDE.md
├── package.json
├── .gitignore
├── config/              ← next.config.ts, tailwind.config.ts, tsconfig.json, postcss.config.js
├── public/              ← images, favicon, og-image
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx           ← Home / Hero
│   │   ├── about/page.tsx
│   │   ├── work/page.tsx      ← Results / Work Delivered
│   │   ├── services/page.tsx  ← What We Do
│   │   └── contact/page.tsx
│   ├── components/
│   │   ├── layout/            ← Navbar, Footer
│   │   └── sections/          ← Hero, ServiceCard, WorkCard, etc.
│   ├── data/                  ← services.ts, projects.ts (content as TS data)
│   ├── lib/                   ← utility functions
│   └── types/                 ← TypeScript interfaces
└── scripts/                   ← build/deploy helpers
```

**Root rule:** Only `CLAUDE.md`, `package.json`, `.gitignore`, `.env*` at root. Everything else in a named subfolder.

---

## Content Strategy

Capability-first — markets what Binary Ventures can do for a business.

### Pages

**Hero** — positioning line + single CTA

**Services — What We Do**
- *Websites & Web Apps* — fast, modern, conversion-focused websites and web applications
- *Automation & Workflows* — automate repetitive business processes on any platform (n8n, Zapier, bots, custom scripts)
- *Lead Generation & Scraping* — automated lead capture pipelines from Google Maps, LinkedIn, and more
- *AI-Powered Tools* — custom Claude/LLM integrations that make a business faster and smarter

**Work Delivered** — outcome-focused cards (not a project list). Each card = client/product context + what was built + result/impact. All work treated equally — no single project elevated above others. Optionally include client testimonial.

**About** — Binary Ventures story, who's behind it

**Contact** — email + inquiry form

---

## Projects Reference (internal — use to write copy and populate work cards)

| Project | What was built | Highlight |
|---------|---------------|-----------|
| Zero One POS | Offline-first grocery store POS — billing, inventory, shift reports, barcode scanner, thermal printer, PWA | Production-ready, multi-client white-label |
| Store Bot | Telegram expense tracking bot → Google Sheets | Real-time store expense logging |
| n8n Builder | AI workflow builder via MCP — 1,084 nodes, 2,709 templates | Rapid automation prototyping |
| Data Scraping Toolkit | Google Maps / Yellow Pages / LinkedIn scraper + AI-powered extraction | Automated lead sourcing at scale |
| The Digital Experts | 5-page marketing agency website | Live: the-digital-experts-in.netlify.app |
| PreSchool Website Builder | Reusable template system for Indian preschools | Repeatable client delivery system |
| Job Tailor | AI resume tailor → tailored resume + cover letter PDF in 60s | Anthropic API + React-PDF |
| Lead Capture Agent | Multi-agent lead gen — scraping, AI analysis, VPN | End-to-end lead pipeline |
| Marketing Team Template | Multi-agent AI marketing team (research, content, creative) | Reusable Claude Code skill system |
| Notion Context Sync | Project context sync to Notion via CLI | Developer productivity tooling |

---

## Naming Conventions

- Components: PascalCase (`WorkCard.tsx`, `ServiceCard.tsx`)
- Hooks/utils: camelCase (`useScrollAnimation.ts`)
- Data files: camelCase (`services.ts`, `projects.ts`)
- Styles: Tailwind only — no custom CSS files unless unavoidable

---

## Anti-Patterns

- Never run `npm install` or `npx create-next-app` from the repo root — always work inside `Website/`
- No `node_modules/`, config files (`next.config.*`, `tailwind.config.*`), or build output outside `Website/`
- No shared `package.json` with POS — completely separate projects
- No files created outside `Website/` for this project

---

## Edit Discipline

- Read a file before editing it
- Use Edit tool for existing files; Write only for new files
- No changes outside the current task scope

---

## Deployment

- Target: `binaryventures.in`
- Firebase Hosting (`next build` + static export) or Vercel — to be decided at deployment time
