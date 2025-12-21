/**
 * Jest test setup file
 * Runs before all tests to configure the test environment
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-for-testing';
process.env.JWT_EXPIRES_IN = '24h';
process.env.BCRYPT_ROUNDS = '4'; // Lower rounds for faster tests

// Increase test timeout for database operations
jest.setTimeout(10000);
