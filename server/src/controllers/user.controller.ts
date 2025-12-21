import { Request, Response } from 'express';
import { UserService, CreateUserInput, UpdateUserInput } from '../services/user.service';
import { Role } from '@prisma/client';

export class UserController {
  /**
   * Create a new user - POST /api/users
   * Admin only
   */
  static async createUser(req: Request, res: Response): Promise<void> {
    try {
      const { username, password, role } = req.body;

      // Validate input
      if (!username || !password || !role) {
        res.status(400).json({
          error: 'Validation error',
          message: 'Username, password, and role are required',
        });
        return;
      }

      // Validate role
      if (!Object.values(Role).includes(role)) {
        res.status(400).json({
          error: 'Validation error',
          message: `Invalid role. Must be one of: ${Object.values(Role).join(', ')}`,
        });
        return;
      }

      const userData: CreateUserInput = {
        username,
        password,
        role,
      };

      const user = await UserService.createUser(userData);

      res.status(201).json(user);
    } catch (error) {
      if (error instanceof Error) {
        // Handle duplicate username error
        if (error.message === 'Username already exists') {
          res.status(409).json({
            error: 'Conflict',
            message: error.message,
          });
          return;
        }

        // Handle validation errors
        if (error.message.includes('required')) {
          res.status(400).json({
            error: 'Validation error',
            message: error.message,
          });
          return;
        }

        // Handle other errors
        res.status(500).json({
          error: 'Failed to create user',
          message: error.message,
        });
      } else {
        res.status(500).json({ error: 'An unexpected error occurred' });
      }
    }
  }

  /**
   * Get all users - GET /api/users
   * Admin only
   */
  static async getAllUsers(_req: Request, res: Response): Promise<void> {
    try {
      const users = await UserService.getAllUsers();
      res.status(200).json(users);
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({
          error: 'Failed to retrieve users',
          message: error.message,
        });
      } else {
        res.status(500).json({ error: 'An unexpected error occurred' });
      }
    }
  }

  /**
   * Get user by ID - GET /api/users/:id
   * Admin only
   */
  static async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);

      if (isNaN(id)) {
        res.status(400).json({
          error: 'Validation error',
          message: 'Invalid user ID',
        });
        return;
      }

      const user = await UserService.getUserById(id);

      if (!user) {
        res.status(404).json({
          error: 'Not found',
          message: 'User not found',
        });
        return;
      }

      res.status(200).json(user);
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({
          error: 'Failed to retrieve user',
          message: error.message,
        });
      } else {
        res.status(500).json({ error: 'An unexpected error occurred' });
      }
    }
  }

  /**
   * Update user - PUT /api/users/:id
   * Admin only
   */
  static async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);

      if (isNaN(id)) {
        res.status(400).json({
          error: 'Validation error',
          message: 'Invalid user ID',
        });
        return;
      }

      const { username, password, role } = req.body;

      // Validate that at least one field is provided
      if (!username && !password && !role) {
        res.status(400).json({
          error: 'Validation error',
          message: 'At least one field (username, password, or role) must be provided',
        });
        return;
      }

      // Validate role if provided
      if (role && !Object.values(Role).includes(role)) {
        res.status(400).json({
          error: 'Validation error',
          message: `Invalid role. Must be one of: ${Object.values(Role).join(', ')}`,
        });
        return;
      }

      const updateData: UpdateUserInput = {};
      if (username) updateData.username = username;
      if (password) updateData.password = password;
      if (role) updateData.role = role;

      const user = await UserService.updateUser(id, updateData);

      res.status(200).json(user);
    } catch (error) {
      if (error instanceof Error) {
        // Handle user not found error
        if (error.message === 'User not found') {
          res.status(404).json({
            error: 'Not found',
            message: error.message,
          });
          return;
        }

        // Handle duplicate username error
        if (error.message === 'Username already exists') {
          res.status(409).json({
            error: 'Conflict',
            message: error.message,
          });
          return;
        }

        // Handle other errors
        res.status(500).json({
          error: 'Failed to update user',
          message: error.message,
        });
      } else {
        res.status(500).json({ error: 'An unexpected error occurred' });
      }
    }
  }

  /**
   * Delete user - DELETE /api/users/:id
   * Admin only
   */
  static async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);

      if (isNaN(id)) {
        res.status(400).json({
          error: 'Validation error',
          message: 'Invalid user ID',
        });
        return;
      }

      const user = await UserService.deleteUser(id);

      res.status(200).json({
        message: 'User deleted successfully',
        user,
      });
    } catch (error) {
      if (error instanceof Error) {
        // Handle user not found error
        if (error.message === 'User not found') {
          res.status(404).json({
            error: 'Not found',
            message: error.message,
          });
          return;
        }

        // Handle other errors
        res.status(500).json({
          error: 'Failed to delete user',
          message: error.message,
        });
      } else {
        res.status(500).json({ error: 'An unexpected error occurred' });
      }
    }
  }
}
