import { z } from 'zod';
import { logger } from '../logging/logger';

// Define the environment variable schema
const envSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Site configuration
  NEXT_PUBLIC_SITE_URL: z.string().url().default('http://localhost:3000'),
  
  // Supabase configuration
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  
  // AI service APIs
  OPENAI_API_KEY: z.string().min(1),
  ANTHROPIC_API_KEY: z.string().min(1).optional(),
  
  // External services
  SERPER_API_KEY: z.string().min(1),
  FIRECRAWL_API_KEY: z.string().min(1),
  
  // Authentication
  NEXTAUTH_SECRET: z.string().min(32),
  NEXTAUTH_URL: z.string().url().optional(),
  
  // Vercel deployment
  VERCEL_ORG_ID: z.string().optional(),
  VERCEL_PROJECT_ID: z.string().optional(),
  VERCEL_TOKEN: z.string().optional(),
  
  // Monitoring
  SENTRY_DSN: z.string().url().optional(),
  
  // Security
  ENCRYPTION_KEY: z.string().min(32).optional(),
  JWT_SECRET: z.string().min(32).optional(),
  
  // Performance
  ENABLE_BUNDLE_ANALYZER: z.string().transform((val) => val === 'true').optional(),
  ENABLE_PERFORMANCE_MONITORING: z.string().transform((val) => val === 'true').default('true'),
  
  // Rate limiting
  RATE_LIMIT_WINDOW: z.string().transform((val) => parseInt(val, 10)).default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform((val) => parseInt(val, 10)).default('100'),
  
  // Caching
  CACHE_TTL: z.string().transform((val) => parseInt(val, 10)).default('3600'),
  REDIS_URL: z.string().url().optional(),
  
  // Development
  DEBUG: z.string().transform((val) => val === 'true').default('false'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
});

// Validate environment variables
function validateEnv() {
  try {
    const env = envSchema.parse(process.env);
    return { success: true, data: env, errors: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        data: null,
        errors: error.errors.map((err) => ({
          path: err.path.join('.'),
          message: err.message,
          code: err.code,
        })),
      };
    }
    
    return {
      success: false,
      data: null,
      errors: [{ path: 'unknown', message: 'Unknown validation error', code: 'unknown' }],
    };
  }
}

// Get validated environment variables with improved error handling
export function getEnv() {
  const result = validateEnv();
  
  if (!result.success) {
    const errorSummary = result.errors.map(error => `${error.path}: ${error.message}`).join(', ');
    
    logger.error('Environment validation failed', { 
      errors: result.errors.map(error => ({
        path: error.path,
        message: error.message,
        code: error.code
      })),
      summary: errorSummary
    });
    
    if (process.env.NODE_ENV === 'production') {
      // In production, we need all required variables
      const criticalErrors = result.errors.filter(error => 
        ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'OPENAI_API_KEY'].includes(error.path)
      );
      
      if (criticalErrors.length > 0) {
        const criticalErrorMsg = `Critical environment variables missing: ${criticalErrors.map(e => e.path).join(', ')}`;
        logger.error(criticalErrorMsg);
        throw new Error(criticalErrorMsg);
      }
    }
    
    // For development, warn about missing variables but continue with defaults
    logger.warn('Using development defaults for missing environment variables', {
      missingVariables: result.errors.map(error => error.path)
    });
    
    // Return a more type-safe development environment
    const defaultEnv: EnvConfig = {
      NODE_ENV: 'development',
      NEXT_PUBLIC_SITE_URL: 'http://localhost:3000',
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
      SERPER_API_KEY: process.env.SERPER_API_KEY || '',
      FIRECRAWL_API_KEY: process.env.FIRECRAWL_API_KEY || '',
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || 'development-secret-key-32-chars-long-please-change-in-production',
      RATE_LIMIT_WINDOW: 900000,
      RATE_LIMIT_MAX_REQUESTS: 100,
      CACHE_TTL: 3600,
      DEBUG: false,
      LOG_LEVEL: 'info',
      ENABLE_PERFORMANCE_MONITORING: true,
    };
    
    return defaultEnv;
  }
  
  return result.data;
}

// Check if running in development
export function isDevelopment() {
  return getEnv().NODE_ENV === 'development';
}

// Check if running in production
export function isProduction() {
  return getEnv().NODE_ENV === 'production';
}

// Get site URL
export function getSiteUrl() {
  return getEnv().NEXT_PUBLIC_SITE_URL;
}

// Environment validation for API routes with enhanced error handling
export function validateApiEnv() {
  try {
    const env = getEnv();
    
    const requiredKeys = [
      'OPENAI_API_KEY',
      'SERPER_API_KEY', 
      'FIRECRAWL_API_KEY',
      'NEXT_PUBLIC_SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
    ];
    
    const missingKeys = requiredKeys.filter((key) => !env[key as keyof typeof env]);
    
    if (missingKeys.length > 0) {
      const errorMsg = `Missing required API environment variables: ${missingKeys.join(', ')}`;
      logger.error('API environment validation failed', { 
        missingKeys,
        environment: process.env.NODE_ENV 
      });
      
      if (process.env.NODE_ENV === 'production') {
        throw new Error(errorMsg);
      } else {
        logger.warn('API will have limited functionality due to missing environment variables', {
          missingKeys
        });
      }
    }
    
    // Validate API key formats
    const apiKeyValidation = validateApiKeyFormats(env);
    if (!apiKeyValidation.valid) {
      logger.warn('Some API keys may have invalid formats', {
        issues: apiKeyValidation.issues
      });
    }
    
    return env;
  } catch (error) {
    logger.error('Critical error during API environment validation', {
      error: error instanceof Error ? error.message : error
    });
    throw error;
  }
}

// Validate API key formats
function validateApiKeyFormats(env: EnvConfig) {
  const issues: string[] = [];
  
  // OpenAI API key should start with 'sk-'
  if (env.OPENAI_API_KEY && !env.OPENAI_API_KEY.startsWith('sk-')) {
    issues.push('OPENAI_API_KEY: Should start with "sk-"');
  }
  
  // Supabase URL should be a valid URL
  if (env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
      new URL(env.NEXT_PUBLIC_SUPABASE_URL);
    } catch {
      issues.push('NEXT_PUBLIC_SUPABASE_URL: Invalid URL format');
    }
  }
  
  // JWT tokens should be reasonable length
  if (env.SUPABASE_SERVICE_ROLE_KEY && env.SUPABASE_SERVICE_ROLE_KEY.length < 100) {
    issues.push('SUPABASE_SERVICE_ROLE_KEY: Seems too short for a JWT token');
  }
  
  return {
    valid: issues.length === 0,
    issues
  };
}

// Type export for environment variables
export type EnvConfig = z.infer<typeof envSchema>;

// Enhanced startup validation with better error handling
export function validateEnvironmentOnStartup(): { success: boolean; errors?: string[] } {
  if (typeof window !== 'undefined') {
    // Client-side validation - only check public vars
    return validateClientEnvironment();
  }
  
  try {
    const result = validateEnv();
    if (!result.success) {
      const criticalErrors = result.errors.filter(error => 
        ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'].includes(error.path)
      );
      
      if (criticalErrors.length > 0 && process.env.NODE_ENV === 'production') {
        return {
          success: false,
          errors: criticalErrors.map(e => `${e.path}: ${e.message}`)
        };
      }
    }
    
    logger.info('Environment validation completed', {
      success: result.success,
      environment: process.env.NODE_ENV,
      errorCount: result.errors?.length || 0
    });
    
    return { success: true };
  } catch (error) {
    logger.error('Environment validation failed during startup', {
      error: error instanceof Error ? error.message : error
    });
    return {
      success: false,
      errors: [error instanceof Error ? error.message : 'Unknown validation error']
    };
  }
}

// Client-side environment validation
function validateClientEnvironment(): { success: boolean; errors?: string[] } {
  const requiredClientVars = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'];
  const missing = requiredClientVars.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    return {
      success: false,
      errors: missing.map(key => `Missing required client environment variable: ${key}`)
    };
  }
  
  return { success: true };
}

// Check if all critical environment variables are available
export function hasCriticalEnvironmentVariables(): boolean {
  try {
    const env = getEnv();
    const critical = ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
    return critical.every(key => env[key as keyof typeof env]);
  } catch {
    return false;
  }
}

// Get environment variable with fallback and warning
export function getEnvVar(key: string, fallback?: string, required: boolean = false): string {
  const value = process.env[key];
  
  if (!value) {
    if (required) {
      const errorMsg = `Required environment variable ${key} is not set`;
      logger.error(errorMsg);
      throw new Error(errorMsg);
    }
    
    if (fallback) {
      logger.warn(`Environment variable ${key} not set, using fallback`, { fallback });
      return fallback;
    }
    
    logger.warn(`Environment variable ${key} not set and no fallback provided`);
    return '';
  }
  
  return value;
}

// Initialize environment validation on module load with improved handling
if (typeof window === 'undefined') {
  // Only validate on server-side
  const startupResult = validateEnvironmentOnStartup();
  if (!startupResult.success && process.env.NODE_ENV === 'production') {
    logger.error('Critical environment validation failure on startup', {
      errors: startupResult.errors
    });
    // In production, we could potentially exit the process here
    // process.exit(1);
  }
}

export default getEnv;