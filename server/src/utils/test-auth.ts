/**
 * Simple test script to verify authentication functionality
 * Run with: ts-node src/utils/test-auth.ts
 */

import { AuthService } from '../services/auth.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testAuthentication() {
  console.log('Testing Authentication Service...\n');

  try {
    // Test 1: Password hashing
    console.log('Test 1: Password Hashing');
    const plainPassword = 'testpassword123';
    const hashedPassword = await AuthService.hashPassword(plainPassword);
    console.log(`✓ Password hashed successfully`);
    console.log(`  Plain: ${plainPassword}`);
    console.log(`  Hash: ${hashedPassword.substring(0, 30)}...`);

    // Test 2: Password comparison
    console.log('\nTest 2: Password Comparison');
    const isMatch = await AuthService.comparePassword(plainPassword, hashedPassword);
    console.log(`✓ Password comparison: ${isMatch ? 'MATCH' : 'NO MATCH'}`);

    const isWrongMatch = await AuthService.comparePassword('wrongpassword', hashedPassword);
    console.log(`✓ Wrong password comparison: ${isWrongMatch ? 'MATCH (ERROR!)' : 'NO MATCH (CORRECT)'}`);

    // Test 3: Token generation
    console.log('\nTest 3: JWT Token Generation');
    const token = AuthService.generateToken(1, 'testuser', 'ADMIN');
    console.log(`✓ Token generated successfully`);
    console.log(`  Token: ${token.substring(0, 50)}...`);

    // Test 4: Token verification
    console.log('\nTest 4: JWT Token Verification');
    const decoded = AuthService.verifyToken(token);
    console.log(`✓ Token verified successfully`);
    console.log(`  User ID: ${decoded.userId}`);
    console.log(`  Username: ${decoded.username}`);
    console.log(`  Role: ${decoded.role}`);

    // Test 5: Invalid token verification
    console.log('\nTest 5: Invalid Token Verification');
    try {
      AuthService.verifyToken('invalid.token.here');
      console.log('✗ Should have thrown an error for invalid token');
    } catch (error) {
      console.log(`✓ Invalid token rejected: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Test 6: Authenticate with valid credentials (admin user from seed)
    console.log('\nTest 6: Authenticate with Valid Credentials');
    const loginResult = await AuthService.authenticate('admin', 'admin123');
    console.log(`✓ Authentication successful`);
    console.log(`  User ID: ${loginResult.user.id}`);
    console.log(`  Username: ${loginResult.user.username}`);
    console.log(`  Role: ${loginResult.user.role}`);
    console.log(`  Token: ${loginResult.token.substring(0, 50)}...`);

    // Test 7: Authenticate with invalid credentials
    console.log('\nTest 7: Authenticate with Invalid Credentials');
    try {
      await AuthService.authenticate('admin', 'wrongpassword');
      console.log('✗ Should have thrown an error for invalid credentials');
    } catch (error) {
      console.log(`✓ Invalid credentials rejected: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Test 8: Authenticate with non-existent user
    console.log('\nTest 8: Authenticate with Non-existent User');
    try {
      await AuthService.authenticate('nonexistent', 'password');
      console.log('✗ Should have thrown an error for non-existent user');
    } catch (error) {
      console.log(`✓ Non-existent user rejected: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Test 9: Authenticate staff user
    console.log('\nTest 9: Authenticate Staff User');
    const staffLogin = await AuthService.authenticate('staff', 'staff123');
    console.log(`✓ Staff authentication successful`);
    console.log(`  Username: ${staffLogin.user.username}`);
    console.log(`  Role: ${staffLogin.user.role}`);

    console.log('\n✅ All authentication tests passed!');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run tests
testAuthentication();
