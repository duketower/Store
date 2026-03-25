# Binary Ventures Website Interface Design

## Current Interface Surface

- Static site content rendered through Next.js
- Project and service content sourced from local TypeScript data files
- Contact path currently driven through visible CTA/contact details rather than a complex backend

## Content Sources

- `src/data/services.ts`
- `src/data/work.ts`
- `src/data/about.ts`
- `src/data/contact.ts`
- `src/data/navigation.ts`

## Integration Notes

- Keep contact integrations simple unless a clear backend requirement emerges
- Prefer data-driven content updates over hardcoding copy inside component markup
