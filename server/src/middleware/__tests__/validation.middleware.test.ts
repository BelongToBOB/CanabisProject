/**
 * Tests for validation middleware
 * Requirements: 11.4, 11.5, 12.1
 */

import { Request, Response } from 'express';
import {
  validateMonetaryValue,
  validateQuantityValue,
  validateNonNegativeInteger,
  validateRequiredString,
  validateBatchCreation,
  validateSalesOrderCreation,
  validateUserCreation,
  validateProfitShareExecution
} from '../validation.middleware';

describe('Validation Middleware', () => {
  describe('validateMonetaryValue', () => {
    it('should return null for valid non-negative monetary values', () => {
      expect(validateMonetaryValue(0, 'price')).toBeNull();
      expect(validateMonetaryValue(10.50, 'price')).toBeNull();
      expect(validateMonetaryValue(100, 'price')).toBeNull();
    });

    it('should return error for negative values', () => {
      const error = validateMonetaryValue(-1, 'price');
      expect(error).not.toBeNull();
      expect(error?.field).toBe('price');
      expect(error?.message).toContain('non-negative');
    });

    it('should return error for non-numeric values', () => {
      const error = validateMonetaryValue('abc', 'price');
      expect(error).not.toBeNull();
      expect(error?.field).toBe('price');
      expect(error?.message).toContain('valid number');
    });

    it('should return error for null or undefined', () => {
      expect(validateMonetaryValue(null, 'price')).not.toBeNull();
      expect(validateMonetaryValue(undefined, 'price')).not.toBeNull();
    });
  });

  describe('validateQuantityValue', () => {
    it('should return null for valid positive integers', () => {
      expect(validateQuantityValue(1, 'quantity')).toBeNull();
      expect(validateQuantityValue(100, 'quantity')).toBeNull();
    });

    it('should return error for zero', () => {
      const error = validateQuantityValue(0, 'quantity');
      expect(error).not.toBeNull();
      expect(error?.message).toContain('positive integer');
    });

    it('should return error for negative values', () => {
      const error = validateQuantityValue(-5, 'quantity');
      expect(error).not.toBeNull();
      expect(error?.message).toContain('positive integer');
    });

    it('should return error for non-integers', () => {
      const error = validateQuantityValue(5.5, 'quantity');
      expect(error).not.toBeNull();
      expect(error?.message).toContain('integer');
    });

    it('should return error for non-numeric values', () => {
      const error = validateQuantityValue('abc', 'quantity');
      expect(error).not.toBeNull();
      expect(error?.message).toContain('valid number');
    });
  });

  describe('validateNonNegativeInteger', () => {
    it('should return null for valid non-negative integers including zero', () => {
      expect(validateNonNegativeInteger(0, 'quantity')).toBeNull();
      expect(validateNonNegativeInteger(1, 'quantity')).toBeNull();
      expect(validateNonNegativeInteger(100, 'quantity')).toBeNull();
    });

    it('should return error for negative values', () => {
      const error = validateNonNegativeInteger(-1, 'quantity');
      expect(error).not.toBeNull();
      expect(error?.message).toContain('non-negative');
    });

    it('should return error for non-integers', () => {
      const error = validateNonNegativeInteger(5.5, 'quantity');
      expect(error).not.toBeNull();
      expect(error?.message).toContain('integer');
    });
  });

  describe('validateRequiredString', () => {
    it('should return null for valid non-empty strings', () => {
      expect(validateRequiredString('test', 'field')).toBeNull();
      expect(validateRequiredString('  test  ', 'field')).toBeNull();
    });

    it('should return error for empty strings', () => {
      const error = validateRequiredString('', 'field');
      expect(error).not.toBeNull();
      expect(error?.message).toContain('required');
    });

    it('should return error for whitespace-only strings', () => {
      const error = validateRequiredString('   ', 'field');
      expect(error).not.toBeNull();
      expect(error?.message).toContain('required');
    });

    it('should return error for non-string values', () => {
      expect(validateRequiredString(123, 'field')).not.toBeNull();
      expect(validateRequiredString(null, 'field')).not.toBeNull();
      expect(validateRequiredString(undefined, 'field')).not.toBeNull();
    });
  });

  describe('validateBatchCreation middleware', () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    let mockNext: jest.Mock;

    beforeEach(() => {
      mockReq = {
        body: {}
      };
      mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      mockNext = jest.fn();
    });

    it('should call next() for valid batch data', () => {
      mockReq.body = {
        batchIdentifier: 'BATCH-001',
        productName: 'Product A',
        purchasePricePerUnit: 10.50,
        initialQuantity: 100
      };

      validateBatchCreation(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should return 400 for missing required fields', () => {
      mockReq.body = {
        batchIdentifier: 'BATCH-001'
      };

      validateBatchCreation(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: 'VALIDATION_ERROR',
            details: expect.any(Array)
          })
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 400 for negative price', () => {
      mockReq.body = {
        batchIdentifier: 'BATCH-001',
        productName: 'Product A',
        purchasePricePerUnit: -10,
        initialQuantity: 100
      };

      validateBatchCreation(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 400 for non-positive quantity', () => {
      mockReq.body = {
        batchIdentifier: 'BATCH-001',
        productName: 'Product A',
        purchasePricePerUnit: 10,
        initialQuantity: 0
      };

      validateBatchCreation(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('validateSalesOrderCreation middleware', () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    let mockNext: jest.Mock;

    beforeEach(() => {
      mockReq = {
        body: {}
      };
      mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      mockNext = jest.fn();
    });

    it('should call next() for valid sales order data', () => {
      mockReq.body = {
        lineItems: [
          {
            batchId: 1,
            quantitySold: 10,
            sellingPricePerUnit: 20.50
          }
        ]
      };

      validateSalesOrderCreation(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should return 400 for missing lineItems', () => {
      mockReq.body = {};

      validateSalesOrderCreation(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 400 for empty lineItems array', () => {
      mockReq.body = {
        lineItems: []
      };

      validateSalesOrderCreation(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid line item data', () => {
      mockReq.body = {
        lineItems: [
          {
            batchId: 1,
            quantitySold: -5,
            sellingPricePerUnit: 20
          }
        ]
      };

      validateSalesOrderCreation(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 400 for negative selling price', () => {
      mockReq.body = {
        lineItems: [
          {
            batchId: 1,
            quantitySold: 5,
            sellingPricePerUnit: -20
          }
        ]
      };

      validateSalesOrderCreation(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('validateUserCreation middleware', () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    let mockNext: jest.Mock;

    beforeEach(() => {
      mockReq = {
        body: {}
      };
      mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      mockNext = jest.fn();
    });

    it('should call next() for valid user data', () => {
      mockReq.body = {
        username: 'testuser',
        password: 'password123',
        role: 'ADMIN'
      };

      validateUserCreation(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should return 400 for missing required fields', () => {
      mockReq.body = {
        username: 'testuser'
      };

      validateUserCreation(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid role', () => {
      mockReq.body = {
        username: 'testuser',
        password: 'password123',
        role: 'INVALID'
      };

      validateUserCreation(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('validateProfitShareExecution middleware', () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    let mockNext: jest.Mock;

    beforeEach(() => {
      mockReq = {
        body: {}
      };
      mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      mockNext = jest.fn();
    });

    it('should call next() for valid profit share data', () => {
      mockReq.body = {
        month: 11,
        year: 2024
      };

      validateProfitShareExecution(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should return 400 for missing month', () => {
      mockReq.body = {
        year: 2024
      };

      validateProfitShareExecution(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid month range', () => {
      mockReq.body = {
        month: 13,
        year: 2024
      };

      validateProfitShareExecution(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid year', () => {
      mockReq.body = {
        month: 11,
        year: 2019
      };

      validateProfitShareExecution(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
