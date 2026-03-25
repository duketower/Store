# Binary Ventures Website Architecture

## Goal

Ship a fast, visually distinctive marketing website for Binary Ventures that presents services, work, and contact pathways clearly.

## Main Structure

### App Layer

- Next.js App Router
- Primary route served from `src/app/`
- Layout and global styling owned by `src/app/layout.tsx` and `src/app/globals.css`

### Content Layer

- Site content stored in `src/data/`
- Sections composed from reusable components under `src/components/sections/`

### Experience Layer

- Layout primitives in `src/components/layout/`
- Visual and motion components in `src/components/ui/`
- Smooth scrolling behavior coordinated through `src/lib/` and layout helpers

## Delivery Model

- Local development in `Websites/binaryventures.in/`
- Production build generated through Next.js
- Hosting target currently documented as Firebase Hosting or Vercel

## Constraints

- Preserve the established visual direction
- Keep marketing copy and project data easy to update
- Avoid introducing cross-project dependencies from the workspace
