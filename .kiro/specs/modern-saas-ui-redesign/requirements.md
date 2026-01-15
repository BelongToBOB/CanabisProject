# Requirements Document: Modern SaaS UI Redesign

## Introduction

Complete UI redesign of the cannabis shop management system to achieve a premium, modern SaaS dashboard aesthetic inspired by Notion, Linear, and Vercel. The redesign focuses on visual hierarchy, user experience, and a cohesive design system while maintaining all existing functionality.

## Glossary

- **System**: The cannabis shop management web application
- **SaaS Dashboard**: Software-as-a-Service dashboard interface pattern
- **Design System**: Cohesive set of reusable UI components with consistent styling
- **Theme**: Visual appearance mode (Light or Dark)
- **Component**: Reusable UI element (Button, Card, Input, etc.)
- **Layout**: Page structure including Sidebar and Topbar
- **Accent Color**: Primary brand color used for emphasis (emerald-600)
- **Neutral Palette**: Grayscale colors (slate/gray) used for backgrounds and text
- **Gradient Background**: Subtle color transition for page backgrounds
- **Visual Hierarchy**: Clear distinction between heading levels and content importance
- **Interaction State**: Visual feedback for hover, active, focus, and disabled states
- **Responsive Design**: UI adapts to desktop, tablet, and mobile screen sizes

## Requirements

### Requirement 1: Design System Foundation

**User Story:** As a developer, I want a consistent design system with reusable components, so that the UI is cohesive and maintainable.

#### Acceptance Criteria

1. THE System SHALL implement a color system using slate/gray as neutral palette and emerald-600 as primary accent
2. THE System SHALL define typography hierarchy with text-2xl/3xl for page titles, text-lg for section titles, and text-sm for captions
3. THE System SHALL use consistent spacing scale based on Tailwind's default spacing
4. THE System SHALL define component variants: Button (primary/secondary/ghost/destructive), Badge (success/warning/danger), Card (default/hover)
5. THE System SHALL apply rounded-xl corners to cards and rounded-lg to buttons and inputs
6. THE System SHALL use shadow-sm for cards and shadow-md for elevated states

### Requirement 2: Light and Dark Theme Support

**User Story:** As a user, I want to toggle between light and dark themes, so that I can use the application comfortably in different lighting conditions.

#### Acceptance Criteria

1. WHEN the application loads, THE System SHALL check localStorage for saved theme preference
2. WHEN no theme preference exists, THE System SHALL default to light theme
3. WHEN user toggles theme, THE System SHALL save preference to localStorage
4. WHEN theme changes, THE System SHALL apply appropriate color classes to all components
5. THE System SHALL use bg-gradient-to-b from-slate-50 to-white for light theme background
6. THE System SHALL use bg-gradient-to-b from-slate-950 to-slate-900 for dark theme background
7. THE System SHALL ensure all text has sufficient contrast ratio in both themes (WCAG AA)

### Requirement 3: Modern Layout Structure

**User Story:** As a user, I want a clean SaaS-style layout with sidebar and topbar, so that navigation is intuitive and content is well-organized.

#### Acceptance Criteria

1. THE System SHALL implement a fixed sidebar on the left with navigation links
2. THE System SHALL implement a fixed topbar at the top with user info and theme toggle
3. THE System SHALL make sidebar collapsible on mobile devices
4. THE System SHALL apply subtle gradient backgrounds to page content areas
5. THE System SHALL use consistent padding and spacing throughout the layout
6. WHEN viewport width is below 768px, THE System SHALL hide sidebar by default and show hamburger menu

### Requirement 4: Base Component Library

**User Story:** As a developer, I want reusable base components with consistent styling, so that I can build pages efficiently.

#### Acceptance Criteria

1. THE System SHALL provide Button component with variants: primary, secondary, ghost, destructive
2. THE System SHALL provide Input component with focus ring and clear placeholder styling
3. THE System SHALL provide Card component with border, shadow, and hover effects
4. THE System SHALL provide Badge component for status display (success/warning/danger)
5. THE System SHALL provide Table component with row hover and optional zebra striping
6. THE System SHALL provide Modal component with backdrop blur effect
7. THE System SHALL provide Toast component with success/error/info variants
8. WHEN any interactive element is hovered, THE System SHALL show visual feedback with transition
9. WHEN any button is clicked, THE System SHALL show active state with scale transform

### Requirement 5: Dashboard Page Redesign

**User Story:** As a user, I want a modern dashboard with clear statistics cards, so that I can quickly understand key metrics.

#### Acceptance Criteria

1. THE System SHALL display statistics in cards with icon, title, large number, and subtitle
2. THE System SHALL apply subtle accent colors to stat card borders or icons
3. THE System SHALL show quick action cards with icon, description, and action button
4. THE System SHALL arrange cards in responsive grid (4 columns desktop, 2 tablet, 1 mobile)
5. WHEN user hovers over stat card, THE System SHALL elevate card with translate-y and shadow-md
6. THE System SHALL use emerald color for positive metrics and rose for negative metrics

### Requirement 6: List Pages Enhancement

**User Story:** As a user, I want list pages with modern search, filter, and sort controls, so that I can find information efficiently.

#### Acceptance Criteria

1. THE System SHALL provide search input with icon and clear placeholder
2. THE System SHALL provide filter controls in a clean horizontal layout
3. THE System SHALL provide sort dropdown with clear labels
4. THE System SHALL display data in table with hover effects on rows
5. THE System SHALL show empty state with icon, message, and action button when no data exists
6. WHEN table row is hovered, THE System SHALL highlight row with background color change
7. THE System SHALL make table horizontally scrollable on mobile devices

### Requirement 7: Form Pages Improvement

**User Story:** As a user, I want forms with clear sections and labels, so that data entry is intuitive and error-free.

#### Acceptance Criteria

1. THE System SHALL group related form fields into sections with dividers
2. THE System SHALL display labels with clear hierarchy and required field indicators
3. THE System SHALL show validation errors inline below each field
4. THE System SHALL provide helpful placeholder text in inputs
5. THE System SHALL disable submit button while form is submitting
6. WHEN input receives focus, THE System SHALL show colored focus ring
7. WHEN form has errors, THE System SHALL scroll to first error and show toast notification

### Requirement 8: Interactive Feedback

**User Story:** As a user, I want smooth animations and transitions, so that the interface feels responsive and polished.

#### Acceptance Criteria

1. THE System SHALL apply transition-all duration-200 to all interactive elements
2. WHEN card is hovered, THE System SHALL translate card up by 0.5 units and increase shadow
3. WHEN button is hovered, THE System SHALL brighten background color
4. WHEN button is clicked, THE System SHALL scale down to 0.98
5. THE System SHALL animate modal entrance with fade and scale
6. THE System SHALL animate toast notifications with slide-in from right
7. THE System SHALL use ease-in-out timing function for all transitions

### Requirement 9: Responsive Design

**User Story:** As a user, I want the application to work well on all devices, so that I can access it from desktop, tablet, or mobile.

#### Acceptance Criteria

1. WHEN viewport width is below 640px, THE System SHALL stack form fields vertically
2. WHEN viewport width is below 768px, THE System SHALL hide sidebar and show mobile menu
3. WHEN viewport width is below 1024px, THE System SHALL reduce stat card columns from 4 to 2
4. THE System SHALL make tables horizontally scrollable on small screens
5. THE System SHALL adjust font sizes for mobile (smaller headings, readable body text)
6. THE System SHALL ensure touch targets are at least 44x44 pixels on mobile
7. THE System SHALL test all pages on mobile, tablet, and desktop viewports

### Requirement 10: Accessibility Compliance

**User Story:** As a user with accessibility needs, I want the interface to be keyboard navigable and screen reader friendly, so that I can use the application effectively.

#### Acceptance Criteria

1. THE System SHALL ensure all interactive elements are keyboard accessible
2. THE System SHALL provide visible focus indicators for keyboard navigation
3. THE System SHALL use semantic HTML elements (button, nav, main, etc.)
4. THE System SHALL provide aria-labels for icon-only buttons
5. THE System SHALL maintain color contrast ratio of at least 4.5:1 for normal text
6. THE System SHALL maintain color contrast ratio of at least 3:1 for large text
7. THE System SHALL announce dynamic content changes to screen readers
