import { Request, Response } from 'express';
import { BatchService, CreateBatchInput, UpdateBatchInput, BatchFilters } from '../services/batch.service';

export class BatchController {
  /**
   * Create a new batch - POST /api/batches
   * Admin only
   * Requirements: 2.1, 2.2, 11.4, 11.5
   */
  static async createBatch(req: Request, res: Response): Promise<void> {
    try {
      const { batchIdentifier, productName, purchaseDate, purchasePricePerUnit, defaultSellingPricePerUnit, initialQuantity } = req.body;

      // Validate required fields
      if (!batchIdentifier || !productName || !purchaseDate || purchasePricePerUnit === undefined || !initialQuantity) {
        res.status(400).json({
          error: 'Validation error',
          message: 'Batch identifier, product name, purchase date, purchase price per unit, and initial quantity are required',
        });
        return;
      }

      // Validate monetary values (non-negative) - Requirement 11.4
      if (purchasePricePerUnit < 0) {
        res.status(400).json({
          error: 'Validation error',
          message: 'Purchase price per unit must be non-negative',
        });
        return;
      }

      // Validate default selling price if provided
      if (defaultSellingPricePerUnit !== undefined && defaultSellingPricePerUnit < 0) {
        res.status(400).json({
          error: 'Validation error',
          message: 'Default selling price per unit must be non-negative',
        });
        return;
      }

      // Validate quantity values (positive integers) - Requirement 11.5
      if (!Number.isInteger(initialQuantity) || initialQuantity <= 0) {
        res.status(400).json({
          error: 'Validation error',
          message: 'Initial quantity must be a positive integer',
        });
        return;
      }

      const batchData: CreateBatchInput = {
        batchIdentifier,
        productName,
        purchaseDate: new Date(purchaseDate),
        purchasePricePerUnit,
        defaultSellingPricePerUnit,
        initialQuantity,
      };

      const batch = await BatchService.createBatch(batchData);

      res.status(201).json(batch);
    } catch (error) {
      if (error instanceof Error) {
        // Handle duplicate batch identifier error - Requirement 2.2
        if (error.message === 'Batch identifier already exists') {
          res.status(409).json({
            error: 'Conflict',
            message: error.message,
          });
          return;
        }

        // Handle validation errors
        if (error.message.includes('required') || error.message.includes('must be')) {
          res.status(400).json({
            error: 'Validation error',
            message: error.message,
          });
          return;
        }

        // Handle other errors
        res.status(500).json({
          error: 'Failed to create batch',
          message: error.message,
        });
      } else {
        res.status(500).json({ error: 'An unexpected error occurred' });
      }
    }
  }

  /**
   * Get all batches - GET /api/batches
   * Admin only
   * Requirements: 2.5 - with filtering by product name
   */
  static async getAllBatches(req: Request, res: Response): Promise<void> {
    try {
      const filters: BatchFilters = {};

      // Add product name filter if provided
      if (req.query.productName) {
        filters.productName = req.query.productName as string;
      }

      const batches = await BatchService.getBatches(filters);
      res.status(200).json(batches);
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({
          error: 'Failed to retrieve batches',
          message: error.message,
        });
      } else {
        res.status(500).json({ error: 'An unexpected error occurred' });
      }
    }
  }

  /**
   * Get available batches for sales order creation - GET /api/batches/available
   * Admin and Staff access
   * Returns only batches with currentQuantity > 0
   */
  static async getAvailableBatches(_req: Request, res: Response): Promise<void> {
    try {
      const batches = await BatchService.getAvailableBatches();
      res.status(200).json(batches);
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({
          error: 'Failed to retrieve available batches',
          message: error.message,
        });
      } else {
        res.status(500).json({ error: 'An unexpected error occurred' });
      }
    }
  }

  /**
   * Get batch by ID - GET /api/batches/:id
   * Admin only
   */
  static async getBatchById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);

      if (isNaN(id)) {
        res.status(400).json({
          error: 'Validation error',
          message: 'Invalid batch ID',
        });
        return;
      }

      const batch = await BatchService.getBatchById(id);

      if (!batch) {
        res.status(404).json({
          error: 'Not found',
          message: 'Batch not found',
        });
        return;
      }

      res.status(200).json(batch);
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({
          error: 'Failed to retrieve batch',
          message: error.message,
        });
      } else {
        res.status(500).json({ error: 'An unexpected error occurred' });
      }
    }
  }

  /**
   * Update batch - PUT /api/batches/:id
   * Admin only
   * Requirements: 2.4 - Immutability constraints (cannot update purchase price or date)
   */
  static async updateBatch(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);

      if (isNaN(id)) {
        res.status(400).json({
          error: 'Validation error',
          message: 'Invalid batch ID',
        });
        return;
      }

      const { productName, currentQuantity, defaultSellingPricePerUnit } = req.body;

      // Validate that at least one field is provided
      if (productName === undefined && currentQuantity === undefined && defaultSellingPricePerUnit === undefined) {
        res.status(400).json({
          error: 'Validation error',
          message: 'At least one field (productName, currentQuantity, or defaultSellingPricePerUnit) must be provided',
        });
        return;
      }

      // Validate quantity if provided - Requirement 11.5
      if (currentQuantity !== undefined) {
        if (!Number.isInteger(currentQuantity) || currentQuantity < 0) {
          res.status(400).json({
            error: 'Validation error',
            message: 'Current quantity must be a non-negative integer',
          });
          return;
        }
      }

      // Validate default selling price if provided
      if (defaultSellingPricePerUnit !== undefined && defaultSellingPricePerUnit < 0) {
        res.status(400).json({
          error: 'Validation error',
          message: 'Default selling price per unit must be non-negative',
        });
        return;
      }

      const updateData: UpdateBatchInput = {};
      if (productName !== undefined) updateData.productName = productName;
      if (currentQuantity !== undefined) updateData.currentQuantity = currentQuantity;
      if (defaultSellingPricePerUnit !== undefined) updateData.defaultSellingPricePerUnit = defaultSellingPricePerUnit;

      const batch = await BatchService.updateBatch(id, updateData);

      res.status(200).json(batch);
    } catch (error) {
      if (error instanceof Error) {
        // Handle batch not found error
        if (error.message === 'Batch not found') {
          res.status(404).json({
            error: 'Not found',
            message: error.message,
          });
          return;
        }

        // Handle validation errors
        if (error.message.includes('must be') || error.message.includes('cannot exceed')) {
          res.status(400).json({
            error: 'Validation error',
            message: error.message,
          });
          return;
        }

        // Handle other errors
        res.status(500).json({
          error: 'Failed to update batch',
          message: error.message,
        });
      } else {
        res.status(500).json({ error: 'An unexpected error occurred' });
      }
    }
  }

  /**
   * Delete batch - DELETE /api/batches/:id
   * Admin only
   * Requirements: 11.3 - Prevent deletion if referenced by sales orders
   */
  static async deleteBatch(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);

      if (isNaN(id)) {
        res.status(400).json({
          error: 'Validation error',
          message: 'Invalid batch ID',
        });
        return;
      }

      const batch = await BatchService.deleteBatch(id);

      res.status(200).json({
        message: 'Batch deleted successfully',
        batch,
      });
    } catch (error) {
      if (error instanceof Error) {
        // Handle batch not found error
        if (error.message === 'Batch not found') {
          res.status(404).json({
            error: 'Not found',
            message: error.message,
          });
          return;
        }

        // Handle referential integrity error - Requirement 11.3
        if (error.message === 'Cannot delete batch that is referenced by sales orders') {
          res.status(409).json({
            error: 'Conflict',
            message: error.message,
          });
          return;
        }

        // Handle other errors
        res.status(500).json({
          error: 'Failed to delete batch',
          message: error.message,
        });
      } else {
        res.status(500).json({ error: 'An unexpected error occurred' });
      }
    }
  }
}
