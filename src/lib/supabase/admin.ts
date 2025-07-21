/**
 * Supabase admin client with service role key
 * Used for server-side operations that require elevated permissions
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables for admin client');
}

// Admin client with service role key
export const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  db: {
    schema: 'public',
  },
});

/**
 * Retry configuration for admin operations
 */
const RETRY_CONFIG = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 5000,
  backoffFactor: 2,
};

/**
 * Retry wrapper for admin operations
 */
async function withRetry<T>(
  operation: () => Promise<T>,
  context: string,
  maxAttempts: number = RETRY_CONFIG.maxAttempts
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      if (attempt === maxAttempts) {
        console.error(`${context} failed after ${maxAttempts} attempts:`, lastError);
        throw lastError;
      }
      
      const delay = Math.min(
        RETRY_CONFIG.baseDelay * Math.pow(RETRY_CONFIG.backoffFactor, attempt - 1),
        RETRY_CONFIG.maxDelay
      );
      
      console.warn(`${context} attempt ${attempt} failed, retrying in ${delay}ms:`, lastError.message);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

/**
 * Admin user operations
 */
export const adminUserOperations = {
  /**
   * Create user profile (service role only)
   */
  async createUserProfile(userId: string, userData: {
    email: string;
    full_name?: string;
    subscription_tier?: string;
  }) {
    return withRetry(async () => {
      const { data, error } = await supabaseAdmin
        .from('users')
        .insert({
          id: userId,
          email: userData.email,
          full_name: userData.full_name,
          subscription_tier: userData.subscription_tier || 'free',
          usage_count: 0,
          usage_limit: 10,
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create user profile: ${error.message}`);
      }

      return data;
    }, 'Create user profile');
  },

  /**
   * Get user profile by ID (service role only)
   */
  async getUserProfileById(userId: string) {
    return withRetry(async () => {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        throw new Error(`Failed to get user profile: ${error.message}`);
      }

      return data;
    }, 'Get user profile by ID');
  },

  /**
   * Update user subscription (service role only)
   */
  async updateUserSubscription(userId: string, subscriptionData: {
    subscription_tier: string;
    subscription_status: string;
    subscription_ends_at?: string;
    usage_limit?: number;
  }) {
    return withRetry(async () => {
      const { data, error } = await supabaseAdmin
        .from('users')
        .update(subscriptionData)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update user subscription: ${error.message}`);
      }

      return data;
    }, 'Update user subscription');
  },

  /**
   * Reset user usage count (service role only)
   */
  async resetUserUsage(userId: string) {
    return withRetry(async () => {
      const { data, error } = await supabaseAdmin
        .from('users')
        .update({ usage_count: 0 })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to reset user usage: ${error.message}`);
      }

      return data;
    }, 'Reset user usage');
  },
};

/**
 * Admin analytics operations
 */
export const adminAnalyticsOperations = {
  /**
   * Get usage statistics for all users
   */
  async getGlobalUsageStats() {
    return withRetry(async () => {
      const { data, error } = await supabaseAdmin
        .from('usage_analytics')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) {
        throw new Error(`Failed to get global usage stats: ${error.message}`);
      }

      return data;
    }, 'Get global usage stats');
  },

  /**
   * Get user count by subscription tier
   */
  async getUserCountByTier() {
    return withRetry(async () => {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('subscription_tier, count(*)')
        .group('subscription_tier');

      if (error) {
        throw new Error(`Failed to get user count by tier: ${error.message}`);
      }

      return data;
    }, 'Get user count by tier');
  },

  /**
   * Clean up expired data
   */
  async cleanupExpiredData() {
    return withRetry(async () => {
      // Clean expired SERP analysis
      const { error: serpError } = await supabaseAdmin
        .from('serp_analysis')
        .delete()
        .lt('expires_at', new Date().toISOString());

      if (serpError) {
        throw new Error(`Failed to clean expired SERP data: ${serpError.message}`);
      }

      // Clean expired competitor analysis
      const { error: competitorError } = await supabaseAdmin
        .from('competitor_analysis')
        .delete()
        .lt('expires_at', new Date().toISOString());

      if (competitorError) {
        throw new Error(`Failed to clean expired competitor data: ${competitorError.message}`);
      }

      return { success: true };
    }, 'Cleanup expired data');
  },
};

/**
 * Admin health check
 */
export const adminHealthCheck = {
  /**
   * Check database connectivity
   */
  async checkDatabaseHealth() {
    return withRetry(async () => {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('count')
        .limit(1);

      if (error) {
        throw new Error(`Database health check failed: ${error.message}`);
      }

      return { healthy: true, timestamp: new Date().toISOString() };
    }, 'Database health check');
  },

  /**
   * Check table existence
   */
  async checkTableStructure() {
    const tables = [
      'users',
      'projects',
      'generated_content',
      'serp_analysis',
      'competitor_analysis',
      'usage_analytics',
    ];

    const results = await Promise.all(
      tables.map(async (table) => {
        try {
          const { data, error } = await supabaseAdmin
            .from(table)
            .select('count')
            .limit(1);

          return {
            table,
            exists: !error,
            error: error?.message || null,
          };
        } catch (error) {
          return {
            table,
            exists: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      })
    );

    return results;
  },
};

/**
 * Connection error handler
 */
export function handleConnectionError(error: Error, context: string) {
  const errorMessage = error.message.toLowerCase();
  
  if (errorMessage.includes('connection') || errorMessage.includes('network')) {
    console.error(`${context}: Network connectivity issue`, error);
    return { type: 'network', message: 'Network connectivity issue. Please try again.' };
  }
  
  if (errorMessage.includes('timeout')) {
    console.error(`${context}: Request timeout`, error);
    return { type: 'timeout', message: 'Request timed out. Please try again.' };
  }
  
  if (errorMessage.includes('unauthorized') || errorMessage.includes('forbidden')) {
    console.error(`${context}: Authentication error`, error);
    return { type: 'auth', message: 'Authentication error. Please log in again.' };
  }
  
  if (errorMessage.includes('rate limit')) {
    console.error(`${context}: Rate limit exceeded`, error);
    return { type: 'rate_limit', message: 'Too many requests. Please wait and try again.' };
  }
  
  console.error(`${context}: Unknown error`, error);
  return { type: 'unknown', message: 'An unexpected error occurred. Please try again.' };
}

export default supabaseAdmin;

// Export createClient for backward compatibility
export { createClient };