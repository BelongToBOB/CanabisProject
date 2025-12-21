import { Request, Response, NextFunction } from 'express';
import { AuthService, AuthPayload } from '../services/auth.service';
import { Role } from '@prisma/client';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

/**
 * Middleware to verify JWT token and attach user to request
 */
export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      res.status(401).json({ 
        error: {
          code: 'AUTHENTICATION_ERROR',
          message: 'No authorization token provided'
        }
      });
      return;
    }

    // Extract token from "Bearer <token>" format
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      res.status(401).json({ 
        error: {
          code: 'AUTHENTICATION_ERROR',
          message: 'Invalid authorization header format. Use: Bearer <token>'
        }
      });
      return;
    }

    const token = parts[1];

    // Verify token
    const decoded = AuthService.verifyToken(token);

    // Attach user to request
    req.user = decoded;

    next();
  } catch (error) {
    if (error instanceof Error) {
      res.status(401).json({ 
        error: {
          code: 'AUTHENTICATION_ERROR',
          message: error.message
        }
      });
    } else {
      res.status(401).json({ 
        error: {
          code: 'AUTHENTICATION_ERROR',
          message: 'Authentication failed'
        }
      });
    }
  }
};

/**
 * Middleware to check if user has required role(s)
 * @param allowedRoles - Array of roles that are allowed to access the endpoint
 */
export const authorize = (...allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Check if user is authenticated
    if (!req.user) {
      res.status(401).json({ 
        error: {
          code: 'AUTHENTICATION_ERROR',
          message: 'Authentication required'
        }
      });
      return;
    }

    // Check if user has required role
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ 
        error: {
          code: 'AUTHORIZATION_ERROR',
          message: `Insufficient permissions. This endpoint requires one of the following roles: ${allowedRoles.join(', ')}`
        }
      });
      return;
    }

    next();
  };
};

/**
 * Convenience middleware for admin-only endpoints
 */
export const adminOnly = authorize(Role.ADMIN);

/**
 * Convenience middleware for admin and staff endpoints
 */
export const adminOrStaff = authorize(Role.ADMIN, Role.STAFF);
