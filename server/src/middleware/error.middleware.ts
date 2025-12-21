/**
 * Error Handling Middleware
 * Provides centralized error handling and logging
 * Requirements: 12.1, 12.2, 12.4
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Standardized error response structure
 * Requirement 12.1: Return descriptive error messages
 */
export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Array<{
      field: string;
      message: string;
    }>;
  };
}

/**
 * Custom application error class
 */
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: Array<{ field: string; message: string }>
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Log error with context
 * Requirement 12.4: Log all errors with timestamps and user context
 */
export function logError(error: Error, req: Request): void {
  const timestamp = new Date().toISOString();
  const user = (req as any).user;
  const userId = user ? user.userId : 'anonymous';
  const userRole = user ? user.role : 'none';

  console.error('=== Error Log ===');
  console.error(`Timestamp: ${timestamp}`);
  console.error(`User ID: ${userId}`);
  console.error(`User Role: ${userRole}`);
  console.error(`Method: ${req.method}`);
  console.error(`Path: ${req.path}`);
  console.error(`Error Name: ${error.name}`);
  console.error(`Error Message: ${error.message}`);
  
  if (error.stack) {
    console.error(`Stack Trace:\n${error.stack}`);
  }
  
  console.error('================\n');
}

/**
 * Global error handler middleware
 * Requirements: 12.1, 12.2, 12.3, 12.4
 */
export const errorHandler = (
  error: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Log error with context (Requirement 12.4)
  logError(error, req);

  // Handle custom AppError
  if (error instanceof AppError) {
    const response: ErrorResponse = {
      error: {
        code: error.code,
        message: error.message,
        details: error.details
      }
    };
    res.status(error.statusCode).json(response);
    return;
  }

  // Handle validation errors
  if (error.message.includes('Validation') || 
      error.message.includes('required') ||
      error.message.includes('must be') ||
      error.message.includes('invalid')) {
    const response: ErrorResponse = {
      error: {
        code: 'VALIDATION_ERROR',
        message: error.message
      }
    };
    res.status(400).json(response);
    return;
  }

  // Handle authentication errors
  if (error.message.includes('Invalid credentials') ||
      error.message.includes('Authentication') ||
      error.message.includes('token')) {
    const response: ErrorResponse = {
      error: {
        code: 'AUTHENTICATION_ERROR',
        message: error.message
      }
    };
    res.status(401).json(response);
    return;
  }

  // Handle authorization errors
  if (error.message.includes('Unauthorized') ||
      error.message.includes('permission') ||
      error.message.includes('access denied')) {
    const response: ErrorResponse = {
      error: {
        code: 'AUTHORIZATION_ERROR',
        message: error.message
      }
    };
    res.status(403).json(response);
    return;
  }

  // Handle not found errors
  if (error.message.includes('not found') ||
      error.message.includes('does not exist')) {
    const response: ErrorResponse = {
      error: {
        code: 'NOT_FOUND',
        message: error.message
      }
    };
    res.status(404).json(response);
    return;
  }

  // Handle conflict errors (duplicate, locked records, etc.)
  if (error.message.includes('already exists') ||
      error.message.includes('duplicate') ||
      error.message.includes('locked') ||
      error.message.includes('already executed')) {
    const response: ErrorResponse = {
      error: {
        code: 'CONFLICT',
        message: error.message
      }
    };
    res.status(409).json(response);
    return;
  }

  // Handle database errors
  if (error.message.includes('Prisma') ||
      error.message.includes('database') ||
      error.message.includes('constraint')) {
    // Requirement 12.3: Return generic error without exposing sensitive details
    const response: ErrorResponse = {
      error: {
        code: 'DATABASE_ERROR',
        message: 'A database error occurred. Please try again later.'
      }
    };
    res.status(500).json(response);
    return;
  }

  // Default server error (Requirement 12.3)
  const response: ErrorResponse = {
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred. Please try again later.'
    }
  };
  res.status(500).json(response);
};

/**
 * 404 Not Found handler for undefined routes
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  const response: ErrorResponse = {
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`
    }
  };
  res.status(404).json(response);
};

/**
 * Async error wrapper to catch errors in async route handlers
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
