import { Router } from 'express';
import { SalesOrderController } from '../controllers/sales-order.controller';
import { authenticate, adminOnly } from '../middleware/auth.middleware';
import { validateSalesOrderCreation } from '../middleware/validation.middleware';

const router = Router();

// All sales order endpoints require authentication
router.use(authenticate);

/**
 * POST /api/sales-orders
 * Create a new sales order
 * Admin and Staff access
 * Body: { orderDate?: Date, customerName?: string, lineItems: Array<{ batchId: number, quantitySold: number, sellingPricePerUnit: number }> }
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */
router.post('/', validateSalesOrderCreation, SalesOrderController.createSalesOrder);

/**
 * GET /api/sales-orders
 * Get all sales orders with optional filtering
 * Admin only
 * Query params: startDate, endDate, isLocked, customerName (all optional)
 * Requirements: 3.1, 5.4
 */
router.get('/', adminOnly, SalesOrderController.getAllSalesOrders);

/**
 * GET /api/sales-orders/:id
 * Get sales order by ID
 * Admin only
 * Requirements: 3.1, 5.4
 */
router.get('/:id', adminOnly, SalesOrderController.getSalesOrderById);

/**
 * DELETE /api/sales-orders/:id
 * Delete sales order (only if unlocked)
 * Admin only
 * Requirements: 8.2, 8.3
 */
router.delete('/:id', adminOnly, SalesOrderController.deleteSalesOrder);

export default router;
