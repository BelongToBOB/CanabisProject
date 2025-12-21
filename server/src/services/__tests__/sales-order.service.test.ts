import { SalesOrderService, CreateSalesOrderInput } from '../sales-order.service';
import { BatchService } from '../batch.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('SalesOrderService', () => {
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

  describe('createSalesOrder', () => {
    it('should create a sales order with line items and calculate profit correctly', async () => {
      // Create test batches
      const batch1 = await BatchService.createBatch({
        batchIdentifier: 'SO-TEST-001',
        productName: 'Test Product 1',
        purchaseDate: new Date('2024-01-01'),
        purchasePricePerUnit: 10.00,
        initialQuantity: 100,
      });

      const batch2 = await BatchService.createBatch({
        batchIdentifier: 'SO-TEST-002',
        productName: 'Test Product 2',
        purchaseDate: new Date('2024-01-01'),
        purchasePricePerUnit: 15.00,
        initialQuantity: 50,
      });

      // Create sales order
      const orderData: CreateSalesOrderInput = {
        customerName: 'Test Customer',
        lineItems: [
          {
            batchId: batch1.id,
            quantitySold: 10,
            sellingPricePerUnit: 20.00,
          },
          {
            batchId: batch2.id,
            quantitySold: 5,
            sellingPricePerUnit: 25.00,
          },
        ],
      };

      const order = await SalesOrderService.createSalesOrder(orderData);

      // Verify order was created
      expect(order).toBeDefined();
      expect(order.id).toBeDefined();
      expect(order.customerName).toBe('Test Customer');
      expect(order.isLocked).toBe(false);
      expect(order.lineItems).toHaveLength(2);

      // Verify line item 1 profit: (20 - 10) * 10 = 100
      const lineItem1 = order.lineItems.find(item => item.batchId === batch1.id);
      expect(lineItem1).toBeDefined();
      expect(lineItem1!.quantitySold).toBe(10);
      expect(lineItem1!.sellingPricePerUnit).toBe(20.00);
      expect(lineItem1!.lineProfit).toBe(100.00);

      // Verify line item 2 profit: (25 - 15) * 5 = 50
      const lineItem2 = order.lineItems.find(item => item.batchId === batch2.id);
      expect(lineItem2).toBeDefined();
      expect(lineItem2!.quantitySold).toBe(5);
      expect(lineItem2!.sellingPricePerUnit).toBe(25.00);
      expect(lineItem2!.lineProfit).toBe(50.00);

      // Verify total profit: 100 + 50 = 150
      expect(order.totalProfit).toBe(150.00);

      // Verify stock was deducted
      const updatedBatch1 = await BatchService.getBatchById(batch1.id);
      expect(updatedBatch1!.currentQuantity).toBe(90); // 100 - 10

      const updatedBatch2 = await BatchService.getBatchById(batch2.id);
      expect(updatedBatch2!.currentQuantity).toBe(45); // 50 - 5
    });

    it('should handle multiple line items referencing the same batch', async () => {
      // Create test batch
      const batch = await BatchService.createBatch({
        batchIdentifier: 'SO-TEST-003',
        productName: 'Test Product 3',
        purchaseDate: new Date('2024-01-01'),
        purchasePricePerUnit: 10.00,
        initialQuantity: 100,
      });

      // Create sales order with multiple line items for same batch
      const orderData: CreateSalesOrderInput = {
        lineItems: [
          {
            batchId: batch.id,
            quantitySold: 10,
            sellingPricePerUnit: 20.00,
          },
          {
            batchId: batch.id,
            quantitySold: 15,
            sellingPricePerUnit: 22.00,
          },
        ],
      };

      const order = await SalesOrderService.createSalesOrder(orderData);

      // Verify order was created
      expect(order).toBeDefined();
      expect(order.lineItems).toHaveLength(2);

      // Verify total stock deduction: 10 + 15 = 25
      const updatedBatch = await BatchService.getBatchById(batch.id);
      expect(updatedBatch!.currentQuantity).toBe(75); // 100 - 25

      // Verify total profit: (20-10)*10 + (22-10)*15 = 100 + 180 = 280
      expect(order.totalProfit).toBe(280.00);
    });

    it('should reject order with non-existent batch', async () => {
      const orderData: CreateSalesOrderInput = {
        lineItems: [
          {
            batchId: 99999, // Non-existent batch
            quantitySold: 10,
            sellingPricePerUnit: 20.00,
          },
        ],
      };

      await expect(SalesOrderService.createSalesOrder(orderData)).rejects.toThrow(
        'Batch(es) not found'
      );
    });

    it('should reject order with insufficient stock', async () => {
      // Create test batch with limited stock
      const batch = await BatchService.createBatch({
        batchIdentifier: 'SO-TEST-004',
        productName: 'Test Product 4',
        purchaseDate: new Date('2024-01-01'),
        purchasePricePerUnit: 10.00,
        initialQuantity: 5,
      });

      const orderData: CreateSalesOrderInput = {
        lineItems: [
          {
            batchId: batch.id,
            quantitySold: 10, // More than available
            sellingPricePerUnit: 20.00,
          },
        ],
      };

      await expect(SalesOrderService.createSalesOrder(orderData)).rejects.toThrow(
        'Insufficient stock'
      );

      // Verify stock was not deducted (transaction rolled back)
      const unchangedBatch = await BatchService.getBatchById(batch.id);
      expect(unchangedBatch!.currentQuantity).toBe(5);
    });

    it('should reject order with negative selling price', async () => {
      const batch = await BatchService.createBatch({
        batchIdentifier: 'SO-TEST-005',
        productName: 'Test Product 5',
        purchaseDate: new Date('2024-01-01'),
        purchasePricePerUnit: 10.00,
        initialQuantity: 100,
      });

      const orderData: CreateSalesOrderInput = {
        lineItems: [
          {
            batchId: batch.id,
            quantitySold: 10,
            sellingPricePerUnit: -5.00, // Negative price
          },
        ],
      };

      await expect(SalesOrderService.createSalesOrder(orderData)).rejects.toThrow(
        'Selling price per unit must be non-negative'
      );
    });

    it('should reject order with invalid quantity', async () => {
      const batch = await BatchService.createBatch({
        batchIdentifier: 'SO-TEST-006',
        productName: 'Test Product 6',
        purchaseDate: new Date('2024-01-01'),
        purchasePricePerUnit: 10.00,
        initialQuantity: 100,
      });

      const orderData: CreateSalesOrderInput = {
        lineItems: [
          {
            batchId: batch.id,
            quantitySold: 0, // Invalid quantity
            sellingPricePerUnit: 20.00,
          },
        ],
      };

      await expect(SalesOrderService.createSalesOrder(orderData)).rejects.toThrow(
        'Quantity sold must be a positive integer'
      );
    });

    it('should reject order with no line items', async () => {
      const orderData: CreateSalesOrderInput = {
        lineItems: [],
      };

      await expect(SalesOrderService.createSalesOrder(orderData)).rejects.toThrow(
        'Sales order must contain at least one line item'
      );
    });

    it('should calculate negative profit correctly (loss)', async () => {
      // Create batch with high purchase price
      const batch = await BatchService.createBatch({
        batchIdentifier: 'SO-TEST-007',
        productName: 'Test Product 7',
        purchaseDate: new Date('2024-01-01'),
        purchasePricePerUnit: 30.00,
        initialQuantity: 100,
      });

      // Sell at lower price (loss)
      const orderData: CreateSalesOrderInput = {
        lineItems: [
          {
            batchId: batch.id,
            quantitySold: 10,
            sellingPricePerUnit: 20.00, // Selling below cost
          },
        ],
      };

      const order = await SalesOrderService.createSalesOrder(orderData);

      // Verify negative profit: (20 - 30) * 10 = -100
      expect(order.totalProfit).toBe(-100.00);
      expect(order.lineItems[0].lineProfit).toBe(-100.00);
    });
  });

  describe('getSalesOrders', () => {
    it('should retrieve all sales orders', async () => {
      // Create batch and order first
      const batch = await BatchService.createBatch({
        batchIdentifier: 'SO-TEST-GET-ALL-001',
        productName: 'Get All Test',
        purchaseDate: new Date('2024-01-01'),
        purchasePricePerUnit: 10.00,
        initialQuantity: 100,
      });

      await SalesOrderService.createSalesOrder({
        lineItems: [
          {
            batchId: batch.id,
            quantitySold: 5,
            sellingPricePerUnit: 20.00,
          },
        ],
      });

      const orders = await SalesOrderService.getSalesOrders();
      expect(Array.isArray(orders)).toBe(true);
      expect(orders.length).toBeGreaterThan(0);
    });

    it('should filter orders by date range', async () => {
      // Create batch
      const batch = await BatchService.createBatch({
        batchIdentifier: 'SO-TEST-FILTER-001',
        productName: 'Filter Test',
        purchaseDate: new Date('2024-01-01'),
        purchasePricePerUnit: 10.00,
        initialQuantity: 100,
      });

      // Create order with specific date
      const orderData: CreateSalesOrderInput = {
        orderDate: new Date('2024-06-15'),
        lineItems: [
          {
            batchId: batch.id,
            quantitySold: 5,
            sellingPricePerUnit: 20.00,
          },
        ],
      };

      await SalesOrderService.createSalesOrder(orderData);

      // Filter by date range
      const orders = await SalesOrderService.getSalesOrders({
        startDate: new Date('2024-06-01'),
        endDate: new Date('2024-06-30'),
      });

      expect(orders.length).toBeGreaterThan(0);
      orders.forEach(order => {
        expect(order.orderDate.getTime()).toBeGreaterThanOrEqual(new Date('2024-06-01').getTime());
        expect(order.orderDate.getTime()).toBeLessThanOrEqual(new Date('2024-06-30').getTime());
      });
    });
  });

  describe('getSalesOrderById', () => {
    it('should retrieve a specific sales order', async () => {
      // Create batch and order
      const batch = await BatchService.createBatch({
        batchIdentifier: 'SO-TEST-GET-001',
        productName: 'Get Test',
        purchaseDate: new Date('2024-01-01'),
        purchasePricePerUnit: 10.00,
        initialQuantity: 100,
      });

      const orderData: CreateSalesOrderInput = {
        customerName: 'Specific Customer',
        lineItems: [
          {
            batchId: batch.id,
            quantitySold: 5,
            sellingPricePerUnit: 20.00,
          },
        ],
      };

      const createdOrder = await SalesOrderService.createSalesOrder(orderData);

      // Retrieve by ID
      const retrievedOrder = await SalesOrderService.getSalesOrderById(createdOrder.id);

      expect(retrievedOrder).toBeDefined();
      expect(retrievedOrder!.id).toBe(createdOrder.id);
      expect(retrievedOrder!.customerName).toBe('Specific Customer');
      expect(retrievedOrder!.lineItems).toHaveLength(1);
    });

    it('should return null for non-existent order', async () => {
      const order = await SalesOrderService.getSalesOrderById(99999);
      expect(order).toBeNull();
    });
  });

  describe('deleteSalesOrder', () => {
    it('should delete an unlocked sales order', async () => {
      // Create batch and order
      const batch = await BatchService.createBatch({
        batchIdentifier: 'SO-TEST-DELETE-001',
        productName: 'Delete Test',
        purchaseDate: new Date('2024-01-01'),
        purchasePricePerUnit: 10.00,
        initialQuantity: 100,
      });

      const orderData: CreateSalesOrderInput = {
        lineItems: [
          {
            batchId: batch.id,
            quantitySold: 5,
            sellingPricePerUnit: 20.00,
          },
        ],
      };

      const createdOrder = await SalesOrderService.createSalesOrder(orderData);

      // Delete order
      const deletedOrder = await SalesOrderService.deleteSalesOrder(createdOrder.id);

      expect(deletedOrder).toBeDefined();
      expect(deletedOrder.id).toBe(createdOrder.id);

      // Verify order is deleted
      const retrievedOrder = await SalesOrderService.getSalesOrderById(createdOrder.id);
      expect(retrievedOrder).toBeNull();
    });

    it('should throw error when deleting non-existent order', async () => {
      await expect(SalesOrderService.deleteSalesOrder(99999)).rejects.toThrow(
        'Sales order not found'
      );
    });
  });
});
