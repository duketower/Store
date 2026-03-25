# Binary Ventures Website V2 Component Request Plan

This file defines the roles of components we may ask for later. It is not a commitment to any specific external design.

## Rule

Ask for components by role and purpose only after the page structure is approved.

## Component Roles We Will Likely Need

### Shared Layout

- premium multi-page navbar
- footer with compact company info and CTA

Current status:
- the first shared navbar prototype has been integrated in code as `header-3.tsx`
- it is still generic placeholder content and must be adapted to Binary Ventures navigation, service categories, and CTA language

### Home

- hero that supports bold premium tech positioning
- service pillar layout
- proof preview / selected work block
- process / working-method block
- CTA section

Current status:
- the first hero prototype is integrated in code as `hero-section-1.tsx`
- the component has already been adapted away from generic SaaS copy toward Binary Ventures positioning
- the first proof preview block is integrated in code as `testimonials-columns-1.tsx`
- the proof block has been adapted into anonymized outcome cards to stay aligned with the no-client-name rule
- the next step is to choose the section that follows the proof block on the real homepage

### Work

- case-study listing system
- featured case-study layout
- metric or outcome callout block

### Services

- service category cards or structured sections
- engagement model block
- pricing-ready layout for future use

### About

- founder-led studio narrative block
- values / standards layout

### Contact

- contact split layout
- email + booking CTA block
- optional enquiry form wrapper

## Component Selection Criteria

- premium and high-trust
- direct and refined
- strong hierarchy
- flexible enough for real business copy
- no gimmick-heavy interaction that weakens trust
