import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logging/logger';

export interface AuthUser {
  id: string;
  email: string;
  role?: string;
}

export async function authenticateRequest(request: NextRequest): Promise<AuthUser | null> {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.debug('No authorization header found');
      return null;
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
      return null;
    }

    return {
      id: user.id,
      email: user.email!,
      role: user.user_metadata?.role || 'user'
    };
  } catch (error) {
    logger.error('Authentication error:', error);
    return null;
  }
}

export async function requireAuth(request: NextRequest): Promise<AuthUser> {
  const user = await authenticateRequest(request);
  if (!user) {
    throw new Error('Authentication required');
  }
  return user;
}

export async function requireRole(request: NextRequest, requiredRole: string): Promise<AuthUser> {
  const user = await requireAuth(request);
  if (user.role !== requiredRole && user.role !== 'admin') {
    throw new Error('Insufficient permissions');
  }
  return user;
}