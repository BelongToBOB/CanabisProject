import request from 'supertest';
import express, { Application } from 'express';
import salesOrderRoutes from '../../routes/sales-order.routes';
import { PrismaClient, Role } from '@prisma/client';
import { AuthService } from '../../services/auth.service';

const prisma = new PrismaClient();
const app: Application = express();

app.use(express.json());
app.use('/api/sales-orders', salesOrderRoutes);

describe('SalesOrderController', () => {
  let adminToken: string;
  let staffToken: string;
  let testBatchId: number;

  beforeAll(async () => {
    // Create admin user
    const adminUser = await prisma.user.create({
      data: {
        username: 'sales_admin_test',
        password: await AuthService.hashPassword('admin123'),
        role: Role.ADMIN,
      },
    });
    adminToken = AuthService.generateToken(adminUser.id, adminUser.username, adminUser.role);

    // Create staff user
    const staffUser = await prisma.user.create({
      data: {
        username: 'sales_staff_test',
        password: await AuthService.hashPassword('staff123'),
        role: Role.STAFF,
      },
    });
    staffToken = AuthService.generateToken(staffUser.id, staffUser.username, staffUser.role);

    // Create a test batch for sales orders
    const batch = await prisma.batch.create({
      data: {
        batchIdentifier: 'BATCH-TEST-001',
        productName: 'Test Product',
        purchaseDate: new Date('2024-01-01'),
        purchasePricePerUnit: 10.0,
        initialQuantity: 100,
        currentQuantity: 100,
      },
    });
    testBatchId = batch.id;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.salesOrderLineItem.deleteMany({});
    await prisma.salesOrder.deleteMany({});
    await prisma.batch.deleteMany({
      where: {
        batchIdentifier: {
          startsWith: 'BATCH-TEST-',
        },
      },
    });
    await prisma.user.deleteMany({
      where: {
        username: {
          startsWith: 'sales_',
        },
      },
    });
    await prisma.$disconnect();
  });

  describe('POST /api/sales-orders', () => {
    it('should allow admin to create a sales order', async () => {
      const response = await request(app)
        .post('/api/sales-orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          customerName: 'Test Customer',
          lineItems: [
            {
              batchId: testBatchId,
              quantitySold: 5,
              sellingPricePerUnit: 20.0,
            },
          ],
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.customerName).toBe('Test Customer');
      expect(response.body.totalProfit).toBe(50); // (20 - 10) * 5
      expect(response.body.isLocked).toBe(false);
      expect(response.body.lineItems).toHaveLength(1);
    });

    it('should allow staff to create a sales order', async () => {
      const response = await request(app)
        .post('/api/sales-orders')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          customerName: 'Staff Customer',
          lineItems: [
            {
              batchId: testBatchId,
              quantitySold: 3,
              sellingPricePerUnit: 25.0,
            },
          ],
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.customerName).toBe('Staff Customer');
      expect(response.body.totalProfit).toBe(45); // (25 - 10) * 3
    });

    it('should reject sales order with non-existent batch', async () => {
      const response = await request(app)
        .post('/api/sales-orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          lineItems: [
            {
              batchId: 99999,
              quantitySold: 5,
              sellingPricePerUnit: 20.0,
            },
          ],
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation error');
      expect(response.body.message).toContain('not found');
    });

    it('should reject sales order with insufficient stock', async () => {
      const response = await request(app)
        .post('/api/sales-orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          lineItems: [
            {
              batchId: testBatchId,
              quantitySold: 1000,
              sellingPricePerUnit: 20.0,
            },
          ],
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation error');
      expect(response.body.message).toContain('Insufficient stock');
    });

    it('should reject sales order without line items', async () => {
      const response = await request(app)
        .post('/api/sales-orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          customerName: 'Test Customer',
          lineItems: [],
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.message).toBe('Validation failed');
    });

    it('should reject unauthenticated request', async () => {
      const response = await request(app)
        .post('/api/sales-orders')
        .send({
          lineItems: [
            {
              batchId: testBatchId,
              quantitySold: 5,
              sellingPricePerUnit: 20.0,
            },
          ],
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/sales-orders', () => {
    let testOrderId: number;

    beforeAll(async () => {
      // Create a test order
      const order = await prisma.salesOrder.create({
        data: {
          customerName: 'List Test Customer',
          totalProfit: 100,
          isLocked: false,
          lineItems: {
            create: [
              {
                batchId: testBatchId,
                quantitySold: 10,
                sellingPricePerUnit: 20,
                finalSellingPricePerUnit: 20,
                subtotal: 200,
                lineProfit: 100,
              },
            ],
          },
        },
      });
      testOrderId = order.id;
    });

    it('should allow admin to get all sales orders', async () => {
      const response = await request(app)
        .get('/api/sales-orders')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should deny staff access to get all sales orders', async () => {
      const response = await request(app)
        .get('/api/sales-orders')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(response.status).toBe(403);
    });

    it('should allow admin to get sales order by ID', async () => {
      const response = await request(app)
        .get(`/api/sales-orders/${testOrderId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(testOrderId);
      expect(response.body).toHaveProperty('totalProfit');
      expect(response.body).toHaveProperty('lineItems');
    });

    it('should deny staff access to get sales order by ID', async () => {
      const response = await request(app)
        .get(`/api/sales-orders/${testOrderId}`)
        .set('Authorization', `Bearer ${staffToken}`);

      expect(response.status).toBe(403);
    });

    it('should return 404 for non-existent sales order', async () => {
      const response = await request(app)
        .get('/api/sales-orders/99999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/sales-orders/:id', () => {
    let unlockedOrderId: number;
    let lockedOrderId: number;

    beforeAll(async () => {
      // Create an unlocked order
      const unlockedOrder = await prisma.salesOrder.create({
        data: {
          customerName: 'Delete Test Customer',
          totalProfit: 50,
          isLocked: false,
          lineItems: {
            create: [
              {
                batchId: testBatchId,
                quantitySold: 5,
                sellingPricePerUnit: 20,
                finalSellingPricePerUnit: 20,
                subtotal: 100,
                lineProfit: 50,
              },
            ],
          },
        },
      });
      unlockedOrderId = unlockedOrder.id;

      // Create a locked order
      const lockedOrder = await prisma.salesOrder.create({
        data: {
          customerName: 'Locked Order Customer',
          totalProfit: 75,
          isLocked: true,
          lineItems: {
            create: [
              {
                batchId: testBatchId,
                quantitySold: 5,
                sellingPricePerUnit: 25,
                finalSellingPricePerUnit: 25,
                subtotal: 125,
                lineProfit: 75,
              },
            ],
          },
        },
      });
      lockedOrderId = lockedOrder.id;
    });

    it('should allow admin to delete unlocked sales order', async () => {
      const response = await request(app)
        .delete(`/api/sales-orders/${unlockedOrderId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Sales order deleted successfully');

      // Verify order is deleted
      const deletedOrder = await prisma.salesOrder.findUnique({
        where: { id: unlockedOrderId },
      });
      expect(deletedOrder).toBeNull();
    });

    it('should prevent deletion of locked sales order', async () => {
      const response = await request(app)
        .delete(`/api/sales-orders/${lockedOrderId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Forbidden');
      expect(response.body.message).toBe('Cannot delete locked sales order');

      // Verify order still exists
      const order = await prisma.salesOrder.findUnique({
        where: { id: lockedOrderId },
      });
      expect(order).not.toBeNull();
    });

    it('should deny staff access to delete sales order', async () => {
      const response = await request(app)
        .delete(`/api/sales-orders/${lockedOrderId}`)
        .set('Authorization', `Bearer ${staffToken}`);

      expect(response.status).toBe(403);
    });

    it('should return 404 for non-existent sales order', async () => {
      const response = await request(app)
        .delete('/api/sales-orders/99999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });
  });
});
