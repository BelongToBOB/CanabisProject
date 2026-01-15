import { Router } from 'express';
import { BatchController } from '../controllers/batch.controller';
import { authenticate, adminOnly } from '../middleware/auth.middleware';
import { validateBatchCreation, validateBatchUpdate } from '../middleware/validation.middleware';

const router = Router();

// All batch endpoints require authentication
router.use(authenticate);

/**
 * GET /api/batches/available
 * Get available batches for sales order creation (currentQuantity > 0)
 * Accessible by: ADMIN and STAFF
 * IMPORTANT: This route must be defined BEFORE /api/batches/:id to avoid route conflicts
 */
router.get('/available', BatchController.getAvailableBatches);

/**
 * GET /api/batches
 * Get all batches with optional filtering
 * Query params: productName (optional)
 * Accessible by: ADMIN only
 */
router.get('/', adminOnly, BatchController.getAllBatches);

/**
 * GET /api/batches/:id
 * Get batch by ID
 * Accessible by: ADMIN only
 */
router.get('/:id', adminOnly, BatchController.getBatchById);

// All write operations (POST, PUT, DELETE) require admin role
/**
 * POST /api/batches
 * Create a new batch
 * Body: { batchIdentifier: string, productName: string, purchaseDate: Date, purchasePricePerUnit: number, initialQuantity: number }
 * Accessible by: ADMIN only
 */
router.post('/', adminOnly, validateBatchCreation, BatchController.createBatch);

/**
 * PUT /api/batches/:id
 * Update batch (limited fields - purchase price and date are immutable)
 * Body: { productName?: string, currentQuantity?: number }
 * Accessible by: ADMIN only
 */
router.put('/:id', adminOnly, validateBatchUpdate, BatchController.updateBatch);

/**
 * DELETE /api/batches/:id
 * Delete batch (only if not referenced by sales orders)
 * Accessible by: ADMIN only
 */
router.delete('/:id', adminOnly, BatchController.deleteBatch);

export default router;
