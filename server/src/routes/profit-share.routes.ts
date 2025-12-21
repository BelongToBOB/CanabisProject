import { Router } from 'express';
import { ProfitShareController } from '../controllers/profit-share.controller';
import { authenticate, adminOnly } from '../middleware/auth.middleware';
import { validateProfitShareExecution } from '../middleware/validation.middleware';

const router = Router();

// All profit share endpoints require authentication and admin role
router.use(authenticate);
router.use(adminOnly);

/**
 * GET /api/profit-shares
 * Get all profit share records ordered by execution date (most recent first)
 * Requirements: 9.1, 9.2
 */
router.get('/', ProfitShareController.getProfitShares);

/**
 * GET /api/profit-shares/:id
 * Get specific profit share by ID
 * Requirements: 9.1
 */
router.get('/:id', ProfitShareController.getProfitShareById);

/**
 * POST /api/profit-shares/execute
 * Manually trigger profit split execution for testing
 * Body: { month: number, year: number }
 * Requirements: 7.1, 7.2
 */
router.post('/execute', validateProfitShareExecution, ProfitShareController.executeProfitSplit);

export default router;
