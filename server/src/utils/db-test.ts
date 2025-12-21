/**
 * Database Connection Test
 * 
 * This script tests the Prisma client connection to the database.
 * Run this after setting up your database to verify the connection works.
 * 
 * Usage: npx ts-node src/utils/db-test.ts
 */

import { prisma } from './prisma';

async function testConnection() {
  try {
    console.log('Testing database connection...');
    
    // Try to connect to the database
    await prisma.$connect();
    console.log('✓ Successfully connected to the database');
    
    // Test a simple query
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✓ Database query successful:', result);
    
    // Check if tables exist (will fail if migrations haven't been run)
    try {
      const userCount = await prisma.user.count();
      console.log(`✓ User table exists (${userCount} users)`);
      
      const batchCount = await prisma.batch.count();
      console.log(`✓ Batch table exists (${batchCount} batches)`);
      
      const orderCount = await prisma.salesOrder.count();
      console.log(`✓ SalesOrder table exists (${orderCount} orders)`);
      
      const profitShareCount = await prisma.profitShare.count();
      console.log(`✓ ProfitShare table exists (${profitShareCount} profit shares)`);
      
      console.log('\n✓ All database tables are set up correctly!');
    } catch (error) {
      console.log('\n⚠ Tables do not exist yet. Please run migrations:');
      console.log('  npm run prisma:migrate');
    }
    
  } catch (error) {
    console.error('✗ Database connection failed:', error);
    console.log('\nPlease check:');
    console.log('1. MySQL server is running');
    console.log('2. Database credentials in .env are correct');
    console.log('3. Database "cannabis_shop" exists');
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
