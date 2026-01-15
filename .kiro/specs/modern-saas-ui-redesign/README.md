# Modern SaaS UI Redesign Spec

## Overview

Complete UI redesign of the cannabis shop management system to achieve a premium, modern SaaS dashboard aesthetic inspired by Notion, Linear, and Vercel.

## Goals

- Create a cohesive design system with reusable components
- Implement light/dark theme support with localStorage persistence
- Ensure responsive design across desktop, tablet, and mobile
- Improve visual hierarchy and user experience
- Add smooth animations and transitions
- Maintain accessibility compliance (WCAG AA)

## Design Direction

### Layout
- SaaS-style layout with fixed sidebar and topbar
- Soft gradient backgrounds (slate-50 to white in light, slate-950 to slate-900 in dark)
- Cards with rounded-xl corners, borders, and subtle shadows

### Colors
- Neutral palette: slate/gray
- Primary accent: emerald-600
- Status colors: emerald (success), amber (warning), rose (danger)

### Typography
- Page titles: text-2xl/3xl font-semibold
- Section titles: text-lg font-medium
- Captions: text-sm text-muted
- Improved line-height and spacing

### Components
- Button: primary, secondary, ghost, destructive variants
- Input: focus ring, error states, labels
- Card: hover elevation effects
- Badge: status variants
- Table: row hover, responsive scroll
- Modal: backdrop blur, animations

### Interactions
- All clickable elements have hover/active states
- Smooth transitions (duration-200)
- Cards elevate on hover
- Buttons scale on active
- Modals fade + scale in
- Toasts slide in from right

## Documents

1. **requirements.md** - Detailed requirements with EARS patterns
2. **design.md** - Component specifications and architecture
3. **tasks.md** - Implementation plan with 17 phases

## Implementation Phases

1. **Foundation** - Theme system + base components
2. **Pages** - Redesign all pages (Dashboard, Lists, Forms, Reports)
3. **Polish** - Animations, responsive testing, accessibility audit

## Tech Stack

- React + TypeScript
- Tailwind CSS (no Radix/shadcn-ui)
- Custom component library
- ThemeContext for light/dark mode

## Getting Started

To begin implementation:

1. Review requirements.md for detailed acceptance criteria
2. Study design.md for component specifications
3. Follow tasks.md for step-by-step implementation
4. Start with Task 1: Setup Theme System

## Testing Strategy

- **Manual Testing**: Primary validation for visual design
- **Unit Tests**: Theme persistence logic (optional)
- **Accessibility Testing**: Keyboard navigation, screen readers, contrast
- **Responsive Testing**: Desktop, tablet, mobile viewports
- **Cross-browser Testing**: Chrome, Firefox, Safari, Edge

## Success Criteria

- ✅ All pages redesigned with consistent styling
- ✅ Light/dark theme toggle works everywhere
- ✅ Responsive on all device sizes
- ✅ Smooth animations and transitions
- ✅ WCAG AA accessibility compliance
- ✅ Modern SaaS aesthetic achieved
