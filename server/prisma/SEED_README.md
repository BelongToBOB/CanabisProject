# Database Seed Script

This seed script populates the database with initial data for testing and development purposes.

## What Gets Seeded

### Users (2)
- **Admin User**
  - Username: `admin`
  - Password: `admin123`
  - Role: ADMIN
  
- **Staff User**
  - Username: `staff`
  - Password: `staff123`
  - Role: STAFF

### Batches (5)
1. **BATCH-001** - Blue Dream
   - Purchase Date: 2024-01-15
   - Purchase Price: $8.50/unit
   - Initial Quantity: 100 units
   - Current Quantity: 75 units (after sales)

2. **BATCH-002** - OG Kush
   - Purchase Date: 2024-01-20
   - Purchase Price: $10.00/unit
   - Initial Quantity: 75 units
   - Current Quantity: 62 units (after sales)

3. **BATCH-003** - Sour Diesel
   - Purchase Date: 2024-02-01
   - Purchase Price: $9.25/unit
   - Initial Quantity: 120 units
   - Current Quantity: 100 units (after sales)

4. **BATCH-004** - Blue Dream
   - Purchase Date: 2024-02-10
   - Purchase Price: $8.75/unit
   - Initial Quantity: 80 units
   - Current Quantity: 68 units (after sales)

5. **BATCH-005** - Purple Haze
   - Purchase Date: 2024-02-15
   - Purchase Price: $11.00/unit
   - Initial Quantity: 60 units
   - Current Quantity: 53 units (after sales)

### Sales Orders (4)

#### Order 1 (January 25, 2024)
- Customer: John Doe
- Line Items:
  - 10 units of Blue Dream (BATCH-001) @ $15.00/unit → Profit: $65.00
  - 5 units of OG Kush (BATCH-002) @ $18.00/unit → Profit: $40.00
- **Total Profit: $105.00**

#### Order 2 (January 28, 2024)
- Customer: Jane Smith
- Line Items:
  - 15 units of Blue Dream (BATCH-001) @ $14.50/unit → Profit: $90.00
- **Total Profit: $90.00**

#### Order 3 (February 5, 2024)
- Customer: Bob Johnson
- Line Items:
  - 20 units of Sour Diesel (BATCH-003) @ $16.00/unit → Profit: $135.00
  - 8 units of OG Kush (BATCH-002) @ $17.50/unit → Profit: $60.00
- **Total Profit: $195.00**

#### Order 4 (February 12, 2024)
- Customer: Anonymous (null)
- Line Items:
  - 12 units of Blue Dream (BATCH-004) @ $15.50/unit → Profit: $81.00
  - 7 units of Purple Haze (BATCH-005) @ $19.00/unit → Profit: $56.00
- **Total Profit: $137.00**

## How to Run

### Prerequisites
1. Ensure your database is running (MySQL)
2. Configure your `.env` file with the correct `DATABASE_URL`
3. Run migrations: `npm run prisma:migrate`

### Running the Seed Script

```bash
# Option 1: Using npm script
npm run prisma:seed

# Option 2: Using Prisma CLI (runs automatically after migrations)
npx prisma db seed

# Option 3: Direct execution
npx ts-node prisma/seed.ts
```

## Important Notes

⚠️ **Warning**: This script will **DELETE ALL EXISTING DATA** before seeding. Use with caution in production environments.

The seed script:
1. Clears all existing data from all tables
2. Creates users with hashed passwords (using bcrypt)
3. Creates sample inventory batches
4. Creates sample sales orders with proper profit calculations
5. Updates batch quantities to reflect sales

## Testing Scenarios

The seeded data supports testing:
- User authentication (admin and staff roles)
- Batch inventory management
- Sales order creation with multiple line items
- Profit calculations
- Stock deduction
- Monthly profit reporting (January and February 2024)
- Customer name handling (including null/anonymous customers)

## Validation

After seeding, you can verify the data:

```bash
# Open Prisma Studio to view the data
npm run prisma:studio
```

Expected counts:
- Users: 2
- Batches: 5
- Sales Orders: 4
- Sales Order Line Items: 7
- Profit Shares: 0 (none created yet)
