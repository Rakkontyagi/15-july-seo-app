import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logging/logger';

export interface AuthUser {
  id: string;
  email: string;
  role?: string;
}

export interface AuthResult {
  success: boolean;
  user?: AuthUser;
  error?: string;
}

export async function authenticateRequest(request: NextRequest): Promise<AuthResult> {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.debug('No authorization header found');
      return {
        success: false,
        error: 'No authorization header provided'
      };
    }

    const token = authHeader.substring(7);

    // Create Supabase client with service role key for auth verification
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Verify the JWT token
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      logger.debug('Invalid token or user not found');
      return {
        success: false,
        error: error?.message || 'Invalid token or user not found'
      };
    }

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email!,
        role: user.user_metadata?.role || 'user'
      }
    };
  } catch (error) {
    logger.error('Authentication error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Authentication failed'
    };
  }
}

export async function requireAuth(request: NextRequest): Promise<AuthUser> {
  const result = await authenticateRequest(request);
  if (!result.success || !result.user) {
    throw new Error(result.error || 'Authentication required');
  }
  return result.user;
}

export async function requireRole(request: NextRequest, requiredRole: string): Promise<AuthUser> {
  const user = await requireAuth(request);
  if (user.role !== requiredRole && user.role !== 'admin') {
    throw new Error('Insufficient permissions');
  }
  return user;
}