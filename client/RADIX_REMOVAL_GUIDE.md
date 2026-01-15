# Radix UI Removal - Complete Guide

## Status: IN PROGRESS

## What Was Done

### 1. ✅ Upgraded to React 19
- Updated `package.json` to use React 19.0.0
- Removed all `@radix-ui/*` packages
- Added `react-hot-toast` for toast notifications
- Clean reinstall completed

### 2. ✅ Installed react-hot-toast
- Version: 2.6.0
- Configured in App.tsx with `<Toaster position="top-right" />`

### 3. ✅ Created Simple Replacement Components
Created Tailwind-only components in `client/src/components/simple/`:
- `Button.tsx` - Replaces @radix-ui button
- `Input.tsx` - Simple input component
- `Label.tsx` - Simple label component
- `Select.tsx` - Native HTML select with Tailwind
- `Card.tsx` - Card components (Card, CardHeader, CardTitle, CardDescription, CardContent)
- `Badge.tsx` - Badge component
- `Alert.tsx` - Alert components (Alert, AlertDescription, AlertTitle)
- `Dialog.tsx` - Modal dialog with overlay
- `Table.tsx` - Table components (Table, TableHeader, TableBody, TableRow, TableHead, TableCell)
- `Skeleton.tsx` - Loading skeleton
- `index.ts` - Exports all components

### 4. ✅ Updated Core Files
- `client/src/App.tsx` - Now uses `react-hot-toast`
- `client/src/pages/Login.tsx` - Uses `toast.success()` and `toast.error()`
- `client/src/components/layout/Topbar.tsx` - Replaced DropdownMenu with plain HTML dropdown
- `client/src/components/shared/LoadingState.tsx` - Uses simple Skeleton

## What Needs to Be Done

### Step 1: Update All Page Imports

Replace all imports from `@/components/ui/*` with `@/components/simple/*`:

**Find and Replace:**
```typescript
// OLD
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

// NEW
import { Button } from '@/components/simple';
import { Input } from '@/components/simple';
import { Label } from '@/components/simple';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/simple';
import { Badge } from '@/components/simple';
import { Alert, AlertDescription, AlertTitle } from '@/components/simple';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/simple';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/simple';
import { Skeleton } from '@/components/simple';
```

### Step 2: Replace Radix Select with Native HTML Select

**OLD (Radix UI Select):**
```typescript
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

<Select value={value} onValueChange={setValue}>
  <SelectTrigger>
    <SelectValue placeholder="Select..." />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
    <SelectItem value="option2">Option 2</SelectItem>
  </SelectContent>
</Select>
```

**NEW (Native HTML Select):**
```typescript
import { Select } from '@/components/simple';

<Select value={value} onChange={(e) => setValue(e.target.value)}>
  <option value="">Select...</option>
  <option value="option1">Option 1</option>
  <option value="option2">Option 2</option>
</Select>
```

### Step 3: Replace Toast Calls

**OLD (shadcn/ui toast):**
```typescript
import { useToast } from '@/hooks/use-toast';

const { toast } = useToast();

toast({
  title: "Success",
  description: "Operation completed",
});

toast({
  variant: "destructive",
  title: "Error",
  description: "Something went wrong",
});
```

**NEW (react-hot-toast):**
```typescript
import toast from 'react-hot-toast';

toast.success('Operation completed');
toast.error('Something went wrong');
toast.loading('Processing...');
toast('Info message');
```

### Step 4: Files That Need Updates

#### High Priority (Likely Causing Crashes):
1. ✅ `client/src/pages/Login.tsx` - DONE
2. ✅ `client/src/components/layout/Topbar.tsx` - DONE
3. `client/src/pages/SalesOrderCreate.tsx` - **NEEDS UPDATE** (uses Select heavily)
4. `client/src/pages/UserManagement.tsx` - **NEEDS UPDATE** (uses Dialog, Select)
5. `client/src/pages/SalesOrderList.tsx` - **NEEDS UPDATE** (uses Dialog)
6. `client/src/pages/BatchManagement.tsx` - **NEEDS UPDATE** (uses Dialog)

#### Medium Priority:
7. `client/src/pages/ProfitShareHistory.tsx`
8. `client/src/pages/MonthlyProfitSummary.tsx`
9. `client/src/pages/InventoryReport.tsx`
10. `client/src/pages/Dashboard.tsx`
11. `client/src/pages/ComponentShowcase.tsx`
12. `client/src/pages/ErrorHandlingDemo.tsx`

### Step 5: Delete Old UI Folder

After all updates are complete:
```cmd
cd client
rmdir /s /q src\components\ui
del src\hooks\use-toast.ts
```

### Step 6: Update DataTable Component

The `DataTable` component likely uses Radix UI Table. Update it to use simple Table:

```typescript
// client/src/components/shared/DataTable.tsx
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/simple';
```

## Testing Checklist

After all updates:

### 1. Build Test
```cmd
cd client
npm run build
```
**Expected:** Build completes with no errors

### 2. Dev Server Test
```cmd
cd client
npm run dev
```
**Expected:** Server starts with no errors

### 3. Runtime Tests
- [ ] Login page loads without errors
- [ ] Login with valid credentials shows success toast
- [ ] Login with invalid credentials shows error toast
- [ ] Topbar dropdown opens and closes correctly
- [ ] Sales order creation page loads
- [ ] All select dropdowns work
- [ ] All dialogs open and close
- [ ] All toasts appear correctly
- [ ] No console errors related to Radix UI
- [ ] No "useMemo null" errors
- [ ] No "useToast must be used within provider" errors

## Quick Fix Commands

If you encounter issues:

### Clear and Reinstall
```cmd
cd client
rmdir /s /q node_modules
del package-lock.json
npm install
```

### Verify React Version
```cmd
cd client
npm list react react-dom
```
Should show React 19.x

### Check for Radix Packages
```cmd
cd client
npm list | findstr radix
```
Should return nothing (no Radix packages)

## Common Issues

### Issue: "Cannot find module '@/components/ui/...'"
**Solution:** Update the import to use `@/components/simple` instead

### Issue: "SelectTrigger is not defined"
**Solution:** Replace Radix Select with native HTML select

### Issue: "useToast is not a function"
**Solution:** Replace with `import toast from 'react-hot-toast'`

### Issue: Dialog not closing
**Solution:** Ensure Dialog component has proper `onOpenChange` handler

## Status Summary

✅ React 19 installed
✅ react-hot-toast installed
✅ Simple components created
✅ App.tsx updated
✅ Login.tsx updated
✅ Topbar.tsx updated
✅ LoadingState.tsx updated

⏳ Remaining: Update all page files to use simple components
⏳ Remaining: Delete old ui folder
⏳ Remaining: Test all functionality

## Next Steps

1. Update SalesOrderCreate.tsx (most critical - uses Select)
2. Update UserManagement.tsx (uses Dialog and Select)
3. Update remaining pages
4. Delete ui folder
5. Run full test suite
6. Verify no runtime errors

---

**Last Updated:** January 15, 2026
**React Version:** 19.2.3
**Toast Library:** react-hot-toast 2.6.0
