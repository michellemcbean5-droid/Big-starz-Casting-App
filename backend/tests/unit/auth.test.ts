import jwt from 'jsonwebtoken';
import { hashPassword, comparePassword } from '../../src/utils/password';
import { generateAccessToken, verifyAccessToken, generateRefreshToken, verifyRefreshToken } from '../../src/utils/jwt';
import { ApiError } from '../../src/utils/ApiError';

// Set JWT secrets for tests
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-key-for-testing-only';

describe('Password Utils', () => {
  describe('hashPassword', () => {
    it('should hash a plain password', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);
      expect(hash).toBeDefined();
      expect(hash.length).toBeGreaterThan(0);
      expect(hash).not.toBe(password);
    });

    it('should produce different hashes for same password (salt)', async () => {
      const password = 'TestPassword123!';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('comparePassword', () => {
    it('should return true for matching password', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);
      const isMatch = await comparePassword(password, hash);
      expect(isMatch).toBe(true);
    });

    it('should return false for non-matching password', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);
      const isMatch = await comparePassword('WrongPassword!', hash);
      expect(isMatch).toBe(false);
    });
  });
});

describe('JWT Utils', () => {
  const payload = {
    userId: 'test-user-id-123',
    email: 'test@example.com',
    role: 'TALENT',
  };

  describe('generateAccessToken', () => {
    it('should generate a valid JWT token', () => {
      const token = generateAccessToken(payload);
      expect(token).toBeDefined();
      expect(token.split('.')).toHaveLength(3); // header.payload.signature
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify and decode a valid token', () => {
      const token = generateAccessToken(payload);
      const decoded = verifyAccessToken(token);
      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.email).toBe(payload.email);
      expect(decoded.role).toBe(payload.role);
    });

    it('should throw for invalid token', () => {
      expect(() => verifyAccessToken('invalid-token')).toThrow(jwt.JsonWebTokenError);
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a valid refresh token', () => {
      const token = generateRefreshToken(payload);
      expect(token).toBeDefined();
      expect(token.split('.')).toHaveLength(3);
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify and decode a valid refresh token', () => {
      const token = generateRefreshToken(payload);
      const decoded = verifyRefreshToken(token);
      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.email).toBe(payload.email);
    });
  });
});

describe('ApiError', () => {
  it('should create error with status code and message', () => {
    const error = new ApiError(404, 'Not found');
    expect(error.statusCode).toBe(404);
    expect(error.message).toBe('Not found');
    expect(error.isOperational).toBe(true);
  });

  it('should create bad request error', () => {
    const error = ApiError.badRequest('Invalid input');
    expect(error.statusCode).toBe(400);
    expect(error.message).toBe('Invalid input');
  });

  it('should create unauthorized error', () => {
    const error = ApiError.unauthorized();
    expect(error.statusCode).toBe(401);
    expect(error.message).toBe('Unauthorized');
  });

  it('should create forbidden error', () => {
    const error = ApiError.forbidden();
    expect(error.statusCode).toBe(403);
    expect(error.message).toBe('Forbidden');
  });

  it('should create not found error', () => {
    const error = ApiError.notFound();
    expect(error.statusCode).toBe(404);
    expect(error.message).toBe('Resource not found');
  });

  it('should create conflict error', () => {
    const error = ApiError.conflict('Already exists');
    expect(error.statusCode).toBe(409);
    expect(error.message).toBe('Already exists');
  });

  it('should create internal error', () => {
    const error = ApiError.internal();
    expect(error.statusCode).toBe(500);
    expect(error.message).toBe('Internal server error');
    expect(error.isOperational).toBe(false);
  });
});

describe('Auth Routes - Basic Validation', () => {
  // These are basic tests without the database layer
  // Full integration tests would require a test database

  describe('Password Validation', () => {
    it('should validate password requirements', () => {
      // Password must be at least 8 chars with uppercase, lowercase, number, special char
      const validPasswords = [
        'Test123!',
        'MyP@ssw0rd',
        'Secure$1A',
      ];
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;

      validPasswords.forEach(pwd => {
        expect(pwd.length).toBeGreaterThanOrEqual(8);
        expect(passwordRegex.test(pwd)).toBe(true);
      });
    });

    it('should reject weak passwords', () => {
      const weakPasswords = [
        'short',     // too short
        'lowercase', // no uppercase
        'UPPERCASE', // no lowercase
        'NoSpecial1', // no special char
        'NoNumber!',  // no number
      ];
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;

      weakPasswords.forEach(pwd => {
        const isLongEnough = pwd.length >= 8;
        const hasRequiredChars = passwordRegex.test(pwd);
        expect(isLongEnough && hasRequiredChars).toBe(false);
      });
    });
  });

  describe('Email Validation', () => {
    it('should validate email format', () => {
      const validEmails = [
        'user@example.com',
        'test.user@domain.co.uk',
        'user+tag@example.com',
      ];
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      validEmails.forEach(email => {
        expect(emailRegex.test(email)).toBe(true);
      });
    });

    it('should reject invalid emails', () => {
      const invalidEmails = [
        'not-an-email',
        '@nodomain.com',
        'spaces in@email.com',
        'missing@tld',
      ];
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      invalidEmails.forEach(email => {
        expect(emailRegex.test(email)).toBe(false);
      });
    });
  });
});
