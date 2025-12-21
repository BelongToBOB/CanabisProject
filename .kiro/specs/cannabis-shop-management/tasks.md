# Implementation Plan

- [x] 1. Backend setup and project structure









  - Initialize Node.js project with Express and TypeScript
  - Install dependencies: express, prisma, bcrypt, jsonwebtoken, cors, dotenv
  - Set up project folder structure: src/controllers, src/services, src/middleware, src/utils
  - Configure TypeScript with tsconfig.json
  - Create .env.example file with required environment variables
  - _Requirements: 13.2, 13.5_

- [x] 2. Database setup with Prisma
















  - Initialize Prisma with MySQL provider
  - Create Prisma schema with all models (User, Batch, SalesOrder, SalesOrderLineItem, ProfitShare)
  - Generate Prisma client
  - Create initial migration
  - _Requirements: 13.4, 13.5_

- [x] 2.1 Create database seed script






  - Write seed script to create initial admin user
  - Add sample batch data for testing
  - Add sample sales orders for testing
  - _Requirements: 1.1, 2.1_

- [x] 3. Authentication service and middleware





  - Implement AuthService with password hashing (bcrypt) and JWT token generation
  - Create authentication middleware to verify JWT tokens
  - Create authorization middleware to check user roles
  - Implement login endpoint (POST /api/auth/login)
  - _Requirements: 1.2, 1.3, 14.1, 14.2_

- [x] 3.1 Write property test for authentication






  - **Property 2: Valid authentication succeeds**
  - **Validates: Requirements 1.2**

- [x] 3.2 Write property test for invalid authentication






  - **Property 3: Invalid authentication fails**
  - **Validates: Requirements 1.3**

- [x] 3.3 Write property test for password hashing






  - **Property 36: Password hashing**
  - **Validates: Requirements 14.1**

- [x] 4. User management APIs





  - Implement UserService with CRUD operations
  - Create user management endpoints (POST, GET, PUT, DELETE /api/users)
  - Add role-based authorization (admin only)
  - _Requirements: 1.1, 1.4, 1.5_

- [x] 4.1 Write property test for user data persistence






  - **Property 1: User account data persistence**
  - **Validates: Requirements 1.1**

- [x] 4.2 Write property test for staff authorization






  - **Property 4: Staff authorization enforcement**
  - **Validates: Requirements 1.4**

- [x] 5. Batch management service





  - Implement BatchService with batch creation, retrieval, and validation
  - Add batch availability checking function
  - Implement batch update with immutability constraints (prevent purchase price/date changes)
  - Implement batch deletion with referential integrity check
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 11.3_

- [x] 5.1 Write property test for batch data persistence






  - **Property 5: Batch data persistence**
  - **Validates: Requirements 2.1**

- [x] 5.2 Write property test for batch initial quantity invariant






  - **Property 6: Batch initial quantity invariant**
  - **Validates: Requirements 2.3**

- [x] 5.3 Write property test for batch immutability






  - **Property 7: Batch immutability**
  - **Validates: Requirements 2.4**

- [x] 6. Batch management APIs




  - Create batch endpoints (POST, GET, PUT, DELETE /api/batches)
  - Add filtering by product name
  - Add role-based authorization (admin only)
  - Implement validation for duplicate batch identifiers
  - _Requirements: 2.1, 2.2, 2.5, 11.4, 11.5_

- [x] 6.1 Write property test for batch response completeness






  - **Property 8: Batch inventory response completeness**
  - **Validates: Requirements 2.5**



- [x] 6.2 Write property test for batch deletion prevention




  - **Property 33: Batch deletion prevention**
  - **Validates: Requirements 11.3**

- [x] 7. Sales order service with profit calculation





  - Implement SalesOrderService with order creation logic
  - Add line item validation (batch existence, stock availability)
  - Implement profit calculation for line items and total order
  - Add stock deduction logic with transaction management
  - Implement order retrieval with filtering
  - _Requirements: 3.1, 3.2, 3.3, 4.1, 4.2, 4.3, 4.4, 5.1, 5.2_

- [ ]* 7.1 Write property test for sales order data persistence
  - **Property 9: Sales order data persistence**
  - **Validates: Requirements 3.1**

- [ ]* 7.2 Write property test for batch existence validation
  - **Property 10: Batch existence validation**
  - **Validates: Requirements 3.2**

- [ ]* 7.3 Write property test for stock availability validation
  - **Property 11: Stock availability validation**
  - **Validates: Requirements 3.3**

- [ ]* 7.4 Write property test for order identifier uniqueness
  - **Property 12: Order identifier uniqueness**
  - **Validates: Requirements 3.5**

- [ ]* 7.5 Write property test for stock deduction accuracy
  - **Property 13: Stock deduction accuracy**
  - **Validates: Requirements 4.1**

- [ ]* 7.6 Write property test for transaction atomicity
  - **Property 14: Transaction atomicity**
  - **Validates: Requirements 4.4, 11.1**

- [ ]* 7.7 Write property test for line item profit calculation
  - **Property 15: Line item profit calculation**
  - **Validates: Requirements 5.1**

- [ ]* 7.8 Write property test for order total profit calculation
  - **Property 16: Order total profit calculation**
  - **Validates: Requirements 5.2**

- [x] 8. Sales order APIs





  - Create sales order endpoints (POST, GET, DELETE /api/sales-orders)
  - Implement role-based access (POST for admin and staff, GET/DELETE for admin only)
  - Add locked order validation (prevent modification/deletion of locked orders)
  - _Requirements: 3.1, 3.4, 3.5, 8.2, 8.3_

- [ ]* 8.1 Write property test for profit in order response
  - **Property 17: Profit in order response**
  - **Validates: Requirements 5.4**

- [ ]* 8.2 Write property test for locked order immutability
  - **Property 23: Locked order immutability**
  - **Validates: Requirements 8.2**

- [ ]* 8.3 Write property test for locked order deletion prevention
  - **Property 24: Locked order deletion prevention**
  - **Validates: Requirements 8.3**

- [x] 9. Checkpoint - Ensure all tests pass





  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Report service for inventory and profit summaries





  - Implement ReportService with inventory report generation
  - Add inventory value calculation
  - Implement monthly profit summary calculation
  - Add filtering and ordering for inventory reports
  - Identify depleted batches (zero quantity)
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ]* 10.1 Write property test for monthly profit aggregation
  - **Property 18: Monthly profit aggregation**
  - **Validates: Requirements 6.1**

- [ ]* 10.2 Write property test for monthly summary response completeness
  - **Property 19: Monthly summary response completeness**
  - **Validates: Requirements 6.2**

- [ ]* 10.3 Write property test for inventory report response completeness
  - **Property 28: Inventory report response completeness**
  - **Validates: Requirements 10.1**

- [ ]* 10.4 Write property test for inventory value calculation
  - **Property 29: Inventory value calculation**
  - **Validates: Requirements 10.2**

- [ ]* 10.5 Write property test for inventory filtering
  - **Property 30: Inventory filtering**
  - **Validates: Requirements 10.3**

- [ ]* 10.6 Write property test for depleted batch identification
  - **Property 31: Depleted batch identification**
  - **Validates: Requirements 10.4**

- [ ]* 10.7 Write property test for inventory report ordering
  - **Property 32: Inventory report ordering**
  - **Validates: Requirements 10.5**

- [x] 11. Report APIs




  - Create report endpoints (GET /api/reports/inventory, GET /api/reports/monthly-profit)
  - Add role-based authorization (admin only)
  - Implement query parameters for filtering and date selection
  - _Requirements: 6.1, 6.2, 10.1, 10.2, 10.3_

- [x] 12. Profit share service





  - Implement ProfitShareService with profit split execution logic
  - Add calculation of total profit from unlocked orders for specified month
  - Implement 50/50 profit distribution
  - Add duplicate prevention check (month/year uniqueness)
  - Implement sales order locking after profit split
  - Add profit share retrieval with ordering
  - _Requirements: 7.1, 7.2, 7.3, 7.5, 8.1, 9.1, 9.2, 9.4_

- [ ]* 12.1 Write property test for profit split calculation
  - **Property 20: Profit split calculation**
  - **Validates: Requirements 7.1, 7.2**

- [ ]* 12.2 Write property test for profit split idempotency
  - **Property 21: Profit split idempotency**
  - **Validates: Requirements 7.5**

- [ ]* 12.3 Write property test for sales order locking on profit split
  - **Property 22: Sales order locking on profit split**
  - **Validates: Requirements 8.1**

- [ ]* 12.4 Write property test for profit share immutability
  - **Property 27: Profit share immutability**
  - **Validates: Requirements 9.4**

- [x] 13. Profit share APIs




  - Create profit share endpoints (GET /api/profit-shares, POST /api/profit-shares/execute)
  - Add role-based authorization (admin only)
  - Implement manual trigger endpoint for testing
  - _Requirements: 7.1, 7.2, 9.1, 9.2_

- [ ]* 13.1 Write property test for profit share response completeness
  - **Property 25: Profit share response completeness**
  - **Validates: Requirements 9.1**

- [ ]* 13.2 Write property test for profit share ordering
  - **Property 26: Profit share ordering**
  - **Validates: Requirements 9.2**

- [x] 14. Scheduler service for automated profit sharing




  - Implement SchedulerService using node-cron
  - Configure cron job to run daily at midnight
  - Add logic to check if current date is 24th of month
  - Trigger profit split execution for previous month
  - Add error handling and logging
  - _Requirements: 7.1, 7.4_

- [x] 15. Input validation and error handling





  - Implement validation middleware for all endpoints
  - Add validation for monetary values (non-negative)
  - Add validation for quantity values (positive integers)
  - Create standardized error response format
  - Implement error logging with context
  - _Requirements: 11.4, 11.5, 12.1, 12.2, 12.4_

- [x] 15.1 Write property test for monetary value validation






  - **Property 34: Monetary value validation**
  - **Validates: Requirements 11.4**

- [ ]* 15.2 Write property test for quantity value validation
  - **Property 35: Quantity value validation**
  - **Validates: Requirements 11.5**

- [x] 16. Checkpoint - Ensure all backend tests pass









  - Ensure all tests pass, ask the user if questions arise.

- [x] 17. Frontend project setup









  - Initialize React project with TypeScript using Vite or Create React App
  - Install dependencies: react-router-dom, axios, react-hook-form, tailwindcss (or preferred CSS framework)
  - Set up project folder structure: src/components, src/pages, src/services, src/contexts, src/utils
  - Configure environment variables for API URL
  - _Requirements: 13.1, 13.3_

- [x] 18. Authentication context and API client





  - Create AuthContext for managing authentication state
  - Implement API client with axios interceptors for token injection
  - Create login page with form validation
  - Implement protected route wrapper component
  - Add token storage in localStorage or sessionStorage
  - _Requirements: 1.2, 1.3, 14.2_

- [x] 19. User management UI (admin only)




  - Create user list page with table display
  - Implement user creation form
  - Add user edit functionality
  - Implement user deletion with confirmation
  - Add role-based UI visibility
  - _Requirements: 1.1, 1.4_

- [x] 20. Batch management UI (admin only)














  - Create batch list page with filtering by product name
  - Implement batch creation form with validation
  - Add batch detail view
  - Display current quantity and purchase information
  - Implement batch deletion with referential integrity error handling
  - _Requirements: 2.1, 2.2, 2.5, 11.3_


- [x] 21. Sales order creation UI




  - Create sales order form with dynamic line item addition
  - Implement batch selection dropdown with available quantity display
  - Add real-time profit calculation preview
  - Implement form validation (batch existence, stock availability)
  - Add customer name field (optional)
  - Display success/error messages
  - _Requirements: 3.1, 3.2, 3.3, 5.1, 5.2_

- [x] 22. Sales order list and detail UI (admin only)




  - Create sales order list page with date filtering
  - Display order summary (date, customer, total profit, locked status)
  - Implement order detail view with line items
  - Add visual indicator for locked orders
  - Implement order deletion (only for unlocked orders)
  - _Requirements: 3.5, 5.4, 8.2, 8.3_

- [x] 23. Inventory report UI (admin only)





  - Create inventory report page
  - Display all batches in table format
  - Add filtering by product name
  - Show total inventory value calculation
  - Highlight depleted batches (zero quantity)
  - Implement sorting by product name and batch identifier
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 24. Monthly profit summary UI (admin only)




  - Create monthly profit summary page
  - Add month/year selector
  - Display total profit, number of orders, and date range
  - Show zero profit message when no orders exist
  - Add navigation to view historical months
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 25. Profit share history UI (admin only)





  - Create profit share history page
  - Display all profit distributions in table format
  - Show execution date, month/year, total profit, and amount per owner
  - Order by execution date (most recent first)
  - Add detail view for individual profit share records
  - _Requirements: 9.1, 9.2, 9.3_

- [x] 26. Navigation and layout





  - Create main navigation component with role-based menu items
  - Implement responsive layout with header and sidebar
  - Add logout functionality
  - Create dashboard/home page with quick stats
  - Implement breadcrumb navigation
  - _Requirements: 1.4, 1.5_

- [x] 27. Error handling and user feedback





  - Implement global error boundary component
  - Create toast/notification system for success/error messages
  - Add loading states for async operations
  - Display validation errors from backend
  - Implement 401/403 error handling with redirect to login
  - _Requirements: 12.1, 12.2_

- [x] 28. Final checkpoint - End-to-end testing





  - Ensure all tests pass, ask the user if questions arise.

- [ ]* 29. Documentation
  - Create API documentation with endpoint descriptions
  - Write README with setup instructions
  - Document environment variables
  - Add database migration guide
  - Create user guide for admin and staff roles
  - _Requirements: All_
