# Binary Ventures — Website

Marketing and portfolio website for **Binary Ventures Pvt Ltd** at **binaryventures.in**.

Markets capabilities, showcases work delivered, and drives client inquiries.

**Stack:** Next.js (App Router) · TypeScript · Tailwind CSS · GSAP · Lenis

Reference docs:
- `README.md`
- `ARCHITECTURE.md`
- `PROJECT_PLAN.md`
- `TASK_QUEUE.md`
- `DECISIONS.md`
- `docs/product_spec.md`
- `docs/api_design.md`
- `docs/workflows.md`

Repo Git rules:
- The repo pre-commit hook enforces doc sync and small commit batches
- The repo commit-msg hook enforces clear commit messages

Documentation sync rule:
- Before finishing any non-trivial task, update the affected docs in this folder if structure, content strategy, setup, workflow, roadmap, or decisions changed
- `README.md` = setup, build, deployment basics
- `ARCHITECTURE.md` = app structure, content/data flow, delivery model
- `PROJECT_PLAN.md` = roadmap and priorities
- `TASK_QUEUE.md` = current, next, done
- `DECISIONS.md` = durable choices
- `docs/*` = product goals, interface shape, workflows
- If no docs changed, say so explicitly in the final summary

---

## How to Run

```bash
cd Websites/binaryventures.in/
npm run dev
npm run build
```

## Fonts Setup (One-time)

Fonts are already in `public/fonts/` as `.otf` files:
- `NeueMachina-Light.otf`
- `NeueMachina-Regular.otf`
- `NeueMachina-Ultrabold.otf`

---

## Folder Structure

```
Websites/binaryventures.in/
├── CLAUDE.md
├── package.json
├── .gitignore
├── next.config.ts
├── tsconfig.json
├── postcss.config.mjs
├── public/              ← images, favicon, og-image
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx           ← Home / Hero
│   ├── components/
│   │   ├── layout/            ← Navbar, Footer, smooth scroll wrapper
│   │   ├── sections/          ← Hero, services, work, contact
│   │   └── ui/                ← Cursor, marquee, loader, visual effects
│   ├── data/                  ← site content as TypeScript data
│   ├── lib/                   ← utility functions
│   └── types/                 ← TypeScript interfaces
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

- Never run `npm install` or `npx create-next-app` from the repo root — always work inside `Websites/binaryventures.in/`
- No `node_modules/`, config files (`next.config.*`, `tailwind.config.*`), or build output outside `Websites/binaryventures.in/`
- No shared `package.json` with POS — completely separate projects
- No files created outside `Websites/binaryventures.in/` for this project

---

## Edit Discipline

- Read a file before editing it
- Use Edit tool for existing files; Write only for new files
- No changes outside the current task scope

---

## Deployment

- Target: `binaryventures.in`
- Firebase Hosting (`next build` + static export) or Vercel — to be decided at deployment time
