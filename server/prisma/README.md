# Prisma Database Setup

This directory contains the Prisma schema and database migrations for the Cannabis Shop Management System.

## Prerequisites

Before running migrations, ensure you have:

1. **MySQL Server** installed and running (version 8.0 or higher recommended)
2. **Database created**: Create a database named `cannabis_shop` (or your preferred name)
3. **Environment variables configured**: Update the `.env` file in the project root with your MySQL credentials

## Environment Configuration

Update the `DATABASE_URL` in your `.env` file:

```env
DATABASE_URL="mysql://username:password@localhost:3306/cannabis_shop"
```

Replace:
- `username` with your MySQL username (e.g., `root`)
- `password` with your MySQL password
- `localhost:3306` with your MySQL host and port if different
- `cannabis_shop` with your database name if different

## Creating the Database

If you haven't created the database yet, connect to MySQL and run:

```sql
CREATE DATABASE cannabis_shop CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

## Running Migrations

Once your database is configured, run the migrations to create all tables:

```bash
npm run prisma:migrate
```

This will:
1. Apply all pending migrations to your database
2. Generate the Prisma Client
3. Create all tables with proper indexes and foreign keys

## Prisma Client

The Prisma Client has already been generated and is available at `node_modules/@prisma/client`.

To regenerate the client after schema changes:

```bash
npm run prisma:generate
```

## Database Schema

The schema includes the following models:

- **User**: User accounts with role-based access (Admin/Staff)
- **Batch**: Inventory batches with purchase information
- **SalesOrder**: Sales transaction headers
- **SalesOrderLineItem**: Individual line items in sales orders
- **ProfitShare**: Monthly profit distribution records

## Useful Commands

- **Open Prisma Studio** (database GUI): `npm run prisma:studio`
- **Generate Prisma Client**: `npm run prisma:generate`
- **Create a new migration**: `npm run prisma:migrate`
- **Reset database** (⚠️ deletes all data): `npx prisma migrate reset`

## Troubleshooting

### Connection Issues

If you get authentication errors:
1. Verify your MySQL credentials in `.env`
2. Ensure MySQL server is running
3. Check that the database exists
4. Verify the user has proper permissions

### Migration Errors

If migrations fail:
1. Check that no other process is using the database
2. Ensure you have proper permissions to create/modify tables
3. Review the error message for specific SQL issues

## Next Steps

After successfully running migrations:
1. Optionally run the seed script to create initial data (when available)
2. Start the development server: `npm run dev`
3. The API will be available at `http://localhost:3000`
