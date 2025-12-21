/**
 * Property-Based Tests for Authorization Middleware
 * Using fast-check for property-based testing
 */

import * as fc from 'fast-check';
import request from 'supertest';
import app from '../../index';
import { PrismaClient, Role } from '@prisma/client';
import { AuthService } from '../../services/auth.service';

const prisma = new PrismaClient();

describe('Authorization Middleware Property-Based Tests', () => {
  let staffToken: string;
  let staffUserId: number;
  let testBatchId: number;

  beforeAll(async () => {
    // Ensure database is connected
    await prisma.$connect();

    // Clean up any existing test data
    await prisma.user.deleteMany({
      where: {
        username: {
          startsWith: 'proptest_auth_',
        },
      },
    });

    // Create a staff user for testing
    const hashedPassword = await AuthService.hashPassword('testpassword123');
    const staffUser = await prisma.user.create({
      data: {
        username: 'proptest_auth_staff',
        password: hashedPassword,
        role: Role.STAFF,
      },
    });
    staffUserId = staffUser.id;
    staffToken = AuthService.generateToken(staffUser.id, staffUser.username, staffUser.role);

    // Create an admin user to set up test data
    const adminUser = await prisma.user.create({
      data: {
        username: 'proptest_auth_admin',
        password: hashedPassword,
        role: Role.ADMIN,
      },
    });
    const adminToken = AuthService.generateToken(adminUser.id, adminUser.username, adminUser.role);

    // Create a test batch for testing batch-related endpoints
    const batchResponse = await request(app)
      .post('/api/batches')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        batchIdentifier: 'PROPTEST-AUTH-001',
        productName: 'Test Product',
        purchaseDate: new Date(),
        purchasePricePerUnit: 10,
        initialQuantity: 100,
      });
    testBatchId = batchResponse.body.id;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.salesOrderLineItem.deleteMany({});
    await prisma.salesOrder.deleteMany({});
    await prisma.batch.deleteMany({
      where: {
        batchIdentifier: {
          startsWith: 'PROPTEST-AUTH-',
        },
      },
    });
    await prisma.user.deleteMany({
      where: {
        username: {
          startsWith: 'proptest_auth_',
        },
      },
    });
    await prisma.$disconnect();
  });

  /**
   * Feature: cannabis-shop-management, Property 4: Staff authorization enforcement
   * Validates: Requirements 1.4
   * 
   * For any admin-only API endpoint, when a Staff user attempts to access it, 
   * the system should deny access and return an authorization error.
   */
  test('Property 4: Staff authorization enforcement - staff users should be denied access to all admin-only endpoints', async () => {
    // Define all admin-only endpoints with their HTTP methods and test payloads
    const adminOnlyEndpoints = [
      // User management endpoints (all admin-only)
      { method: 'POST', path: '/api/users', body: { username: 'newuser', password: 'pass123', role: 'STAFF' } },
      { method: 'GET', path: '/api/users', body: null },
      { method: 'GET', path: `/api/users/${staffUserId}`, body: null },
      { method: 'PUT', path: `/api/users/${staffUserId}`, body: { username: 'updated' } },
      { method: 'DELETE', path: `/api/users/${staffUserId}`, body: null },
      
      // Batch management endpoints (all admin-only)
      { method: 'POST', path: '/api/batches', body: { batchIdentifier: 'TEST-001', productName: 'Test', purchaseDate: new Date(), purchasePricePerUnit: 10, initialQuantity: 100 } },
      { method: 'GET', path: '/api/batches', body: null },
      { method: 'GET', path: `/api/batches/${testBatchId}`, body: null },
      { method: 'PUT', path: `/api/batches/${testBatchId}`, body: { productName: 'Updated' } },
      { method: 'DELETE', path: `/api/batches/${testBatchId}`, body: null },
      
      // Report endpoints (all admin-only)
      { method: 'GET', path: '/api/reports/inventory', body: null },
      { method: 'GET', path: '/api/reports/monthly-profit?month=1&year=2024', body: null },
      
      // Profit share endpoints (all admin-only)
      { method: 'GET', path: '/api/profit-shares', body: null },
      { method: 'POST', path: '/api/profit-shares/execute', body: { month: 1, year: 2024 } },
      
      // Sales order GET and DELETE endpoints (admin-only, POST is staff-accessible)
      { method: 'GET', path: '/api/sales-orders', body: null },
      { method: 'DELETE', path: '/api/sales-orders/1', body: null },
    ];

    // Use fast-check to test a random selection of these endpoints
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...adminOnlyEndpoints),
        async (endpoint) => {
          // Act: Attempt to access the admin-only endpoint with staff token
          let response;
          
          switch (endpoint.method) {
            case 'GET':
              response = await request(app)
                .get(endpoint.path)
                .set('Authorization', `Bearer ${staffToken}`);
              break;
            case 'POST':
              response = await request(app)
                .post(endpoint.path)
                .set('Authorization', `Bearer ${staffToken}`)
                .send(endpoint.body || {});
              break;
            case 'PUT':
              response = await request(app)
                .put(endpoint.path)
                .set('Authorization', `Bearer ${staffToken}`)
                .send(endpoint.body || {});
              break;
            case 'DELETE':
              response = await request(app)
                .delete(endpoint.path)
                .set('Authorization', `Bearer ${staffToken}`);
              break;
            default:
              throw new Error(`Unsupported HTTP method: ${endpoint.method}`);
          }

          // Assert 1: The response should be 403 Forbidden
          expect(response.status).toBe(403);

          // Assert 2: The response should have an error object
          expect(response.body).toHaveProperty('error');
          expect(response.body.error).toHaveProperty('code');
          expect(response.body.error).toHaveProperty('message');

          // Assert 3: The error code should be AUTHORIZATION_ERROR
          expect(response.body.error.code).toBe('AUTHORIZATION_ERROR');

          // Assert 4: The error message should indicate insufficient permissions
          expect(response.body.error.message).toContain('Insufficient permissions');
          expect(response.body.error.message).toContain('ADMIN');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Complementary test: Verify that staff users CAN access staff-allowed endpoints
   * This ensures our authorization isn't overly restrictive
   */
  test('Property 4 (complement): Staff users should be able to access staff-allowed endpoints', async () => {
    // Staff users should be able to create sales orders
    const response = await request(app)
      .post('/api/sales-orders')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        lineItems: [
          {
            batchId: testBatchId,
            quantitySold: 5,
            sellingPricePerUnit: 20,
          },
        ],
      });

    // Assert: Staff should be able to create sales orders (not 403)
    expect(response.status).not.toBe(403);
    // It should either succeed (201) or fail for other reasons (400, 404, etc.), but not authorization
    expect([200, 201, 400, 404, 409, 500]).toContain(response.status);
  });
});
