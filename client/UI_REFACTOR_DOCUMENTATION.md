# UI/UX Refactor Documentation

## Overview

This document provides comprehensive documentation for the Cannabis Shop Management application UI/UX refactor. The refactor introduces a modern, consistent, and accessible interface using shadcn/ui components and a theme system.

## Table of Contents

1. [Theme System](#theme-system)
2. [Component Library](#component-library)
3. [Layout System](#layout-system)
4. [Shared Components](#shared-components)
5. [Styling Guidelines](#styling-guidelines)
6. [Accessibility](#accessibility)
7. [Responsive Design](#responsive-design)
8. [Best Practices](#best-practices)

---

## Theme System

### Overview

The application supports light and dark themes with automatic persistence using localStorage.

### Implementation

#### ThemeContext

Located at: `client/src/contexts/ThemeContext.tsx`

```tsx
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';

// In your app root
<ThemeProvider>
  <App />
</ThemeProvider>

// In any component
const { theme, toggleTheme, setTheme } = useTheme();
```

#### Theme Toggle Component

Located at: `client/src/components/ThemeToggle.tsx`

```tsx
import ThemeToggle from '@/components/ThemeToggle';

// Usage
<ThemeToggle />
```

### CSS Variables

Themes are defined using CSS variables in `client/src/index.css`:

```css
/* Light theme (default) */
:root {
  --color-background: oklch(100% 0 0);
  --color-foreground: oklch(9.8% 0.084 285.9);
  --color-primary: oklch(11.2% 0.047 285.9);
  /* ... more variables */
}

/* Dark theme */
.dark {
  --color-background: oklch(9.8% 0.084 285.9);
  --color-foreground: oklch(98% 0.004 285.9);
  --color-primary: oklch(98% 0.004 285.9);
  /* ... more variables */
}
```

### Using Theme Colors

Always use theme-aware color classes:

```tsx
// ✅ Good - theme-aware
<div className="bg-background text-foreground">
<Button className="bg-primary text-primary-foreground">

// ❌ Bad - hardcoded colors
<div className="bg-white text-black">
<Button className="bg-blue-500 text-white">
```

---

## Component Library

### shadcn/ui Components

The application uses shadcn/ui components for consistent UI elements.

#### Installed Components

Located at: `client/src/components/ui/`

- `button.tsx` - Button component with variants
- `input.tsx` - Input field component
- `card.tsx` - Card container component
- `table.tsx` - Table component
- `dialog.tsx` - Modal dialog component
- `badge.tsx` - Badge/tag component
- `alert.tsx` - Alert message component
- `toast.tsx` - Toast notification component
- `skeleton.tsx` - Loading skeleton component
- `dropdown-menu.tsx` - Dropdown menu component
- `select.tsx` - Select dropdown component
- `label.tsx` - Form label component

### Button Component

```tsx
import { Button } from '@/components/ui/button';

// Variants
<Button variant="default">Primary</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Secondary</Button>
<Button variant="ghost">Subtle</Button>
<Button variant="link">Link</Button>

// Sizes
<Button size="default">Normal</Button>
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
<Button size="icon">Icon Only</Button>

// With icons
<Button>
  <Plus className="h-4 w-4 mr-2" />
  Add Item
</Button>

// Loading state
<Button disabled={isLoading}>
  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
  Submit
</Button>
```

### Input Component

```tsx
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Basic usage
<div className="space-y-2">
  <Label htmlFor="email">Email</Label>
  <Input 
    id="email" 
    type="email" 
    placeholder="Enter email"
  />
</div>

// With error
<div className="space-y-2">
  <Label htmlFor="username">Username</Label>
  <Input 
    id="username"
    className={error ? 'border-destructive' : ''}
  />
  {error && (
    <p className="text-sm text-destructive">{error}</p>
  )}
</div>
```

### Card Component

```tsx
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from '@/components/ui/card';

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description text</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Card content goes here</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

### Dialog Component

```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const [open, setOpen] = useState(false);

<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
      <DialogDescription>
        Dialog description text
      </DialogDescription>
    </DialogHeader>
    
    {/* Dialog content */}
    <div className="space-y-4">
      {/* Your form or content */}
    </div>
    
    <DialogFooter>
      <Button variant="outline" onClick={() => setOpen(false)}>
        Cancel
      </Button>
      <Button onClick={handleSubmit}>
        Confirm
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Toast Notifications

```tsx
import { useToast } from '@/hooks/use-toast';

const { toast } = useToast();

// Success toast
toast({
  title: "Success",
  description: "Operation completed successfully",
});

// Error toast
toast({
  variant: "destructive",
  title: "Error",
  description: "Something went wrong",
});

// Custom duration
toast({
  title: "Info",
  description: "This will disappear in 3 seconds",
  duration: 3000,
});
```

---

## Layout System

### AppLayout Component

Located at: `client/src/components/layout/AppLayout.tsx`

The main layout wrapper that includes sidebar and topbar.

```tsx
import AppLayout from '@/components/layout/AppLayout';

// In App.tsx
<AppLayout>
  <Routes>
    {/* Your routes */}
  </Routes>
</AppLayout>
```

### Sidebar Component

Located at: `client/src/components/layout/Sidebar.tsx`

Features:
- Collapsible on desktop
- Slide-out on mobile
- Role-based menu items
- Active state highlighting

```tsx
// Sidebar is included in AppLayout
// No need to use directly
```

### Topbar Component

Located at: `client/src/components/layout/Topbar.tsx`

Features:
- Mobile menu toggle
- Theme toggle
- User menu with dropdown
- Sticky positioning

```tsx
// Topbar is included in AppLayout
// No need to use directly
```

### Page Structure

Standard page structure:

```tsx
const MyPage: React.FC = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold">Page Title</h1>
        <p className="text-muted-foreground mt-2">
          Page description
        </p>
      </div>

      {/* Page Content */}
      <Card>
        <CardContent>
          {/* Your content */}
        </CardContent>
      </Card>
    </div>
  );
};
```

---

## Shared Components

### DataTable Component

Located at: `client/src/components/shared/DataTable.tsx`

A powerful table component with search, sort, and pagination.

```tsx
import { DataTable, type ColumnDef } from '@/components/shared/DataTable';

interface User {
  id: number;
  name: string;
  email: string;
}

const columns: ColumnDef<User>[] = [
  {
    key: 'id',
    header: 'ID',
    sortable: true,
  },
  {
    key: 'name',
    header: 'Name',
    sortable: true,
  },
  {
    key: 'email',
    header: 'Email',
    sortable: true,
  },
  {
    key: 'actions',
    header: 'Actions',
    render: (user) => (
      <Button onClick={() => handleEdit(user)}>
        Edit
      </Button>
    ),
  },
];

<DataTable
  data={users}
  columns={columns}
  searchKey="name"
  searchPlaceholder="Search by name..."
  loading={isLoading}
  emptyState={<EmptyState title="No users found" />}
/>
```

### EmptyState Component

Located at: `client/src/components/shared/EmptyState.tsx`

Display when there's no data to show.

```tsx
import { EmptyState } from '@/components/shared/EmptyState';
import { Package } from 'lucide-react';

<EmptyState
  icon={<Package className="h-10 w-10 text-muted-foreground" />}
  title="No items found"
  description="Get started by creating your first item"
  action={{
    label: 'Create Item',
    onClick: handleCreate,
  }}
/>
```

### LoadingState Component

Located at: `client/src/components/shared/LoadingState.tsx`

Display loading indicators.

```tsx
import { LoadingState } from '@/components/shared/LoadingState';

// Spinner (default)
<LoadingState type="spinner" />

// Skeleton loaders
<LoadingState type="skeleton" count={3} />

// Full page loading
<LoadingState type="page" />
```

---

## Styling Guidelines

### Tailwind CSS Classes

#### Spacing

```tsx
// Container spacing
<div className="container mx-auto p-6">

// Section spacing
<div className="space-y-6">

// Card spacing
<div className="space-y-4">

// Form field spacing
<div className="space-y-2">
```

#### Typography

```tsx
// Page title
<h1 className="text-3xl font-bold">

// Section title
<h2 className="text-lg font-semibold">

// Card title
<CardTitle className="text-base">

// Body text
<p className="text-sm">

// Muted text
<p className="text-muted-foreground">
```

#### Colors

```tsx
// Success
<span className="text-green-600">

// Error
<span className="text-destructive">

// Warning
<span className="text-orange-600">

// Info
<span className="text-blue-600">
```

#### Grid Layouts

```tsx
// Responsive grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

// Form grid
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
```

### Utility Functions

Located at: `client/src/lib/utils.ts`

```tsx
import { cn, formatCurrency, formatDate, formatDateTime } from '@/lib/utils';

// Combine class names
<div className={cn('base-class', condition && 'conditional-class')}>

// Format currency
formatCurrency(1234.56) // "฿1,234.56"

// Format date
formatDate('2024-01-15') // "15/01/2024"

// Format date and time
formatDateTime('2024-01-15T10:30:00') // "15/01/2024 10:30"
```

---

## Accessibility

### Keyboard Navigation

All interactive elements are keyboard accessible:
- **Tab**: Navigate forward
- **Shift+Tab**: Navigate backward
- **Enter/Space**: Activate buttons and links
- **Escape**: Close dialogs and dropdowns
- **Arrow keys**: Navigate menus and dropdowns

### ARIA Labels

Always provide ARIA labels for icon-only buttons:

```tsx
// ✅ Good
<Button aria-label="Delete item">
  <Trash2 className="h-4 w-4" />
</Button>

// ❌ Bad
<Button>
  <Trash2 className="h-4 w-4" />
</Button>
```

### Form Accessibility

```tsx
// Always associate labels with inputs
<Label htmlFor="email">Email</Label>
<Input id="email" name="email" />

// Mark required fields
<Label>
  Username <span className="text-destructive">*</span>
</Label>
<Input required aria-required="true" />

// Associate errors with fields
<Input 
  aria-invalid={hasError}
  aria-describedby={hasError ? "error-message" : undefined}
/>
{hasError && (
  <p id="error-message" className="text-sm text-destructive">
    {errorMessage}
  </p>
)}
```

### Loading States

```tsx
<LoadingState 
  type="spinner"
  role="status"
  aria-busy="true"
  aria-label="Loading data"
/>
```

---

## Responsive Design

### Breakpoints

- **Mobile**: < 768px
- **Tablet**: 768px - 1024px (md:)
- **Desktop**: > 1024px (lg:)

### Responsive Patterns

#### Grid Layouts

```tsx
// Stack on mobile, 2 cols on tablet, 3 on desktop
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
```

#### Form Fields

```tsx
// Stack on mobile, side-by-side on tablet+
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
```

#### Sidebar

```tsx
// Hidden on mobile, visible on desktop
// Controlled by AppLayout component
```

#### Tables

```tsx
// Horizontal scroll on mobile
// DataTable component handles this automatically
```

---

## Best Practices

### Component Organization

```
src/
├── components/
│   ├── ui/              # shadcn/ui components
│   ├── layout/          # Layout components
│   ├── shared/          # Shared/reusable components
│   └── [feature]/       # Feature-specific components
├── pages/               # Page components
├── contexts/            # React contexts
├── hooks/               # Custom hooks
└── lib/                 # Utility functions
```

### Naming Conventions

- **Components**: PascalCase (e.g., `UserManagement.tsx`)
- **Hooks**: camelCase with 'use' prefix (e.g., `useToast.ts`)
- **Utilities**: camelCase (e.g., `formatCurrency`)
- **CSS Classes**: kebab-case (Tailwind classes)

### State Management

```tsx
// Local state
const [data, setData] = useState([]);

// Context for global state
const { user } = useAuth();
const { theme } = useTheme();

// Custom hooks for reusable logic
const { toast } = useToast();
const { handleError } = useApiError();
```

### Error Handling

```tsx
try {
  await apiClient.post('/endpoint', data);
  toast({
    title: 'Success',
    description: 'Operation completed',
  });
} catch (err: any) {
  toast({
    variant: 'destructive',
    title: 'Error',
    description: err.response?.data?.message || 'Operation failed',
  });
}
```

### Loading States

```tsx
const [isLoading, setIsLoading] = useState(false);

const fetchData = async () => {
  setIsLoading(true);
  try {
    const response = await apiClient.get('/data');
    setData(response.data);
  } finally {
    setIsLoading(false);
  }
};

// In render
if (isLoading) {
  return <LoadingState type="page" />;
}
```

### Form Validation

```tsx
const [errors, setErrors] = useState<Record<string, string>>({});

const validate = () => {
  const newErrors: Record<string, string> = {};
  
  if (!formData.name) {
    newErrors.name = 'Name is required';
  }
  
  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (!validate()) {
    return;
  }
  
  // Submit form
};
```

---

## Migration Guide

### Migrating Existing Pages

1. **Update imports**:
```tsx
// Old
import Button from '../components/Button';

// New
import { Button } from '@/components/ui/button';
```

2. **Update layout**:
```tsx
// Old
<div className="page-container">

// New
<div className="container mx-auto p-6 space-y-6">
```

3. **Update components**:
```tsx
// Old
<button className="btn btn-primary">

// New
<Button variant="default">
```

4. **Update colors**:
```tsx
// Old
<div className="bg-white text-black">

// New
<div className="bg-background text-foreground">
```

5. **Add loading states**:
```tsx
// New
if (isLoading) {
  return <LoadingState type="page" />;
}
```

6. **Add empty states**:
```tsx
// New
if (data.length === 0) {
  return <EmptyState title="No data" />;
}
```

---

## Troubleshooting

### Theme Not Applying

Check that:
1. ThemeProvider wraps your app
2. CSS variables are defined in index.css
3. Tailwind config references CSS variables

### Components Not Styled

Check that:
1. Component is imported from correct path
2. Tailwind classes are not being purged
3. CSS is being loaded

### Focus Ring Not Visible

Check that:
1. `ring-ring` CSS variable is defined
2. Focus-visible utility is applied
3. Browser focus styles not overridden

---

## Resources

### Documentation
- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Radix UI](https://www.radix-ui.com/)
- [Lucide Icons](https://lucide.dev/)

### Tools
- [Tailwind CSS IntelliSense](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss)
- [React DevTools](https://react.dev/learn/react-developer-tools)

---

## Changelog

### Version 2.0.0 (UI Refactor)

#### Added
- Theme system with light/dark modes
- shadcn/ui component library
- New layout system with sidebar and topbar
- DataTable component with search, sort, pagination
- EmptyState component
- LoadingState component
- Responsive design across all pages
- Accessibility improvements
- Toast notifications

#### Changed
- All pages redesigned with new UI
- Improved form validation display
- Better error handling
- Enhanced loading states
- Consistent spacing and typography

#### Maintained
- All existing functionality
- Data integrity
- API compatibility
- Business logic

---

## Support

For questions or issues:
1. Check this documentation
2. Review component examples in the codebase
3. Consult shadcn/ui documentation
4. Contact the development team

---

**Last Updated**: January 2026
**Version**: 2.0.0
