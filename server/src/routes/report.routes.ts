import { Router } from 'express';
import { ReportController } from '../controllers/report.controller';
import { authenticate, adminOnly } from '../middleware/auth.middleware';

const router = Router();

// All report endpoints require authentication and admin role
router.use(authenticate);
router.use(adminOnly);

/**
 * GET /api/reports/inventory
 * Generate inventory report with optional filtering
 * Query params: productName (optional)
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5
 */
router.get('/inventory', ReportController.getInventoryReport);

/**
 * GET /api/reports/monthly-profit
 * Generate monthly profit summary for a specific month
 * Query params: month (required, 1-12), year (required, e.g., 2024)
 * Requirements: 6.1, 6.2, 6.3, 6.4
 */
router.get('/monthly-profit', ReportController.getMonthlyProfitSummary);

export default router;
