import { ProfitShareService, ExecuteProfitSplitInput } from '../profit-share.service';
import { SalesOrderService, CreateSalesOrderInput } from '../sales-order.service';
import { BatchService } from '../batch.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('ProfitShareService', () => {
  // Clean up test data before and after each test
  beforeEach(async () => {
    // Delete in correct order due to foreign key constraints
    await prisma.profitShare.deleteMany({});
    await prisma.salesOrderLineItem.deleteMany({});
    await prisma.salesOrder.deleteMany({});
    await prisma.batch.deleteMany({});
  });

  afterEach(async () => {
    // Delete in correct order due to foreign key constraints
    await prisma.profitShare.deleteMany({});
    await prisma.salesOrderLineItem.deleteMany({});
    await prisma.salesOrder.deleteMany({});
    await prisma.batch.deleteMany({});
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('executeProfitSplit', () => {
    it('should execute profit split and create two equal shares', async () => {
      // Create test batch
      const batch = await BatchService.createBatch({
        batchIdentifier: 'PS-TEST-001',
        productName: 'Test Product',
        purchaseDate: new Date('2024-01-01'),
        purchasePricePerUnit: 10.00,
        initialQuantity: 1000,
      });

      // Create sales orders in January 2024
      const order1Data: CreateSalesOrderInput = {
        orderDate: new Date('2024-01-15'),
        customerName: 'Customer 1',
        lineItems: [
          {
            batchId: batch.id,
            quantitySold: 10,
            sellingPricePerUnit: 20.00, // Profit: (20-10)*10 = 100
          },
        ],
      };

      const order2Data: CreateSalesOrderInput = {
        orderDate: new Date('2024-01-20'),
        customerName: 'Customer 2',
        lineItems: [
          {
            batchId: batch.id,
            quantitySold: 20,
            sellingPricePerUnit: 25.00, // Profit: (25-10)*20 = 300
          },
        ],
      };

      await SalesOrderService.createSalesOrder(order1Data);
      await SalesOrderService.createSalesOrder(order2Data);

      // Execute profit split for January 2024
      const profitSplit: ExecuteProfitSplitInput = {
        month: 1,
        year: 2024,
      };

      const profitShare = await ProfitShareService.executeProfitSplit(profitSplit);

      // Verify profit share was created
      expect(profitShare).toBeDefined();
      expect(profitShare.id).toBeDefined();
      expect(profitShare.month).toBe(1);
      expect(profitShare.year).toBe(2024);
      
      // Total profit should be 100 + 300 = 400
      expect(profitShare.totalProfit).toBe(400.00);
      
      // Each owner should get 50% = 200
      expect(profitShare.amountPerOwner).toBe(200.00);
      
      expect(profitShare.executionDate).toBeDefined();
      expect(profitShare.createdAt).toBeDefined();
    });

    it('should lock sales orders after profit split', async () => {
      // Create test batch
      const batch = await BatchService.createBatch({
        batchIdentifier: 'PS-TEST-002',
        productName: 'Test Product 2',
        purchaseDate: new Date('2024-02-01'),
        purchasePricePerUnit: 10.00,
        initialQuantity: 1000,
      });

      // Create sales order in February 2024
      const orderData: CreateSalesOrderInput = {
        orderDate: new Date('2024-02-15'),
        lineItems: [
          {
            batchId: batch.id,
            quantitySold: 10,
            sellingPricePerUnit: 20.00,
          },
        ],
      };

      const order = await SalesOrderService.createSalesOrder(orderData);
      
      // Verify order is initially unlocked
      expect(order.isLocked).toBe(false);

      // Execute profit split for February 2024
      await ProfitShareService.executeProfitSplit({
        month: 2,
        year: 2024,
      });

      // Verify order is now locked
      const lockedOrder = await SalesOrderService.getSalesOrderById(order.id);
      expect(lockedOrder).toBeDefined();
      expect(lockedOrder!.isLocked).toBe(true);
    });

    it('should prevent duplicate profit splits for the same month', async () => {
      // Create test batch
      const batch = await BatchService.createBatch({
        batchIdentifier: 'PS-TEST-003',
        productName: 'Test Product 3',
        purchaseDate: new Date('2024-03-01'),
        purchasePricePerUnit: 10.00,
        initialQuantity: 1000,
      });

      // Create sales order in March 2024
      await SalesOrderService.createSalesOrder({
        orderDate: new Date('2024-03-15'),
        lineItems: [
          {
            batchId: batch.id,
            quantitySold: 10,
            sellingPricePerUnit: 20.00,
          },
        ],
      });

      // Execute profit split for March 2024
      await ProfitShareService.executeProfitSplit({
        month: 3,
        year: 2024,
      });

      // Attempt to execute again for the same month
      await expect(
        ProfitShareService.executeProfitSplit({
          month: 3,
          year: 2024,
        })
      ).rejects.toThrow('Profit split already executed for 3/2024');
    });

    it('should handle zero profit when no orders exist', async () => {
      // Execute profit split for a month with no orders
      const profitShare = await ProfitShareService.executeProfitSplit({
        month: 4,
        year: 2024,
      });

      expect(profitShare).toBeDefined();
      expect(profitShare.totalProfit).toBe(0);
      expect(profitShare.amountPerOwner).toBe(0);
    });

    it('should only include unlocked orders in profit calculation', async () => {
      // Create test batch
      const batch = await BatchService.createBatch({
        batchIdentifier: 'PS-TEST-004',
        productName: 'Test Product 4',
        purchaseDate: new Date('2024-05-01'),
        purchasePricePerUnit: 10.00,
        initialQuantity: 1000,
      });

      // Create two orders in May 2024
      const order1 = await SalesOrderService.createSalesOrder({
        orderDate: new Date('2024-05-10'),
        lineItems: [
          {
            batchId: batch.id,
            quantitySold: 10,
            sellingPricePerUnit: 20.00, // Profit: 100
          },
        ],
      });

      await SalesOrderService.createSalesOrder({
        orderDate: new Date('2024-05-20'),
        lineItems: [
          {
            batchId: batch.id,
            quantitySold: 10,
            sellingPricePerUnit: 20.00, // Profit: 100
          },
        ],
      });

      // Manually lock the first order
      await prisma.salesOrder.update({
        where: { id: order1.id },
        data: { isLocked: true },
      });

      // Execute profit split for May 2024
      const profitShare = await ProfitShareService.executeProfitSplit({
        month: 5,
        year: 2024,
      });

      // Should only include the unlocked order (profit = 100)
      expect(profitShare.totalProfit).toBe(100.00);
      expect(profitShare.amountPerOwner).toBe(50.00);
    });

    it('should reject invalid month values', async () => {
      await expect(
        ProfitShareService.executeProfitSplit({
          month: 0,
          year: 2024,
        })
      ).rejects.toThrow('Month must be an integer between 1 and 12');

      await expect(
        ProfitShareService.executeProfitSplit({
          month: 13,
          year: 2024,
        })
      ).rejects.toThrow('Month must be an integer between 1 and 12');
    });

    it('should reject invalid year values', async () => {
      await expect(
        ProfitShareService.executeProfitSplit({
          month: 1,
          year: 2019,
        })
      ).rejects.toThrow('Year must be an integer >= 2020');
    });

    it('should handle negative profit (losses)', async () => {
      // Create test batch with high purchase price
      const batch = await BatchService.createBatch({
        batchIdentifier: 'PS-TEST-005',
        productName: 'Test Product 5',
        purchaseDate: new Date('2024-06-01'),
        purchasePricePerUnit: 30.00,
        initialQuantity: 1000,
      });

      // Create order selling at a loss
      await SalesOrderService.createSalesOrder({
        orderDate: new Date('2024-06-15'),
        lineItems: [
          {
            batchId: batch.id,
            quantitySold: 10,
            sellingPricePerUnit: 20.00, // Profit: (20-30)*10 = -100
          },
        ],
      });

      // Execute profit split for June 2024
      const profitShare = await ProfitShareService.executeProfitSplit({
        month: 6,
        year: 2024,
      });

      // Should handle negative profit
      expect(profitShare.totalProfit).toBe(-100.00);
      expect(profitShare.amountPerOwner).toBe(-50.00);
    });
  });

  describe('getProfitShares', () => {
    it('should retrieve all profit shares ordered by execution date', async () => {
      // Create test batch
      const batch = await BatchService.createBatch({
        batchIdentifier: 'PS-TEST-GET-001',
        productName: 'Get Test',
        purchaseDate: new Date('2024-01-01'),
        purchasePricePerUnit: 10.00,
        initialQuantity: 1000,
      });

      // Create orders in different months
      await SalesOrderService.createSalesOrder({
        orderDate: new Date('2024-01-15'),
        lineItems: [
          {
            batchId: batch.id,
            quantitySold: 10,
            sellingPricePerUnit: 20.00,
          },
        ],
      });

      await SalesOrderService.createSalesOrder({
        orderDate: new Date('2024-02-15'),
        lineItems: [
          {
            batchId: batch.id,
            quantitySold: 10,
            sellingPricePerUnit: 20.00,
          },
        ],
      });

      // Execute profit splits
      await ProfitShareService.executeProfitSplit({ month: 1, year: 2024 });
      
      // Wait a bit to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));
      
      await ProfitShareService.executeProfitSplit({ month: 2, year: 2024 });

      // Retrieve all profit shares
      const profitShares = await ProfitShareService.getProfitShares();

      expect(Array.isArray(profitShares)).toBe(true);
      expect(profitShares.length).toBe(2);
      
      // Verify ordering (most recent first)
      expect(profitShares[0].month).toBe(2);
      expect(profitShares[1].month).toBe(1);
      
      // Verify execution dates are in descending order
      expect(profitShares[0].executionDate.getTime()).toBeGreaterThanOrEqual(
        profitShares[1].executionDate.getTime()
      );
    });

    it('should return empty array when no profit shares exist', async () => {
      const profitShares = await ProfitShareService.getProfitShares();
      expect(Array.isArray(profitShares)).toBe(true);
      expect(profitShares.length).toBe(0);
    });
  });

  describe('getProfitShareById', () => {
    it('should retrieve a specific profit share', async () => {
      // Create test batch
      const batch = await BatchService.createBatch({
        batchIdentifier: 'PS-TEST-GET-ID-001',
        productName: 'Get ID Test',
        purchaseDate: new Date('2024-01-01'),
        purchasePricePerUnit: 10.00,
        initialQuantity: 1000,
      });

      // Create order
      await SalesOrderService.createSalesOrder({
        orderDate: new Date('2024-07-15'),
        lineItems: [
          {
            batchId: batch.id,
            quantitySold: 10,
            sellingPricePerUnit: 20.00,
          },
        ],
      });

      // Execute profit split
      const createdProfitShare = await ProfitShareService.executeProfitSplit({
        month: 7,
        year: 2024,
      });

      // Retrieve by ID
      const retrievedProfitShare = await ProfitShareService.getProfitShareById(
        createdProfitShare.id
      );

      expect(retrievedProfitShare).toBeDefined();
      expect(retrievedProfitShare!.id).toBe(createdProfitShare.id);
      expect(retrievedProfitShare!.month).toBe(7);
      expect(retrievedProfitShare!.year).toBe(2024);
      expect(retrievedProfitShare!.totalProfit).toBe(100.00);
      expect(retrievedProfitShare!.amountPerOwner).toBe(50.00);
    });

    it('should return null for non-existent profit share', async () => {
      const profitShare = await ProfitShareService.getProfitShareById(99999);
      expect(profitShare).toBeNull();
    });
  });

  describe('getProfitShareByMonthYear', () => {
    it('should retrieve profit share by month and year', async () => {
      // Create test batch
      const batch = await BatchService.createBatch({
        batchIdentifier: 'PS-TEST-GET-MY-001',
        productName: 'Get Month Year Test',
        purchaseDate: new Date('2024-01-01'),
        purchasePricePerUnit: 10.00,
        initialQuantity: 1000,
      });

      // Create order
      await SalesOrderService.createSalesOrder({
        orderDate: new Date('2024-08-15'),
        lineItems: [
          {
            batchId: batch.id,
            quantitySold: 10,
            sellingPricePerUnit: 20.00,
          },
        ],
      });

      // Execute profit split
      await ProfitShareService.executeProfitSplit({
        month: 8,
        year: 2024,
      });

      // Retrieve by month and year
      const profitShare = await ProfitShareService.getProfitShareByMonthYear(8, 2024);

      expect(profitShare).toBeDefined();
      expect(profitShare!.month).toBe(8);
      expect(profitShare!.year).toBe(2024);
      expect(profitShare!.totalProfit).toBe(100.00);
    });

    it('should return null for non-existent month/year combination', async () => {
      const profitShare = await ProfitShareService.getProfitShareByMonthYear(12, 2099);
      expect(profitShare).toBeNull();
    });
  });
});
