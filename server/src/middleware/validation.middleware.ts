/**
 * Validation Middleware
 * Provides reusable validation functions for common data types
 * Requirements: 11.4, 11.5, 12.1
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Validation error details
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validate that a value is a non-negative monetary value
 * Requirement 11.4: Validate all monetary values to ensure they are non-negative
 */
export function validateMonetaryValue(value: any, fieldName: string): ValidationError | null {
  if (value === undefined || value === null) {
    return { field: fieldName, message: `${fieldName} is required` };
  }

  // Reject non-primitive types (objects, arrays, etc.)
  if (typeof value === 'object') {
    return { field: fieldName, message: `${fieldName} must be a valid number` };
  }

  const numValue = Number(value);
  
  if (isNaN(numValue)) {
    return { field: fieldName, message: `${fieldName} must be a valid number` };
  }

  if (!isFinite(numValue)) {
    return { field: fieldName, message: `${fieldName} must be a valid number` };
  }

  if (numValue < 0) {
    return { field: fieldName, message: `${fieldName} must be non-negative` };
  }

  return null;
}

/**
 * Validate that a value is a positive integer
 * Requirement 11.5: Validate all quantity values to ensure they are positive integers
 */
export function validateQuantityValue(value: any, fieldName: string): ValidationError | null {
  if (value === undefined || value === null) {
    return { field: fieldName, message: `${fieldName} is required` };
  }

  const numValue = Number(value);
  
  if (isNaN(numValue)) {
    return { field: fieldName, message: `${fieldName} must be a valid number` };
  }

  if (!Number.isInteger(numValue)) {
    return { field: fieldName, message: `${fieldName} must be an integer` };
  }

  if (numValue <= 0) {
    return { field: fieldName, message: `${fieldName} must be a positive integer` };
  }

  return null;
}

/**
 * Validate that a value is a non-negative integer (for current quantity which can be 0)
 * Requirement 11.5: Validate all quantity values to ensure they are non-negative integers
 */
export function validateNonNegativeInteger(value: any, fieldName: string): ValidationError | null {
  if (value === undefined || value === null) {
    return { field: fieldName, message: `${fieldName} is required` };
  }

  const numValue = Number(value);
  
  if (isNaN(numValue)) {
    return { field: fieldName, message: `${fieldName} must be a valid number` };
  }

  if (!Number.isInteger(numValue)) {
    return { field: fieldName, message: `${fieldName} must be an integer` };
  }

  if (numValue < 0) {
    return { field: fieldName, message: `${fieldName} must be non-negative` };
  }

  return null;
}

/**
 * Validate required string field
 */
export function validateRequiredString(value: any, fieldName: string): ValidationError | null {
  if (!value || typeof value !== 'string' || value.trim().length === 0) {
    return { field: fieldName, message: `${fieldName} is required` };
  }
  return null;
}

/**
 * Validate required field (any type)
 */
export function validateRequired(value: any, fieldName: string): ValidationError | null {
  if (value === undefined || value === null) {
    return { field: fieldName, message: `${fieldName} is required` };
  }
  return null;
}

/**
 * Middleware to validate batch creation data
 * Requirements: 11.4, 11.5
 */
export const validateBatchCreation = (req: Request, res: Response, next: NextFunction): void => {
  const errors: ValidationError[] = [];
  const { batchIdentifier, productName, purchasePricePerUnit, initialQuantity } = req.body;

  // Validate required string fields
  const batchIdError = validateRequiredString(batchIdentifier, 'batchIdentifier');
  if (batchIdError) errors.push(batchIdError);

  const productNameError = validateRequiredString(productName, 'productName');
  if (productNameError) errors.push(productNameError);

  // Validate monetary value
  const priceError = validateMonetaryValue(purchasePricePerUnit, 'purchasePricePerUnit');
  if (priceError) errors.push(priceError);

  // Validate quantity value
  const quantityError = validateQuantityValue(initialQuantity, 'initialQuantity');
  if (quantityError) errors.push(quantityError);

  if (errors.length > 0) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: errors
      }
    });
    return;
  }

  next();
};

/**
 * Middleware to validate batch update data
 * Requirements: 11.4, 11.5
 */
export const validateBatchUpdate = (req: Request, res: Response, next: NextFunction): void => {
  const errors: ValidationError[] = [];
  const { currentQuantity } = req.body;

  // Only validate if currentQuantity is provided
  if (currentQuantity !== undefined) {
    const quantityError = validateNonNegativeInteger(currentQuantity, 'currentQuantity');
    if (quantityError) errors.push(quantityError);
  }

  if (errors.length > 0) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: errors
      }
    });
    return;
  }

  next();
};

/**
 * Middleware to validate sales order creation data
 * Requirements: 11.4, 11.5
 */
export const validateSalesOrderCreation = (req: Request, res: Response, next: NextFunction): void => {
  const errors: ValidationError[] = [];
  const { lineItems } = req.body;

  // Validate line items array
  if (!lineItems || !Array.isArray(lineItems)) {
    errors.push({ field: 'lineItems', message: 'lineItems must be an array' });
  } else if (lineItems.length === 0) {
    errors.push({ field: 'lineItems', message: 'lineItems must contain at least one item' });
  } else {
    // Validate each line item
    lineItems.forEach((item: any, index: number) => {
      const prefix = `lineItems[${index}]`;

      // Validate batchId
      const batchIdError = validateRequired(item.batchId, `${prefix}.batchId`);
      if (batchIdError) errors.push(batchIdError);

      // Validate quantitySold
      const quantityError = validateQuantityValue(item.quantitySold, `${prefix}.quantitySold`);
      if (quantityError) errors.push(quantityError);

      // Validate sellingPricePerUnit
      const priceError = validateMonetaryValue(item.sellingPricePerUnit, `${prefix}.sellingPricePerUnit`);
      if (priceError) errors.push(priceError);
    });
  }

  if (errors.length > 0) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: errors
      }
    });
    return;
  }

  next();
};

/**
 * Middleware to validate user creation data
 */
export const validateUserCreation = (req: Request, res: Response, next: NextFunction): void => {
  const errors: ValidationError[] = [];
  const { username, password, role } = req.body;

  // Validate required fields
  const usernameError = validateRequiredString(username, 'username');
  if (usernameError) errors.push(usernameError);

  const passwordError = validateRequiredString(password, 'password');
  if (passwordError) errors.push(passwordError);

  const roleError = validateRequiredString(role, 'role');
  if (roleError) errors.push(roleError);

  // Validate role value
  if (role && !['ADMIN', 'STAFF'].includes(role)) {
    errors.push({ field: 'role', message: 'role must be either ADMIN or STAFF' });
  }

  if (errors.length > 0) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: errors
      }
    });
    return;
  }

  next();
};

/**
 * Middleware to validate profit share execution data
 */
export const validateProfitShareExecution = (req: Request, res: Response, next: NextFunction): void => {
  const errors: ValidationError[] = [];
  const { month, year } = req.body;

  // Validate month
  const monthError = validateRequired(month, 'month');
  if (monthError) {
    errors.push(monthError);
  } else {
    const monthNum = Number(month);
    if (isNaN(monthNum) || !Number.isInteger(monthNum)) {
      errors.push({ field: 'month', message: 'month must be an integer' });
    } else if (monthNum < 1 || monthNum > 12) {
      errors.push({ field: 'month', message: 'month must be between 1 and 12' });
    }
  }

  // Validate year
  const yearError = validateRequired(year, 'year');
  if (yearError) {
    errors.push(yearError);
  } else {
    const yearNum = Number(year);
    if (isNaN(yearNum) || !Number.isInteger(yearNum)) {
      errors.push({ field: 'year', message: 'year must be an integer' });
    } else if (yearNum < 2020) {
      errors.push({ field: 'year', message: 'year must be 2020 or later' });
    }
  }

  if (errors.length > 0) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: errors
      }
    });
    return;
  }

  next();
};
