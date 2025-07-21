# Fix Deployment Blockers Task

## ⚠️ CRITICAL EXECUTION NOTICE ⚠️

**THIS IS AN EXECUTABLE WORKFLOW - NOT REFERENCE MATERIAL**

When this task is invoked, execute ALL steps in sequence. This task addresses CRITICAL deployment failures preventing production deployment.

## TASK OVERVIEW

**Objective**: Resolve ESLint dependency conflicts and deployment infrastructure issues
**Priority**: CRITICAL BLOCKER
**Estimated Time**: 2-4 hours
**Impact**: Enables production deployment capability

## CURRENT DEPLOYMENT FAILURE

```
npm error ERESOLVE could not resolve
npm error While resolving: eslint-plugin-jest@27.9.0
npm error Found: @typescript-eslint/eslint-plugin@8.37.0
npm error Could not resolve dependency:
npm error peerOptional @typescript-eslint/eslint-plugin@"^5.0.0 || ^6.0.0 || ^7.0.0" from eslint-plugin-jest@27.9.0
npm error Conflicting peer dependency: @typescript-eslint/eslint-plugin@7.18.0
```

## EXECUTION STEPS

### Step 1: Analyze Current Project Structure

**Action**: Examine project structure and identify conflicts
```bash
# Navigate to project root
cd /mnt/persist/workspace

# Check current structure
ls -la
ls -la seo-automation-app/

# Examine package.json files
cat package.json | grep -A 10 -B 10 "eslint"
cat seo-automation-app/package.json | grep -A 10 -B 10 "eslint"
```

**Expected Output**: Identify dual package.json structure and version conflicts

### Step 2: Fix ESLint Dependency Conflicts

**Action**: Resolve version incompatibilities
```bash
# Navigate to seo-automation-app (main project directory)
cd seo-automation-app

# Backup current package.json
cp package.json package.json.backup

# Remove conflicting dependencies
npm uninstall eslint-plugin-jest @typescript-eslint/eslint-plugin @typescript-eslint/parser

# Install compatible versions
npm install --save-dev \
  eslint-plugin-jest@^28.9.0 \
  @typescript-eslint/eslint-plugin@^8.37.0 \
  @typescript-eslint/parser@^8.37.0

# Clean install with legacy peer deps (Vercel requirement)
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

**Validation**: 
```bash
# Test local build
npm run build

# Check for dependency conflicts
npm ls | grep -i conflict
```

### Step 3: Consolidate Project Structure

**Action**: Choose and implement project structure consolidation

**Option A: Move seo-automation-app to root (RECOMMENDED)**
```bash
# Navigate to project root
cd /mnt/persist/workspace

# Create backup
cp -r . ../backup-$(date +%Y%m%d-%H%M%S)

# Move seo-automation-app contents to root
cp -r seo-automation-app/* .
cp -r seo-automation-app/.* . 2>/dev/null || true

# Remove old directory
rm -rf seo-automation-app

# Update any references to seo-automation-app in configuration files
```

**Option B: Configure Vercel for subdirectory**
```json
// Update vercel.json
{
  "buildCommand": "cd seo-automation-app && npm run build",
  "installCommand": "cd seo-automation-app && npm install --legacy-peer-deps",
  "outputDirectory": "seo-automation-app/.next",
  "framework": "nextjs"
}
```

### Step 4: Secure Environment Variables

**Action**: Remove hardcoded API keys from vercel.json
```bash
# Backup current vercel.json
cp vercel.json vercel.json.backup

# Update vercel.json to use environment variable references
```

**Updated vercel.json**:
```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "installCommand": "npm install --legacy-peer-deps",
  "framework": "nextjs",
  "functions": {
    "src/app/api/content/generate/route.ts": {
      "maxDuration": 300,
      "memory": 3008
    }
  },
  "regions": ["iad1"],
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase-url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase-anon-key",
    "SUPABASE_SERVICE_ROLE_KEY": "@supabase-service-role-key",
    "OPENAI_API_KEY": "@openai-api-key",
    "SERPER_API_KEY": "@serper-api-key",
    "FIRECRAWL_API_KEY": "@firecrawl-api-key"
  }
}
```

### Step 5: Test Deployment Readiness

**Action**: Validate all fixes work correctly
```bash
# Test local build
npm run build

# Test with legacy peer deps (Vercel setting)
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
npm run build

# Run existing tests to ensure no regressions
npm run test

# Check for security vulnerabilities
npm audit --audit-level=moderate
```

## ACCEPTANCE CRITERIA

- [ ] No ESLint dependency conflicts in npm install
- [ ] Local build succeeds without errors
- [ ] All existing tests continue to pass
- [ ] No hardcoded API keys in repository files
- [ ] Clear, single project structure
- [ ] Vercel deployment succeeds
- [ ] Application functions correctly with environment variables
- [ ] Security audit passes with no critical vulnerabilities

## VALIDATION COMMANDS

```bash
# Final validation sequence
npm install --legacy-peer-deps
npm run lint
npm run type-check
npm run build
npm run test
npm audit --audit-level=moderate
```

## ROLLBACK PLAN

If issues occur:
```bash
# Restore from backup
cp package.json.backup package.json
cp vercel.json.backup vercel.json

# Clean install
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

## SUCCESS METRICS

- ✅ Vercel deployment completes successfully
- ✅ No dependency resolution errors
- ✅ Application loads and functions correctly
- ✅ All API endpoints respond properly
- ✅ Environment variables work in production
- ✅ No security vulnerabilities introduced

## NEXT STEPS AFTER COMPLETION

1. Monitor first successful deployment
2. Verify all application functionality works in production
3. Proceed with Phase 1: Core Functionality Implementation
4. Update team on deployment resolution
