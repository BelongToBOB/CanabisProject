# Complete Tailwind CSS Refactor Plan

## AUDIT RESULTS

### Files Using @radix-ui (in src/components/ui/):
1. dropdown-menu.tsx
2. label.tsx
3. select.tsx
4. toast.tsx
5. dialog.tsx
6. button.tsx

### Files Using @/components/ui:
1. UserManagement.tsx
2. SalesOrderList.tsx
3. SalesOrderCreate.tsx
4. ProfitShareHistory.tsx
5. InventoryReport.tsx
6. Dashboard.tsx
7. ComponentShowcase.tsx
8. BatchManagement.tsx
9. MonthlyProfitSummary.tsx
10. LoadingState.tsx (uses Skeleton)

### Files Using @/hooks/use-toast:
1. SalesOrderList.tsx
2. SalesOrderCreate.tsx
3. InventoryReport.tsx
4. ComponentShowcase.tsx

## EXECUTION PLAN

### Phase A: Remove Radix/shadcn
1. Delete entire src/components/ui folder
2. Delete src/hooks/use-toast.ts
3. Remove from package.json:
   - class-variance-authority
   - All @radix-ui/* packages
4. Clean reinstall

### Phase B: Create Tailwind-Only Components
Create in src/components/common/:
1. Button.tsx
2. Card.tsx
3. Input.tsx
4. Label.tsx
5. Select.tsx (native)
6. Badge.tsx
7. Alert.tsx
8. Modal.tsx
9. Dropdown.tsx
10. Table.tsx

### Phase C: Custom Toast System
1. Create ToastContext.tsx
2. Create ToastContainer.tsx
3. Update App.tsx to wrap with ToastProvider

### Phase D: Theme System
1. Update tailwind.config.js (darkMode: "class")
2. Update ThemeContext to apply dark class
3. Add theme toggle to Topbar
4. Update all components with dark: variants

### Phase E: Update All Pages
Update imports and component usage in all 10+ pages

### Phase F: Verification
1. Build test
2. Dev server test
3. Manual testing

## STATUS: READY TO EXECUTE
