# Design Document - Frontend UI/UX Refactor

## Overview

This document outlines the design for refactoring the Cannabis Shop Management frontend to implement a modern, consistent, and user-friendly interface. The refactor will introduce a theme system, shadcn/ui components, improved UX patterns, and redesigned pages while maintaining all existing functionality.

## Architecture

### Technology Stack

**Existing:**
- React 18
- TypeScript
- Tailwind CSS
- React Router
- Axios

**New Additions:**
- shadcn/ui (Radix UI + Tailwind)
- class-variance-authority (CVA) for component variants
- clsx + tailwind-merge for className utilities
- lucide-react for icons

### Project Structure

```
client/src/
├── components/
│   ├── ui/              # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   ├── table.tsx
│   │   ├── dialog.tsx
│   │   ├── badge.tsx
│   │   ├── alert.tsx
│   │   ├── toast.tsx
│   │   └── skeleton.tsx
│   ├── layout/          # Layout components
│   │   ├── Sidebar.tsx
│   │   ├── Topbar.tsx
│   │   ├── AppLayout.tsx
│   │   └── PageHeader.tsx
│   └── shared/          # Shared components
│       ├── DataTable.tsx
│       ├── EmptyState.tsx
│       └── LoadingState.tsx
├── contexts/
│   └── ThemeContext.tsx # Theme management
├── lib/
│   └── utils.ts         # Utility functions
└── pages/               # Page components (redesigned)
```

## Components and Interfaces

### 1. Theme System

#### ThemeContext

```typescript
interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

// Implementation
- Read theme from localStorage on mount
- Apply theme class to document root
- Persist theme changes to localStorage
- Provide theme context to all components
```

#### Theme Configuration

```typescript
// Tailwind config with CSS variables
colors: {
  background: 'hsl(var(--background))',
  foreground: 'hsl(var(--foreground))',
  primary: 'hsl(var(--primary))',
  secondary: 'hsl(var(--secondary))',
  muted: 'hsl(var(--muted))',
  accent: 'hsl(var(--accent))',
  destructive: 'hsl(var(--destructive))',
  border: 'hsl(var(--border))',
  input: 'hsl(var(--input))',
  ring: 'hsl(var(--ring))',
}
```

### 2. UI Components (shadcn/ui)

#### Button Component

```typescript
interface ButtonProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
}

// Features:
- Multiple variants for different contexts
- Loading state with spinner
- Disabled state
- Icon support
- Full keyboard accessibility
```

#### Input Component

```typescript
interface InputProps {
  type?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

// Features:
- Error state with message
- Disabled state
- Focus ring
- Consistent sizing
- Label integration
```

#### Card Component

```typescript
interface CardProps {
  children: React.ReactNode;
  className?: string;
}

// Sub-components:
- CardHeader
- CardTitle
- CardDescription
- CardContent
- CardFooter

// Features:
- Consistent padding and spacing
- Theme-aware borders and backgrounds
- Flexible composition
```

#### Table Component

```typescript
interface TableProps {
  data: any[];
  columns: ColumnDef[];
  searchable?: boolean;
  sortable?: boolean;
  filterable?: boolean;
  loading?: boolean;
  emptyState?: React.ReactNode;
}

// Features:
- Column sorting
- Search functionality
- Filtering
- Pagination
- Loading skeletons
- Empty states
- Responsive design
```

#### Dialog Component

```typescript
interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}

// Features:
- Modal overlay
- Focus trap
- ESC to close
- Click outside to close
- Accessible
```

#### Toast Component

```typescript
interface ToastProps {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success';
  duration?: number;
}

// Features:
- Auto-dismiss
- Manual dismiss
- Multiple toasts
- Position control
- Animation
```

### 3. Layout Components

#### AppLayout

```typescript
interface AppLayoutProps {
  children: React.ReactNode;
}

// Structure:
<div className="flex h-screen">
  <Sidebar />
  <div className="flex-1 flex flex-col">
    <Topbar />
    <main className="flex-1 overflow-auto">
      <Breadcrumb />
      {children}
    </main>
  </div>
</div>

// Features:
- Responsive sidebar (collapsible on mobile)
- Fixed topbar
- Scrollable content area
- Breadcrumb navigation
```

#### Sidebar

```typescript
interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

// Navigation Items:
- Dashboard
- Sales Orders (with submenu: Create, List)
- Batch Management
- Reports (with submenu: Inventory, Profit Summary)
- Profit Sharing
- User Management (admin only)

// Features:
- Collapsible
- Active state highlighting
- Icon + text (or icon only when collapsed)
- Role-based menu items
- Smooth transitions
```

#### Topbar

```typescript
interface TopbarProps {
  user: User;
  onLogout: () => void;
}

// Elements:
- Menu toggle (mobile)
- App title/logo
- Theme toggle
- User menu (dropdown)
  - Profile
  - Settings
  - Logout

// Features:
- Sticky positioning
- Responsive
- User avatar
- Dropdown menu
```

#### PageHeader

```typescript
interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

// Structure:
<div className="mb-6">
  <h1 className="text-3xl font-bold">{title}</h1>
  {description && <p className="text-muted-foreground">{description}</p>}
  {actions && <div className="mt-4">{actions}</div>}
</div>

// Features:
- Consistent spacing
- Optional description
- Action buttons area
- Responsive
```

### 4. Shared Components

#### DataTable

```typescript
interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  searchKey?: string;
  searchPlaceholder?: string;
  filters?: FilterConfig[];
  loading?: boolean;
  emptyState?: React.ReactNode;
}

// Features:
- Built on shadcn/ui Table
- Column sorting (click header)
- Global search
- Column filters
- Pagination
- Loading skeletons
- Empty state
- Row selection (optional)
- Responsive (horizontal scroll on mobile)
```

#### EmptyState

```typescript
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Features:
- Centered layout
- Icon support
- Title and description
- Optional action button
- Consistent styling
```

#### LoadingState

```typescript
interface LoadingStateProps {
  type?: 'spinner' | 'skeleton' | 'page';
  count?: number; // for skeleton rows
}

// Types:
- Spinner: Simple loading spinner
- Skeleton: Content placeholder (cards, tables)
- Page: Full page loading state

// Features:
- Smooth animations
- Theme-aware
- Accessible (aria-busy)
```

## Data Models

No changes to data models - all existing interfaces remain the same.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system.*

### Property 1: Theme Persistence
*For any* theme selection (light or dark), storing the theme and reloading the page should restore the same theme.
**Validates: Requirements 1.3, 1.4**

### Property 2: Component Consistency
*For all* UI components, the visual styling should be consistent with the theme (light or dark).
**Validates: Requirements 1.5, 2.1-2.10**

### Property 3: Layout Responsiveness
*For any* screen size, the layout should adapt appropriately (sidebar collapse on mobile, responsive tables).
**Validates: Requirements 3.6, 9.1-9.5**

### Property 4: Form Validation Display
*For any* form with validation errors, all invalid fields should display error messages.
**Validates: Requirements 4.1-4.5**

### Property 5: Loading State Visibility
*For any* async operation, a loading indicator should be visible while the operation is in progress.
**Validates: Requirements 5.1-5.4**

### Property 6: Toast Notification Display
*For any* user action (success or failure), a toast notification should appear with appropriate messaging.
**Validates: Requirements 6.1-6.5**

### Property 7: Empty State Guidance
*For any* empty list or table, an empty state with guidance should be displayed.
**Validates: Requirements 7.1-7.4**

### Property 8: Table Functionality
*For any* table with data, search, filter, and sort operations should work correctly.
**Validates: Requirements 8.1-8.5**

### Property 9: Backward Compatibility
*For all* existing features, functionality should work exactly the same after the UI refactor.
**Validates: Requirements 12.1-12.6**

## Error Handling

### Client-Side Errors

**Form Validation:**
- Display field-level errors inline
- Show error summary at form level
- Prevent submission when invalid
- Clear errors on field change

**API Errors:**
- Display toast notification for errors
- Show specific error messages from backend
- Provide retry options where appropriate
- Log errors to console for debugging

**Network Errors:**
- Display offline indicator
- Show retry button
- Cache form data to prevent loss
- Provide helpful error messages

### Loading States

**Page Loading:**
- Show skeleton loaders for content
- Display loading spinner for full-page loads
- Smooth transition to loaded state

**Form Submission:**
- Disable submit button
- Show loading spinner on button
- Prevent double submission
- Clear loading state on completion

## Testing Strategy

### Unit Tests

**Component Tests:**
- Theme toggle functionality
- Button variants and states
- Input validation display
- Card composition
- Dialog open/close
- Toast notifications

**Context Tests:**
- Theme context provider
- Theme persistence
- Theme application

### Integration Tests

**Layout Tests:**
- Sidebar collapse/expand
- Navigation between pages
- Breadcrumb updates
- Responsive behavior

**Page Tests:**
- Form submission with new UI
- Table sorting and filtering
- Empty states display
- Loading states display

### Manual Testing

**Visual Testing:**
- Light theme appearance
- Dark theme appearance
- Responsive layouts (mobile, tablet, desktop)
- Component consistency
- Typography and spacing

**Functional Testing:**
- All existing features work
- Navigation works
- Forms submit correctly
- Tables display data
- Toasts appear
- Loading states show

**Accessibility Testing:**
- Keyboard navigation
- Screen reader compatibility
- Focus management
- Color contrast
- ARIA labels

## Implementation Phases

### Phase 1: Foundation (Theme + Utils)
1. Install dependencies (shadcn/ui, lucide-react, etc.)
2. Configure Tailwind with CSS variables
3. Create ThemeContext and provider
4. Add theme toggle to existing navbar
5. Test theme switching and persistence

### Phase 2: UI Component Library
1. Install shadcn/ui components (button, input, card, etc.)
2. Customize component styles for brand
3. Create utility functions (cn, formatters)
4. Test components in isolation

### Phase 3: Layout System
1. Create AppLayout component
2. Create Sidebar component
3. Create Topbar component
4. Create PageHeader component
5. Create Breadcrumb component
6. Integrate layout into App.tsx

### Phase 4: Shared Components
1. Create DataTable component
2. Create EmptyState component
3. Create LoadingState component
4. Test shared components

### Phase 5: Page Redesigns
1. Redesign Dashboard
2. Redesign SalesOrderCreate
3. Redesign SalesOrderList
4. Redesign BatchManagement
5. Redesign InventoryReport
6. Redesign MonthlyProfitSummary
7. Redesign ProfitShareHistory
8. Redesign UserManagement

### Phase 6: Polish and Testing
1. Review all pages for consistency
2. Test responsive behavior
3. Test accessibility
4. Fix any issues
5. Document new components

## Notes

- **No Backend Changes:** All backend APIs and logic remain unchanged
- **Incremental Migration:** Pages can be migrated one at a time
- **Backward Compatibility:** All existing functionality must work
- **Performance:** Use React.memo and useMemo where appropriate
- **Accessibility:** Follow WCAG 2.1 AA guidelines
- **Mobile First:** Design for mobile, enhance for desktop
- **Thai Language:** All UI text remains in Thai
- **Testing:** Test each phase before moving to the next

