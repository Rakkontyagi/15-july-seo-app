/**
 * Unit Tests for Authentication Utilities
 * Tests authentication functions, validation, and security features
 */

import { 
  validateEmail, 
  validatePassword, 
  hashPassword, 
  verifyPassword,
  generateSessionToken,
  validateSessionToken,
  isAuthenticated,
  getUserFromToken,
  refreshToken
} from '@/lib/auth/auth-utils';

describe('Authentication Utilities', () => {
  describe('validateEmail', () => {
    it('should validate correct email formats', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
        'user123@test-domain.com'
      ];

      validEmails.forEach(email => {
        expect(validateEmail(email)).toBe(true);
        expect(email).toBeValidEmail();
      });
    });

    it('should reject invalid email formats', () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'user@',
        'user@.com',
        'user..name@example.com',
        'user@example.',
        ''
      ];

      invalidEmails.forEach(email => {
        expect(validateEmail(email)).toBe(false);
      });
    });

    it('should handle edge cases', () => {
      expect(validateEmail(null as any)).toBe(false);
      expect(validateEmail(undefined as any)).toBe(false);
      expect(validateEmail(' test@example.com ')).toBe(true); // Should trim
    });
  });

  describe('validatePassword', () => {
    it('should validate strong passwords', () => {
      const strongPasswords = [
        'StrongPass123!',
        'MySecure@Password1',
        'Complex#Pass2023',
        'Secure$123Password'
      ];

      strongPasswords.forEach(password => {
        const result = validatePassword(password);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    it('should reject weak passwords', () => {
      const weakPasswords = [
        { password: '123456', expectedErrors: ['length', 'uppercase', 'lowercase', 'special'] },
        { password: 'password', expectedErrors: ['uppercase', 'number', 'special'] },
        { password: 'PASSWORD', expectedErrors: ['lowercase', 'number', 'special'] },
        { password: 'Pass123', expectedErrors: ['special'] },
        { password: 'Pass!', expectedErrors: ['length', 'number'] }
      ];

      weakPasswords.forEach(({ password, expectedErrors }) => {
        const result = validatePassword(password);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
        
        expectedErrors.forEach(errorType => {
          expect(result.errors.some(error => error.includes(errorType))).toBe(true);
        });
      });
    });

    it('should provide helpful error messages', () => {
      const result = validatePassword('weak');
      expect(result.errors).toContain('Password must be at least 8 characters long');
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
      expect(result.errors).toContain('Password must contain at least one number');
      expect(result.errors).toContain('Password must contain at least one special character');
    });
  });

  describe('hashPassword', () => {
    it('should hash passwords securely', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);
      
      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(50); // bcrypt hashes are typically 60 chars
      expect(hash).toMatch(/^\$2[aby]\$\d+\$/); // bcrypt format
    });

    it('should generate different hashes for same password', async () => {
      const password = 'TestPassword123!';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);
      
      expect(hash1).not.toBe(hash2); // Salt should make them different
    });

    it('should handle empty passwords', async () => {
      await expect(hashPassword('')).rejects.toThrow('Password cannot be empty');
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct passwords', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);
      
      const isValid = await verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect passwords', async () => {
      const password = 'TestPassword123!';
      const wrongPassword = 'WrongPassword123!';
      const hash = await hashPassword(password);
      
      const isValid = await verifyPassword(wrongPassword, hash);
      expect(isValid).toBe(false);
    });

    it('should handle invalid hashes', async () => {
      const password = 'TestPassword123!';
      const invalidHash = 'invalid-hash';
      
      await expect(verifyPassword(password, invalidHash)).rejects.toThrow();
    });
  });

  describe('generateSessionToken', () => {
    it('should generate valid JWT tokens', () => {
      const userId = 'test-user-id';
      const email = 'test@example.com';
      
      const token = generateSessionToken(userId, email);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should include user information in token', () => {
      const userId = 'test-user-id';
      const email = 'test@example.com';
      
      const token = generateSessionToken(userId, email);
      const payload = JSON.parse(atob(token.split('.')[1]));
      
      expect(payload.userId).toBe(userId);
      expect(payload.email).toBe(email);
      expect(payload.exp).toBeDefined();
      expect(payload.iat).toBeDefined();
    });

    it('should set appropriate expiration time', () => {
      const userId = 'test-user-id';
      const email = 'test@example.com';
      
      const token = generateSessionToken(userId, email);
      const payload = JSON.parse(atob(token.split('.')[1]));
      
      const now = Math.floor(Date.now() / 1000);
      const expectedExp = now + (24 * 60 * 60); // 24 hours
      
      expect(payload.exp).toBeCloseTo(expectedExp, -2); // Within 100 seconds
    });
  });

  describe('validateSessionToken', () => {
    it('should validate correct tokens', () => {
      const userId = 'test-user-id';
      const email = 'test@example.com';
      
      const token = generateSessionToken(userId, email);
      const result = validateSessionToken(token);
      
      expect(result.isValid).toBe(true);
      expect(result.payload?.userId).toBe(userId);
      expect(result.payload?.email).toBe(email);
    });

    it('should reject invalid tokens', () => {
      const invalidTokens = [
        'invalid-token',
        'header.payload.signature',
        '',
        null,
        undefined
      ];

      invalidTokens.forEach(token => {
        const result = validateSessionToken(token as any);
        expect(result.isValid).toBe(false);
        expect(result.error).toBeDefined();
      });
    });

    it('should reject expired tokens', () => {
      // Create token with past expiration
      const header = { alg: 'HS256', typ: 'JWT' };
      const payload = {
        userId: 'test-user-id',
        email: 'test@example.com',
        exp: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
        iat: Math.floor(Date.now() / 1000) - 7200  // 2 hours ago
      };
      
      const encodedHeader = btoa(JSON.stringify(header));
      const encodedPayload = btoa(JSON.stringify(payload));
      const expiredToken = `${encodedHeader}.${encodedPayload}.signature`;
      
      const result = validateSessionToken(expiredToken);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('expired');
    });
  });

  describe('isAuthenticated', () => {
    it('should return true for valid authentication', () => {
      const mockRequest = {
        headers: {
          authorization: 'Bearer valid-token'
        }
      };

      // Mock validateSessionToken to return valid result
      jest.spyOn(require('@/lib/auth/auth-utils'), 'validateSessionToken')
        .mockReturnValue({ isValid: true, payload: { userId: 'test-user-id' } });

      const result = isAuthenticated(mockRequest as any);
      expect(result).toBe(true);
    });

    it('should return false for missing authorization header', () => {
      const mockRequest = {
        headers: {}
      };

      const result = isAuthenticated(mockRequest as any);
      expect(result).toBe(false);
    });

    it('should return false for invalid token format', () => {
      const mockRequest = {
        headers: {
          authorization: 'Invalid token-format'
        }
      };

      const result = isAuthenticated(mockRequest as any);
      expect(result).toBe(false);
    });

    it('should return false for invalid tokens', () => {
      const mockRequest = {
        headers: {
          authorization: 'Bearer invalid-token'
        }
      };

      // Mock validateSessionToken to return invalid result
      jest.spyOn(require('@/lib/auth/auth-utils'), 'validateSessionToken')
        .mockReturnValue({ isValid: false, error: 'Invalid token' });

      const result = isAuthenticated(mockRequest as any);
      expect(result).toBe(false);
    });
  });

  describe('getUserFromToken', () => {
    it('should extract user information from valid token', () => {
      const userId = 'test-user-id';
      const email = 'test@example.com';
      const token = generateSessionToken(userId, email);
      
      const user = getUserFromToken(token);
      
      expect(user).toBeDefined();
      expect(user?.userId).toBe(userId);
      expect(user?.email).toBe(email);
    });

    it('should return null for invalid tokens', () => {
      const invalidToken = 'invalid-token';
      const user = getUserFromToken(invalidToken);
      
      expect(user).toBeNull();
    });

    it('should return null for expired tokens', () => {
      // Create expired token
      const header = { alg: 'HS256', typ: 'JWT' };
      const payload = {
        userId: 'test-user-id',
        email: 'test@example.com',
        exp: Math.floor(Date.now() / 1000) - 3600,
        iat: Math.floor(Date.now() / 1000) - 7200
      };
      
      const encodedHeader = btoa(JSON.stringify(header));
      const encodedPayload = btoa(JSON.stringify(payload));
      const expiredToken = `${encodedHeader}.${encodedPayload}.signature`;
      
      const user = getUserFromToken(expiredToken);
      expect(user).toBeNull();
    });
  });

  describe('refreshToken', () => {
    it('should generate new token from valid refresh token', async () => {
      const userId = 'test-user-id';
      const email = 'test@example.com';
      const originalToken = generateSessionToken(userId, email);
      
      const newToken = await refreshToken(originalToken);
      
      expect(newToken).toBeDefined();
      expect(newToken).not.toBe(originalToken);
      
      const newPayload = JSON.parse(atob(newToken.split('.')[1]));
      expect(newPayload.userId).toBe(userId);
      expect(newPayload.email).toBe(email);
    });

    it('should reject invalid refresh tokens', async () => {
      const invalidToken = 'invalid-token';
      
      await expect(refreshToken(invalidToken)).rejects.toThrow('Invalid refresh token');
    });

    it('should reject expired refresh tokens', async () => {
      // Create expired token
      const header = { alg: 'HS256', typ: 'JWT' };
      const payload = {
        userId: 'test-user-id',
        email: 'test@example.com',
        exp: Math.floor(Date.now() / 1000) - 3600,
        iat: Math.floor(Date.now() / 1000) - 7200
      };
      
      const encodedHeader = btoa(JSON.stringify(header));
      const encodedPayload = btoa(JSON.stringify(payload));
      const expiredToken = `${encodedHeader}.${encodedPayload}.signature`;
      
      await expect(refreshToken(expiredToken)).rejects.toThrow('Token expired');
    });
  });
});
