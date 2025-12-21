import request from 'supertest';
import express, { Application } from 'express';
import { PrismaClient, Role } from '@prisma/client';
import profitShareRoutes from '../../routes/profit-share.routes';
import { AuthService } from '../../services/auth.service';

const prisma = new PrismaClient();

// Create test app
const app: Application = express();
app.use(express.json());
app.use('/api/profit-shares', profitShareRoutes);

describe('ProfitShareController', () => {
  let adminToken: string;
  let staffToken: string;

  beforeAll(async () => {
    // Create admin user
    const adminUser = await prisma.user.create({
      data: {
        username: 'test_admin_profitshare',
        password: await AuthService.hashPassword('admin123'),
        role: Role.ADMIN,
      },
    });
    adminToken = AuthService.generateToken(adminUser.id, adminUser.username, adminUser.role);

    // Create staff user
    const staffUser = await prisma.user.create({
      data: {
        username: 'test_staff_profitshare',
        password: await AuthService.hashPassword('staff123'),
        role: Role.STAFF,
      },
    });
    staffToken = AuthService.generateToken(staffUser.id, staffUser.username, staffUser.role);
  });

  afterAll(async () => {
    // Clean up test users
    await prisma.user.deleteMany({
      where: {
        username: {
          startsWith: 'test_',
        },
      },
    });
    await prisma.$disconnect();
  });

  describe('POST /api/profit-shares/execute', () => {
    beforeEach(async () => {
      // Clean up profit shares and sales orders
      await prisma.profitShare.deleteMany();
      await prisma.salesOrderLineItem.deleteMany();
      await prisma.salesOrder.deleteMany();
      await prisma.batch.deleteMany();
    });

    it('should execute profit split for a valid month/year', async () => {
      // Create a batch
      const batch = await prisma.batch.create({
        data: {
          batchIdentifier: 'BATCH-001',
          productName: 'Product A',
          purchaseDate: new Date('2024-01-15'),
          purchasePricePerUnit: 10.0,
          initialQuantity: 100,
          currentQuantity: 90,
        },
      });

      // Create a sales order in January 2024
      const order = await prisma.salesOrder.create({
        data: {
          orderDate: new Date('2024-01-20'),
          customerName: 'Test Customer',
          totalProfit: 100.0,
          isLocked: false,
          lineItems: {
            create: [
              {
                batchId: batch.id,
                quantitySold: 10,
                sellingPricePerUnit: 20.0,
                lineProfit: 100.0,
              },
            ],
          },
        },
      });

      const response = await request(app)
        .post('/api/profit-shares/execute')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ month: 1, year: 2024 });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.month).toBe(1);
      expect(response.body.year).toBe(2024);
      expect(response.body.totalProfit).toBe(100);
      expect(response.body.amountPerOwner).toBe(50);
      expect(response.body).toHaveProperty('executionDate');
      expect(response.body).toHaveProperty('createdAt');

      // Verify the order is now locked
      const lockedOrder = await prisma.salesOrder.findUnique({
        where: { id: order.id },
      });
      expect(lockedOrder?.isLocked).toBe(true);
    });

    it('should return 400 if month is missing', async () => {
      const response = await request(app)
        .post('/api/profit-shares/execute')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ year: 2024 });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.message).toContain('Validation failed');
    });

    it('should return 400 if year is missing', async () => {
      const response = await request(app)
        .post('/api/profit-shares/execute')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ month: 1 });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.message).toContain('Validation failed');
    });

    it('should return 400 if month is not an integer', async () => {
      const response = await request(app)
        .post('/api/profit-shares/execute')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ month: 1.5, year: 2024 });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.message).toContain('Validation failed');
    });

    it('should return 400 if month is invalid', async () => {
      const response = await request(app)
        .post('/api/profit-shares/execute')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ month: 13, year: 2024 });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.message).toContain('Validation failed');
    });

    it('should return 400 if profit split already executed for the month', async () => {
      // Execute profit split once
      await request(app)
        .post('/api/profit-shares/execute')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ month: 2, year: 2024 });

      // Try to execute again
      const response = await request(app)
        .post('/api/profit-shares/execute')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ month: 2, year: 2024 });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation error');
      expect(response.body.message).toContain('already executed');
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .post('/api/profit-shares/execute')
        .send({ month: 1, year: 2024 });

      expect(response.status).toBe(401);
    });

    it('should return 403 when staff user tries to access', async () => {
      const response = await request(app)
        .post('/api/profit-shares/execute')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ month: 1, year: 2024 });

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/profit-shares', () => {
    beforeEach(async () => {
      await prisma.profitShare.deleteMany();
    });

    it('should return all profit shares ordered by execution date', async () => {
      // Create multiple profit shares
      await prisma.profitShare.create({
        data: {
          month: 1,
          year: 2024,
          totalProfit: 100.0,
          amountPerOwner: 50.0,
          executionDate: new Date('2024-02-24'),
        },
      });

      await prisma.profitShare.create({
        data: {
          month: 2,
          year: 2024,
          totalProfit: 200.0,
          amountPerOwner: 100.0,
          executionDate: new Date('2024-03-24'),
        },
      });

      const response = await request(app)
        .get('/api/profit-shares')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);

      // Verify ordering (most recent first)
      expect(response.body[0].month).toBe(2);
      expect(response.body[1].month).toBe(1);

      // Verify response completeness (Requirements 9.1)
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('month');
      expect(response.body[0]).toHaveProperty('year');
      expect(response.body[0]).toHaveProperty('totalProfit');
      expect(response.body[0]).toHaveProperty('amountPerOwner');
      expect(response.body[0]).toHaveProperty('executionDate');
      expect(response.body[0]).toHaveProperty('createdAt');
    });

    it('should return empty array if no profit shares exist', async () => {
      const response = await request(app)
        .get('/api/profit-shares')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app).get('/api/profit-shares');

      expect(response.status).toBe(401);
    });

    it('should return 403 when staff user tries to access', async () => {
      const response = await request(app)
        .get('/api/profit-shares')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/profit-shares/:id', () => {
    beforeEach(async () => {
      await prisma.profitShare.deleteMany();
    });

    it('should return a specific profit share by ID', async () => {
      const profitShare = await prisma.profitShare.create({
        data: {
          month: 1,
          year: 2024,
          totalProfit: 100.0,
          amountPerOwner: 50.0,
          executionDate: new Date('2024-02-24'),
        },
      });

      const response = await request(app)
        .get(`/api/profit-shares/${profitShare.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(profitShare.id);
      expect(response.body.month).toBe(1);
      expect(response.body.year).toBe(2024);
      expect(response.body.totalProfit).toBe(100);
      expect(response.body.amountPerOwner).toBe(50);
    });

    it('should return 404 if profit share not found', async () => {
      const response = await request(app)
        .get('/api/profit-shares/99999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Not found');
    });

    it('should return 400 if ID is invalid', async () => {
      const response = await request(app)
        .get('/api/profit-shares/invalid')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation error');
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app).get('/api/profit-shares/1');

      expect(response.status).toBe(401);
    });

    it('should return 403 when staff user tries to access', async () => {
      const response = await request(app)
        .get('/api/profit-shares/1')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(response.status).toBe(403);
    });
  });
});
