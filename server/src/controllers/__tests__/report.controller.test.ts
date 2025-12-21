import request from 'supertest';
import express, { Application } from 'express';
import { PrismaClient, Role } from '@prisma/client';
import reportRoutes from '../../routes/report.routes';
import { AuthService } from '../../services/auth.service';

const prisma = new PrismaClient();

// Create test app
const app: Application = express();
app.use(express.json());
app.use('/api/reports', reportRoutes);

describe('Report Controller', () => {
  let adminToken: string;
  let staffToken: string;

  beforeAll(async () => {
    // Create admin user
    const adminUser = await prisma.user.create({
      data: {
        username: 'test_admin_report',
        password: await AuthService.hashPassword('admin123'),
        role: Role.ADMIN,
      },
    });
    adminToken = AuthService.generateToken(adminUser.id, adminUser.username, adminUser.role);

    // Create staff user
    const staffUser = await prisma.user.create({
      data: {
        username: 'test_staff_report',
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

  describe('GET /api/reports/inventory', () => {
    beforeEach(async () => {
      // Clean up batches before each test
      await prisma.batch.deleteMany({});
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/reports/inventory');

      expect(response.status).toBe(401);
    });

    it('should return 403 when staff user tries to access', async () => {
      const response = await request(app)
        .get('/api/reports/inventory')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(response.status).toBe(403);
    });

    it('should return inventory report for admin user', async () => {
      // Create test batches
      await prisma.batch.createMany({
        data: [
          {
            batchIdentifier: 'BATCH-001',
            productName: 'Product A',
            purchaseDate: new Date('2024-01-01'),
            purchasePricePerUnit: 10.00,
            initialQuantity: 100,
            currentQuantity: 50,
          },
          {
            batchIdentifier: 'BATCH-002',
            productName: 'Product B',
            purchaseDate: new Date('2024-01-02'),
            purchasePricePerUnit: 15.00,
            initialQuantity: 200,
            currentQuantity: 0,
          },
        ],
      });

      const response = await request(app)
        .get('/api/reports/inventory')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('items');
      expect(response.body).toHaveProperty('totalInventoryValue');
      expect(response.body.items).toHaveLength(2);
      expect(response.body.totalInventoryValue).toBe(500); // 50 * 10 + 0 * 15
    });

    it('should filter inventory report by product name', async () => {
      // Create test batches
      await prisma.batch.createMany({
        data: [
          {
            batchIdentifier: 'BATCH-001',
            productName: 'Product A',
            purchaseDate: new Date('2024-01-01'),
            purchasePricePerUnit: 10.00,
            initialQuantity: 100,
            currentQuantity: 50,
          },
          {
            batchIdentifier: 'BATCH-002',
            productName: 'Product B',
            purchaseDate: new Date('2024-01-02'),
            purchasePricePerUnit: 15.00,
            initialQuantity: 200,
            currentQuantity: 100,
          },
        ],
      });

      const response = await request(app)
        .get('/api/reports/inventory?productName=Product A')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.items).toHaveLength(1);
      expect(response.body.items[0].productName).toBe('Product A');
      expect(response.body.totalInventoryValue).toBe(500); // 50 * 10
    });

    it('should mark depleted batches', async () => {
      await prisma.batch.create({
        data: {
          batchIdentifier: 'BATCH-DEPLETED',
          productName: 'Product C',
          purchaseDate: new Date('2024-01-01'),
          purchasePricePerUnit: 10.00,
          initialQuantity: 100,
          currentQuantity: 0,
        },
      });

      const response = await request(app)
        .get('/api/reports/inventory')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.items[0].isDepleted).toBe(true);
    });
  });

  describe('GET /api/reports/monthly-profit', () => {
    beforeEach(async () => {
      // Clean up sales orders before each test
      await prisma.salesOrder.deleteMany({});
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/reports/monthly-profit?month=1&year=2024');

      expect(response.status).toBe(401);
    });

    it('should return 403 when staff user tries to access', async () => {
      const response = await request(app)
        .get('/api/reports/monthly-profit?month=1&year=2024')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(response.status).toBe(403);
    });

    it('should return 400 when month is missing', async () => {
      const response = await request(app)
        .get('/api/reports/monthly-profit?year=2024')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation error');
    });

    it('should return 400 when year is missing', async () => {
      const response = await request(app)
        .get('/api/reports/monthly-profit?month=1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation error');
    });

    it('should return 400 when month is invalid', async () => {
      const response = await request(app)
        .get('/api/reports/monthly-profit?month=13&year=2024')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation error');
    });

    it('should return monthly profit summary for admin user', async () => {
      // Create test sales orders
      await prisma.salesOrder.createMany({
        data: [
          {
            orderDate: new Date('2024-01-15'),
            customerName: 'Customer 1',
            totalProfit: 100.00,
            isLocked: false,
          },
          {
            orderDate: new Date('2024-01-20'),
            customerName: 'Customer 2',
            totalProfit: 150.00,
            isLocked: false,
          },
          {
            orderDate: new Date('2024-02-10'),
            customerName: 'Customer 3',
            totalProfit: 200.00,
            isLocked: false,
          },
        ],
      });

      const response = await request(app)
        .get('/api/reports/monthly-profit?month=1&year=2024')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.month).toBe(1);
      expect(response.body.year).toBe(2024);
      expect(response.body.totalProfit).toBe(250); // 100 + 150
      expect(response.body.numberOfOrders).toBe(2);
      expect(response.body).toHaveProperty('startDate');
      expect(response.body).toHaveProperty('endDate');
    });

    it('should return zero profit when no orders exist', async () => {
      const response = await request(app)
        .get('/api/reports/monthly-profit?month=3&year=2024')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.totalProfit).toBe(0);
      expect(response.body.numberOfOrders).toBe(0);
    });
  });
});
