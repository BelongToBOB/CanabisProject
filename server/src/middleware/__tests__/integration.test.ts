/**
 * Integration tests for validation and error handling
 * Tests the complete flow from request to response
 * Requirements: 11.4, 11.5, 12.1, 12.2, 12.4
 */

import request from 'supertest';
import app from '../../index';
import { PrismaClient, Role } from '@prisma/client';
import { AuthService } from '../../services/auth.service';

const prisma = new PrismaClient();

describe('Validation and Error Handling Integration', () => {
  let adminToken: string;
  let adminUserId: number;

  beforeAll(async () => {
    // Clean up any existing test data
    await prisma.salesOrderLineItem.deleteMany({});
    await prisma.salesOrder.deleteMany({});
    await prisma.batch.deleteMany({});
    await prisma.user.deleteMany({ where: { username: { startsWith: 'validation-' } } });

    // Create admin user for testing
    const hashedPassword = await AuthService.hashPassword('password123');
    const admin = await prisma.user.create({
      data: {
        username: 'validation-admin',
        password: hashedPassword,
        role: Role.ADMIN
      }
    });
    adminUserId = admin.id;
    adminToken = AuthService.generateToken(admin.id, admin.username, admin.role);
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.salesOrderLineItem.deleteMany({});
    await prisma.salesOrder.deleteMany({});
    await prisma.batch.deleteMany({});
    await prisma.user.deleteMany({ where: { id: adminUserId } });
    await prisma.$disconnect();
  });

  describe('Batch Validation', () => {
    it('should reject batch with negative price (Requirement 11.4)', async () => {
      const response = await request(app)
        .post('/api/batches')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          batchIdentifier: 'TEST-001',
          productName: 'Test Product',
          purchaseDate: new Date(),
          purchasePricePerUnit: -10,
          initialQuantity: 100
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'purchasePricePerUnit',
            message: expect.stringContaining('non-negative')
          })
        ])
      );
    });

    it('should reject batch with zero quantity (Requirement 11.5)', async () => {
      const response = await request(app)
        .post('/api/batches')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          batchIdentifier: 'TEST-002',
          productName: 'Test Product',
          purchaseDate: new Date(),
          purchasePricePerUnit: 10,
          initialQuantity: 0
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'initialQuantity',
            message: expect.stringContaining('positive integer')
          })
        ])
      );
    });

    it('should reject batch with non-integer quantity (Requirement 11.5)', async () => {
      const response = await request(app)
        .post('/api/batches')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          batchIdentifier: 'TEST-003',
          productName: 'Test Product',
          purchaseDate: new Date(),
          purchasePricePerUnit: 10,
          initialQuantity: 10.5
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'initialQuantity',
            message: expect.stringContaining('integer')
          })
        ])
      );
    });

    it('should accept valid batch data', async () => {
      const response = await request(app)
        .post('/api/batches')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          batchIdentifier: 'VALID-001',
          productName: 'Valid Product',
          purchaseDate: new Date(),
          purchasePricePerUnit: 10.50,
          initialQuantity: 100
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
    });
  });

  describe('Sales Order Validation', () => {
    let batchId: number;

    beforeAll(async () => {
      // Create a batch for testing
      const batch = await request(app)
        .post('/api/batches')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          batchIdentifier: 'SALES-BATCH-001',
          productName: 'Sales Test Product',
          purchaseDate: new Date(),
          purchasePricePerUnit: 10,
          initialQuantity: 100
        });
      batchId = batch.body.id;
    });

    it('should reject sales order with negative selling price (Requirement 11.4)', async () => {
      const response = await request(app)
        .post('/api/sales-orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          lineItems: [
            {
              batchId: batchId,
              quantitySold: 10,
              sellingPricePerUnit: -20
            }
          ]
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'lineItems[0].sellingPricePerUnit',
            message: expect.stringContaining('non-negative')
          })
        ])
      );
    });

    it('should reject sales order with zero quantity (Requirement 11.5)', async () => {
      const response = await request(app)
        .post('/api/sales-orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          lineItems: [
            {
              batchId: batchId,
              quantitySold: 0,
              sellingPricePerUnit: 20
            }
          ]
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'lineItems[0].quantitySold',
            message: expect.stringContaining('positive integer')
          })
        ])
      );
    });

    it('should reject sales order with non-integer quantity (Requirement 11.5)', async () => {
      const response = await request(app)
        .post('/api/sales-orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          lineItems: [
            {
              batchId: batchId,
              quantitySold: 5.5,
              sellingPricePerUnit: 20
            }
          ]
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'lineItems[0].quantitySold',
            message: expect.stringContaining('integer')
          })
        ])
      );
    });

    it('should accept valid sales order data', async () => {
      const response = await request(app)
        .post('/api/sales-orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          lineItems: [
            {
              batchId: batchId,
              quantitySold: 10,
              sellingPricePerUnit: 20
            }
          ]
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
    });
  });

  describe('User Validation', () => {
    it('should reject user with invalid role', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'testuser',
          password: 'password123',
          role: 'INVALID_ROLE'
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'role',
            message: expect.stringContaining('ADMIN or STAFF')
          })
        ])
      );
    });

    it('should reject user with missing fields', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'testuser'
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.details.length).toBeGreaterThan(0);
    });
  });

  describe('Error Response Format (Requirement 12.1)', () => {
    it('should return standardized error format for validation errors', async () => {
      const response = await request(app)
        .post('/api/batches')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          batchIdentifier: 'TEST',
          productName: 'Test',
          purchasePricePerUnit: -10,
          initialQuantity: 0
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code');
      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error).toHaveProperty('details');
      expect(Array.isArray(response.body.error.details)).toBe(true);
    });

    it('should return standardized error format for authentication errors', async () => {
      const response = await request(app)
        .post('/api/batches')
        .send({
          batchIdentifier: 'TEST',
          productName: 'Test',
          purchasePricePerUnit: 10,
          initialQuantity: 100
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code');
      expect(response.body.error).toHaveProperty('message');
    });
  });

  describe('404 Not Found Handler', () => {
    it('should return 404 for undefined routes', async () => {
      const response = await request(app)
        .get('/api/undefined-route')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('NOT_FOUND');
      expect(response.body.error.message).toContain('not found');
    });
  });

  describe('Multiple Validation Errors (Requirement 12.1)', () => {
    it('should return all validation errors in a single response', async () => {
      const response = await request(app)
        .post('/api/batches')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          batchIdentifier: '',
          productName: '',
          purchasePricePerUnit: -10,
          initialQuantity: 0
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.details.length).toBeGreaterThanOrEqual(4);
    });
  });
});
