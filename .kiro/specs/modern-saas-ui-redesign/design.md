# Design Document: Modern SaaS UI Redesign

## Overview

This design document outlines the complete UI redesign of the cannabis shop management system to achieve a premium, modern SaaS dashboard aesthetic. The redesign focuses on creating a cohesive design system with reusable components, implementing light/dark theme support, and ensuring responsive design across all devices.

The design follows modern SaaS patterns seen in applications like Notion, Linear, and Vercel, emphasizing clean layouts, subtle animations, and clear visual hierarchy.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Application                          │
│  ┌───────────────────────────────────────────────────┐  │
│  │              ThemeProvider                         │  │
│  │  ┌─────────────────────────────────────────────┐  │  │
│  │  │           ToastProvider                      │  │  │
│  │  │  ┌───────────────────────────────────────┐  │  │  │
│  │  │  │        AuthProvider                    │  │  │  │
│  │  │  │  ┌─────────────────────────────────┐  │  │  │  │
│  │  │  │  │         Router                   │  │  │  │  │
│  │  │  │  │  ┌───────────────────────────┐  │  │  │  │  │
│  │  │  │  │  │      AppLayout            │  │  │  │  │  │
│  │  │  │  │  │  ┌─────────┬──────────┐  │  │  │  │  │  │
│  │  │  │  │  │  │ Sidebar │ Content  │  │  │  │  │  │  │
│  │  │  │  │  │  │         │ ┌──────┐ │  │  │  │  │  │  │
│  │  │  │  │  │  │         │ │Topbar│ │  │  │  │  │  │  │
│  │  │  │  │  │  │         │ └──────┘ │  │  │  │  │  │  │
│  │  │  │  │  │  │         │  Pages   │  │  │  │  │  │  │
│  │  │  │  │  │  └─────────┴──────────┘  │  │  │  │  │  │
│  │  │  │  │  └───────────────────────────┘  │  │  │  │  │
│  │  │  │  └─────────────────────────────────┘  │  │  │  │
│  │  │  └───────────────────────────────────────┘  │  │  │
│  │  └─────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Component Hierarchy

```
Design System
├── Theme
│   ├── ThemeContext (state management)
│   ├── ThemeProvider (context provider)
│   └── useTheme (hook)
├── Base Components
│   ├── Button (primary, secondary, ghost, destructive)
│   ├── Input (text, number, date, password)
│   ├── Card (default, hover, elevated)
│   ├── Badge (success, warning, danger, default)
│   ├── Select (dropdown)
│   ├── Label (form labels)
│   └── Skeleton (loading states)
├── Composite Components
│   ├── DataTable (sortable, searchable)
│   ├── Modal/Dialog (with backdrop)
│   ├── Toast (success, error, info)
│   ├── EmptyState (icon, message, action)
│   └── LoadingState (spinner, skeleton)
└── Layout Components
    ├── AppLayout (sidebar + content)
    ├── Sidebar (navigation)
    ├── Topbar (user info, theme toggle)
    └── PageHeader (title, actions)
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
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    return (saved as 'light' | 'dark') || 'light';
  });

  const setTheme = (newTheme: 'light' | 'dark') => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};
```

### 2. Base Components

#### Button Component

```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

// Styling classes
const baseClasses = 'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]';

const variantClasses = {
  primary: 'bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-600',
  secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200 focus:ring-slate-500 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700',
  ghost: 'text-slate-700 hover:bg-slate-100 focus:ring-slate-500 dark:text-slate-300 dark:hover:bg-slate-800',
  destructive: 'bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-500 dark:bg-rose-500 dark:hover:bg-rose-600'
};

const sizeClasses = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg'
};
```

#### Input Component

```typescript
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

// Styling classes
const baseClasses = 'w-full rounded-lg border bg-white px-4 py-2 text-slate-900 placeholder:text-slate-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 dark:placeholder:text-slate-500';

const errorClasses = 'border-rose-500 focus:ring-rose-500';
const normalClasses = 'border-slate-200 dark:border-slate-700';
```

#### Card Component

```typescript
interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

// Styling classes
const baseClasses = 'rounded-xl border bg-white p-6 shadow-sm transition-all duration-200 dark:bg-slate-900 dark:border-slate-800';

const hoverClasses = 'hover:-translate-y-0.5 hover:shadow-md cursor-pointer';
```

#### Badge Component

```typescript
interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

// Styling classes
const baseClasses = 'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium';

const variantClasses = {
  default: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  danger: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
};
```

### 3. Layout Components

#### AppLayout

```typescript
interface AppLayoutProps {
  children: ReactNode;
}

// Structure
<div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
  <Sidebar />
  <div className="lg:pl-64">
    <Topbar />
    <main className="p-6 lg:p-8">
      {children}
    </main>
  </div>
</div>
```

#### Sidebar

```typescript
interface SidebarProps {
  // Navigation items from router
}

// Styling
- Fixed position on desktop (lg:fixed lg:inset-y-0 lg:left-0 lg:w-64)
- Slide-in drawer on mobile
- Background: bg-white dark:bg-slate-900
- Border: border-r border-slate-200 dark:border-slate-800
- Navigation items with hover states
- Active item highlighted with emerald accent
```

#### Topbar

```typescript
interface TopbarProps {
  // User info, theme toggle
}

// Styling
- Sticky top position
- Background: bg-white/80 dark:bg-slate-900/80
- Backdrop blur: backdrop-blur-sm
- Border: border-b border-slate-200 dark:border-slate-800
- Contains: breadcrumbs, user menu, theme toggle
```

### 4. Composite Components

#### DataTable

```typescript
interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  searchKey?: string;
  searchPlaceholder?: string;
  loading?: boolean;
  emptyState?: ReactNode;
}

// Features
- Sortable columns
- Search functionality
- Row hover effects
- Responsive (horizontal scroll on mobile)
- Loading skeleton states
```

#### Modal/Dialog

```typescript
interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}

// Styling
- Backdrop: bg-black/50 backdrop-blur-sm
- Content: rounded-xl shadow-2xl
- Animation: fade + scale entrance
- Close on backdrop click or ESC key
```

## Data Models

### Theme Preference

```typescript
type Theme = 'light' | 'dark';

interface ThemePreference {
  theme: Theme;
  // Stored in localStorage as 'theme'
}
```

### Component Props

All component props follow TypeScript interfaces with proper typing for variants, sizes, and states.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Based on the prework analysis, this UI redesign project focuses primarily on visual design, styling, and user experience improvements. The acceptance criteria are largely about CSS classes, layout structure, and visual appearance, which are not amenable to property-based testing.

The only testable properties identified are related to theme management:

### Property 1: Theme Persistence
*For any* theme selection (light or dark), when the user toggles the theme, the preference should be saved to localStorage and persist across page reloads.

**Validates: Requirements 2.3**

### Property 2: Theme Default Behavior
*For any* application initialization where no theme preference exists in localStorage, the system should default to light theme.

**Validates: Requirements 2.2**

**Note:** The majority of this redesign involves visual styling, component structure, and CSS implementation, which are validated through manual testing, visual regression testing, and accessibility audits rather than property-based testing.

## Error Handling

### Theme System Errors

1. **localStorage Access Failure**
   - Fallback to default light theme
   - Log error to console
   - Continue application functionality

2. **Invalid Theme Value**
   - Validate theme value before applying
   - Fallback to light theme if invalid
   - Clear invalid value from localStorage

### Component Errors

1. **Missing Required Props**
   - TypeScript will catch at compile time
   - Provide sensible defaults where possible

2. **Invalid Variant/Size Props**
   - Fallback to default variant
   - Log warning in development mode

## Testing Strategy

### Manual Testing

Since this is primarily a UI redesign, manual testing is the primary validation method:

1. **Visual Testing**
   - Verify all pages match design specifications
   - Check component consistency across pages
   - Validate color usage and typography hierarchy
   - Test hover, active, and focus states

2. **Theme Testing**
   - Toggle between light and dark themes
   - Verify theme persistence across page reloads
   - Check contrast ratios in both themes
   - Validate all components in both themes

3. **Responsive Testing**
   - Test on desktop (1920px, 1440px, 1024px)
   - Test on tablet (768px, 834px)
   - Test on mobile (375px, 414px)
   - Verify sidebar collapse on mobile
   - Check table horizontal scroll

4. **Interaction Testing**
   - Test all button hover/active states
   - Verify card elevation on hover
   - Check modal open/close animations
   - Test toast notifications
   - Verify form validation feedback

### Accessibility Testing

1. **Keyboard Navigation**
   - Tab through all interactive elements
   - Verify focus indicators are visible
   - Test modal trap focus
   - Check dropdown keyboard controls

2. **Screen Reader Testing**
   - Test with NVDA/JAWS on Windows
   - Test with VoiceOver on macOS
   - Verify aria-labels on icon buttons
   - Check form field associations

3. **Contrast Testing**
   - Use browser DevTools contrast checker
   - Verify WCAG AA compliance (4.5:1 for normal text)
   - Check all color combinations in both themes

### Unit Testing (Limited Scope)

Property-based tests for theme management:

```typescript
// Test theme persistence
describe('Theme Management', () => {
  it('should save theme preference to localStorage', () => {
    // Property: For any theme toggle, preference is saved
    const { result } = renderHook(() => useTheme());
    
    act(() => {
      result.current.toggleTheme();
    });
    
    expect(localStorage.getItem('theme')).toBe('dark');
  });

  it('should default to light theme when no preference exists', () => {
    // Property: Default theme is light when localStorage is empty
    localStorage.removeItem('theme');
    const { result } = renderHook(() => useTheme());
    
    expect(result.current.theme).toBe('light');
  });
});
```

### Integration Testing

Test complete user flows:

1. **Dashboard Flow**
   - Load dashboard
   - Verify stat cards render
   - Click quick action
   - Verify navigation

2. **List Page Flow**
   - Load list page
   - Search for item
   - Sort by column
   - Click row action

3. **Form Flow**
   - Open create form
   - Fill in fields
   - Submit form
   - Verify success toast

### Visual Regression Testing (Optional)

If using tools like Percy or Chromatic:

1. Capture screenshots of all pages in both themes
2. Compare against baseline on each PR
3. Flag visual changes for review

## Implementation Notes

### Tailwind Configuration

Update `tailwind.config.js` to support dark mode and custom colors:

```javascript
module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Emerald as primary accent
        primary: colors.emerald,
      },
      animation: {
        'in': 'in 0.2s ease-out',
      },
      keyframes: {
        in: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
};
```

### CSS Global Styles

Add smooth transitions and base styles:

```css
* {
  @apply transition-colors duration-200;
}

body {
  @apply antialiased;
}
```

### Component Organization

```
src/
├── components/
│   ├── common/          # Base components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── Select.tsx
│   │   └── Label.tsx
│   ├── shared/          # Composite components
│   │   ├── DataTable.tsx
│   │   ├── EmptyState.tsx
│   │   └── LoadingState.tsx
│   └── layout/          # Layout components
│       ├── AppLayout.tsx
│       ├── Sidebar.tsx
│       └── Topbar.tsx
├── contexts/
│   └── ThemeContext.tsx
└── pages/               # Page components
    ├── Dashboard.tsx
    ├── BatchManagement.tsx
    ├── UserManagement.tsx
    └── ...
```

### Migration Strategy

1. **Phase 1: Foundation**
   - Implement ThemeContext
   - Update base components (Button, Input, Card, Badge)
   - Update layout (AppLayout, Sidebar, Topbar)

2. **Phase 2: Pages**
   - Redesign Dashboard
   - Redesign list pages (Batches, Users, Sales Orders)
   - Redesign form pages (Create/Edit)

3. **Phase 3: Polish**
   - Add animations and transitions
   - Implement loading states
   - Add empty states
   - Test responsiveness

4. **Phase 4: Validation**
   - Manual testing all pages
   - Accessibility audit
   - Cross-browser testing
   - Mobile device testing
