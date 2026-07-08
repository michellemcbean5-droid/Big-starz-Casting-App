// Jest setup file - runs before each test suite
import { jest } from '@jest/globals';

// Set default test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-min-32-chars-long';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-key-min-32-chars';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/bigstarz_test';

// Mock console methods during tests to reduce noise
// Uncomment to suppress console output during tests
// jest.spyOn(console, 'log').mockImplementation(() => {});
// jest.spyOn(console, 'error').mockImplementation(() => {});
// jest.spyOn(console, 'warn').mockImplementation(() => {});

// Global test timeout
jest.setTimeout(10000);
