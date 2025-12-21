import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';

export class AuthController {
  /**
   * Login endpoint - POST /api/auth/login
   * Authenticates user and returns JWT token
   */
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { username, password } = req.body;

      // Validate input
      if (!username || !password) {
        res.status(400).json({ 
          error: 'Validation error',
          message: 'Username and password are required' 
        });
        return;
      }

      // Authenticate user
      const result = await AuthService.authenticate(username, password);

      res.status(200).json(result);
    } catch (error) {
      if (error instanceof Error) {
        // Handle authentication errors
        if (error.message === 'Invalid credentials') {
          res.status(401).json({ error: error.message });
          return;
        }
        
        // Handle other errors
        res.status(500).json({ 
          error: 'Authentication failed',
          message: error.message 
        });
      } else {
        res.status(500).json({ error: 'An unexpected error occurred' });
      }
    }
  }

  /**
   * Logout endpoint - POST /api/auth/logout
   * Note: With JWT, logout is typically handled client-side by removing the token
   * This endpoint is provided for consistency but doesn't perform server-side actions
   */
  static async logout(_req: Request, res: Response): Promise<void> {
    res.status(200).json({ 
      message: 'Logout successful. Please remove the token from client storage.' 
    });
  }
}
