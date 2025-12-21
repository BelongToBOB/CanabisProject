/**
 * Property-Based Tests for User Service
 * Using fast-check for property-based testing
 */

import * as fc from 'fast-check';
import { UserService } from '../user.service';
import { PrismaClient, Role } from '@prisma/client';
import { AuthService } from '../auth.service';

const prisma = new PrismaClient();

describe('UserService Property-Based Tests', () => {
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
          startsWith: 'proptest_user_',
        },
      },
    });
    await prisma.$disconnect();
  });

  /**
   * Feature: cannabis-shop-management, Property 1: User account data persistence
   * Validates: Requirements 1.1
   * 
   * For any valid user account data (username, password, role), when an admin creates 
   * the account, retrieving that account should return the same username and role, 
   * with the password properly hashed (not stored in plaintext).
   */
  test('Property 1: User account data persistence - for any valid user account data, creating and retrieving should preserve username and role with hashed password', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          username: fc.string({ minLength: 3, maxLength: 20 }).map(s => `proptest_user_${s.replace(/[^a-zA-Z0-9]/g, '_')}`),
          password: fc.string({ minLength: 6, maxLength: 50 }),
          role: fc.constantFrom<Role>('ADMIN', 'STAFF'),
        }),
        async ({ username, password, role }) => {
          // Clean up any existing user with this username
          await prisma.user.deleteMany({
            where: { username },
          });

          let createdUserId: number | null = null;

          try {
            // Act: Create a user with the generated data
            const createdUser = await UserService.createUser({
              username,
              password,
              role,
            });

            createdUserId = createdUser.id;

            // Assert 1: Created user should have the correct username
            expect(createdUser.username).toBe(username);

            // Assert 2: Created user should have the correct role
            expect(createdUser.role).toBe(role);

            // Assert 3: Created user should have an ID
            expect(createdUser.id).toBeDefined();
            expect(typeof createdUser.id).toBe('number');

            // Assert 4: Password should NOT be in the response
            expect((createdUser as any).password).toBeUndefined();

            // Assert 5: Retrieve the user by ID
            const retrievedUser = await UserService.getUserById(createdUser.id);
            expect(retrievedUser).not.toBeNull();

            // Assert 6: Retrieved user should have the same username
            expect(retrievedUser?.username).toBe(username);

            // Assert 7: Retrieved user should have the same role
            expect(retrievedUser?.role).toBe(role);

            // Assert 8: Retrieved user should have the same ID
            expect(retrievedUser?.id).toBe(createdUser.id);

            // Assert 9: Password should NOT be in the retrieved response
            expect((retrievedUser as any)?.password).toBeUndefined();

            // Assert 10: Verify password is hashed in database (not plaintext)
            const dbUser = await prisma.user.findUnique({
              where: { id: createdUser.id },
            });

            expect(dbUser).not.toBeNull();
            expect(dbUser?.password).not.toBe(password); // Not plaintext
            expect(dbUser?.password).toBeDefined();
            expect(typeof dbUser?.password).toBe('string');
            expect(dbUser?.password.length).toBeGreaterThan(0);

            // Assert 11: The hashed password should be verifiable against the original password
            const isPasswordValid = await AuthService.comparePassword(password, dbUser!.password);
            expect(isPasswordValid).toBe(true);

            // Assert 12: The hashed password should follow bcrypt pattern
            expect(dbUser?.password).toMatch(/^\$2[aby]\$/); // bcrypt hash pattern

          } finally {
            // Cleanup: Remove the test user
            if (createdUserId !== null) {
              await prisma.user.deleteMany({
                where: { id: createdUserId },
              });
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
