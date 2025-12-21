import { PrismaClient, SalesOrder, SalesOrderLineItem, Batch } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

export interface LineItemInput {
  batchId: number;
  quantitySold: number;
  sellingPricePerUnit: number;
}

export interface CreateSalesOrderInput {
  orderDate?: Date;
  customerName?: string;
  lineItems: LineItemInput[];
}

export interface SalesOrderFilters {
  startDate?: Date;
  endDate?: Date;
  isLocked?: boolean;
  customerName?: string;
}

export interface LineItemResponse {
  id: number;
  batchId: number;
  batchIdentifier: string;
  productName: string;
  purchasePricePerUnit: number;
  quantitySold: number;
  sellingPricePerUnit: number;
  lineProfit: number;
}

export interface SalesOrderResponse {
  id: number;
  orderDate: Date;
  customerName: string | null;
  totalProfit: number;
  isLocked: boolean;
  createdAt: Date;
  updatedAt: Date;
  lineItems: LineItemResponse[];
}

type SalesOrderWithRelations = SalesOrder & {
  lineItems: (SalesOrderLineItem & {
    batch: Batch | null;
  })[];
};

export class SalesOrderService {
  /**
   * Convert SalesOrder model to SalesOrderResponse
   */
  private static toSalesOrderResponse(order: SalesOrderWithRelations): SalesOrderResponse {
    return {
      id: order.id,
      orderDate: order.orderDate,
      customerName: order.customerName,
      totalProfit: order.totalProfit.toNumber(),
      isLocked: order.isLocked,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      lineItems: order.lineItems.map(item => ({
        id: item.id,
        batchId: item.batchId,
        // Handle case where batch might be null (shouldn't happen with proper referential integrity)
        batchIdentifier: item.batch?.batchIdentifier || 'Unknown',
        productName: item.batch?.productName || 'Unknown',
        purchasePricePerUnit: item.batch?.purchasePricePerUnit.toNumber() || 0,
        quantitySold: item.quantitySold,
        sellingPricePerUnit: item.sellingPricePerUnit.toNumber(),
        lineProfit: item.lineProfit.toNumber(),
      })),
    };
  }

  /**
   * Validate line items for batch existence and stock availability
   * Requirements: 3.2, 3.3
   * @param lineItems - Line items to validate
   * @throws Error if validation fails
   */
  private static async validateLineItems(lineItems: LineItemInput[]): Promise<void> {
    if (!lineItems || lineItems.length === 0) {
      throw new Error('Sales order must contain at least one line item');
    }

    // Aggregate quantities by batch (for multiple line items referencing same batch)
    const batchQuantities = new Map<number, number>();
    for (const item of lineItems) {
      const currentQty = batchQuantities.get(item.batchId) || 0;
      batchQuantities.set(item.batchId, currentQty + item.quantitySold);
    }

    // Validate each line item
    for (const item of lineItems) {
      // Validate quantity values (positive integers) - Requirement 11.5
      if (!Number.isInteger(item.quantitySold) || item.quantitySold <= 0) {
        throw new Error('Quantity sold must be a positive integer');
      }

      // Validate monetary values (non-negative) - Requirement 11.4
      if (item.sellingPricePerUnit < 0) {
        throw new Error('Selling price per unit must be non-negative');
      }
    }

    // Check batch existence and stock availability
    const batchIds = Array.from(batchQuantities.keys());
    const batches = await prisma.batch.findMany({
      where: {
        id: { in: batchIds },
      },
    });

    // Requirement 3.2: Validate that all specified batches exist
    if (batches.length !== batchIds.length) {
      const foundIds = batches.map(b => b.id);
      const missingIds = batchIds.filter(id => !foundIds.includes(id));
      throw new Error(`Batch(es) not found: ${missingIds.join(', ')}`);
    }

    // Requirement 3.3: Validate sufficient quantity exists in each batch
    for (const batch of batches) {
      const requiredQty = batchQuantities.get(batch.id) || 0;
      if (batch.currentQuantity < requiredQty) {
        throw new Error(
          `Insufficient stock for batch ${batch.batchIdentifier}. Available: ${batch.currentQuantity}, Required: ${requiredQty}`
        );
      }
    }
  }

  /**
   * Calculate profit for line items
   * Requirements: 5.1
   * @param lineItems - Line items with batch information
   * @returns Array of line items with calculated profit
   */
  private static async calculateLineItemProfits(
    lineItems: LineItemInput[]
  ): Promise<Array<LineItemInput & { lineProfit: number; purchasePricePerUnit: number }>> {
    const batchIds = lineItems.map(item => item.batchId);
    const batches = await prisma.batch.findMany({
      where: {
        id: { in: batchIds },
      },
    });

    const batchMap = new Map(batches.map(b => [b.id, b]));

    return lineItems.map(item => {
      const batch = batchMap.get(item.batchId);
      if (!batch) {
        throw new Error(`Batch ${item.batchId} not found`);
      }

      const purchasePricePerUnit = batch.purchasePricePerUnit.toNumber();
      // Requirement 5.1: lineProfit = (sellingPrice - purchasePrice) * quantity
      const lineProfit = (item.sellingPricePerUnit - purchasePricePerUnit) * item.quantitySold;

      return {
        ...item,
        lineProfit,
        purchasePricePerUnit,
      };
    });
  }

  /**
   * Calculate total order profit
   * Requirements: 5.2
   * @param lineItemsWithProfit - Line items with calculated profit
   * @returns Total profit
   */
  private static calculateTotalProfit(
    lineItemsWithProfit: Array<{ lineProfit: number }>
  ): number {
    // Requirement 5.2: totalProfit = sum of all line item profits
    return lineItemsWithProfit.reduce((sum, item) => sum + item.lineProfit, 0);
  }

  /**
   * Create a new sales order with automatic stock deduction
   * Requirements: 3.1, 3.2, 3.3, 4.1, 4.2, 4.3, 4.4, 5.1, 5.2
   * @param data - Sales order creation data
   * @returns Created sales order with line items
   */
  static async createSalesOrder(data: CreateSalesOrderInput): Promise<SalesOrderResponse> {
    // Validate line items (batch existence and stock availability)
    await this.validateLineItems(data.lineItems);

    // Calculate line item profits
    const lineItemsWithProfit = await this.calculateLineItemProfits(data.lineItems);

    // Calculate total order profit
    const totalProfit = this.calculateTotalProfit(lineItemsWithProfit);

    // Requirement 4.4: Execute all operations as an atomic transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create sales order
      const order = await tx.salesOrder.create({
        data: {
          orderDate: data.orderDate || new Date(),
          customerName: data.customerName || null,
          totalProfit: new Decimal(totalProfit),
          isLocked: false,
        },
      });

      // Create line items
      await Promise.all(
        lineItemsWithProfit.map(item =>
          tx.salesOrderLineItem.create({
            data: {
              salesOrderId: order.id,
              batchId: item.batchId,
              quantitySold: item.quantitySold,
              sellingPricePerUnit: new Decimal(item.sellingPricePerUnit),
              lineProfit: new Decimal(item.lineProfit),
            },
          })
        )
      );

      // Requirement 4.1, 4.2: Deduct stock from batches
      // Aggregate quantities by batch (for multiple line items referencing same batch)
      const batchQuantities = new Map<number, number>();
      for (const item of data.lineItems) {
        const currentQty = batchQuantities.get(item.batchId) || 0;
        batchQuantities.set(item.batchId, currentQty + item.quantitySold);
      }

      // Update batch quantities
      await Promise.all(
        Array.from(batchQuantities.entries()).map(([batchId, quantity]) =>
          tx.batch.update({
            where: { id: batchId },
            data: {
              currentQuantity: {
                decrement: quantity,
              },
            },
          })
        )
      );

      // Fetch the complete order with relations
      const completeOrder = await tx.salesOrder.findUnique({
        where: { id: order.id },
        include: {
          lineItems: {
            include: {
              batch: true,
            },
          },
        },
      });

      if (!completeOrder) {
        throw new Error('Failed to retrieve created order');
      }

      return completeOrder;
    });

    return this.toSalesOrderResponse(result);
  }

  /**
   * Get all sales orders with optional filtering
   * Requirements: 3.1, 5.4
   * @param filters - Optional filters
   * @returns Array of sales orders
   */
  static async getSalesOrders(filters?: SalesOrderFilters): Promise<SalesOrderResponse[]> {
    const where: any = {};

    if (filters?.startDate || filters?.endDate) {
      where.orderDate = {};
      if (filters.startDate) {
        where.orderDate.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.orderDate.lte = filters.endDate;
      }
    }

    if (filters?.isLocked !== undefined) {
      where.isLocked = filters.isLocked;
    }

    if (filters?.customerName) {
      where.customerName = {
        contains: filters.customerName,
      };
    }

    const orders = await prisma.salesOrder.findMany({
      where,
      include: {
        lineItems: {
          include: {
            batch: true,
          },
        },
      },
      orderBy: {
        orderDate: 'desc',
      },
    });

    return orders.map(order => this.toSalesOrderResponse(order));
  }

  /**
   * Get sales order by ID
   * Requirements: 3.1, 5.4
   * @param id - Sales order ID
   * @returns Sales order or null if not found
   */
  static async getSalesOrderById(id: number): Promise<SalesOrderResponse | null> {
    const order = await prisma.salesOrder.findUnique({
      where: { id },
      include: {
        lineItems: {
          include: {
            batch: true,
          },
        },
      },
    });

    if (!order) {
      return null;
    }

    return this.toSalesOrderResponse(order);
  }

  /**
   * Delete sales order (only if unlocked)
   * Requirements: 8.3
   * @param id - Sales order ID
   * @returns Deleted sales order
   */
  static async deleteSalesOrder(id: number): Promise<SalesOrderResponse> {
    // Check if order exists
    const existingOrder = await prisma.salesOrder.findUnique({
      where: { id },
      include: {
        lineItems: {
          include: {
            batch: true,
          },
        },
      },
    });

    if (!existingOrder) {
      throw new Error('Sales order not found');
    }

    // Requirement 8.3: Prevent deletion of locked orders
    if (existingOrder.isLocked) {
      throw new Error('Cannot delete locked sales order');
    }

    // Delete order (line items will be cascade deleted)
    await prisma.salesOrder.delete({
      where: { id },
    });

    return this.toSalesOrderResponse(existingOrder);
  }
}
