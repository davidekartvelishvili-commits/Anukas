---
description: Design and styling rules for all React components
globs: ["src/**/*.tsx", "app/**/*.tsx"]
---

# Component Design Rules

## Visual Identity
- Every component must feel custom-designed — no generic/template aesthetics
- Use CSS variables for all theme colors (--color-accent, --color-bg, --color-surface, etc.)
- Glass-morphism cards: `backdrop-blur-xl bg-white/5 border border-white/10`
- Gradient buttons: use accent color gradients, never flat solid buttons

## Interactivity
- Every clickable/interactive element MUST have hover, active, and focus states
- Use `transition-all duration-200` or similar on all interactive elements
- Hover states should include subtle scale, glow, or color shift effects

## Icons
- Use `lucide-react` for all icons — no other icon libraries
- Icons should be sized consistently (16px inline, 20px buttons, 24px standalone)

## Spacing & Layout
- Mobile-first: start with mobile layout, add `md:` and `lg:` breakpoints
- Consistent padding: 16px mobile, 24px tablet, 32px desktop
- Card border-radius: 16px, button border-radius: 12px, input border-radius: 8px
