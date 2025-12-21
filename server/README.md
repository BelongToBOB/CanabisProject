# Cannabis Shop Management System - Backend

A comprehensive backend API for managing cannabis inventory, sales orders, and automated profit sharing.

## Features

- Role-based authentication (Admin/Staff)
- Batch-level inventory management
- Sales order processing with automatic stock deduction
- Profit calculation and tracking
- Automated monthly profit sharing (50/50 split)
- Comprehensive reporting (inventory, monthly profits)

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MySQL
- **ORM**: Prisma
- **Authentication**: JWT + bcrypt

## Prerequisites

- Node.js (v18 or higher)
- MySQL (v8 or higher)
- npm or yarn

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy the example environment file and update with your configuration:

```bash
cp .env.example .env
```

Edit `.env` and set your database credentials and other configuration values.

### 3. Set Up Database

**Create MySQL Database:**

First, create a MySQL database for the application:

```sql
CREATE DATABASE cannabis_shop CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

**Update Database Connection:**

Edit your `.env` file and update the `DATABASE_URL` with your MySQL credentials:

```env
DATABASE_URL="mysql://username:password@localhost:3306/cannabis_shop"
```

**Run Migrations:**

Apply the database schema migrations:

```bash
npm run prisma:migrate
```

This will create all necessary tables, indexes, and foreign key constraints.

**Note:** The Prisma client has already been generated. If you make changes to the schema, regenerate it with:

```bash
npm run prisma:generate
```

### 4. Run the Application

**Development mode** (with auto-reload):
```bash
npm run dev
```

**Production mode**:
```bash
npm run build
npm start
```

## Project Structure

```
src/
├── controllers/    # Request handlers for API endpoints
├── services/       # Business logic layer
├── middleware/     # Authentication, authorization, validation
├── utils/          # Helper functions and utilities
└── index.ts        # Application entry point
```

## API Endpoints

The API will be available at `http://localhost:3000` (or your configured PORT).

Health check: `GET /health`

Additional endpoints will be documented as they are implemented.

## Environment Variables

See `.env.example` for all required environment variables.

## License

ISC
