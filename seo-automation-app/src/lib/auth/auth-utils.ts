import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

export function validateEmail(email: string): boolean {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];
  
  if (!password || password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function hashPassword(password: string): Promise<string> {
  if (!password) throw new Error('Password cannot be empty');
  return bcrypt.hash(password, 12);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateSessionToken(userId: string, email: string): string {
  const payload = {
    userId,
    email,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
  };

  return jwt.sign(payload, process.env.JWT_SECRET || 'fallback-secret');
}

export interface TokenValidationResult {
  isValid: boolean;
  payload?: {
    userId: string;
    email: string;
    exp: number;
    iat: number;
  };
  error?: string;
}

export function validateSessionToken(token: string): TokenValidationResult {
  try {
    if (!token) {
      return { isValid: false, error: 'No token provided' };
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as jwt.JwtPayload & {
      userId: string;
      email: string;
      exp: number;
      iat: number;
    };
    
    // Check if token is expired
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return { isValid: false, error: 'Token expired' };
    }

    return {
      isValid: true,
      payload: {
        userId: payload.userId,
        email: payload.email,
        exp: payload.exp,
        iat: payload.iat,
      }
    };
  } catch (error) {
    return { 
      isValid: false, 
      error: error instanceof Error ? error.message : 'Invalid token' 
    };
  }
}

export function isAuthenticated(request: NextRequest): boolean {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return false;
    }

    const token = authHeader.substring(7);
    const result = validateSessionToken(token);
    return result.isValid;
  } catch {
    return false;
  }
}

export function getUserFromToken(token: string): { userId: string; email: string } | null {
  const result = validateSessionToken(token);
  if (result.isValid && result.payload) {
    return {
      userId: result.payload.userId,
      email: result.payload.email,
    };
  }
  return null;
}

export function refreshToken(oldToken: string): string {
  const result = validateSessionToken(oldToken);
  
  if (!result.isValid) {
    throw new Error('Invalid refresh token');
  }

  if (!result.payload) {
    throw new Error('Token expired');
  }

  // Generate new token with same user info
  return generateSessionToken(result.payload.userId, result.payload.email);
}