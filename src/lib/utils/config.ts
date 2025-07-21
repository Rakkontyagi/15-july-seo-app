import { env } from './env'

export const config = {
  app: {
    name: 'SEO Automation Platform',
    url: env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    environment: env.NODE_ENV,
  },
  
  supabase: {
    url: env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
  },
  
  ai: {
    openai: {
      apiKey: env.OPENAI_API_KEY,
      model: 'gpt-4o-mini',
      maxTokens: 4000,
    },
    anthropic: {
      apiKey: env.ANTHROPIC_API_KEY,
      model: 'claude-3-haiku-20240307',
      maxTokens: 4000,
    },
  },
  
  scraping: {
    serper: {
      apiKey: env.SERPER_API_KEY,
      baseUrl: 'https://google.serper.dev',
    },
    firecrawl: {
      apiKey: env.FIRECRAWL_API_KEY,
      baseUrl: 'https://api.firecrawl.dev',
    },
  },
  
  analytics: {
    vercel: {
      id: env.VERCEL_ANALYTICS_ID,
    },
    sentry: {
      dsn: env.SENTRY_DSN,
    },
  },
  
  auth: {
    secret: env.NEXTAUTH_SECRET,
    url: env.NEXTAUTH_URL,
  },
  
  features: {
    enableAnalytics: env.NODE_ENV === 'production',
    enableDebugMode: env.NODE_ENV === 'development',
    enableSentryTracking: !!env.SENTRY_DSN,
  },
  
  limits: {
    maxContentLength: 50000,
    maxProjectsPerUser: 10,
    maxGenerationsPerDay: 100,
    rateLimit: {
      requests: 100,
      windowMs: 15 * 60 * 1000, // 15 minutes
    },
  },
} as const

export type Config = typeof config