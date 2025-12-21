import { BatchService, CreateBatchInput } from '../batch.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('BatchService', () => {
  // Clean up test data before and after each test
  beforeEach(async () => {
    // Delete in correct order due to foreign key constraints
    await prisma.salesOrderLineItem.deleteMany({});
    await prisma.salesOrder.deleteMany({});
    await prisma.batch.deleteMany({});
  });

  afterEach(async () => {
    // Delete in correct order due to foreign key constraints
    await prisma.salesOrderLineItem.deleteMany({});
    await prisma.salesOrder.deleteMany({});
    await prisma.batch.deleteMany({});
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('createBatch', () => {
    it('should create a batch with valid data', async () => {
      const batchData: CreateBatchInput = {
        batchIdentifier: 'BATCH-001',
        productName: 'Blue Dream',
        purchaseDate: new Date('2024-01-15'),
        purchasePricePerUnit: 10.50,
        initialQuantity: 100,
      };

      const batch = await BatchService.createBatch(batchData);

      expect(batch).toBeDefined();
      expect(batch.batchIdentifier).toBe('BATCH-001');
      expect(batch.productName).toBe('Blue Dream');
      expect(batch.purchasePricePerUnit).toBe(10.50);
      expect(batch.initialQuantity).toBe(100);
      expect(batch.currentQuantity).toBe(100); // Should equal initial quantity
    });

    it('should reject duplicate batch identifier', async () => {
      const batchData: CreateBatchInput = {
        batchIdentifier: 'BATCH-002',
        productName: 'OG Kush',
        purchaseDate: new Date('2024-01-15'),
        purchasePricePerUnit: 12.00,
        initialQuantity: 50,
      };

      await BatchService.createBatch(batchData);

      await expect(BatchService.createBatch(batchData)).rejects.toThrow(
        'Batch identifier already exists'
      );
    });

    it('should reject negative purchase price', async () => {
      const batchData: CreateBatchInput = {
        batchIdentifier: 'BATCH-003',
        productName: 'Sour Diesel',
        purchaseDate: new Date('2024-01-15'),
        purchasePricePerUnit: -5.00,
        initialQuantity: 75,
      };

      await expect(BatchService.createBatch(batchData)).rejects.toThrow(
        'Purchase price per unit must be non-negative'
      );
    });

    it('should reject non-positive initial quantity', async () => {
      const batchData: CreateBatchInput = {
        batchIdentifier: 'BATCH-004',
        productName: 'Purple Haze',
        purchaseDate: new Date('2024-01-15'),
        purchasePricePerUnit: 11.00,
        initialQuantity: 0,
      };

      await expect(BatchService.createBatch(batchData)).rejects.toThrow(
        'Initial quantity must be a positive integer'
      );
    });
  });

  describe('getBatches', () => {
    it('should retrieve all batches', async () => {
      await BatchService.createBatch({
        batchIdentifier: 'BATCH-005',
        productName: 'Green Crack',
        purchaseDate: new Date('2024-01-15'),
        purchasePricePerUnit: 9.50,
        initialQuantity: 80,
      });

      await BatchService.createBatch({
        batchIdentifier: 'BATCH-006',
        productName: 'White Widow',
        purchaseDate: new Date('2024-01-16'),
        purchasePricePerUnit: 10.00,
        initialQuantity: 60,
      });

      const batches = await BatchService.getBatches();

      expect(batches).toHaveLength(2);
    });

    it('should filter batches by product name', async () => {
      await BatchService.createBatch({
        batchIdentifier: 'BATCH-007',
        productName: 'Indica Strain',
        purchaseDate: new Date('2024-01-15'),
        purchasePricePerUnit: 9.50,
        initialQuantity: 80,
      });

      await BatchService.createBatch({
        batchIdentifier: 'BATCH-008',
        productName: 'Sativa Strain',
        purchaseDate: new Date('2024-01-16'),
        purchasePricePerUnit: 10.00,
        initialQuantity: 60,
      });

      const batches = await BatchService.getBatches({ productName: 'Indica Strain' });

      expect(batches).toHaveLength(1);
      expect(batches[0].productName).toBe('Indica Strain');
    });
  });

  describe('checkBatchAvailability', () => {
    it('should return true when sufficient quantity is available', async () => {
      const batch = await BatchService.createBatch({
        batchIdentifier: 'BATCH-009',
        productName: 'Test Product',
        purchaseDate: new Date('2024-01-15'),
        purchasePricePerUnit: 10.00,
        initialQuantity: 100,
      });

      const isAvailable = await BatchService.checkBatchAvailability(batch.id, 50);

      expect(isAvailable).toBe(true);
    });

    it('should return false when insufficient quantity is available', async () => {
      const batch = await BatchService.createBatch({
        batchIdentifier: 'BATCH-010',
        productName: 'Test Product',
        purchaseDate: new Date('2024-01-15'),
        purchasePricePerUnit: 10.00,
        initialQuantity: 100,
      });

      const isAvailable = await BatchService.checkBatchAvailability(batch.id, 150);

      expect(isAvailable).toBe(false);
    });

    it('should return false for non-existent batch', async () => {
      const isAvailable = await BatchService.checkBatchAvailability(99999, 10);

      expect(isAvailable).toBe(false);
    });
  });

  describe('updateBatch', () => {
    it('should update allowed fields', async () => {
      const batch = await BatchService.createBatch({
        batchIdentifier: 'BATCH-011',
        productName: 'Original Name',
        purchaseDate: new Date('2024-01-15'),
        purchasePricePerUnit: 10.00,
        initialQuantity: 100,
      });

      const updated = await BatchService.updateBatch(batch.id, {
        productName: 'Updated Name',
        currentQuantity: 80,
      });

      expect(updated.productName).toBe('Updated Name');
      expect(updated.currentQuantity).toBe(80);
      expect(updated.purchasePricePerUnit).toBe(10.00); // Should remain unchanged
    });

    it('should maintain immutability of purchase price and date', async () => {
      const originalDate = new Date('2024-01-15');
      const batch = await BatchService.createBatch({
        batchIdentifier: 'BATCH-012',
        productName: 'Test Product',
        purchaseDate: originalDate,
        purchasePricePerUnit: 10.00,
        initialQuantity: 100,
      });

      const updated = await BatchService.updateBatch(batch.id, {
        productName: 'Updated Name',
      });

      expect(updated.purchasePricePerUnit).toBe(10.00);
      expect(updated.purchaseDate.toISOString()).toBe(originalDate.toISOString());
    });

    it('should reject current quantity exceeding initial quantity', async () => {
      const batch = await BatchService.createBatch({
        batchIdentifier: 'BATCH-013',
        productName: 'Test Product',
        purchaseDate: new Date('2024-01-15'),
        purchasePricePerUnit: 10.00,
        initialQuantity: 100,
      });

      await expect(
        BatchService.updateBatch(batch.id, { currentQuantity: 150 })
      ).rejects.toThrow('Current quantity cannot exceed initial quantity');
    });
  });

  describe('deleteBatch', () => {
    it('should delete batch when not referenced', async () => {
      const batch = await BatchService.createBatch({
        batchIdentifier: 'BATCH-014',
        productName: 'Test Product',
        purchaseDate: new Date('2024-01-15'),
        purchasePricePerUnit: 10.00,
        initialQuantity: 100,
      });

      const deleted = await BatchService.deleteBatch(batch.id);

      expect(deleted.id).toBe(batch.id);

      const found = await BatchService.getBatchById(batch.id);
      expect(found).toBeNull();
    });

    it('should reject deletion when referenced by sales orders', async () => {
      const batch = await BatchService.createBatch({
        batchIdentifier: 'BATCH-015',
        productName: 'Test Product',
        purchaseDate: new Date('2024-01-15'),
        purchasePricePerUnit: 10.00,
        initialQuantity: 100,
      });

      // Create a sales order that references this batch
      await prisma.salesOrder.create({
        data: {
          customerName: 'Test Customer',
          totalProfit: 50.00,
          lineItems: {
            create: {
              batchId: batch.id,
              quantitySold: 10,
              sellingPricePerUnit: 15.00,
              lineProfit: 50.00,
            },
          },
        },
      });

      await expect(BatchService.deleteBatch(batch.id)).rejects.toThrow(
        'Cannot delete batch that is referenced by sales orders'
      );
    });
  });
});
