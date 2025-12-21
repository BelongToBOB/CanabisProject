# Requirements Document

## Introduction

The Cannabis Shop Management System is a web-based application designed to manage cannabis inventory at the batch level, record sales transactions, automatically deduct stock, calculate profits, and distribute monthly earnings between two shop owners. The system provides role-based access for administrators and sales staff, with a focus on accurate inventory tracking, profit calculation, and automated profit-sharing functionality.

## Glossary

- **System**: The Cannabis Shop Management System
- **Batch**: A discrete quantity of cannabis product received from a supplier with unique identification, purchase price, and quantity
- **Sales Order**: A transaction record documenting products sold, quantities, prices, and calculated profit
- **Profit Share**: The automated monthly distribution of accumulated profits equally between two owners
- **Historical Data**: Sales orders, inventory transactions, and profit calculations that have been locked after profit distribution
- **Admin**: A user with full system access including inventory management, sales recording, and profit viewing
- **Staff**: A user with limited access to record sales orders only
- **Stock Deduction**: The automatic reduction of batch inventory quantities when a sales order is processed
- **Profit Calculation**: The computation of profit as the difference between selling price and cost of goods sold per batch
- **Lock Period**: The time frame after the 24th of each month when previous month's data becomes read-only

## Requirements

### Requirement 1

**User Story:** As an admin, I want to manage user accounts with role-based access, so that I can control who can perform specific operations in the system.

#### Acceptance Criteria

1. WHEN an admin creates a new user account, THE System SHALL store the username, password hash, and assigned role (Admin or Staff)
2. WHEN a user attempts to log in with valid credentials, THE System SHALL authenticate the user and grant access based on their assigned role
3. WHEN a user attempts to log in with invalid credentials, THE System SHALL reject the authentication and return an error message
4. WHEN a Staff user attempts to access admin-only features, THE System SHALL deny access and return an authorization error
5. THE System SHALL enforce that all administrative operations require Admin role privileges

### Requirement 2

**User Story:** As an admin, I want to add cannabis products to inventory by batch, so that I can track stock with accurate cost and quantity information.

#### Acceptance Criteria

1. WHEN an admin creates a new batch, THE System SHALL store the product name, batch identifier, purchase date, purchase price per unit, and initial quantity
2. WHEN an admin creates a batch with a duplicate batch identifier, THE System SHALL reject the operation and return a validation error
3. WHEN a batch is created, THE System SHALL initialize the current quantity equal to the initial quantity
4. THE System SHALL maintain batch records with immutable purchase price and purchase date values
5. WHEN an admin views batch inventory, THE System SHALL display all batches with current quantities, purchase prices, and batch identifiers

### Requirement 3

**User Story:** As a staff member, I want to record sales orders with product details and quantities, so that customer purchases are documented in the system.

#### Acceptance Criteria

1. WHEN a staff member creates a sales order, THE System SHALL store the order date, customer name (optional), line items with batch identifier, quantity sold, and selling price per unit
2. WHEN a sales order is created, THE System SHALL validate that all specified batches exist in inventory
3. WHEN a sales order is created, THE System SHALL validate that sufficient quantity exists in each specified batch
4. WHEN a sales order contains invalid batch identifiers or insufficient quantities, THE System SHALL reject the order and return validation errors
5. THE System SHALL assign a unique order identifier to each successfully created sales order

### Requirement 4

**User Story:** As an admin, I want the system to automatically deduct sold quantities from batch inventory, so that stock levels remain accurate without manual updates.

#### Acceptance Criteria

1. WHEN a sales order is successfully created, THE System SHALL reduce the current quantity of each affected batch by the quantity sold
2. WHEN multiple line items in a sales order reference the same batch, THE System SHALL deduct the total combined quantity from that batch
3. WHEN stock deduction would result in negative inventory, THE System SHALL reject the sales order before any deductions occur
4. THE System SHALL execute all stock deductions for a sales order as an atomic transaction
5. WHEN a stock deduction fails, THE System SHALL roll back all changes and return an error without partially updating inventory

### Requirement 5

**User Story:** As an admin, I want the system to calculate profit for each sales order, so that I can track earnings accurately per transaction.

#### Acceptance Criteria

1. WHEN a sales order is created, THE System SHALL calculate profit for each line item as (selling price per unit minus purchase price per unit) multiplied by quantity sold
2. WHEN a sales order is created, THE System SHALL calculate total order profit as the sum of all line item profits
3. THE System SHALL store the calculated profit with each sales order record
4. WHEN an admin views a sales order, THE System SHALL display the calculated profit alongside order details
5. THE System SHALL use the purchase price from the specific batch referenced in each line item for profit calculations

### Requirement 6

**User Story:** As an admin, I want to view monthly profit summaries, so that I can understand business performance over time.

#### Acceptance Criteria

1. WHEN an admin requests a monthly profit summary for a specific month and year, THE System SHALL calculate total profit from all sales orders within that month
2. WHEN an admin requests a monthly profit summary, THE System SHALL display the total profit, number of orders, and date range
3. THE System SHALL determine monthly boundaries based on calendar months (1st to last day of month)
4. WHEN no sales orders exist for a requested month, THE System SHALL return a summary with zero profit and zero orders
5. THE System SHALL allow admins to view profit summaries for any historical month

### Requirement 7

**User Story:** As an admin, I want the system to automatically split monthly profit 50/50 between two owners on the 24th of each month, so that profit distribution is consistent and automated.

#### Acceptance Criteria

1. WHEN the system date reaches the 24th day of any month, THE System SHALL calculate total profit from all unlocked sales orders in the previous month
2. WHEN the monthly profit split is executed, THE System SHALL create two profit share records with equal amounts (50% each) for the two owners
3. WHEN the monthly profit split is executed, THE System SHALL store the profit share date, amount per owner, and month/year reference
4. THE System SHALL execute the profit split process automatically without manual intervention
5. WHEN a profit split has already been executed for a given month, THE System SHALL prevent duplicate profit splits for that same month

### Requirement 8

**User Story:** As an admin, I want historical sales data to be locked after profit sharing, so that past financial records cannot be altered.

#### Acceptance Criteria

1. WHEN a monthly profit split is executed, THE System SHALL mark all sales orders from that month as locked
2. WHEN a sales order is locked, THE System SHALL prevent any modifications to the order details, quantities, or prices
3. WHEN a sales order is locked, THE System SHALL prevent deletion of the order record
4. WHEN an admin attempts to modify or delete a locked sales order, THE System SHALL reject the operation and return an error
5. THE System SHALL allow viewing of locked sales orders without restrictions

### Requirement 9

**User Story:** As an admin, I want to view profit share history, so that I can verify past distributions and maintain financial transparency.

#### Acceptance Criteria

1. WHEN an admin requests profit share history, THE System SHALL display all historical profit splits with date, month/year, and amount per owner
2. THE System SHALL order profit share history by date in descending order (most recent first)
3. WHEN an admin views a specific profit share record, THE System SHALL display the associated month's total profit and individual owner shares
4. THE System SHALL maintain profit share records as immutable historical data
5. WHEN an admin attempts to modify or delete a profit share record, THE System SHALL reject the operation and return an error

### Requirement 10

**User Story:** As an admin, I want to generate reports on inventory status, so that I can monitor stock levels and identify low inventory situations.

#### Acceptance Criteria

1. WHEN an admin requests an inventory report, THE System SHALL display all batches with product name, batch identifier, current quantity, and purchase price
2. THE System SHALL calculate total inventory value as the sum of (current quantity multiplied by purchase price) for all batches
3. WHEN an admin filters the inventory report by product name, THE System SHALL display only batches matching the specified product
4. THE System SHALL identify batches with zero current quantity and mark them as depleted
5. THE System SHALL order inventory reports by product name and batch identifier

### Requirement 11

**User Story:** As a system, I want to maintain data integrity across all operations, so that financial and inventory records remain accurate and consistent.

#### Acceptance Criteria

1. WHEN any database operation fails, THE System SHALL roll back all changes within that transaction
2. THE System SHALL enforce referential integrity between sales order line items and batch records
3. THE System SHALL prevent deletion of batches that are referenced by any sales order
4. THE System SHALL validate all monetary values to ensure they are non-negative
5. THE System SHALL validate all quantity values to ensure they are positive integers

### Requirement 12

**User Story:** As an admin, I want the system to provide clear error messages, so that I can understand and resolve issues quickly.

#### Acceptance Criteria

1. WHEN a validation error occurs, THE System SHALL return a descriptive error message indicating the specific validation failure
2. WHEN an authorization error occurs, THE System SHALL return a message indicating insufficient permissions
3. WHEN a database error occurs, THE System SHALL return a generic error message without exposing sensitive system details
4. THE System SHALL log all errors with timestamps and user context for debugging purposes
5. WHEN multiple validation errors occur, THE System SHALL return all error messages in a structured format

## Non-Functional Requirements

### Requirement 13

**User Story:** As a system architect, I want clear separation between frontend and backend, so that the system is maintainable and scalable.

#### Acceptance Criteria

1. THE System SHALL implement the frontend using ReactJS as a single-page application
2. THE System SHALL implement the backend using Node.js with Express framework
3. THE System SHALL communicate between frontend and backend exclusively through RESTful API endpoints
4. THE System SHALL use MySQL as the database management system
5. THE System SHALL use Prisma ORM for all database operations in the backend

### Requirement 14

**User Story:** As a developer, I want the system to follow security best practices, so that sensitive data is protected.

#### Acceptance Criteria

1. THE System SHALL hash all user passwords using a secure hashing algorithm before storage
2. THE System SHALL implement authentication tokens for API requests
3. THE System SHALL validate and sanitize all user inputs to prevent injection attacks
4. THE System SHALL enforce HTTPS for all client-server communication in production
5. THE System SHALL implement role-based access control for all protected endpoints

### Requirement 15

**User Story:** As a user, I want the system to respond quickly to my actions, so that I can work efficiently.

#### Acceptance Criteria

1. WHEN a user submits a sales order, THE System SHALL process and respond within 2 seconds under normal load
2. WHEN a user requests an inventory report, THE System SHALL generate and return results within 3 seconds for up to 1000 batches
3. THE System SHALL handle at least 50 concurrent users without performance degradation
4. WHEN database queries are executed, THE System SHALL use appropriate indexes to optimize performance
5. THE System SHALL implement pagination for list views exceeding 100 records

## Business Rules

1. **Profit Split Date**: Profit sharing occurs automatically on the 24th day of each month for the previous month's sales
2. **Owner Distribution**: All profits are split exactly 50/50 between two owners with no exceptions
3. **Data Locking**: Once a month's profit has been distributed, all sales orders from that month become immutable
4. **Batch Tracking**: All inventory must be tracked at the batch level with unique identifiers
5. **FIFO Not Required**: The system does not enforce First-In-First-Out inventory management; staff can sell from any available batch
6. **No Partial Batches**: All quantities are tracked as whole units (integers), not fractional amounts
7. **Single Currency**: All monetary values are in a single currency (no multi-currency support)
8. **Two Owners Only**: The system is designed specifically for two owners and does not support variable ownership structures

## Assumptions

1. The system will be deployed on a server with reliable internet connectivity
2. Users will access the system through modern web browsers (Chrome, Firefox, Safari, Edge)
3. The shop operates in a jurisdiction where cannabis sales are legal and regulated
4. Staff members are trained on proper batch identification and sales recording procedures
5. The server's system clock is accurate and synchronized for automated profit sharing
6. Database backups are handled by external infrastructure (not part of this system)
7. The shop has a maximum of 10 concurrent users at any given time
8. Historical data retention is indefinite (no automatic archival or deletion)
9. Product names and batch identifiers are assigned by shop management (not generated by the system)
10. Customer information is optional and minimal (name only, no detailed customer management)
