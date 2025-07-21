# 🚀 CI/CD Pipeline Documentation

This directory contains the GitHub Actions workflows for the SEO Automation App CI/CD pipeline.

## 📋 Workflow Overview

### 🏗️ Main CI/CD Pipeline (`ci-cd.yml`)
**Triggered by:** Push to main/develop, Pull Requests, Manual dispatch

**Jobs:**
1. **Code Quality & Security** - Linting, type checking, security audit
2. **Testing Suite** - Unit, integration, and E2E tests (parallel matrix)
3. **Build Application** - Production build with artifact upload
4. **Deploy to Staging** - Automatic staging deployment for develop/PRs
5. **Performance Testing** - Lighthouse CI and Web Vitals checks
6. **Deploy to Production** - Production deployment for main branch
7. **Post-deployment Monitoring** - Health checks and synthetic monitoring
8. **Rollback** - Automatic rollback on deployment failure

### 🔒 Security Scanning (`security-scan.yml`)
**Triggered by:** Weekly schedule, Push to main, Manual dispatch

**Jobs:**
1. **Dependency Security Scan** - npm audit, Snyk scanning
2. **CodeQL Analysis** - Static code analysis for security vulnerabilities
3. **Container Security Scan** - Docker image vulnerability scanning with Trivy
4. **Secret Scanning** - TruffleHog for leaked secrets/credentials

### 📊 Performance Monitoring (`performance-monitoring.yml`)
**Triggered by:** Every 6 hours, Manual dispatch

**Jobs:**
1. **Lighthouse Performance Audit** - Core Web Vitals and performance metrics
2. **Load Testing** - K6 load testing for staging/production
3. **Real User Monitoring** - PageSpeed Insights API checks
4. **Performance Alerts** - Automated issue creation for performance degradation

### 💾 Database Backup & Maintenance (`database-backup.yml`)
**Triggered by:** Daily backups, Weekly full backup/maintenance

**Jobs:**
1. **Database Backup** - Automated Supabase backup to AWS S3
2. **Database Maintenance** - Weekly optimization and cleanup
3. **Backup Status Notification** - Success/failure notifications

### 🔄 Dependency Updates (`dependency-update.yml`)
**Triggered by:** Weekly schedule, Manual dispatch

**Jobs:**
1. **Update Dependencies** - Automated npm updates with PR creation
2. **Security Updates** - Security-focused dependency updates

## 🔧 Required Secrets

Add these secrets in your GitHub repository settings:

### Vercel Deployment
```
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_vercel_org_id
VERCEL_PROJECT_ID=your_vercel_project_id
```

### Supabase Database
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### External Services
```
OPENAI_API_KEY=sk-your-openai-key
SERPER_API_KEY=your-serper-key
FIRECRAWL_API_KEY=your-firecrawl-key
```

### Security Scanning
```
SNYK_TOKEN=your_snyk_token
```

### AWS S3 Backup (Optional)
```
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_S3_BACKUP_BUCKET=your-backup-bucket
```

## 📈 Performance Budgets

The pipeline enforces these performance budgets:

- **Lighthouse Performance Score:** ≥ 85
- **First Contentful Paint:** ≤ 1.5s
- **Largest Contentful Paint:** ≤ 2.5s
- **First Input Delay:** ≤ 100ms
- **Cumulative Layout Shift:** ≤ 0.1
- **Total Blocking Time:** ≤ 200ms

## 🔄 Deployment Strategy

### Staging Deployments
- Automatic deployment on push to `develop` branch
- Preview deployments for all pull requests
- Comment with staging URL added to PRs automatically

### Production Deployments
- Automatic deployment on push to `main` branch
- Zero-downtime deployment with health checks
- Automatic rollback on deployment failure

### Manual Rollback
- Available through GitHub Actions interface
- Reverts to previous stable deployment
- Creates incident issue for tracking

## 🧪 Testing Strategy

### Unit Tests
- Jest with React Testing Library
- Coverage reporting and artifacts
- Runs on every push and PR

### Integration Tests
- API endpoint testing
- Database integration tests
- External service mocking

### E2E Tests
- Playwright browser automation
- Critical user journey testing
- Visual regression testing

### Performance Tests
- Lighthouse CI integration
- K6 load testing
- Core Web Vitals monitoring

## 📊 Monitoring & Alerts

### Automated Monitoring
- Health check endpoints
- Performance degradation detection
- Security vulnerability scanning
- Database backup verification

### Alert Channels
- GitHub Issues for critical failures
- Performance budget violations
- Security vulnerability notifications
- Backup failure alerts

## 🔧 Configuration Files

### Lighthouse Configuration (`lighthouse.config.js`)
- Performance budget definitions
- Core Web Vitals thresholds
- Multi-page testing configuration

### Package.json Scripts Required
```json
{
  "scripts": {
    "build": "next build",
    "start": "next start",
    "test": "jest",
    "test:integration": "jest --config jest.integration.config.js",
    "test:e2e": "playwright test",
    "test:performance": "node performance/performance-test-runner.js",
    "test:performance-budget": "node scripts/check-performance-budget.js",
    "test:synthetic": "node scripts/synthetic-monitoring.js",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "analyze": "ANALYZE=true npm run build"
  }
}
```

## 🚀 Getting Started

1. **Set up repository secrets** as listed above
2. **Configure Vercel project** and get org/project IDs
3. **Set up external service accounts** (Snyk, AWS, etc.)
4. **Push to develop branch** to trigger first staging deployment
5. **Create PR to main** to test full pipeline
6. **Monitor workflows** in GitHub Actions tab

## 🔍 Troubleshooting

### Common Issues
1. **Vercel deployment fails:** Check VERCEL_TOKEN and project IDs
2. **Tests timeout:** Increase timeout values in workflow files
3. **Security scan fails:** Review and update SNYK_TOKEN
4. **Performance budget violations:** Optimize code or adjust budgets

### Debug Steps
1. Check workflow logs in GitHub Actions
2. Verify all required secrets are set
3. Test deployment commands locally
4. Review error messages and stack traces

## 📚 Further Reading

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vercel CLI Documentation](https://vercel.com/docs/cli)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- [Playwright Testing](https://playwright.dev/)
- [K6 Load Testing](https://k6.io/docs/)