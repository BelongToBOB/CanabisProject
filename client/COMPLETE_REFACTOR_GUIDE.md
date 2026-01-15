# Complete Tailwind CSS Refactor - Implementation Guide

## ⚠️ IMPORTANT: This is a LARGE refactor affecting 20+ files

This guide provides the complete implementation. Due to the scope, I recommend executing this in stages.

## PHASE A: CLEANUP (5 minutes)

### Step 1: Update package.json

Remove these dependencies:
```json
"@radix-ui/react-dialog": "^1.1.15",
"@radix-ui/react-dropdown-menu": "^2.1.16",
"@radix-ui/react-label": "^2.1.8",
"@radix-ui/react-select": "^2.2.6",
"@radix-ui/react-slot": "^1.2.4",
"@radix-ui/react-toast": "^1.2.5",
"class-variance-authority": "^0.7.1",
```

Keep only:
```json
{
  "dependencies": {
    "autoprefixer": "^10.4.23",
    "axios": "^1.13.2",
    "clsx": "^2.1.1",
    "lucide-react": "^0.562.0",
    "postcss": "^8.5.6",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-hook-form": "^7.68.0",
    "react-router-dom": "^7.10.1",
    "tailwind-merge": "^3.4.0",
    "tailwindcss": "^4.1.18"
  }
}
```

### Step 2: Delete Old UI Files

```cmd
cd client
rmdir /s /q src\components\ui
del src\hooks\use-toast.ts
```

### Step 3: Clean Reinstall

```cmd
cd client
rmdir /s /q node_modules
del package-lock.json
npm install
```

## PHASE B: CREATE NEW COMPONENTS (30 minutes)

I've already created these in `src/components/simple/`:
- Button.tsx ✅
- Input.tsx ✅
- Label.tsx ✅
- Select.tsx ✅
- Card.tsx ✅
- Badge.tsx ✅
- Alert.tsx ✅
- Dialog.tsx ✅
- Table.tsx ✅
- Skeleton.tsx ✅

**Action Required:** Rename folder from `simple` to `common`:
```cmd
cd client\src\components
move simple common
```

## PHASE C: CUSTOM TOAST SYSTEM (15 minutes)

### File 1: src/contexts/CustomToastContext.tsx

```typescript
import React, { createContext, useContext, useState, useCallback } from 'react';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (type: Toast['type'], message: string) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((type: Toast['type'], message: string) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, type, message }]);
    
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

// Helper functions
export const toast = {
  success: (message: string) => {
    // This will be set up in App.tsx
    window.dispatchEvent(new CustomEvent('show-toast', { detail: { type: 'success', message } }));
  },
  error: (message: string) => {
    window.dispatchEvent(new CustomEvent('show-toast', { detail: { type: 'error', message } }));
  },
  info: (message: string) => {
    window.dispatchEvent(new CustomEvent('show-toast', { detail: { type: 'info', message } }));
  },
};
```

### File 2: src/components/CustomToastContainer.tsx

```typescript
import React, { useEffect } from 'react';
import { useToast } from '../contexts/CustomToastContext';
import { X, CheckCircle, XCircle, Info } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, showToast, removeToast } = useToast();

  useEffect(() => {
    const handler = (e: CustomEvent) => {
      showToast(e.detail.type, e.detail.message);
    };
    window.addEventListener('show-toast' as any, handler);
    return () => window.removeEventListener('show-toast' as any, handler);
  }, [showToast]);

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`
            flex items-start gap-3 p-4 rounded-lg shadow-lg border
            animate-in slide-in-from-right duration-300
            ${toast.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : ''}
            ${toast.type === 'error' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' : ''}
            ${toast.type === 'info' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' : ''}
          `}
        >
          {toast.type === 'success' && <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />}
          {toast.type === 'error' && <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />}
          {toast.type === 'info' && <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />}
          
          <p className={`
            flex-1 text-sm font-medium
            ${toast.type === 'success' ? 'text-green-900 dark:text-green-100' : ''}
            ${toast.type === 'error' ? 'text-red-900 dark:text-red-100' : ''}
            ${toast.type === 'info' ? 'text-blue-900 dark:text-blue-100' : ''}
          `}>
            {toast.message}
          </p>
          
          <button
            onClick={() => removeToast(toast.id)}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
```

### File 3: Update App.tsx

```typescript
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/CustomToastContext';
import { ToastContainer } from './components/CustomToastContainer';
import ErrorBoundary from './components/ErrorBoundary';
// ... other imports

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ToastProvider>
          <Router>
            <AuthProvider>
              <ToastContainer />
              <Routes>
                {/* routes */}
              </Routes>
            </AuthProvider>
          </Router>
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
```

## PHASE D: UPDATE THEME SYSTEM (10 minutes)

### File: tailwind.config.js

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // Enable class-based dark mode
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
    },
  },
  plugins: [],
}
```

## PHASE E: UPDATE ALL PAGES (60 minutes)

### Global Find & Replace

Run this PowerShell script in `client/src`:

```powershell
# Replace all imports
Get-ChildItem -Recurse -Filter *.tsx | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    
    # Replace ui imports with common
    $content = $content -replace "from '@/components/ui/([^']+)'", "from '@/components/common'"
    
    # Replace useToast import
    $content = $content -replace "import \{ useToast \} from '@/hooks/use-toast'", "import { toast } from '@/contexts/CustomToastContext'"
    
    # Replace toast usage
    $content = $content -replace "const \{ toast \} = useToast\(\);", "// Using global toast"
    $content = $content -replace "toast\(\{[^}]+title: `"([^`"]+)`"[^}]*\}\)", "toast.success('$1')"
    $content = $content -replace "toast\(\{[^}]+variant: `"destructive`"[^}]+title: `"([^`"]+)`"[^}]*\}\)", "toast.error('$1')"
    
    Set-Content $_.FullName -Value $content
}
```

### Manual Updates Required

For each page file, you need to:

1. **Replace Select components:**
```typescript
// OLD
<Select value={value} onValueChange={setValue}>
  <SelectTrigger><SelectValue /></SelectTrigger>
  <SelectContent>
    <SelectItem value="1">Option 1</SelectItem>
  </SelectContent>
</Select>

// NEW
<Select value={value} onChange={(e) => setValue(e.target.value)}>
  <option value="">Select...</option>
  <option value="1">Option 1</option>
</Select>
```

2. **Replace Dialog components:**
```typescript
// OLD
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
    </DialogHeader>
    {/* content */}
  </DialogContent>
</Dialog>

// NEW - Already created in common/Dialog.tsx
// Usage stays similar but simpler
```

3. **Replace Toast calls:**
```typescript
// OLD
toast({ title: "Success" });
toast({ variant: "destructive", title: "Error" });

// NEW
toast.success("Success");
toast.error("Error");
```

## PHASE F: VERIFICATION

### Build Test
```cmd
cd client
npm run build
```

### Dev Server
```cmd
cd client
npm run dev
```

### Manual Testing Checklist
- [ ] Login page works
- [ ] Toast notifications appear
- [ ] Theme toggle works (light/dark)
- [ ] Dropdowns open/close
- [ ] Modals open/close
- [ ] Forms submit correctly
- [ ] Tables display correctly
- [ ] All pages load without errors

## FILES CHANGED SUMMARY

### Deleted:
- src/components/ui/* (entire folder)
- src/hooks/use-toast.ts

### Created:
- src/contexts/CustomToastContext.tsx
- src/components/CustomToastContainer.tsx
- src/components/common/* (10 files)

### Modified:
- package.json
- tailwind.config.js
- src/App.tsx
- src/pages/*.tsx (10+ files)
- src/components/layout/Topbar.tsx
- src/components/shared/LoadingState.tsx

## ESTIMATED TIME

- Phase A (Cleanup): 5 minutes
- Phase B (Components): Already done
- Phase C (Toast): 15 minutes
- Phase D (Theme): 10 minutes
- Phase E (Pages): 60 minutes
- Phase F (Testing): 30 minutes

**Total: ~2 hours**

## FINAL COMMANDS

After all changes:

```cmd
cd client

# Verify no Radix remains
findstr /s /i "radix" src\*.tsx
findstr /s /i "@/components/ui" src\*.tsx

# Should return nothing

# Build
npm run build

# Run
npm run dev
```

## SUCCESS CRITERIA

✅ No @radix-ui packages in node_modules
✅ No @/components/ui imports
✅ Build succeeds
✅ Dev server runs
✅ All pages load
✅ Toast notifications work
✅ Theme toggle works
✅ No console errors

---

**This is a comprehensive guide. Execute phase by phase and test after each phase.**
