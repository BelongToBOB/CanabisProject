import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

/**
 * POST /api/auth/login
 * Authenticate user and receive JWT token
 * Body: { username: string, password: string }
 */
router.post('/login', AuthController.login);

/**
 * POST /api/auth/logout
 * Logout user (client-side token removal)
 */
router.post('/logout', AuthController.logout);

/**
 * GET /api/auth/verify
 * Verify JWT token and return user info
 * Requires authentication
 */
router.get('/verify', authenticate, AuthController.verify);

export default router;
