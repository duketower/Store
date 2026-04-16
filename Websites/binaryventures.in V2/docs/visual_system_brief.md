# Binary Ventures Website V2 Visual System Brief

## Direction

Bold premium tech.

The site should feel:
- premium
- sharp
- modern
- high-trust
- technically capable

It should not feel:
- playful
- startup-generic
- luxury-editorial only
- overly futuristic
- agency-flashy

## Visual Principles

### 1. Strong Hierarchy

The design should communicate authority through composition and typography before animation is considered.

### 2. Restraint With Impact

The site can be bold, but each page should still feel disciplined.

### 3. Premium Contrast

Use contrast, spacing, typography, and material treatment to create value perception.

### 4. Operational Credibility

The visual language should support the idea that this company builds systems used in real business contexts.

## Typography Principles

- strong display type for key moments
- refined body copy with excellent readability
- headline system should feel premium, not loud by default
- no default SaaS sameness

## Layout Principles

- generous spacing
- deliberate page rhythm
- section transitions that feel architectural, not stacked
- strong desktop composition and clean mobile collapse behavior

## Motion Principles

- motion should support trust, not novelty
- transitions can be confident and polished, but not excessive
- hero and page transitions should feel intentional

## Color System

The site uses a dark theme. The palette is locked.

### Background Stack
| Token | Value | Role |
|---|---|---|
| `--background` | `#070A12` | Primary page background |
| `--card` | `#121212` | Card and elevated surface |
| `--popover` | `#1e212d` | Secondary elevated background |

### Primary Brand Gradient
```
linear-gradient(270deg, #D278FE 0%, #2D69FB 100%)
```
Applied to: CTA buttons, gradient text on key headlines, gradient borders on featured elements.

### Secondary Gradients
```
Warm:  linear-gradient(270deg, #fba05a 0%, #f66979 100%)
Hot:   linear-gradient(270deg, #f66979 0%, #D278FE 100%)
```
Applied to: metric stat labels, accent category markers.

### Accent Spot Colors
| Name | Hex | Use |
|---|---|---|
| Violet | `#D278FE` | Primary accent, ring color |
| Blue | `#2D69FB` | Gradient pair to violet |
| Amber | `#fba05a` | Metric labels, warm accents |
| Coral | `#f66979` | Secondary metric labels |
| Teal | `#00E5A8` | Spot highlights, pricing section glow |
| Cyan | `#22D3EE` | Icon accents |

### Text Hierarchy
| Token | Value | Role |
|---|---|---|
| `--foreground` | `#ffffff` | Primary text |
| `--muted-foreground` | `rgba(255,255,255,0.42)` | Supporting body copy |
| Secondary text | `rgba(255,255,255,0.70)` | Subheadings, captions |
| Disabled | `#B3B3B3` | Inactive states |

### Borders and Surfaces
| Token | Value | Role |
|---|---|---|
| `--border` | `rgba(255,255,255,0.08)` | Default card borders |
| Strong border | `rgba(255,255,255,0.12)` | Hover / emphasis borders |
| Purple surface tint | `rgba(210,120,254,0.08)` | Featured card backgrounds |
| Blue surface tint | `rgba(45,105,251,0.15)` | Section tint accents |

### Gradient Text Utility
```css
background: linear-gradient(90deg, #D278FE 0%, #2D69FB 100%);
-webkit-background-clip: text;
-webkit-text-fill-color: transparent;
background-clip: text;
```
Applied to: key headline words, metric numbers.

### Gradient Border Utility
```css
border: 1px solid transparent;
background:
  linear-gradient(var(--card), var(--card)) padding-box,
  linear-gradient(270deg, #D278FE 0%, #2D69FB 100%) border-box;
```
Applied to: featured pricing card, CTA section borders.

## Color Principles

- dark foundation — not configurable, this is the site's only theme
- accent use should feel premium and controlled: gradients appear on 1–2 elements per section, not everywhere
- glow backgrounds are used at section level only (radial gradients on section top), not on individual cards
- white text opacity variants create hierarchy without introducing new hues

## UI Principles

- shared header/footer must feel part of the same system
- buttons and links should feel premium and clear
- cards or panels should look structured and expensive, not soft or generic
