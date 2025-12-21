/**
 * Property-Based Tests for Validation Middleware
 * Using fast-check for property-based testing
 * Requirements: 11.4, 11.5
 */

import * as fc from 'fast-check';
import { validateMonetaryValue } from '../validation.middleware';

describe('Validation Middleware Property-Based Tests', () => {
  // Feature: cannabis-shop-management, Property 34: Monetary value validation
  // Validates: Requirements 11.4
  test('Property 34: Monetary value validation - for any input containing monetary values, if the value is negative, the system should reject the input and return a validation error', () => {
    fc.assert(
      fc.property(
        fc.record({
          // Generate negative monetary values
          negativeValue: fc.double({ min: -1000000, max: -0.01, noNaN: true }),
          fieldName: fc.string({ minLength: 1, maxLength: 50 }).map(s => s.replace(/[^a-zA-Z0-9_]/g, '_') || 'field'),
        }),
        ({ negativeValue, fieldName }) => {
          // Act: Validate the negative monetary value
          const result = validateMonetaryValue(negativeValue, fieldName);

          // Assert: The validation should return an error (not null)
          expect(result).not.toBeNull();
          
          // Assert: The error should reference the correct field
          expect(result?.field).toBe(fieldName);
          
          // Assert: The error message should indicate the value must be non-negative
          expect(result?.message).toContain('non-negative');
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 34 (complement): Valid non-negative monetary values should be accepted', () => {
    fc.assert(
      fc.property(
        fc.record({
          // Generate non-negative monetary values (including zero)
          nonNegativeValue: fc.double({ min: 0, max: 1000000, noNaN: true }),
          fieldName: fc.string({ minLength: 1, maxLength: 50 }).map(s => s.replace(/[^a-zA-Z0-9_]/g, '_') || 'field'),
        }),
        ({ nonNegativeValue, fieldName }) => {
          // Act: Validate the non-negative monetary value
          const result = validateMonetaryValue(nonNegativeValue, fieldName);

          // Assert: The validation should return null (no error)
          expect(result).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 34 (edge case): Invalid monetary value types should be rejected', () => {
    fc.assert(
      fc.property(
        fc.record({
          // Generate invalid values (non-numeric strings, objects, arrays, etc.)
          invalidValue: fc.oneof(
            fc.string().filter(s => isNaN(Number(s))), // Non-numeric strings
            fc.constant(null),
            fc.constant(undefined),
            fc.constant({}),
            fc.constant([]),
            fc.constant(NaN),
            fc.constant(Infinity),
            fc.constant(-Infinity)
          ),
          fieldName: fc.string({ minLength: 1, maxLength: 50 }).map(s => s.replace(/[^a-zA-Z0-9_]/g, '_') || 'field'),
        }),
        ({ invalidValue, fieldName }) => {
          // Act: Validate the invalid monetary value
          const result = validateMonetaryValue(invalidValue, fieldName);

          // Assert: The validation should return an error (not null)
          expect(result).not.toBeNull();
          
          // Assert: The error should reference the correct field
          expect(result?.field).toBe(fieldName);
        }
      ),
      { numRuns: 100 }
    );
  });
});
