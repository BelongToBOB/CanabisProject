# Implementation Plan: Frontend UI/UX Refactor

## Overview

This plan outlines the step-by-step implementation of the frontend UI/UX refactor, organized into 6 phases. Each phase builds on the previous one, allowing for incremental progress and testing.

## Tasks

- [x] 1. Phase 1: Foundation Setup
  - [x] 1.1 Install required dependencies
    - Install shadcn/ui CLI and initialize
    - Install lucide-react for icons
    - Install class-variance-authority, clsx, tailwind-merge
    - _Requirements: 2.1_
  
  - [x] 1.2 Configure Tailwind CSS with CSS variables
    - Update tailwind.config.js with theme colors
    - Create globals.css with CSS variable definitions for light/dark themes
    - Add theme-specific color values
    - _Requirements: 1.5, 10.5_
  
  - [x] 1.3 Create ThemeContext and provider
    - Create contexts/ThemeContext.tsx
    - Implement theme state management
    - Implement localStorage persistence
    - Implement theme application to document root
    - _Requirements: 1.3, 1.4_
  
  - [x] 1.4 Create theme toggle component
    - Create components/ThemeToggle.tsx
    - Add sun/moon icons
    - Implement toggle functionality
    - Add to existing Navigation component
    - _Requirements: 1.1, 1.2_
  
  - [x] 1.5 Test theme system
    - Verify theme switching works
    - Verify localStorage persistence
    - Verify theme restoration on page reload
    - _Requirements: 1.1-1.5_

- [x] 2. Phase 2: UI Component Library
  - [x] 2.1 Install shadcn/ui base components
    - Run: npx shadcn-ui@latest add button
    - Run: npx shadcn-ui@latest add input
    - Run: npx shadcn-ui@latest add card
    - Run: npx shadcn-ui@latest add table
    - Run: npx shadcn-ui@latest add dialog
    - Run: npx shadcn-ui@latest add badge
    - Run: npx shadcn-ui@latest add alert
    - Run: npx shadcn-ui@latest add toast
    - Run: npx shadcn-ui@latest add skeleton
    - Run: npx shadcn-ui@latest add dropdown-menu
    - Run: npx shadcn-ui@latest add select
    - Run: npx shadcn-ui@latest add label
    - _Requirements: 2.1-2.10_
  
  - [x] 2.2 Create utility functions
    - Create lib/utils.ts with cn() function
    - Add formatCurrency() helper
    - Add formatDate() helper
    - Add other formatting utilities
    - _Requirements: 2.1_
  
  - [x] 2.3 Customize component styles
    - Review and adjust button variants
    - Review and adjust input styles
    - Review and adjust card styles
    - Ensure theme compatibility
    - _Requirements: 2.1-2.10, 10.1-10.5_
  
  - [x] 2.4 Test UI components
    - Create test page for components
    - Test all variants and states
    - Test in light and dark themes
    - Verify accessibility
    - _Requirements: 2.1-2.10_

- [x] 3. Phase 3: Layout System
  - [x] 3.1 Create AppLayout component
    - Create components/layout/AppLayout.tsx
    - Implement flex layout structure
    - Add sidebar and main content areas
    - Make responsive
    - _Requirements: 3.1-3.6_
  
  - [x] 3.2 Create Sidebar component
    - Create components/layout/Sidebar.tsx
    - Implement navigation menu
    - Add collapse/expand functionality
    - Add active state highlighting
    - Add role-based menu filtering
    - Make responsive (hide on mobile)
    - _Requirements: 3.1, 3.2, 3.6_
  
  - [x] 3.3 Create Topbar component
    - Create components/layout/Topbar.tsx
    - Add menu toggle button (mobile)
    - Add theme toggle
    - Add user menu dropdown
    - Make sticky
    - _Requirements: 3.3_
  
  - [x] 3.4 Create PageHeader component
    - Create components/layout/PageHeader.tsx
    - Add title and description
    - Add action buttons area
    - Make responsive
    - _Requirements: 3.5_
  
  - [x] 3.5 Update Breadcrumb component
    - Update components/Breadcrumb.tsx to use new UI
    - Integrate with AppLayout
    - _Requirements: 3.4_
  
  - [x] 3.6 Integrate layout into App.tsx
    - Wrap authenticated routes with AppLayout
    - Test navigation
    - Test responsive behavior
    - _Requirements: 3.1-3.6_

- [x] 4. Phase 4: Shared Components
  - [x] 4.1 Create DataTable component
    - Create components/shared/DataTable.tsx
    - Implement column sorting
    - Implement search functionality
    - Implement filtering
    - Implement pagination
    - Add loading skeletons
    - Add empty state support
    - Make responsive
    - _Requirements: 8.1-8.5, 5.1_
  
  - [x] 4.2 Create EmptyState component
    - Create components/shared/EmptyState.tsx
    - Add icon support
    - Add title and description
    - Add action button
    - _Requirements: 7.1-7.4_
  
  - [x] 4.3 Create LoadingState component
    - Create components/shared/LoadingState.tsx
    - Implement spinner variant
    - Implement skeleton variant
    - Implement page variant
    - _Requirements: 5.1-5.4_
  
  - [x] 4.4 Test shared components
    - Test DataTable with sample data
    - Test EmptyState variations
    - Test LoadingState variations
    - _Requirements: 5.1-5.4, 7.1-7.4, 8.1-8.5_

- [-] 5. Phase 5: Page Redesigns
  - [x] 5.1 Redesign Dashboard page
    - Update pages/Dashboard.tsx
    - Use Card components for stats
    - Use DataTable for recent orders
    - Add loading states
    - Add empty states
    - Test functionality
    - _Requirements: 11.4, 12.1-12.6_
  
  - [x] 5.2 Redesign SalesOrderCreate page
    - Update pages/SalesOrderCreate.tsx
    - Use new Input components
    - Use new Button components
    - Use new Card components
    - Improve form validation display
    - Add loading states
    - Add toast notifications
    - Test form submission
    - _Requirements: 11.1, 4.1-4.5, 5.1-5.4, 6.1-6.5, 12.1-12.6_
  
  - [x] 5.3 Redesign SalesOrderList page
    - Update pages/SalesOrderList.tsx
    - Use DataTable component
    - Add search functionality
    - Add filtering
    - Add sorting
    - Add empty state
    - Add loading state
    - Test functionality
    - _Requirements: 11.2, 7.1-7.4, 8.1-8.5, 12.1-12.6_
  
  - [x] 5.4 Redesign BatchManagement page
    - Update pages/BatchManagement.tsx
    - Use DataTable component
    - Use Dialog for create/edit forms
    - Add search and filtering
    - Add empty state
    - Add loading state
    - Test CRUD operations
    - _Requirements: 11.3, 12.1-12.6_
  
  - [x] 5.5 Redesign InventoryReport page
    - Update pages/InventoryReport.tsx
    - Use DataTable component
    - Use Card for summary stats
    - Add filtering by date range
    - Add empty state
    - Add loading state
    - Test report generation
    - _Requirements: 11.5, 12.1-12.6_
  
  - [x] 5.6 Redesign MonthlyProfitSummary page
    - Update pages/MonthlyProfitSummary.tsx
    - Use Card components for metrics
    - Use DataTable for breakdown
    - Add date range picker
    - Add empty state
    - Add loading state
    - Test calculations
    - _Requirements: 11.6, 12.1-12.6_
  
  - [x] 5.7 Redesign ProfitShareHistory page
    - Update pages/ProfitShareHistory.tsx
    - Use DataTable component
    - Use Badge for status
    - Add filtering
    - Add empty state
    - Add loading state
    - Test functionality
    - _Requirements: 11.7, 12.1-12.6_
  
  - [x] 5.8 Redesign UserManagement page
    - Update pages/UserManagement.tsx
    - Use DataTable component
    - Use Dialog for create/edit forms
    - Use Badge for roles
    - Add search
    - Add empty state
    - Add loading state
    - Test CRUD operations
    - _Requirements: 11.8, 12.1-12.6_

- [x] 6. Phase 6: Polish and Testing
  - [x] 6.1 Review consistency across all pages
    - Check typography consistency
    - Check spacing consistency
    - Check color usage
    - Check component usage
    - _Requirements: 10.1-10.5_
  
  - [x] 6.2 Test responsive behavior
    - Test on mobile (< 768px)
    - Test on tablet (768px - 1024px)
    - Test on desktop (> 1024px)
    - Test sidebar collapse
    - Test table responsiveness
    - _Requirements: 9.1-9.5_
  
  - [x] 6.3 Test accessibility
    - Test keyboard navigation
    - Test screen reader compatibility
    - Test focus management
    - Test color contrast
    - Test ARIA labels
    - _Requirements: 10.5_
  
  - [x] 6.4 Test all existing functionality
    - Test authentication flow
    - Test sales order creation
    - Test batch management
    - Test reports
    - Test profit sharing
    - Test user management
    - Verify no regressions
    - _Requirements: 12.1-12.6_
  
  - [x] 6.5 Create documentation
    - Document new component usage
    - Document theme system
    - Document layout system
    - Update README with UI changes
    - _Requirements: 2.1-2.10_

## Notes

- Each phase should be completed and tested before moving to the next
- All existing functionality must continue to work
- No backend changes should be made
- Test in both light and dark themes
- Test on different screen sizes
- Maintain Thai language for all UI text
- Use console logging for debugging during development
- Remove debug logs before completing each phase

