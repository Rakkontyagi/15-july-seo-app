/**
 * API Key Validation Service
 * Provides secure API key validation for protected endpoints
 */

import { NextRequest } from 'next/server';
import { logger } from '@/lib/logging/logger';

export interface ApiKeyValidationResult {
  isValid: boolean;
  userId?: string;
  error?: string;
}

/**
 * Validates API key from request headers
 * @param request - Next.js request object
 * @returns Promise<ApiKeyValidationResult>
 */
export async function validateApiKey(request: NextRequest): Promise<ApiKeyValidationResult> {
  try {
    const apiKey = request.headers.get('x-api-key') || request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!apiKey) {
      return {
        isValid: false,
        error: 'API key is required'
      };
    }

    // For now, we'll use a simple validation
    // In production, this should validate against a database
    const validApiKeys = process.env.VALID_API_KEYS?.split(',') || [];
    
    if (validApiKeys.includes(apiKey)) {
      return {
        isValid: true,
        userId: 'default-user' // In production, map API key to user ID
      };
    }

    // Log invalid API key attempt
    logger.warn('Invalid API key attempt', {
      apiKey: apiKey.substring(0, 8) + '...',
      ip: request.ip,
      userAgent: request.headers.get('user-agent')
    });

    return {
      isValid: false,
      error: 'Invalid API key'
    };
  } catch (error) {
    logger.error('API key validation error', { error });
    return {
      isValid: false,
      error: 'API key validation failed'
    };
  }
}

/**
 * Middleware function for API key validation
 * @param request - Next.js request object
 * @returns Promise<Response | null> - Returns error response if invalid, null if valid
 */
export async function requireApiKey(request: NextRequest): Promise<Response | null> {
  const validation = await validateApiKey(request);
  
  if (!validation.isValid) {
    return new Response(
      JSON.stringify({
        error: validation.error,
        code: 'INVALID_API_KEY'
      }),
      {
        status: 401,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
  
  return null;
}

/**
 * Extract user ID from validated API key
 * @param request - Next.js request object
 * @returns Promise<string | null>
 */
export async function getUserIdFromApiKey(request: NextRequest): Promise<string | null> {
  const validation = await validateApiKey(request);
  return validation.isValid ? validation.userId || null : null;
}
