import { z } from 'zod';

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

// Get validated environment variables
export function getEnv() {
  const result = validateEnv();
  
  if (!result.success) {
    console.error('Environment validation failed:');
    result.errors.forEach((error) => {
      console.error(`  ${error.path}: ${error.message}`);
    });
    
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Environment validation failed in production');
    }
    
    // Return a default development environment
    return {
      NODE_ENV: 'development' as const,
      NEXT_PUBLIC_SITE_URL: 'http://localhost:3000',
      NEXT_PUBLIC_SUPABASE_URL: '',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: '',
      SUPABASE_SERVICE_ROLE_KEY: '',
      OPENAI_API_KEY: '',
      SERPER_API_KEY: '',
      FIRECRAWL_API_KEY: '',
      NEXTAUTH_SECRET: 'development-secret-key-32-chars-long',
      RATE_LIMIT_WINDOW: 900000,
      RATE_LIMIT_MAX_REQUESTS: 100,
      CACHE_TTL: 3600,
      DEBUG: false,
      LOG_LEVEL: 'info' as const,
    };
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

// Environment validation for API routes
export function validateApiEnv() {
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
    throw new Error(`Missing required environment variables: ${missingKeys.join(', ')}`);
  }
  
  return env;
}

// Type export for environment variables
export type EnvConfig = z.infer<typeof envSchema>;

// Initialize environment validation on module load
if (typeof window === 'undefined') {
  // Only validate on server-side
  validateEnv();
}

export default getEnv;