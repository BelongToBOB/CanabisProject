import { ReportService } from '../report.service';
import { BatchService } from '../batch.service';
import { SalesOrderService } from '../sales-order.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('ReportService', () => {
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

  describe('generateInventoryReport', () => {
    it('should generate inventory report with all batches', async () => {
      // Create test batches
      await BatchService.createBatch({
        batchIdentifier: 'BATCH-001',
        productName: 'Product A',
        purchaseDate: new Date('2024-01-01'),
        purchasePricePerUnit: 10.0,
        initialQuantity: 100,
      });

      await BatchService.createBatch({
        batchIdentifier: 'BATCH-002',
        productName: 'Product B',
        purchaseDate: new Date('2024-01-02'),
        purchasePricePerUnit: 15.0,
        initialQuantity: 50,
      });

      // Generate report
      const report = await ReportService.generateInventoryReport();

      // Verify report contains all batches
      expect(report.items).toHaveLength(2);
      expect(report.items[0].batchIdentifier).toBe('BATCH-001');
      expect(report.items[0].productName).toBe('Product A');
      expect(report.items[0].currentQuantity).toBe(100);
      expect(report.items[0].purchasePricePerUnit).toBe(10.0);
      expect(report.items[0].isDepleted).toBe(false);

      // Verify total inventory value calculation
      // (100 * 10) + (50 * 15) = 1000 + 750 = 1750
      expect(report.totalInventoryValue).toBe(1750);
    });

    it('should filter inventory report by product name', async () => {
      // Create test batches
      await BatchService.createBatch({
        batchIdentifier: 'BATCH-001',
        productName: 'Product A',
        purchaseDate: new Date('2024-01-01'),
        purchasePricePerUnit: 10.0,
        initialQuantity: 100,
      });

      await BatchService.createBatch({
        batchIdentifier: 'BATCH-002',
        productName: 'Product B',
        purchaseDate: new Date('2024-01-02'),
        purchasePricePerUnit: 15.0,
        initialQuantity: 50,
      });

      // Generate filtered report
      const report = await ReportService.generateInventoryReport({
        productName: 'Product A',
      });

      // Verify only Product A is included
      expect(report.items).toHaveLength(1);
      expect(report.items[0].productName).toBe('Product A');
      expect(report.totalInventoryValue).toBe(1000);
    });

    it('should identify depleted batches', async () => {
      // Create batch with zero quantity
      const batch = await BatchService.createBatch({
        batchIdentifier: 'BATCH-001',
        productName: 'Product A',
        purchaseDate: new Date('2024-01-01'),
        purchasePricePerUnit: 10.0,
        initialQuantity: 10,
      });

      // Update to zero quantity
      await BatchService.updateBatch(batch.id, { currentQuantity: 0 });

      // Generate report
      const report = await ReportService.generateInventoryReport();

      // Verify batch is marked as depleted
      expect(report.items).toHaveLength(1);
      expect(report.items[0].isDepleted).toBe(true);
      expect(report.items[0].currentQuantity).toBe(0);
      expect(report.totalInventoryValue).toBe(0);
    });

    it('should order batches by product name and batch identifier', async () => {
      // Create batches in non-alphabetical order
      await BatchService.createBatch({
        batchIdentifier: 'BATCH-002',
        productName: 'Product B',
        purchaseDate: new Date('2024-01-01'),
        purchasePricePerUnit: 10.0,
        initialQuantity: 100,
      });

      await BatchService.createBatch({
        batchIdentifier: 'BATCH-001',
        productName: 'Product A',
        purchaseDate: new Date('2024-01-02'),
        purchasePricePerUnit: 15.0,
        initialQuantity: 50,
      });

      await BatchService.createBatch({
        batchIdentifier: 'BATCH-003',
        productName: 'Product A',
        purchaseDate: new Date('2024-01-03'),
        purchasePricePerUnit: 20.0,
        initialQuantity: 25,
      });

      // Generate report
      const report = await ReportService.generateInventoryReport();

      // Verify ordering: Product A (BATCH-001, BATCH-003), then Product B (BATCH-002)
      expect(report.items).toHaveLength(3);
      expect(report.items[0].productName).toBe('Product A');
      expect(report.items[0].batchIdentifier).toBe('BATCH-001');
      expect(report.items[1].productName).toBe('Product A');
      expect(report.items[1].batchIdentifier).toBe('BATCH-003');
      expect(report.items[2].productName).toBe('Product B');
      expect(report.items[2].batchIdentifier).toBe('BATCH-002');
    });
  });

  describe('generateMonthlyProfitSummary', () => {
    it('should calculate monthly profit summary for orders in specified month', async () => {
      // Create test batch
      const batch = await BatchService.createBatch({
        batchIdentifier: 'BATCH-001',
        productName: 'Product A',
        purchaseDate: new Date('2024-01-01'),
        purchasePricePerUnit: 10.0,
        initialQuantity: 1000,
      });

      // Create sales orders in January 2024
      await SalesOrderService.createSalesOrder({
        orderDate: new Date('2024-01-15'),
        customerName: 'Customer 1',
        lineItems: [
          {
            batchId: batch.id,
            quantitySold: 10,
            sellingPricePerUnit: 20.0,
          },
        ],
      });

      await SalesOrderService.createSalesOrder({
        orderDate: new Date('2024-01-20'),
        customerName: 'Customer 2',
        lineItems: [
          {
            batchId: batch.id,
            quantitySold: 5,
            sellingPricePerUnit: 25.0,
          },
        ],
      });

      // Create order in February (should not be included)
      await SalesOrderService.createSalesOrder({
        orderDate: new Date('2024-02-10'),
        customerName: 'Customer 3',
        lineItems: [
          {
            batchId: batch.id,
            quantitySold: 3,
            sellingPricePerUnit: 30.0,
          },
        ],
      });

      // Generate summary for January 2024
      const summary = await ReportService.generateMonthlyProfitSummary(1, 2024);

      // Verify summary
      expect(summary.month).toBe(1);
      expect(summary.year).toBe(2024);
      expect(summary.numberOfOrders).toBe(2);
      // Order 1: (20 - 10) * 10 = 100
      // Order 2: (25 - 10) * 5 = 75
      // Total: 175
      expect(summary.totalProfit).toBe(175);
      expect(summary.startDate.getFullYear()).toBe(2024);
      expect(summary.startDate.getMonth()).toBe(0); // January (0-indexed)
      expect(summary.startDate.getDate()).toBe(1); // First day
      expect(summary.endDate.getMonth()).toBe(0); // January
      expect(summary.endDate.getDate()).toBe(31); // Last day of January
    });

    it('should return zero profit and zero orders for month with no sales', async () => {
      // Generate summary for a month with no orders
      const summary = await ReportService.generateMonthlyProfitSummary(3, 2024);

      // Verify summary shows zero values
      expect(summary.month).toBe(3);
      expect(summary.year).toBe(2024);
      expect(summary.numberOfOrders).toBe(0);
      expect(summary.totalProfit).toBe(0);
      expect(summary.startDate.getFullYear()).toBe(2024);
      expect(summary.startDate.getMonth()).toBe(2); // March (0-indexed)
      expect(summary.startDate.getDate()).toBe(1); // First day
    });

    it('should validate month parameter', async () => {
      // Test invalid month values
      await expect(
        ReportService.generateMonthlyProfitSummary(0, 2024)
      ).rejects.toThrow('Month must be between 1 and 12');

      await expect(
        ReportService.generateMonthlyProfitSummary(13, 2024)
      ).rejects.toThrow('Month must be between 1 and 12');
    });

    it('should validate year parameter', async () => {
      // Test invalid year value
      await expect(
        ReportService.generateMonthlyProfitSummary(1, 2019)
      ).rejects.toThrow('Year must be 2020 or later');
    });

    it('should handle month boundaries correctly', async () => {
      // Create test batch
      const batch = await BatchService.createBatch({
        batchIdentifier: 'BATCH-001',
        productName: 'Product A',
        purchaseDate: new Date('2024-01-01'),
        purchasePricePerUnit: 10.0,
        initialQuantity: 1000,
      });

      // Create order on first day of month
      await SalesOrderService.createSalesOrder({
        orderDate: new Date('2024-01-01T00:00:00'),
        customerName: 'Customer 1',
        lineItems: [
          {
            batchId: batch.id,
            quantitySold: 10,
            sellingPricePerUnit: 20.0,
          },
        ],
      });

      // Create order on last day of month
      await SalesOrderService.createSalesOrder({
        orderDate: new Date('2024-01-31T23:59:59'),
        customerName: 'Customer 2',
        lineItems: [
          {
            batchId: batch.id,
            quantitySold: 5,
            sellingPricePerUnit: 25.0,
          },
        ],
      });

      // Generate summary
      const summary = await ReportService.generateMonthlyProfitSummary(1, 2024);

      // Both orders should be included
      expect(summary.numberOfOrders).toBe(2);
      expect(summary.totalProfit).toBe(175);
    });
  });
});
