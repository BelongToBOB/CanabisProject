import request from 'supertest';
import express, { Application } from 'express';
import batchRoutes from '../../routes/batch.routes';
import { PrismaClient, Role } from '@prisma/client';
import { AuthService } from '../../services/auth.service';

const prisma = new PrismaClient();
const app: Application = express();

app.use(express.json());
app.use('/api/batches', batchRoutes);

describe('Batch Controller', () => {
  let adminToken: string;
  let staffToken: string;

  beforeAll(async () => {
    // Create test users
    const adminUser = await prisma.user.create({
      data: {
        username: 'batch_admin_test',
        password: await AuthService.hashPassword('admin123'),
        role: Role.ADMIN,
      },
    });
    adminToken = AuthService.generateToken(adminUser.id, adminUser.username, adminUser.role);

    const staffUser = await prisma.user.create({
      data: {
        username: 'batch_staff_test',
        password: await AuthService.hashPassword('staff123'),
        role: Role.STAFF,
      },
    });
    staffToken = AuthService.generateToken(staffUser.id, staffUser.username, staffUser.role);
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.batch.deleteMany({
      where: {
        batchIdentifier: {
          startsWith: 'BATCH-',
        },
      },
    });
    await prisma.batch.deleteMany({
      where: {
        batchIdentifier: {
          startsWith: 'GET-',
        },
      },
    });
    await prisma.batch.deleteMany({
      where: {
        batchIdentifier: {
          startsWith: 'GETID-',
        },
      },
    });
    await prisma.batch.deleteMany({
      where: {
        batchIdentifier: {
          startsWith: 'UPDATE-',
        },
      },
    });
    await prisma.batch.deleteMany({
      where: {
        batchIdentifier: {
          startsWith: 'DELETE-',
        },
      },
    });
    await prisma.user.deleteMany({
      where: {
        username: {
          startsWith: 'batch_',
        },
      },
    });
    await prisma.$disconnect();
  });

  describe('POST /api/batches', () => {
    it('should create a new batch with valid data (admin)', async () => {
      const batchData = {
        batchIdentifier: 'BATCH-001',
        productName: 'Blue Dream',
        purchaseDate: '2024-01-15',
        purchasePricePerUnit: 10.50,
        initialQuantity: 100,
      };

      const response = await request(app)
        .post('/api/batches')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(batchData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.batchIdentifier).toBe(batchData.batchIdentifier);
      expect(response.body.productName).toBe(batchData.productName);
      expect(response.body.purchasePricePerUnit).toBe(batchData.purchasePricePerUnit);
      expect(response.body.initialQuantity).toBe(batchData.initialQuantity);
      expect(response.body.currentQuantity).toBe(batchData.initialQuantity);
    });

    it('should reject duplicate batch identifier', async () => {
      const batchData = {
        batchIdentifier: 'BATCH-002',
        productName: 'OG Kush',
        purchaseDate: '2024-01-16',
        purchasePricePerUnit: 12.00,
        initialQuantity: 50,
      };

      // Create first batch
      await request(app)
        .post('/api/batches')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(batchData);

      // Try to create duplicate
      const response = await request(app)
        .post('/api/batches')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(batchData);

      expect(response.status).toBe(409);
      expect(response.body.error).toBe('Conflict');
      expect(response.body.message).toBe('Batch identifier already exists');
    });

    it('should reject negative purchase price', async () => {
      const batchData = {
        batchIdentifier: 'BATCH-003',
        productName: 'Sour Diesel',
        purchaseDate: '2024-01-17',
        purchasePricePerUnit: -5.00,
        initialQuantity: 75,
      };

      const response = await request(app)
        .post('/api/batches')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(batchData);

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.message).toContain('Validation failed');
    });

    it('should reject non-positive initial quantity', async () => {
      const batchData = {
        batchIdentifier: 'BATCH-004',
        productName: 'Purple Haze',
        purchaseDate: '2024-01-18',
        purchasePricePerUnit: 11.00,
        initialQuantity: -5,
      };

      const response = await request(app)
        .post('/api/batches')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(batchData);

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.message).toContain('Validation failed');
    });

    it('should reject staff user access', async () => {
      const batchData = {
        batchIdentifier: 'BATCH-005',
        productName: 'Green Crack',
        purchaseDate: '2024-01-19',
        purchasePricePerUnit: 9.50,
        initialQuantity: 60,
      };

      const response = await request(app)
        .post('/api/batches')
        .set('Authorization', `Bearer ${staffToken}`)
        .send(batchData);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/batches', () => {
    beforeAll(async () => {
      // Create test batches
      await prisma.batch.createMany({
        data: [
          {
            batchIdentifier: 'GET-001',
            productName: 'Indica Strain',
            purchaseDate: new Date('2024-01-20'),
            purchasePricePerUnit: 10.00,
            initialQuantity: 100,
            currentQuantity: 100,
          },
          {
            batchIdentifier: 'GET-002',
            productName: 'Sativa Strain',
            purchaseDate: new Date('2024-01-21'),
            purchasePricePerUnit: 11.00,
            initialQuantity: 80,
            currentQuantity: 80,
          },
          {
            batchIdentifier: 'GET-003',
            productName: 'Indica Strain',
            purchaseDate: new Date('2024-01-22'),
            purchasePricePerUnit: 10.50,
            initialQuantity: 90,
            currentQuantity: 90,
          },
        ],
      });
    });

    it('should get all batches (admin)', async () => {
      const response = await request(app)
        .get('/api/batches')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should filter batches by product name', async () => {
      const response = await request(app)
        .get('/api/batches?productName=Indica Strain')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach((batch: any) => {
        expect(batch.productName).toBe('Indica Strain');
      });
    });

    it('should reject staff user access', async () => {
      const response = await request(app)
        .get('/api/batches')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/batches/:id', () => {
    let testBatchId: number;

    beforeAll(async () => {
      const batch = await prisma.batch.create({
        data: {
          batchIdentifier: 'GETID-001',
          productName: 'Test Product',
          purchaseDate: new Date('2024-01-23'),
          purchasePricePerUnit: 12.00,
          initialQuantity: 50,
          currentQuantity: 50,
        },
      });
      testBatchId = batch.id;
    });

    it('should get batch by ID (admin)', async () => {
      const response = await request(app)
        .get(`/api/batches/${testBatchId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(testBatchId);
      expect(response.body.batchIdentifier).toBe('GETID-001');
    });

    it('should return 404 for non-existent batch', async () => {
      const response = await request(app)
        .get('/api/batches/999999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Not found');
    });
  });

  describe('PUT /api/batches/:id', () => {
    let testBatchId: number;

    beforeAll(async () => {
      const batch = await prisma.batch.create({
        data: {
          batchIdentifier: 'UPDATE-001',
          productName: 'Original Name',
          purchaseDate: new Date('2024-01-24'),
          purchasePricePerUnit: 10.00,
          initialQuantity: 100,
          currentQuantity: 100,
        },
      });
      testBatchId = batch.id;
    });

    it('should update batch product name (admin)', async () => {
      const response = await request(app)
        .put(`/api/batches/${testBatchId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ productName: 'Updated Name' });

      expect(response.status).toBe(200);
      expect(response.body.productName).toBe('Updated Name');
    });

    it('should update batch current quantity (admin)', async () => {
      const response = await request(app)
        .put(`/api/batches/${testBatchId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ currentQuantity: 50 });

      expect(response.status).toBe(200);
      expect(response.body.currentQuantity).toBe(50);
    });

    it('should reject negative current quantity', async () => {
      const response = await request(app)
        .put(`/api/batches/${testBatchId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ currentQuantity: -10 });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 404 for non-existent batch', async () => {
      const response = await request(app)
        .put('/api/batches/999999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ productName: 'New Name' });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/batches/:id', () => {
    it('should delete batch without references (admin)', async () => {
      const batch = await prisma.batch.create({
        data: {
          batchIdentifier: 'DELETE-001',
          productName: 'To Delete',
          purchaseDate: new Date('2024-01-25'),
          purchasePricePerUnit: 10.00,
          initialQuantity: 50,
          currentQuantity: 50,
        },
      });

      const response = await request(app)
        .delete(`/api/batches/${batch.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Batch deleted successfully');
    });

    it('should return 404 for non-existent batch', async () => {
      const response = await request(app)
        .delete('/api/batches/999999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });
  });
});
