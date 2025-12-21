/**
 * Property-Based Tests for Authentication Service
 * Using fast-check for property-based testing
 */

import * as fc from 'fast-check';
import { AuthService } from '../auth.service';
import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

describe('AuthService Property-Based Tests', () => {
  // Clean up database before and after tests
  beforeAll(async () => {
    // Ensure database is connected
    await prisma.$connect();
  });

  afterAll(async () => {
    // Clean up test users
    await prisma.user.deleteMany({
      where: {
        username: {
          startsWith: 'proptest_',
        },
      },
    });
    await prisma.$disconnect();
  });

  // Feature: cannabis-shop-management, Property 2: Valid authentication succeeds
  test('Property 2: Valid authentication succeeds - for any valid user credentials, authentication should succeed and return the correct user role', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          username: fc.string({ minLength: 3, maxLength: 20 }).map(s => `proptest_${s.replace(/[^a-zA-Z0-9]/g, '_')}`),
          password: fc.string({ minLength: 6, maxLength: 50 }),
          role: fc.constantFrom<Role>('ADMIN', 'STAFF'),
        }),
        async ({ username, password, role }) => {
          // Setup: Create a user with the generated credentials
          const hashedPassword = await AuthService.hashPassword(password);
          
          // Clean up any existing user with this username
          await prisma.user.deleteMany({
            where: { username },
          });

          const createdUser = await prisma.user.create({
            data: {
              username,
              password: hashedPassword,
              role,
            },
          });

          try {
            // Act: Authenticate with the valid credentials
            const result = await AuthService.authenticate(username, password);

            // Assert: Authentication should succeed
            expect(result).toBeDefined();
            expect(result.token).toBeDefined();
            expect(typeof result.token).toBe('string');
            expect(result.token.length).toBeGreaterThan(0);

            // Assert: User information should match
            expect(result.user).toBeDefined();
            expect(result.user.id).toBe(createdUser.id);
            expect(result.user.username).toBe(username);
            expect(result.user.role).toBe(role);

            // Assert: Token should be valid and contain correct information
            const decoded = AuthService.verifyToken(result.token);
            expect(decoded.userId).toBe(createdUser.id);
            expect(decoded.username).toBe(username);
            expect(decoded.role).toBe(role);
          } finally {
            // Cleanup: Remove the test user
            await prisma.user.delete({
              where: { id: createdUser.id },
            });
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: cannabis-shop-management, Property 3: Invalid authentication fails
  test('Property 3: Invalid authentication fails - for any invalid credentials, authentication should fail and return an error', async () => {
    // Test case 1: Non-existent username
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          username: fc.string({ minLength: 3, maxLength: 20 }).map(s => `nonexistent_${s.replace(/[^a-zA-Z0-9]/g, '_')}`),
          password: fc.string({ minLength: 6, maxLength: 50 }),
        }),
        async ({ username, password }) => {
          // Ensure this username doesn't exist
          await prisma.user.deleteMany({
            where: { username },
          });

          // Act & Assert: Authentication should fail
          await expect(AuthService.authenticate(username, password)).rejects.toThrow('Invalid credentials');
        }
      ),
      { numRuns: 100 }
    );

    // Test case 2: Incorrect password for existing user
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          username: fc.string({ minLength: 3, maxLength: 20 }).map(s => `proptest_invalid_${s.replace(/[^a-zA-Z0-9]/g, '_')}`),
          correctPassword: fc.string({ minLength: 6, maxLength: 50 }),
          incorrectPassword: fc.string({ minLength: 6, maxLength: 50 }),
          role: fc.constantFrom<Role>('ADMIN', 'STAFF'),
        }).filter(({ correctPassword, incorrectPassword }) => correctPassword !== incorrectPassword),
        async ({ username, correctPassword, incorrectPassword, role }) => {
          // Setup: Create a user with correct password
          const hashedPassword = await AuthService.hashPassword(correctPassword);
          
          // Clean up any existing user with this username
          await prisma.user.deleteMany({
            where: { username },
          });

          const createdUser = await prisma.user.create({
            data: {
              username,
              password: hashedPassword,
              role,
            },
          });

          try {
            // Act & Assert: Authentication with incorrect password should fail
            await expect(AuthService.authenticate(username, incorrectPassword)).rejects.toThrow('Invalid credentials');
          } finally {
            // Cleanup: Remove the test user
            await prisma.user.delete({
              where: { id: createdUser.id },
            });
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: cannabis-shop-management, Property 36: Password hashing
  // Validates: Requirements 14.1
  test('Property 36: Password hashing - for any user account, the stored password should be a hash (not plaintext), and the hash should be verifiable against the original password', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          password: fc.string({ minLength: 6, maxLength: 100 }),
        }),
        async ({ password }) => {
          // Act: Hash the password
          const hashedPassword = await AuthService.hashPassword(password);

          // Assert 1: The hash should not be the same as the plaintext password
          expect(hashedPassword).not.toBe(password);

          // Assert 2: The hash should be a non-empty string
          expect(hashedPassword).toBeDefined();
          expect(typeof hashedPassword).toBe('string');
          expect(hashedPassword.length).toBeGreaterThan(0);

          // Assert 3: The hash should be verifiable against the original password
          const isValid = await AuthService.comparePassword(password, hashedPassword);
          expect(isValid).toBe(true);

          // Assert 4: The hash should NOT verify against a different password
          // Only test this if we can generate a different password
          if (password.length > 0) {
            const differentPassword = password + 'X'; // Append character to make it different
            const isInvalid = await AuthService.comparePassword(differentPassword, hashedPassword);
            expect(isInvalid).toBe(false);
          }

          // Assert 5: Hashing the same password twice should produce different hashes (due to salt)
          const hashedPassword2 = await AuthService.hashPassword(password);
          expect(hashedPassword2).not.toBe(hashedPassword);
          
          // But both hashes should verify against the original password
          const isValid2 = await AuthService.comparePassword(password, hashedPassword2);
          expect(isValid2).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});
