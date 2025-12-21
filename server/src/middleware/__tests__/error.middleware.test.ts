/**
 * Tests for error handling middleware
 * Requirements: 12.1, 12.2, 12.3, 12.4
 */

import { Request, Response } from 'express';
import { errorHandler, AppError, logError, notFoundHandler } from '../error.middleware';

describe('Error Handling Middleware', () => {
  let mockReq: any;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    mockReq = {
      method: 'GET',
      path: '/api/test',
      user: { userId: 1, role: 'ADMIN' }
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('AppError', () => {
    it('should create custom error with all properties', () => {
      const error = new AppError(400, 'VALIDATION_ERROR', 'Invalid input', [
        { field: 'name', message: 'Name is required' }
      ]);

      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.message).toBe('Invalid input');
      expect(error.details).toHaveLength(1);
      expect(error.name).toBe('AppError');
    });
  });

  describe('logError', () => {
    it('should log error with context', () => {
      const error = new Error('Test error');
      logError(error, mockReq as Request);

      expect(consoleErrorSpy).toHaveBeenCalledWith('=== Error Log ===');
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Timestamp:'));
      expect(consoleErrorSpy).toHaveBeenCalledWith('User ID: 1');
      expect(consoleErrorSpy).toHaveBeenCalledWith('User Role: ADMIN');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Method: GET');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Path: /api/test');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error Message: Test error');
    });

    it('should log anonymous user when no user in request', () => {
      mockReq.user = undefined;
      const error = new Error('Test error');
      logError(error, mockReq as Request);

      expect(consoleErrorSpy).toHaveBeenCalledWith('User ID: anonymous');
      expect(consoleErrorSpy).toHaveBeenCalledWith('User Role: none');
    });
  });

  describe('errorHandler', () => {
    it('should handle AppError with custom status and code', () => {
      const error = new AppError(400, 'VALIDATION_ERROR', 'Invalid input', [
        { field: 'name', message: 'Name is required' }
      ]);

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input',
          details: [{ field: 'name', message: 'Name is required' }]
        }
      });
    });

    it('should handle validation errors with 400 status', () => {
      const error = new Error('Validation failed: name is required');

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed: name is required'
        }
      });
    });

    it('should handle authentication errors with 401 status', () => {
      const error = new Error('Invalid credentials');

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'AUTHENTICATION_ERROR',
          message: 'Invalid credentials'
        }
      });
    });

    it('should handle authorization errors with 403 status', () => {
      const error = new Error('Unauthorized access');

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'AUTHORIZATION_ERROR',
          message: 'Unauthorized access'
        }
      });
    });

    it('should handle not found errors with 404 status', () => {
      const error = new Error('Resource not found');

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'NOT_FOUND',
          message: 'Resource not found'
        }
      });
    });

    it('should handle conflict errors with 409 status', () => {
      const error = new Error('Record already exists');

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'CONFLICT',
          message: 'Record already exists'
        }
      });
    });

    it('should handle locked record errors with 409 status', () => {
      const error = new Error('Cannot modify locked record');

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'CONFLICT',
          message: 'Cannot modify locked record'
        }
      });
    });

    it('should handle database errors with generic message', () => {
      const error = new Error('Prisma error: constraint violation');

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'DATABASE_ERROR',
          message: 'A database error occurred. Please try again later.'
        }
      });
    });

    it('should handle unknown errors with generic message', () => {
      const error = new Error('Some unexpected error');

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred. Please try again later.'
        }
      });
    });

    it('should log all errors', () => {
      const error = new Error('Test error');

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('notFoundHandler', () => {
    it('should return 404 for undefined routes', () => {
      const req = {
        method: 'POST',
        path: '/api/undefined'
      };

      notFoundHandler(req as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'NOT_FOUND',
          message: 'Route POST /api/undefined not found'
        }
      });
    });
  });
});
