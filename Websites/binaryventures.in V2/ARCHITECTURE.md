# Binary Ventures Website V2 Architecture

## Purpose

V2 is a premium, high-trust company website designed to attract businesses that need practical digital systems, not just isolated design deliverables.

## Current Architecture Phase

This workspace has moved from strategy-only into early implementation. The current layers are:

- positioning
- information architecture
- page responsibilities
- copy
- component planning
- implementation scaffold
- first shared navigation prototype

## Site Architecture

### Primary Pages

- `Home`
- `Work`
- `Services`
- `About`
- `Contact`

### Optional Future Pages

- `Pricing`
- `Book a Call`
- `Insights`

## Experience Architecture

### Header / Footer

- shared header across all pages
- shared footer across all pages
- multi-page navigation, not a single-page scroll site

### Homepage Role

- establish positioning fast
- signal credibility
- preview services
- preview proof
- move serious visitors to Work, Services, or Contact

### Work Page Role

- serve as the main proof engine of the site
- present anonymized case studies
- show capability through real solution types and outcomes
- now implemented as a real route at `src/app/work/page.tsx`

### Services Page Role

- clarify what Binary Ventures actually offers
- group offers under a complete business tech setup umbrella
- balance packaged clarity with custom-solution flexibility
- now implemented as a real route at `src/app/services/page.tsx`

### About Page Role

- introduce the founder-led studio model without making the site feel personality-led
- strengthen trust, process clarity, and working style
- now implemented as a real route at `src/app/about/page.tsx`

### Contact Page Role

- reduce friction
- route serious enquiries to email or a call

## Implementation Structure

- `src/app` holds routes, layout, and global styles
- `src/components/ui` holds reusable shadcn-style primitives and imported UI building blocks
- `src/components/site` holds shared site shell pieces such as the reusable header and footer
- `src/components` holds page-level composition such as temporary demos and future page assemblies
- `src/content` holds shared navigation, contact details, and page-specific content models
- `src/lib/utils.ts` exposes the shared `cn` utility expected by shadcn-style components
- `components.json` keeps the folder aliases compatible with future shadcn CLI usage
- `docs/component_inventory.md` tracks which user-supplied components are currently integrated, adapted, or deferred

## Current Integrated Component

- `src/components/ui/header-3.tsx` is the first shared header prototype
- supporting dependencies currently include `button`, `navigation-menu`, and `menu-toggle-icon`
- the component is mounted through `src/components/demo.tsx` and the root page for build verification
- `src/components/ui/hero-section-1.tsx` is the current homepage hero prototype
- `src/components/ui/animated-group.tsx` and `src/components/ui/text-effect.tsx` provide reusable motion helpers for hero and marketing sections
- `src/components/ui/testimonials-columns-1.tsx` currently serves as the homepage proof strip using anonymized outcome cards rather than named client testimonials
- `src/components/ui/section-with-mockup.tsx` currently serves as the homepage positioning block for explaining the end-to-end setup model
- `src/components/ui/ai-models-preview.tsx` currently serves as the homepage services preview block using adapted service cards and a detail modal
- `src/components/ui/grid-feature-cards.tsx` currently serves as the homepage process/working-method block using adapted feature cards
- `src/components/ui/pulse-beams.tsx` currently serves as the homepage final CTA block using an adapted animated beam background
- `src/components/site/site-header.tsx` is now the shared V2 header used by the homepage and future secondary routes
- `src/components/site/site-footer.tsx` is the shared footer for real multi-page routes
- `src/components/work/work-page.tsx` is the first real secondary page assembly, powered by `src/content/work.ts`
- `src/components/services/services-page.tsx` is the Services page assembly, powered by `src/content/services.ts`
- `src/components/about/about-page.tsx` is the About page assembly, powered by `src/content/about.ts`
- `src/components/ui/ai-models-preview.tsx` now reads from the shared services content model so homepage preview content stays aligned with the full Services page
- the V2 palette and semantic token setup continue to live in `src/app/globals.css`; imported components are adapted to that system rather than replacing it

## Implementation Constraints

- keep using `@/components/ui/*` imports for reusable UI to make future component drops predictable
- treat `src/app/globals.css` as the canonical style entrypoint
- bold premium tech visual language
- company-first homepage
- direct + refined tone
- no inherited V1 component logic or layout patterns
