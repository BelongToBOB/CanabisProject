import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticate, adminOnly } from '../middleware/auth.middleware';
import { validateUserCreation } from '../middleware/validation.middleware';

const router = Router();

// All user management endpoints require authentication and admin role
router.use(authenticate);
router.use(adminOnly);

/**
 * POST /api/users
 * Create a new user
 * Body: { username: string, password: string, role: 'ADMIN' | 'STAFF' }
 */
router.post('/', validateUserCreation, UserController.createUser);

/**
 * GET /api/users
 * Get all users
 */
router.get('/', UserController.getAllUsers);

/**
 * GET /api/users/:id
 * Get user by ID
 */
router.get('/:id', UserController.getUserById);

/**
 * PUT /api/users/:id
 * Update user
 * Body: { username?: string, password?: string, role?: 'ADMIN' | 'STAFF' }
 */
router.put('/:id', UserController.updateUser);

/**
 * DELETE /api/users/:id
 * Delete user
 */
router.delete('/:id', UserController.deleteUser);

export default router;
