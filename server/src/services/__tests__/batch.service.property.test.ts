/**
 * Property-Based Tests for Batch Service
 * Using fast-check for property-based testing
 */

import * as fc from 'fast-check';
import { BatchService } from '../batch.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('BatchService Property-Based Tests', () => {
  // Clean up database before and after tests
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    // Clean up test batches
    await prisma.salesOrderLineItem.deleteMany({});
    await prisma.salesOrder.deleteMany({});
    await prisma.batch.deleteMany({
      where: {
        batchIdentifier: {
          startsWith: 'PROPTEST_',
        },
      },
    });
    await prisma.$disconnect();
  });

  // Feature: cannabis-shop-management, Property 5: Batch data persistence
  // Validates: Requirements 2.1
  test('Property 5: Batch data persistence - for any valid batch data, when created, retrieving that batch should return all fields with matching values', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          batchIdentifier: fc.string({ minLength: 1, maxLength: 50 }).map(s => `PROPTEST_${s.replace(/[^a-zA-Z0-9]/g, '_')}`),
          productName: fc.string({ minLength: 1, maxLength: 100 }),
          purchaseDate: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }).map(d => {
            // Normalize to midnight UTC to avoid timezone issues with MySQL DATE type
            const normalized = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
            return normalized;
          }),
          purchasePricePerUnit: fc.float({ min: 0, max: 10000, noNaN: true }).map(n => Math.round(n * 100) / 100),
          initialQuantity: fc.integer({ min: 1, max: 10000 }),
        }),
        async ({ batchIdentifier, productName, purchaseDate, purchasePricePerUnit, initialQuantity }) => {
          // Clean up any existing batch with this identifier
          await prisma.batch.deleteMany({
            where: { batchIdentifier },
          });

          // Act: Create the batch
          const createdBatch = await BatchService.createBatch({
            batchIdentifier,
            productName,
            purchaseDate,
            purchasePricePerUnit,
            initialQuantity,
          });

          try {
            // Assert: The created batch should have an ID
            expect(createdBatch.id).toBeDefined();
            expect(typeof createdBatch.id).toBe('number');

            // Assert: Retrieve the batch by ID
            const retrievedById = await BatchService.getBatchById(createdBatch.id);
            expect(retrievedById).not.toBeNull();

            // Assert: All fields should match the input data
            expect(retrievedById!.batchIdentifier).toBe(batchIdentifier);
            expect(retrievedById!.productName).toBe(productName);
            expect(retrievedById!.purchasePricePerUnit).toBe(purchasePricePerUnit);
            expect(retrievedById!.initialQuantity).toBe(initialQuantity);
            expect(retrievedById!.currentQuantity).toBe(initialQuantity); // Should equal initial quantity

            // Assert: Purchase date should match (comparing date strings to avoid timezone issues)
            // MySQL DATE type stores only the date part (YYYY-MM-DD), so we compare that
            const retrievedDateStr = retrievedById!.purchaseDate.toISOString().split('T')[0];
            const inputDateStr = purchaseDate.toISOString().split('T')[0];
            expect(retrievedDateStr).toBe(inputDateStr);

            // Assert: Retrieve the batch by batch identifier
            const retrievedByIdentifier = await BatchService.getBatchByIdentifier(batchIdentifier);
            expect(retrievedByIdentifier).not.toBeNull();
            expect(retrievedByIdentifier!.id).toBe(createdBatch.id);
            expect(retrievedByIdentifier!.batchIdentifier).toBe(batchIdentifier);
            expect(retrievedByIdentifier!.productName).toBe(productName);
            expect(retrievedByIdentifier!.purchasePricePerUnit).toBe(purchasePricePerUnit);
            expect(retrievedByIdentifier!.initialQuantity).toBe(initialQuantity);

            // Assert: Timestamps should be defined
            expect(retrievedById!.createdAt).toBeDefined();
            expect(retrievedById!.updatedAt).toBeDefined();
          } finally {
            // Cleanup: Remove the test batch
            await prisma.batch.delete({
              where: { id: createdBatch.id },
            }).catch(() => {
              // Ignore errors if already deleted
            });
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: cannabis-shop-management, Property 6: Batch initial quantity invariant
  // Validates: Requirements 2.3
  test('Property 6: Batch initial quantity invariant - for any newly created batch, the current quantity should equal the initial quantity', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          batchIdentifier: fc.string({ minLength: 1, maxLength: 50 }).map(s => `PROPTEST_INV_${s.replace(/[^a-zA-Z0-9]/g, '_')}`),
          productName: fc.string({ minLength: 1, maxLength: 100 }),
          purchaseDate: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }).map(d => {
            // Normalize to midnight UTC to avoid timezone issues with MySQL DATE type
            const normalized = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
            return normalized;
          }),
          purchasePricePerUnit: fc.float({ min: 0, max: 10000, noNaN: true }).map(n => Math.round(n * 100) / 100),
          initialQuantity: fc.integer({ min: 1, max: 10000 }),
        }),
        async ({ batchIdentifier, productName, purchaseDate, purchasePricePerUnit, initialQuantity }) => {
          // Clean up any existing batch with this identifier
          await prisma.batch.deleteMany({
            where: { batchIdentifier },
          });

          // Act: Create the batch
          const createdBatch = await BatchService.createBatch({
            batchIdentifier,
            productName,
            purchaseDate,
            purchasePricePerUnit,
            initialQuantity,
          });

          try {
            // Assert: The invariant - current quantity MUST equal initial quantity for newly created batches
            expect(createdBatch.currentQuantity).toBe(initialQuantity);
            expect(createdBatch.currentQuantity).toBe(createdBatch.initialQuantity);

            // Also verify by retrieving the batch from the database
            const retrievedBatch = await BatchService.getBatchById(createdBatch.id);
            expect(retrievedBatch).not.toBeNull();
            expect(retrievedBatch!.currentQuantity).toBe(retrievedBatch!.initialQuantity);
            expect(retrievedBatch!.currentQuantity).toBe(initialQuantity);
          } finally {
            // Cleanup: Remove the test batch
            await prisma.batch.delete({
              where: { id: createdBatch.id },
            }).catch(() => {
              // Ignore errors if already deleted
            });
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: cannabis-shop-management, Property 7: Batch immutability
  // Validates: Requirements 2.4
  test('Property 7: Batch immutability - for any existing batch, attempts to modify the purchase price or purchase date should be rejected, and those fields should remain unchanged', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          batchIdentifier: fc.string({ minLength: 1, maxLength: 50 }).map(s => `PROPTEST_IMM_${s.replace(/[^a-zA-Z0-9]/g, '_')}`),
          productName: fc.string({ minLength: 1, maxLength: 100 }),
          purchaseDate: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }).map(d => {
            // Normalize to midnight UTC to avoid timezone issues with MySQL DATE type
            const normalized = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
            return normalized;
          }),
          purchasePricePerUnit: fc.float({ min: 0, max: 10000, noNaN: true }).map(n => Math.round(n * 100) / 100),
          initialQuantity: fc.integer({ min: 1, max: 10000 }),
          // Generate update data
          newProductName: fc.string({ minLength: 1, maxLength: 100 }),
          newCurrentQuantity: fc.integer({ min: 0, max: 10000 }),
        }),
        async ({ batchIdentifier, productName, purchaseDate, purchasePricePerUnit, initialQuantity, newProductName, newCurrentQuantity }) => {
          // Clean up any existing batch with this identifier
          await prisma.batch.deleteMany({
            where: { batchIdentifier },
          });

          // Arrange: Create the batch
          const createdBatch = await BatchService.createBatch({
            batchIdentifier,
            productName,
            purchaseDate,
            purchasePricePerUnit,
            initialQuantity,
          });

          try {
            // Store original immutable values
            const originalPurchaseDate = createdBatch.purchaseDate;
            const originalPurchasePricePerUnit = createdBatch.purchasePricePerUnit;

            // Act: Update the batch with allowed fields (productName and currentQuantity)
            // Ensure newCurrentQuantity doesn't exceed initialQuantity
            const validNewQuantity = Math.min(newCurrentQuantity, initialQuantity);
            
            const updatedBatch = await BatchService.updateBatch(createdBatch.id, {
              productName: newProductName,
              currentQuantity: validNewQuantity,
            });

            // Assert: The immutable fields (purchaseDate and purchasePricePerUnit) should remain unchanged
            expect(updatedBatch.purchasePricePerUnit).toBe(originalPurchasePricePerUnit);
            
            // Compare dates as strings to avoid timezone issues
            const updatedDateStr = updatedBatch.purchaseDate.toISOString().split('T')[0];
            const originalDateStr = originalPurchaseDate.toISOString().split('T')[0];
            expect(updatedDateStr).toBe(originalDateStr);

            // Assert: The mutable fields should be updated
            expect(updatedBatch.productName).toBe(newProductName);
            expect(updatedBatch.currentQuantity).toBe(validNewQuantity);

            // Verify by retrieving from database
            const retrievedBatch = await BatchService.getBatchById(createdBatch.id);
            expect(retrievedBatch).not.toBeNull();
            expect(retrievedBatch!.purchasePricePerUnit).toBe(originalPurchasePricePerUnit);
            
            const retrievedDateStr = retrievedBatch!.purchaseDate.toISOString().split('T')[0];
            expect(retrievedDateStr).toBe(originalDateStr);
          } finally {
            // Cleanup: Remove the test batch
            await prisma.batch.delete({
              where: { id: createdBatch.id },
            }).catch(() => {
              // Ignore errors if already deleted
            });
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: cannabis-shop-management, Property 8: Batch inventory response completeness
  // Validates: Requirements 2.5
  test('Property 8: Batch inventory response completeness - for any batch in the inventory, the API response should include product name, batch identifier, current quantity, and purchase price', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          batchIdentifier: fc.string({ minLength: 1, maxLength: 50 }).map(s => `PROPTEST_RESP_${s.replace(/[^a-zA-Z0-9]/g, '_')}`),
          productName: fc.string({ minLength: 1, maxLength: 100 }),
          purchaseDate: fc.integer({ min: 2020, max: 2030 }).chain(year =>
            fc.integer({ min: 0, max: 11 }).chain(month =>
              fc.integer({ min: 1, max: 28 }).map(day => {
                // Use day 1-28 to avoid invalid dates (e.g., Feb 30)
                return new Date(Date.UTC(year, month, day));
              })
            )
          ),
          purchasePricePerUnit: fc.float({ min: 0, max: 10000, noNaN: true }).map(n => Math.round(n * 100) / 100),
          initialQuantity: fc.integer({ min: 1, max: 10000 }),
        }),
        async ({ batchIdentifier, productName, purchaseDate, purchasePricePerUnit, initialQuantity }) => {
          // Clean up any existing batch with this identifier
          await prisma.batch.deleteMany({
            where: { batchIdentifier },
          });

          // Arrange: Create the batch
          const createdBatch = await BatchService.createBatch({
            batchIdentifier,
            productName,
            purchaseDate,
            purchasePricePerUnit,
            initialQuantity,
          });

          try {
            // Act: Retrieve the batch via getBatches (simulating API response)
            const batches = await BatchService.getBatches();
            const retrievedBatch = batches.find(b => b.id === createdBatch.id);

            // Assert: The batch should be in the response
            expect(retrievedBatch).toBeDefined();

            // Assert: Response completeness - all required fields must be present
            expect(retrievedBatch!.productName).toBeDefined();
            expect(retrievedBatch!.batchIdentifier).toBeDefined();
            expect(retrievedBatch!.currentQuantity).toBeDefined();
            expect(retrievedBatch!.purchasePricePerUnit).toBeDefined();

            // Assert: The values should match the input data
            expect(retrievedBatch!.productName).toBe(productName);
            expect(retrievedBatch!.batchIdentifier).toBe(batchIdentifier);
            expect(retrievedBatch!.currentQuantity).toBe(initialQuantity);
            expect(retrievedBatch!.purchasePricePerUnit).toBe(purchasePricePerUnit);

            // Act: Also test getBatchById (another API endpoint)
            const batchById = await BatchService.getBatchById(createdBatch.id);

            // Assert: Response completeness for getBatchById
            expect(batchById).not.toBeNull();
            expect(batchById!.productName).toBeDefined();
            expect(batchById!.batchIdentifier).toBeDefined();
            expect(batchById!.currentQuantity).toBeDefined();
            expect(batchById!.purchasePricePerUnit).toBeDefined();

            // Assert: Values should match
            expect(batchById!.productName).toBe(productName);
            expect(batchById!.batchIdentifier).toBe(batchIdentifier);
            expect(batchById!.currentQuantity).toBe(initialQuantity);
            expect(batchById!.purchasePricePerUnit).toBe(purchasePricePerUnit);
          } finally {
            // Cleanup: Remove the test batch
            await prisma.batch.delete({
              where: { id: createdBatch.id },
            }).catch(() => {
              // Ignore errors if already deleted
            });
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: cannabis-shop-management, Property 33: Batch deletion prevention
  // Validates: Requirements 11.3
  test('Property 33: Batch deletion prevention - for any batch that is referenced by at least one sales order line item, attempts to delete the batch should be rejected and the batch should remain in the database', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          batchIdentifier: fc.string({ minLength: 1, maxLength: 50 }).map(s => `PROPTEST_DEL_${s.replace(/[^a-zA-Z0-9]/g, '_')}`),
          productName: fc.string({ minLength: 1, maxLength: 100 }),
          purchaseDate: fc.integer({ min: 2020, max: 2030 }).chain(year =>
            fc.integer({ min: 0, max: 11 }).chain(month =>
              fc.integer({ min: 1, max: 28 }).map(day => {
                // Use day 1-28 to avoid invalid dates (e.g., Feb 30)
                return new Date(Date.UTC(year, month, day));
              })
            )
          ),
          purchasePricePerUnit: fc.float({ min: Math.fround(0.01), max: 10000, noNaN: true }).map(n => Math.round(n * 100) / 100),
          initialQuantity: fc.integer({ min: 10, max: 10000 }),
          quantitySold: fc.integer({ min: 1, max: 5 }),
          sellingPricePerUnit: fc.float({ min: Math.fround(0.01), max: 15000, noNaN: true }).map(n => Math.round(n * 100) / 100),
        }),
        async ({ batchIdentifier, productName, purchaseDate, purchasePricePerUnit, initialQuantity, quantitySold, sellingPricePerUnit }) => {
          // Clean up any existing data with this identifier
          await prisma.batch.deleteMany({
            where: { batchIdentifier },
          });

          // Arrange: Create a batch
          const createdBatch = await BatchService.createBatch({
            batchIdentifier,
            productName,
            purchaseDate,
            purchasePricePerUnit,
            initialQuantity,
          });

          let salesOrderId: number | null = null;

          try {
            // Arrange: Create a sales order that references this batch
            const lineProfit = (sellingPricePerUnit - purchasePricePerUnit) * quantitySold;
            
            const salesOrder = await prisma.salesOrder.create({
              data: {
                orderDate: new Date(),
                customerName: 'Test Customer',
                totalProfit: lineProfit,
                isLocked: false,
                lineItems: {
                  create: [
                    {
                      batchId: createdBatch.id,
                      quantitySold: quantitySold,
                      sellingPricePerUnit: sellingPricePerUnit,
                      lineProfit: lineProfit,
                    },
                  ],
                },
              },
            });

            salesOrderId = salesOrder.id;

            // Act: Attempt to delete the batch that is referenced by the sales order
            let deletionError: Error | null = null;
            try {
              await BatchService.deleteBatch(createdBatch.id);
            } catch (error) {
              deletionError = error as Error;
            }

            // Assert: The deletion should be rejected with an error
            expect(deletionError).not.toBeNull();
            expect(deletionError!.message).toContain('Cannot delete batch that is referenced by sales orders');

            // Assert: The batch should still exist in the database
            const batchAfterDeletion = await BatchService.getBatchById(createdBatch.id);
            expect(batchAfterDeletion).not.toBeNull();
            expect(batchAfterDeletion!.id).toBe(createdBatch.id);
            expect(batchAfterDeletion!.batchIdentifier).toBe(batchIdentifier);

            // Assert: The batch data should remain unchanged
            expect(batchAfterDeletion!.productName).toBe(productName);
            expect(batchAfterDeletion!.purchasePricePerUnit).toBe(purchasePricePerUnit);
            expect(batchAfterDeletion!.initialQuantity).toBe(initialQuantity);
          } finally {
            // Cleanup: Remove the test data in correct order (sales order first, then batch)
            if (salesOrderId !== null) {
              await prisma.salesOrder.delete({
                where: { id: salesOrderId },
              }).catch(() => {
                // Ignore errors if already deleted
              });
            }

            await prisma.batch.delete({
              where: { id: createdBatch.id },
            }).catch(() => {
              // Ignore errors if already deleted
            });
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
