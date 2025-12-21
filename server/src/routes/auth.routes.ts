import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';

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

export default router;
