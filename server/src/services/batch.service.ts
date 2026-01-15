import { PrismaClient, Batch } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

export interface CreateBatchInput {
  batchIdentifier: string;
  productName: string;
  purchaseDate: Date;
  purchasePricePerUnit: number;
  defaultSellingPricePerUnit?: number;
  initialQuantity: number;
}

export interface UpdateBatchInput {
  productName?: string;
  currentQuantity?: number;
  defaultSellingPricePerUnit?: number;
  // Note: purchaseDate and purchasePricePerUnit are intentionally excluded (immutable)
}

export interface BatchFilters {
  productName?: string;
}

export interface BatchResponse {
  id: number;
  batchIdentifier: string;
  productName: string;
  purchaseDate: Date;
  purchasePricePerUnit: number;
  defaultSellingPricePerUnit: number;
  initialQuantity: number;
  currentQuantity: number;
  createdAt: Date;
  updatedAt: Date;
}

export class BatchService {
  /**
   * Convert Batch model to BatchResponse (convert Decimal to number)
   */
  private static toBatchResponse(batch: Batch): BatchResponse {
    return {
      id: batch.id,
      batchIdentifier: batch.batchIdentifier,
      productName: batch.productName,
      purchaseDate: batch.purchaseDate,
      purchasePricePerUnit: batch.purchasePricePerUnit.toNumber(),
      defaultSellingPricePerUnit: batch.defaultSellingPricePerUnit.toNumber(),
      initialQuantity: batch.initialQuantity,
      currentQuantity: batch.currentQuantity,
      createdAt: batch.createdAt,
      updatedAt: batch.updatedAt,
    };
  }

  /**
   * Create a new batch
   * Requirements: 2.1, 2.2, 2.3
   * @param data - Batch creation data
   * @returns Created batch
   */
  static async createBatch(data: CreateBatchInput): Promise<BatchResponse> {
    // Validate input
    if (!data.batchIdentifier || !data.productName) {
      throw new Error('Batch identifier and product name are required');
    }

    // Validate monetary values (non-negative) - Requirement 11.4
    if (data.purchasePricePerUnit < 0) {
      throw new Error('Purchase price per unit must be non-negative');
    }

    // Validate default selling price if provided
    if (data.defaultSellingPricePerUnit !== undefined && data.defaultSellingPricePerUnit < 0) {
      throw new Error('Default selling price per unit must be non-negative');
    }

    // Validate quantity values (positive integers) - Requirement 11.5
    if (!Number.isInteger(data.initialQuantity) || data.initialQuantity <= 0) {
      throw new Error('Initial quantity must be a positive integer');
    }

    // Check if batch identifier already exists - Requirement 2.2
    const existingBatch = await prisma.batch.findUnique({
      where: { batchIdentifier: data.batchIdentifier },
    });

    if (existingBatch) {
      throw new Error('Batch identifier already exists');
    }

    // Create batch with currentQuantity equal to initialQuantity - Requirement 2.3
    const batch = await prisma.batch.create({
      data: {
        batchIdentifier: data.batchIdentifier,
        productName: data.productName,
        purchaseDate: data.purchaseDate,
        purchasePricePerUnit: new Decimal(data.purchasePricePerUnit),
        defaultSellingPricePerUnit: new Decimal(data.defaultSellingPricePerUnit || 0),
        initialQuantity: data.initialQuantity,
        currentQuantity: data.initialQuantity, // Initialize to initial quantity
      },
    });

    return this.toBatchResponse(batch);
  }

  /**
   * Get all batches with optional filtering
   * Requirements: 2.5
   * @param filters - Optional filters (e.g., productName)
   * @returns Array of batches
   */
  static async getBatches(filters?: BatchFilters): Promise<BatchResponse[]> {
    const where: any = {};

    if (filters?.productName) {
      where.productName = filters.productName;
    }

    const batches = await prisma.batch.findMany({
      where,
      orderBy: [
        { productName: 'asc' },
        { batchIdentifier: 'asc' },
      ],
    });

    return batches.map(batch => this.toBatchResponse(batch));
  }

  /**
   * Get available batches for sales order creation
   * Returns only batches with currentQuantity > 0
   * Accessible by both ADMIN and STAFF
   * @returns Array of available batches
   */
  static async getAvailableBatches(): Promise<BatchResponse[]> {
    const batches = await prisma.batch.findMany({
      where: {
        currentQuantity: {
          gt: 0,
        },
      },
      orderBy: [
        { productName: 'asc' },
        { batchIdentifier: 'asc' },
      ],
    });

    return batches.map(batch => this.toBatchResponse(batch));
  }

  /**
   * Get batch by ID
   * @param id - Batch ID
   * @returns Batch or null if not found
   */
  static async getBatchById(id: number): Promise<BatchResponse | null> {
    const batch = await prisma.batch.findUnique({
      where: { id },
    });

    if (!batch) {
      return null;
    }

    return this.toBatchResponse(batch);
  }

  /**
   * Get batch by batch identifier
   * @param batchIdentifier - Batch identifier
   * @returns Batch or null if not found
   */
  static async getBatchByIdentifier(batchIdentifier: string): Promise<BatchResponse | null> {
    const batch = await prisma.batch.findUnique({
      where: { batchIdentifier },
    });

    if (!batch) {
      return null;
    }

    return this.toBatchResponse(batch);
  }

  /**
   * Check if a batch has sufficient quantity available
   * @param batchId - Batch ID
   * @param quantity - Quantity to check
   * @returns True if sufficient quantity is available, false otherwise
   */
  static async checkBatchAvailability(batchId: number, quantity: number): Promise<boolean> {
    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
    });

    if (!batch) {
      return false;
    }

    return batch.currentQuantity >= quantity;
  }

  /**
   * Update batch (with immutability constraints)
   * Requirements: 2.4 - Prevent purchase price and purchase date changes
   * @param id - Batch ID
   * @param data - Update data (only allowed fields)
   * @returns Updated batch
   */
  static async updateBatch(id: number, data: UpdateBatchInput): Promise<BatchResponse> {
    // Check if batch exists
    const existingBatch = await prisma.batch.findUnique({
      where: { id },
    });

    if (!existingBatch) {
      throw new Error('Batch not found');
    }

    // Prepare update data (only allowed fields)
    const updateData: any = {};

    if (data.productName !== undefined) {
      updateData.productName = data.productName;
    }

    if (data.currentQuantity !== undefined) {
      // Validate quantity value (non-negative integer) - Requirement 11.5
      if (!Number.isInteger(data.currentQuantity) || data.currentQuantity < 0) {
        throw new Error('Current quantity must be a non-negative integer');
      }

      // Ensure current quantity doesn't exceed initial quantity
      if (data.currentQuantity > existingBatch.initialQuantity) {
        throw new Error('Current quantity cannot exceed initial quantity');
      }

      updateData.currentQuantity = data.currentQuantity;
    }

    if (data.defaultSellingPricePerUnit !== undefined) {
      // Validate default selling price (non-negative)
      if (data.defaultSellingPricePerUnit < 0) {
        throw new Error('Default selling price per unit must be non-negative');
      }

      updateData.defaultSellingPricePerUnit = new Decimal(data.defaultSellingPricePerUnit);
    }

    // Update batch (purchaseDate and purchasePricePerUnit are immutable)
    const updatedBatch = await prisma.batch.update({
      where: { id },
      data: updateData,
    });

    return this.toBatchResponse(updatedBatch);
  }

  /**
   * Delete batch with referential integrity check
   * Requirements: 11.3 - Prevent deletion if referenced by sales orders
   * @param id - Batch ID
   * @returns Deleted batch
   */
  static async deleteBatch(id: number): Promise<BatchResponse> {
    // Check if batch exists
    const existingBatch = await prisma.batch.findUnique({
      where: { id },
      include: {
        lineItems: true, // Include related line items
      },
    });

    if (!existingBatch) {
      throw new Error('Batch not found');
    }

    // Check referential integrity - Requirement 11.3
    if (existingBatch.lineItems.length > 0) {
      throw new Error('Cannot delete batch that is referenced by sales orders');
    }

    // Delete batch
    const deletedBatch = await prisma.batch.delete({
      where: { id },
    });

    return this.toBatchResponse(deletedBatch);
  }
}
