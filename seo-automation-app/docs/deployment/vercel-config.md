# Vercel Deployment Configuration

## Overview

This document outlines the complete Vercel deployment configuration for the SEO Automation App, including environment setup, build optimization, and production settings.

## Current Configuration

### vercel.json

```json
{
  "version": 2,
  "installCommand": "npm install --legacy-peer-deps",
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "framework": "nextjs",
  "regions": ["iad1", "sfo1"],
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "env": {
    "NODE_ENV": "production"
  },
  "build": {
    "env": {
      "NODE_OPTIONS": "--max-old-space-size=4096"
    }
  }
}
```

### Environment Variables

Required production environment variables in Vercel:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xpcbyzcaidfukddqniny.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# API Keys
OPENAI_API_KEY=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
SERPER_API_KEY=4ce37b02808e4325e42068eb815b03490a5519e5
FIRECRAWL_API_KEY=fc-4ba88920f7414c93aadb7f6e8752e6c5

# Security
JWT_SECRET=ultra-secure-jwt-secret-for-production-use-only-128-chars-minimum
SESSION_SECRET=ultra-secure-session-secret-for-production-use-only-128-chars-minimum

# Application Configuration
NODE_ENV=production
NEXT_PUBLIC_SITE_URL=https://seo-automation-app.vercel.app
RATE_LIMIT_ENABLED=true
ENABLE_ANALYTICS=true
```

## Deployment Process

### 1. Pre-deployment Checklist

- [ ] All environment variables configured in Vercel dashboard
- [ ] TypeScript compilation passes (`npm run type-check`)
- [ ] ESLint validation passes (`npm run lint`)
- [ ] Tests pass (`npm test`)
- [ ] Build succeeds locally (`npm run build`)

### 2. Automatic Deployment

Deployments trigger automatically on:
- Push to `main` branch (production)
- Push to `develop` branch (preview)
- Pull request creation (preview)

### 3. Manual Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

## Build Optimization

### Bundle Analysis

```bash
# Analyze bundle size
npm run build:analyze

# Check performance budget
npm run test:performance-budget
```

### Memory Optimization

Current settings for large-scale content processing:
- Node.js memory: 4GB (`--max-old-space-size=4096`)
- Function timeout: 30 seconds
- Regions: `iad1` (primary), `sfo1` (fallback)

### Performance Monitoring

Production monitoring includes:
- Vercel Analytics integration
- Speed Insights tracking
- Custom performance metrics
- Error tracking with Sentry

## Environment-Specific Configurations

### Production

```javascript
// next.config.js - Production optimizations
const config = {
  env: {
    NODE_ENV: 'production'
  },
  experimental: {
    optimizeCss: true,
    optimizeServerReact: true
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    dangerouslyAllowSVG: false
  },
  compress: true
};
```

### Staging/Preview

```javascript
// Preview deployments configuration
const previewConfig = {
  env: {
    NODE_ENV: 'staging'
  },
  experimental: {
    instrumentationHook: true
  }
};
```

## Security Configuration

### Headers

```javascript
// Security headers in next.config.js
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  }
];
```

### CORS Configuration

```javascript
// API CORS settings
const allowedOrigins = [
  'https://seo-automation-app.vercel.app',
  'https://seo-automation-app-git-main.vercel.app',
  process.env.NEXT_PUBLIC_SITE_URL
].filter(Boolean);
```

## Database Configuration

### Supabase Connection

```sql
-- Connection pooling settings
ALTER SYSTEM SET max_connections = 100;
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';

-- Performance optimizations
ALTER SYSTEM SET effective_cache_size = '256MB';
ALTER SYSTEM SET random_page_cost = 1.1;
```

### Connection Management

```typescript
// Connection pool configuration
const supabaseConfig = {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'x-application-name': 'seo-automation-app'
    }
  }
};
```

## Monitoring and Alerting

### Health Checks

```bash
# Production health check endpoint
curl https://seo-automation-app.vercel.app/api/health

# Expected response
{
  "status": "healthy",
  "timestamp": "2025-01-15T10:30:00Z",
  "version": "1.0.0",
  "services": {
    "database": true,
    "redis": true,
    "openai": true
  }
}
```

### Performance Metrics

Key metrics monitored:
- Response time: < 2 seconds (95th percentile)
- Availability: > 99.9%
- Error rate: < 0.1%
- Memory usage: < 80% of allocated

### Alerting Rules

1. **High Error Rate**: > 1% for 5 minutes
2. **Slow Response**: > 5 seconds for 3 minutes
3. **Memory Usage**: > 90% for 2 minutes
4. **Database Connection**: Failures for 1 minute

## Troubleshooting

### Common Issues

1. **Build Failures**
   ```bash
   # Clear cache and rebuild
   rm -rf .next node_modules/.cache
   npm install --legacy-peer-deps
   npm run build
   ```

2. **Memory Issues**
   ```bash
   # Increase memory limit
   export NODE_OPTIONS="--max-old-space-size=8192"
   npm run build
   ```

3. **TypeScript Errors**
   ```bash
   # Check TypeScript compilation
   npm run type-check
   ```

4. **Environment Variable Issues**
   ```bash
   # Validate environment
   node -e "console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)"
   ```

### Deployment Logs

Access deployment logs via:
- Vercel Dashboard → Project → Functions tab
- CLI: `vercel logs`
- Runtime logs: `vercel logs --follow`

## Rollback Procedures

### Automatic Rollback

```bash
# Rollback to previous deployment
vercel rollback

# Rollback to specific deployment
vercel rollback [deployment-url]
```

### Manual Rollback

1. Identify stable deployment in Vercel dashboard
2. Click "Promote to Production"
3. Verify health checks pass
4. Update environment variables if needed

## Performance Optimization

### Bundle Size Optimization

Current bundle analysis results:
- Initial JS: ~200KB (gzipped)
- Total bundle: ~800KB (gzipped)
- Lighthouse score: 95+ (Performance)

### Caching Strategy

```javascript
// next.config.js caching
const config = {
  experimental: {
    staticWorkerDestructuringNoop: true
  },
  headers: async () => [
    {
      source: '/api/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=300, stale-while-revalidate=600'
        }
      ]
    }
  ]
};
```

## Continuous Deployment

### GitHub Actions Integration

```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

---

*Last updated: January 15, 2025*