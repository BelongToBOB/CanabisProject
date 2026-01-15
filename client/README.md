# Cannabis Shop Management System - Frontend

This is the frontend application for the Cannabis Shop Management System, built with React, TypeScript, and Vite. The application features a modern, accessible UI with light/dark theme support.

## Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router DOM** - Client-side routing
- **Axios** - HTTP client for API calls
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Modern component library built on Radix UI
- **Lucide React** - Icon library

## Project Structure

```
src/
├── components/
│   ├── ui/              # shadcn/ui components (Button, Input, Card, etc.)
│   ├── layout/          # Layout components (Sidebar, Topbar, AppLayout)
│   ├── shared/          # Shared components (DataTable, EmptyState, LoadingState)
│   └── [other]/         # Feature-specific components
├── pages/               # Page components (routes)
├── services/            # API service layer
├── contexts/            # React context providers (Auth, Theme, Toast)
├── hooks/               # Custom React hooks
├── lib/                 # Utility functions
└── assets/              # Static assets
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

```
VITE_API_URL=http://localhost:3000/api
```

## Getting Started

### Install Dependencies

```bash
npm install
```

### Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## API Configuration

The API URL is configured via the `VITE_API_URL` environment variable. This should point to your backend server's API endpoint.

## Development Guidelines

- Use TypeScript for all new files
- Follow the existing folder structure
- Use Tailwind CSS for styling with theme-aware CSS variables
- Use shadcn/ui components for UI elements
- Use the shared DataTable, EmptyState, and LoadingState components
- Implement proper error handling with toast notifications
- Add loading states for async operations
- Ensure keyboard accessibility
- Test in both light and dark themes
- Follow responsive design patterns (mobile-first)

## UI Components

The application uses shadcn/ui components. Key components include:

- **Button** - Multiple variants (default, destructive, outline, ghost, link)
- **Input** - Form input fields with validation support
- **Card** - Container component for content sections
- **Dialog** - Modal dialogs for forms and confirmations
- **DataTable** - Feature-rich table with search, sort, and pagination
- **Badge** - Status indicators and tags
- **Toast** - Notification system
- **Select** - Dropdown select component
- **Alert** - Alert messages

See `UI_REFACTOR_DOCUMENTATION.md` for detailed component usage.

## Theme System

The application supports light and dark themes:

- Theme preference is persisted in localStorage
- All components use theme-aware CSS variables
- Theme can be toggled via the theme toggle button in the topbar
- Themes are defined in `src/index.css`

## Accessibility

The application follows WCAG 2.1 AA guidelines:

- All interactive elements are keyboard accessible
- Proper ARIA labels and roles
- Focus management in dialogs and dropdowns
- Color contrast meets accessibility standards
- Screen reader compatible

## Responsive Design

The application is fully responsive:

- **Mobile** (< 768px): Stacked layouts, collapsible sidebar
- **Tablet** (768px - 1024px): Optimized grid layouts
- **Desktop** (> 1024px): Full layout with sidebar

## Documentation

- **UI_REFACTOR_DOCUMENTATION.md** - Comprehensive UI component and styling guide
- **UI_CONSISTENCY_REVIEW.md** - Consistency review across all pages
- **RESPONSIVE_BEHAVIOR_TEST.md** - Responsive design test results
- **ACCESSIBILITY_TEST_REPORT.md** - Accessibility compliance report
- **FUNCTIONAL_TEST_REPORT.md** - Functional testing results
