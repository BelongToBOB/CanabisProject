# Design Document

## Overview

The Cannabis Shop Management System is a three-tier web application consisting of a ReactJS frontend (client), a Node.js/Express backend (server), and a MySQL database. The system manages cannabis inventory at the batch level, processes sales transactions with automatic stock deduction, calculates profits, and automates monthly profit distribution between two owners.

The architecture follows a clear separation of concerns with the frontend handling user interface and user experience, the backend managing business logic and data validation, and the database ensuring data persistence and integrity. Communication between frontend and backend occurs exclusively through RESTful API endpoints using JSON payloads.

## Architecture

### System Architecture Diagram

```mermaid
graph TB
    subgraph "Client Layer"
        UI[React SPA]
        State[State Management]
    end
    
    subgraph "Server Layer"
        API[Express REST API]
        Auth[Authentication Middleware]
        BL[Business Logic Layer]
        Scheduler[Profit Share Scheduler]
    end
    
    subgraph "Data Layer"
        Prisma[Prisma ORM]
        DB[(MySQL Database)]
    end
    
    UI --> State
    State --> API
    API --> Auth
    Auth --> BL
    BL --> Prisma
    Prisma --> DB
    Scheduler --> BL
```

### Frontend Responsibilities (ReactJS Client)

1. **User Interface Rendering**: Display forms, tables, and reports for all user interactions
2. **Client-Side Validation**: Provide immediate feedback on form inputs before API submission
3. **State Management**: Manage application state including user session, current views, and cached data
4. **API Communication**: Send HTTP requests to backend endpoints and handle responses
5. **Role-Based UI**: Show/hide features based on authenticated user's role (Admin vs Staff)
6. **Error Display**: Present user-friendly error messages from backend validation
7. **Routing**: Handle navigation between different views (inventory, sales, reports, profit sharing)

### Backend Responsibilities (Node.js + Express Server)

1. **API Endpoints**: Expose RESTful endpoints for all system operations
2. **Authentication**: Validate user credentials and issue authentication tokens
3. **Authorization**: Enforce role-based access control on protected endpoints
4. **Business Logic**: Implement core operations (batch creation, sales processing, profit calculation)
5. **Data Validation**: Validate all inputs against business rules before database operations
6. **Transaction Management**: Ensure atomic operations for multi-step processes (sales with stock deduction)
7. **Profit Sharing Automation**: Execute scheduled profit distribution on the 24th of each month
8. **Error Handling**: Catch exceptions, log errors, and return appropriate HTTP status codes
9. **Database Operations**: Use Prisma ORM for all database queries and mutations

### Database Responsibilities (MySQL)

1. **Data Persistence**: Store all system data (users, batches, sales orders, profit shares)
2. **Referential Integrity**: Enforce foreign key constraints between related tables
3. **Transaction Support**: Provide ACID guarantees for multi-step operations
4. **Indexing**: Optimize query performance through appropriate indexes
5. **Constraints**: Enforce data type, uniqueness, and not-null constraints

## Components and Interfaces

### Frontend Components

#### Authentication Components
- **LoginForm**: Captures username/password, calls `/api/auth/login`
- **AuthContext**: Stores authentication token and user role, provides to all components

#### Inventory Components
- **BatchList**: Displays all batches with filtering, calls `/api/batches`
- **BatchForm**: Creates new batches, calls `POST /api/batches`
- **InventoryReport**: Shows inventory status and value, calls `/api/reports/inventory`

#### Sales Components
- **SalesOrderForm**: Creates sales orders with line items, calls `POST /api/sales-orders`
- **SalesOrderList**: Displays sales orders with filters, calls `/api/sales-orders`
- **SalesOrderDetail**: Shows individual order with profit, calls `/api/sales-orders/:id`

#### Profit Components
- **MonthlySummary**: Displays profit for selected month, calls `/api/reports/monthly-profit`
- **ProfitShareHistory**: Lists all profit distributions, calls `/api/profit-shares`
- **ProfitShareDetail**: Shows specific distribution details, calls `/api/profit-shares/:id`

#### Admin Components
- **UserManagement**: Creates and manages user accounts, calls `/api/users`

### Backend API Endpoints

#### Authentication Endpoints
- `POST /api/auth/login`: Authenticate user, return token and role
- `POST /api/auth/logout`: Invalidate authentication token

#### User Management Endpoints (Admin only)
- `POST /api/users`: Create new user account
- `GET /api/users`: List all users
- `PUT /api/users/:id`: Update user details
- `DELETE /api/users/:id`: Delete user account

#### Batch Management Endpoints (Admin only)
- `POST /api/batches`: Create new inventory batch
- `GET /api/batches`: List all batches with optional filters
- `GET /api/batches/:id`: Get specific batch details
- `PUT /api/batches/:id`: Update batch details (limited fields)
- `DELETE /api/batches/:id`: Delete batch (only if not referenced)

#### Sales Order Endpoints
- `POST /api/sales-orders`: Create new sales order (Admin and Staff)
- `GET /api/sales-orders`: List sales orders with filters (Admin only)
- `GET /api/sales-orders/:id`: Get specific order details (Admin only)
- `DELETE /api/sales-orders/:id`: Delete unlocked order (Admin only)

#### Profit Share Endpoints (Admin only)
- `GET /api/profit-shares`: List all profit distributions
- `GET /api/profit-shares/:id`: Get specific distribution details
- `POST /api/profit-shares/execute`: Manually trigger profit split (for testing)

#### Report Endpoints (Admin only)
- `GET /api/reports/inventory`: Get inventory status report
- `GET /api/reports/monthly-profit`: Get profit summary for specific month

### Backend Services

#### AuthService
- `authenticate(username, password)`: Validate credentials, return token
- `hashPassword(password)`: Hash password using bcrypt
- `verifyToken(token)`: Validate authentication token
- `generateToken(userId, role)`: Create JWT token

#### BatchService
- `createBatch(data)`: Validate and create new batch
- `getBatches(filters)`: Retrieve batches with optional filtering
- `getBatchById(id)`: Get specific batch
- `updateBatch(id, data)`: Update allowed batch fields
- `deleteBatch(id)`: Delete batch if not referenced
- `checkBatchAvailability(batchId, quantity)`: Verify sufficient stock

#### SalesOrderService
- `createSalesOrder(data)`: Create order, calculate profit, deduct stock atomically
- `getSalesOrders(filters)`: Retrieve orders with filtering
- `getSalesOrderById(id)`: Get specific order with line items
- `deleteSalesOrder(id)`: Delete unlocked order
- `calculateOrderProfit(lineItems)`: Compute total profit
- `validateOrderLineItems(lineItems)`: Check batch existence and availability

#### ProfitShareService
- `executeProfitSplit(month, year)`: Calculate and distribute profit for specified month
- `getProfitShares()`: Retrieve all profit distributions
- `getProfitShareById(id)`: Get specific distribution
- `checkIfAlreadyExecuted(month, year)`: Prevent duplicate splits
- `lockSalesOrders(month, year)`: Mark orders as locked after split

#### ReportService
- `generateInventoryReport(filters)`: Compile inventory status
- `generateMonthlyProfitSummary(month, year)`: Calculate monthly profit

#### SchedulerService
- `initializeScheduler()`: Set up cron job for 24th of each month
- `executeDailyCheck()`: Check if profit split should run

## Data Models

### Database Schema (Prisma)

#### Table: User
Stores user accounts with authentication credentials and role-based access control.

**Fields:**
- `id` (INT, PRIMARY KEY, AUTO_INCREMENT): Unique user identifier
- `username` (VARCHAR(50), UNIQUE, NOT NULL): Login username
- `password` (VARCHAR(255), NOT NULL): Bcrypt hashed password
- `role` (ENUM('ADMIN', 'STAFF'), NOT NULL): User role for authorization
- `createdAt` (DATETIME, NOT NULL, DEFAULT CURRENT_TIMESTAMP): Account creation timestamp
- `updatedAt` (DATETIME, NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP): Last update timestamp

**Indexes:**
- PRIMARY KEY: `id`
- UNIQUE INDEX: `username`

**Relationships:**
- None (users don't directly relate to other tables in this design)

---

#### Table: Batch (Stock)
Stores inventory batches with purchase information and current quantity tracking.

**Fields:**
- `id` (INT, PRIMARY KEY, AUTO_INCREMENT): Unique batch identifier
- `batchIdentifier` (VARCHAR(100), UNIQUE, NOT NULL): Business batch/lot number
- `productName` (VARCHAR(255), NOT NULL): Name of the cannabis product
- `purchaseDate` (DATE, NOT NULL): Date batch was purchased
- `purchasePricePerUnit` (DECIMAL(10,2), NOT NULL): Cost per unit (immutable)
- `initialQuantity` (INT, NOT NULL): Original quantity received
- `currentQuantity` (INT, NOT NULL): Remaining quantity in stock
- `createdAt` (DATETIME, NOT NULL, DEFAULT CURRENT_TIMESTAMP): Record creation timestamp
- `updatedAt` (DATETIME, NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP): Last update timestamp

**Constraints:**
- `purchasePricePerUnit` >= 0
- `initialQuantity` > 0
- `currentQuantity` >= 0
- `currentQuantity` <= `initialQuantity`

**Indexes:**
- PRIMARY KEY: `id`
- UNIQUE INDEX: `batchIdentifier`
- INDEX: `productName` (for filtering inventory reports)
- INDEX: `purchaseDate` (for date-based queries)

**Relationships:**
- One-to-Many with `SalesOrderLineItem` (one batch can be referenced by many line items)

---

#### Table: SalesOrder (Orders)
Stores sales transaction headers with calculated profit and lock status.

**Fields:**
- `id` (INT, PRIMARY KEY, AUTO_INCREMENT): Unique order identifier
- `orderDate` (DATETIME, NOT NULL, DEFAULT CURRENT_TIMESTAMP): Transaction timestamp
- `customerName` (VARCHAR(255), NULL): Optional customer name
- `totalProfit` (DECIMAL(10,2), NOT NULL): Calculated total profit for the order
- `isLocked` (BOOLEAN, NOT NULL, DEFAULT FALSE): Lock status (true after profit sharing)
- `createdAt` (DATETIME, NOT NULL, DEFAULT CURRENT_TIMESTAMP): Record creation timestamp
- `updatedAt` (DATETIME, NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP): Last update timestamp

**Constraints:**
- `totalProfit` can be negative (loss) or positive (profit)

**Indexes:**
- PRIMARY KEY: `id`
- INDEX: `orderDate` (for monthly profit calculations and date range queries)
- INDEX: `isLocked` (for filtering unlocked orders during profit split)
- COMPOSITE INDEX: `(orderDate, isLocked)` (optimizes profit split queries)

**Relationships:**
- One-to-Many with `SalesOrderLineItem` (one order contains many line items)

---

#### Table: SalesOrderLineItem (OrderItem)
Stores individual line items within sales orders, linking orders to specific batches.

**Fields:**
- `id` (INT, PRIMARY KEY, AUTO_INCREMENT): Unique line item identifier
- `salesOrderId` (INT, FOREIGN KEY, NOT NULL): Reference to parent sales order
- `batchId` (INT, FOREIGN KEY, NOT NULL): Reference to inventory batch
- `quantitySold` (INT, NOT NULL): Quantity sold in this line item
- `sellingPricePerUnit` (DECIMAL(10,2), NOT NULL): Selling price per unit
- `lineProfit` (DECIMAL(10,2), NOT NULL): Calculated profit for this line item

**Constraints:**
- `quantitySold` > 0
- `sellingPricePerUnit` >= 0
- `lineProfit` = (`sellingPricePerUnit` - `batch.purchasePricePerUnit`) × `quantitySold`

**Indexes:**
- PRIMARY KEY: `id`
- INDEX: `salesOrderId` (for retrieving all items in an order)
- INDEX: `batchId` (for tracking which batches are referenced)
- FOREIGN KEY: `salesOrderId` REFERENCES `SalesOrder(id)` ON DELETE CASCADE
- FOREIGN KEY: `batchId` REFERENCES `Batch(id)` ON DELETE RESTRICT

**Relationships:**
- Many-to-One with `SalesOrder` (many line items belong to one order)
- Many-to-One with `Batch` (many line items can reference one batch)

**Notes:**
- ON DELETE CASCADE: When an order is deleted, all its line items are automatically deleted
- ON DELETE RESTRICT: Batches cannot be deleted if referenced by any line items

---

#### Table: ProfitShare
Stores monthly profit distribution records with immutable historical data.

**Fields:**
- `id` (INT, PRIMARY KEY, AUTO_INCREMENT): Unique profit share identifier
- `month` (INT, NOT NULL): Month number (1-12)
- `year` (INT, NOT NULL): Year (e.g., 2024)
- `totalProfit` (DECIMAL(10,2), NOT NULL): Total profit for the month
- `amountPerOwner` (DECIMAL(10,2), NOT NULL): Amount distributed to each owner (50% of total)
- `executionDate` (DATETIME, NOT NULL, DEFAULT CURRENT_TIMESTAMP): When profit split was executed
- `createdAt` (DATETIME, NOT NULL, DEFAULT CURRENT_TIMESTAMP): Record creation timestamp

**Constraints:**
- `month` BETWEEN 1 AND 12
- `year` >= 2020
- `amountPerOwner` = `totalProfit` / 2
- UNIQUE constraint on (`month`, `year`) to prevent duplicate splits

**Indexes:**
- PRIMARY KEY: `id`
- UNIQUE INDEX: `(month, year)` (ensures one profit split per month)
- INDEX: `executionDate` (for ordering profit share history)

**Relationships:**
- None (profit shares are aggregate records, not directly linked to individual orders)

**Notes:**
- Records are immutable once created (no updates or deletes allowed)
- When a profit share is created, all sales orders from that month are locked

---

### Prisma Schema Definition

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

model User {
  id        Int      @id @default(autoincrement())
  username  String   @unique @db.VarChar(50)
  password  String   @db.VarChar(255)
  role      Role
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

enum Role {
  ADMIN
  STAFF
}

model Batch {
  id                   Int                    @id @default(autoincrement())
  batchIdentifier      String                 @unique @db.VarChar(100)
  productName          String                 @db.VarChar(255)
  purchaseDate         DateTime               @db.Date
  purchasePricePerUnit Decimal                @db.Decimal(10, 2)
  initialQuantity      Int
  currentQuantity      Int
  createdAt            DateTime               @default(now())
  updatedAt            DateTime               @updatedAt
  lineItems            SalesOrderLineItem[]
  
  @@index([productName])
  @@index([purchaseDate])
  @@index([batchIdentifier])
}

model SalesOrder {
  id           Int                    @id @default(autoincrement())
  orderDate    DateTime               @default(now())
  customerName String?                @db.VarChar(255)
  totalProfit  Decimal                @db.Decimal(10, 2)
  isLocked     Boolean                @default(false)
  createdAt    DateTime               @default(now())
  updatedAt    DateTime               @updatedAt
  lineItems    SalesOrderLineItem[]
  
  @@index([orderDate])
  @@index([isLocked])
  @@index([orderDate, isLocked])
}

model SalesOrderLineItem {
  id                  Int         @id @default(autoincrement())
  salesOrderId        Int
  batchId             Int
  quantitySold        Int
  sellingPricePerUnit Decimal     @db.Decimal(10, 2)
  lineProfit          Decimal     @db.Decimal(10, 2)
  salesOrder          SalesOrder  @relation(fields: [salesOrderId], references: [id], onDelete: Cascade)
  batch               Batch       @relation(fields: [batchId], references: [id], onDelete: Restrict)
  
  @@index([salesOrderId])
  @@index([batchId])
}

model ProfitShare {
  id             Int      @id @default(autoincrement())
  month          Int
  year           Int
  totalProfit    Decimal  @db.Decimal(10, 2)
  amountPerOwner Decimal  @db.Decimal(10, 2)
  executionDate  DateTime @default(now())
  createdAt      DateTime @default(now())
  
  @@unique([month, year])
  @@index([executionDate])
}
```

### Database Relationships Diagram

```mermaid
erDiagram
    User {
        int id PK
        string username UK
        string password
        enum role
        datetime createdAt
        datetime updatedAt
    }
    
    Batch {
        int id PK
        string batchIdentifier UK
        string productName
        date purchaseDate
        decimal purchasePricePerUnit
        int initialQuantity
        int currentQuantity
        datetime createdAt
        datetime updatedAt
    }
    
    SalesOrder {
        int id PK
        datetime orderDate
        string customerName
        decimal totalProfit
        boolean isLocked
        datetime createdAt
        datetime updatedAt
    }
    
    SalesOrderLineItem {
        int id PK
        int salesOrderId FK
        int batchId FK
        int quantitySold
        decimal sellingPricePerUnit
        decimal lineProfit
    }
    
    ProfitShare {
        int id PK
        int month
        int year
        decimal totalProfit
        decimal amountPerOwner
        datetime executionDate
        datetime createdAt
    }
    
    SalesOrder ||--o{ SalesOrderLineItem : "contains"
    Batch ||--o{ SalesOrderLineItem : "referenced by"
```

### Data Flow Diagrams

#### Stock Receiving Flow
```mermaid
sequenceDiagram
    participant Admin
    participant Frontend
    participant API
    participant BatchService
    participant Database
    
    Admin->>Frontend: Enter batch details
    Frontend->>API: POST /api/batches
    API->>BatchService: createBatch(data)
    BatchService->>Database: Validate unique batchIdentifier
    Database-->>BatchService: Validation result
    BatchService->>Database: Insert batch record
    Database-->>BatchService: Batch created
    BatchService-->>API: Return batch object
    API-->>Frontend: 201 Created
    Frontend-->>Admin: Display success message
```

#### Sales Order Flow
```mermaid
sequenceDiagram
    participant Staff
    participant Frontend
    participant API
    participant SalesOrderService
    participant BatchService
    participant Database
    
    Staff->>Frontend: Enter order details
    Frontend->>API: POST /api/sales-orders
    API->>SalesOrderService: createSalesOrder(data)
    SalesOrderService->>BatchService: validateLineItems(items)
    BatchService->>Database: Check batch existence & quantity
    Database-->>BatchService: Validation result
    BatchService-->>SalesOrderService: Valid/Invalid
    
    alt Valid Order
        SalesOrderService->>Database: BEGIN TRANSACTION
        SalesOrderService->>Database: Calculate profit
        SalesOrderService->>Database: Create sales order
        SalesOrderService->>Database: Create line items
        SalesOrderService->>Database: Deduct batch quantities
        SalesOrderService->>Database: COMMIT TRANSACTION
        Database-->>SalesOrderService: Order created
        SalesOrderService-->>API: Return order object
        API-->>Frontend: 201 Created
        Frontend-->>Staff: Display success
    else Invalid Order
        SalesOrderService-->>API: Validation errors
        API-->>Frontend: 400 Bad Request
        Frontend-->>Staff: Display errors
    end
```

#### Profit Sharing Flow
```mermaid
sequenceDiagram
    participant Scheduler
    participant ProfitShareService
    participant Database
    
    Scheduler->>ProfitShareService: executeDailyCheck()
    
    alt Is 24th of month
        ProfitShareService->>Database: Check if already executed
        Database-->>ProfitShareService: Not executed
        ProfitShareService->>Database: Get previous month's unlocked orders
        Database-->>ProfitShareService: Sales orders
        ProfitShareService->>ProfitShareService: Calculate total profit
        ProfitShareService->>ProfitShareService: Divide by 2
        ProfitShareService->>Database: BEGIN TRANSACTION
        ProfitShareService->>Database: Create profit share record
        ProfitShareService->>Database: Lock previous month's orders
        ProfitShareService->>Database: COMMIT TRANSACTION
        Database-->>ProfitShareService: Success
    else Not 24th or already executed
        ProfitShareService->>Scheduler: Skip
    end
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: User account data persistence
*For any* valid user account data (username, password, role), when an admin creates the account, retrieving that account should return the same username and role, with the password properly hashed (not stored in plaintext).
**Validates: Requirements 1.1**

### Property 2: Valid authentication succeeds
*For any* valid user credentials (username and password that match an existing account), authentication should succeed and return the correct user role.
**Validates: Requirements 1.2**

### Property 3: Invalid authentication fails
*For any* invalid credentials (non-existent username or incorrect password), authentication should fail and return an error.
**Validates: Requirements 1.3**

### Property 4: Staff authorization enforcement
*For any* admin-only API endpoint, when a Staff user attempts to access it, the system should deny access and return an authorization error.
**Validates: Requirements 1.4**

### Property 5: Batch data persistence
*For any* valid batch data (product name, batch identifier, purchase date, purchase price, initial quantity), when an admin creates the batch, retrieving that batch should return all fields with matching values.
**Validates: Requirements 2.1**

### Property 6: Batch initial quantity invariant
*For any* newly created batch, the current quantity should equal the initial quantity.
**Validates: Requirements 2.3**

### Property 7: Batch immutability
*For any* existing batch, attempts to modify the purchase price or purchase date should be rejected, and those fields should remain unchanged.
**Validates: Requirements 2.4**

### Property 8: Batch inventory response completeness
*For any* batch in the inventory, the API response should include product name, batch identifier, current quantity, and purchase price.
**Validates: Requirements 2.5**

### Property 9: Sales order data persistence
*For any* valid sales order data (order date, customer name, line items), when created, retrieving that order should return all fields with matching values.
**Validates: Requirements 3.1**

### Property 10: Batch existence validation
*For any* sales order containing non-existent batch identifiers, the system should reject the order and return a validation error.
**Validates: Requirements 3.2**

### Property 11: Stock availability validation
*For any* sales order where the quantity sold exceeds the current quantity in any referenced batch, the system should reject the order and return a validation error.
**Validates: Requirements 3.3**

### Property 12: Order identifier uniqueness
*For any* set of successfully created sales orders, all order identifiers should be unique.
**Validates: Requirements 3.5**

### Property 13: Stock deduction accuracy
*For any* successfully created sales order, each referenced batch's current quantity should decrease by exactly the quantity sold in the order.
**Validates: Requirements 4.1**

### Property 14: Transaction atomicity
*For any* sales order operation, if any part of the transaction fails (validation, stock deduction, or record creation), all changes should be rolled back and no partial updates should persist.
**Validates: Requirements 4.4, 11.1**

### Property 15: Line item profit calculation
*For any* sales order line item, the line profit should equal (selling price per unit - purchase price per unit) × quantity sold, where purchase price comes from the referenced batch.
**Validates: Requirements 5.1**

### Property 16: Order total profit calculation
*For any* sales order, the total profit should equal the sum of all line item profits.
**Validates: Requirements 5.2**

### Property 17: Profit in order response
*For any* sales order retrieved via API, the response should include the calculated total profit.
**Validates: Requirements 5.4**

### Property 18: Monthly profit aggregation
*For any* month and year, the monthly profit summary should equal the sum of total profits from all sales orders with order dates within that calendar month.
**Validates: Requirements 6.1**

### Property 19: Monthly summary response completeness
*For any* monthly profit summary, the response should include total profit, number of orders, and the date range (month/year).
**Validates: Requirements 6.2**

### Property 20: Profit split calculation
*For any* executed profit split, the system should calculate total profit from all unlocked sales orders in the specified month, create two profit share records, and each record's amount should equal exactly 50% of the total profit.
**Validates: Requirements 7.1, 7.2**

### Property 21: Profit split idempotency
*For any* month and year, if a profit split has already been executed, attempting to execute another split for the same month should be rejected.
**Validates: Requirements 7.5**

### Property 22: Sales order locking on profit split
*For any* executed profit split for a given month, all sales orders from that month should have their isLocked flag set to true.
**Validates: Requirements 8.1**

### Property 23: Locked order immutability
*For any* locked sales order, attempts to modify order details, quantities, or prices should be rejected and the order should remain unchanged.
**Validates: Requirements 8.2**

### Property 24: Locked order deletion prevention
*For any* locked sales order, attempts to delete the order should be rejected and the order should remain in the database.
**Validates: Requirements 8.3**

### Property 25: Profit share response completeness
*For any* profit share record retrieved via API, the response should include execution date, month, year, total profit, and amount per owner.
**Validates: Requirements 9.1**

### Property 26: Profit share ordering
*For any* list of profit share records, they should be ordered by execution date in descending order (most recent first).
**Validates: Requirements 9.2**

### Property 27: Profit share immutability
*For any* profit share record, attempts to modify or delete it should be rejected and the record should remain unchanged.
**Validates: Requirements 9.4**

### Property 28: Inventory report response completeness
*For any* batch in an inventory report, the response should include product name, batch identifier, current quantity, and purchase price.
**Validates: Requirements 10.1**

### Property 29: Inventory value calculation
*For any* inventory report, the total inventory value should equal the sum of (current quantity × purchase price) for all batches.
**Validates: Requirements 10.2**

### Property 30: Inventory filtering
*For any* inventory report filtered by product name, all returned batches should have a product name matching the filter, and no batches with non-matching product names should be included.
**Validates: Requirements 10.3**

### Property 31: Depleted batch identification
*For any* batch with current quantity equal to zero, the inventory report should mark it as depleted.
**Validates: Requirements 10.4**

### Property 32: Inventory report ordering
*For any* inventory report, batches should be ordered first by product name, then by batch identifier.
**Validates: Requirements 10.5**

### Property 33: Batch deletion prevention
*For any* batch that is referenced by at least one sales order line item, attempts to delete the batch should be rejected and the batch should remain in the database.
**Validates: Requirements 11.3**

### Property 34: Monetary value validation
*For any* input containing monetary values (purchase price, selling price), if the value is negative, the system should reject the input and return a validation error.
**Validates: Requirements 11.4**

### Property 35: Quantity value validation
*For any* input containing quantity values (initial quantity, current quantity, quantity sold), if the value is not a positive integer, the system should reject the input and return a validation error.
**Validates: Requirements 11.5**

### Property 36: Password hashing
*For any* user account, the stored password should be a hash (not plaintext), and the hash should be verifiable against the original password using the hashing algorithm.
**Validates: Requirements 14.1**

## Error Handling

### Error Categories

1. **Validation Errors (400 Bad Request)**
   - Invalid input format
   - Missing required fields
   - Duplicate unique identifiers
   - Insufficient stock
   - Non-existent batch references
   - Negative monetary values
   - Invalid quantity values

2. **Authentication Errors (401 Unauthorized)**
   - Invalid credentials
   - Missing authentication token
   - Expired token

3. **Authorization Errors (403 Forbidden)**
   - Staff user accessing admin-only endpoints
   - Attempting to modify locked records

4. **Not Found Errors (404 Not Found)**
   - Requested resource does not exist

5. **Conflict Errors (409 Conflict)**
   - Duplicate profit split for same month
   - Attempting to delete referenced batch

6. **Server Errors (500 Internal Server Error)**
   - Database connection failures
   - Unexpected exceptions
   - Transaction rollback failures

### Error Response Format

All error responses follow a consistent JSON structure:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": [
      {
        "field": "fieldName",
        "message": "Specific field error"
      }
    ]
  }
}
```

### Error Handling Strategy

1. **Input Validation**: Validate all inputs at the API layer before processing
2. **Business Logic Validation**: Check business rules (stock availability, locked status) before database operations
3. **Transaction Management**: Wrap multi-step operations in database transactions with automatic rollback on failure
4. **Error Logging**: Log all errors with context (user, timestamp, request details) for debugging
5. **User-Friendly Messages**: Return descriptive error messages without exposing sensitive system details
6. **Graceful Degradation**: Handle partial failures without corrupting data state

## Testing Strategy

### Unit Testing

The system will use **Jest** as the testing framework for both frontend and backend unit tests.

**Backend Unit Tests:**
- Service layer functions (AuthService, BatchService, SalesOrderService, etc.)
- Validation functions for input data
- Calculation functions (profit calculation, inventory valuation)
- Middleware functions (authentication, authorization)
- Database query functions (using Prisma)

**Frontend Unit Tests:**
- React component rendering
- Form validation logic
- State management functions
- API client functions
- Utility functions

**Unit Test Coverage:**
- Specific examples demonstrating correct behavior
- Edge cases (empty inputs, boundary values, zero quantities)
- Error conditions (invalid inputs, missing data)
- Integration points between components

### Property-Based Testing

The system will use **fast-check** as the property-based testing library for JavaScript/TypeScript.

**Property-Based Testing Configuration:**
- Each property test will run a minimum of 100 iterations
- Each property test will be tagged with a comment referencing the design document property
- Tag format: `// Feature: cannabis-shop-management, Property {number}: {property_text}`

**Property Test Coverage:**
- Each correctness property from the design document will be implemented as a single property-based test
- Properties will test universal behaviors across randomly generated inputs
- Properties will verify invariants, calculations, and data transformations
- Properties will validate that business rules hold for all valid inputs

**Example Property Test Structure:**

```typescript
// Feature: cannabis-shop-management, Property 13: Stock deduction accuracy
test('stock deduction reduces batch quantity by exact amount sold', () => {
  fc.assert(
    fc.property(
      fc.record({
        batchId: fc.integer({ min: 1 }),
        initialQuantity: fc.integer({ min: 10, max: 1000 }),
        quantitySold: fc.integer({ min: 1, max: 9 })
      }),
      async ({ batchId, initialQuantity, quantitySold }) => {
        // Create batch with initialQuantity
        // Create sales order selling quantitySold
        // Verify batch.currentQuantity === initialQuantity - quantitySold
      }
    ),
    { numRuns: 100 }
  );
});
```

### Integration Testing

- API endpoint testing with real database (test database)
- End-to-end workflows (create batch → create order → verify stock deduction)
- Authentication and authorization flows
- Scheduled job testing (profit split automation)

### Test Database Strategy

- Use separate test database instance
- Reset database state before each test suite
- Use Prisma migrations for test database schema
- Seed test data as needed for specific tests

## Security Considerations

### Authentication
- Passwords hashed using bcrypt with salt rounds = 10
- JWT tokens for session management
- Token expiration: 24 hours
- Secure token storage in HTTP-only cookies (production)

### Authorization
- Role-based access control (RBAC) enforced at API layer
- Middleware validates user role before executing protected endpoints
- Admin-only endpoints: user management, batch management, reports, profit shares
- Staff-accessible endpoints: sales order creation

### Input Validation
- All inputs validated and sanitized before processing
- Prisma ORM provides protection against SQL injection
- Express validator middleware for request validation
- Type checking with TypeScript

### Data Protection
- Sensitive data (passwords) never logged
- Error messages sanitized to prevent information leakage
- HTTPS enforced in production
- Database credentials stored in environment variables

## Performance Considerations

### Database Optimization
- Indexes on frequently queried fields (batchIdentifier, orderDate, productName)
- Composite indexes for multi-field queries
- Connection pooling for database connections
- Query optimization using Prisma's query builder

### API Performance
- Pagination for list endpoints (default: 50 items per page)
- Response caching for read-heavy endpoints (inventory reports)
- Lazy loading for related data
- Compression middleware for API responses

### Frontend Performance
- Code splitting for React components
- Lazy loading of routes
- Memoization of expensive calculations
- Debouncing for search inputs

## Deployment Architecture

### Development Environment
- Frontend: React development server (port 3000)
- Backend: Node.js/Express server (port 5000)
- Database: MySQL local instance (port 3306)

### Production Environment
- Frontend: Static files served by Nginx or CDN
- Backend: Node.js/Express behind reverse proxy (Nginx)
- Database: MySQL managed service (AWS RDS, Google Cloud SQL, etc.)
- Process manager: PM2 for Node.js process management
- Scheduler: Node-cron for profit split automation

### Environment Variables

```
# Database
DATABASE_URL=mysql://user:password@host:port/database

# Authentication
JWT_SECRET=random_secret_key
JWT_EXPIRATION=24h
BCRYPT_ROUNDS=10

# Server
PORT=5000
NODE_ENV=production

# Frontend
REACT_APP_API_URL=https://api.example.com
```

## Future Enhancements (Out of Scope)

1. Multi-currency support
2. Customer relationship management (CRM)
3. Online payment gateway integration
4. Real-time POS hardware integration
5. Advanced analytics and reporting dashboards
6. Mobile application
7. Multi-location support
8. Supplier management
9. Purchase order automation
10. Barcode scanning integration
