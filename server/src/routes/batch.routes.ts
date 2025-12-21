import { Router } from 'express';
import { BatchController } from '../controllers/batch.controller';
import { authenticate, adminOnly } from '../middleware/auth.middleware';
import { validateBatchCreation, validateBatchUpdate } from '../middleware/validation.middleware';

const router = Router();

// All batch management endpoints require authentication and admin role
router.use(authenticate);
router.use(adminOnly);

/**
 * POST /api/batches
 * Create a new batch
 * Body: { batchIdentifier: string, productName: string, purchaseDate: Date, purchasePricePerUnit: number, initialQuantity: number }
 */
router.post('/', validateBatchCreation, BatchController.createBatch);

/**
 * GET /api/batches
 * Get all batches with optional filtering
 * Query params: productName (optional)
 */
router.get('/', BatchController.getAllBatches);

/**
 * GET /api/batches/:id
 * Get batch by ID
 */
router.get('/:id', BatchController.getBatchById);

/**
 * PUT /api/batches/:id
 * Update batch (limited fields - purchase price and date are immutable)
 * Body: { productName?: string, currentQuantity?: number }
 */
router.put('/:id', validateBatchUpdate, BatchController.updateBatch);

/**
 * DELETE /api/batches/:id
 * Delete batch (only if not referenced by sales orders)
 */
router.delete('/:id', BatchController.deleteBatch);

export default router;
