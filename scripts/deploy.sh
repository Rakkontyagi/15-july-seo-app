#!/bin/bash

# Deploy script for SEO Automation App
# This script handles the deployment process with proper checks and optimizations

set -e

echo "🚀 Starting deployment process..."

# Check if we're in the correct directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Are you in the correct directory?"
    exit 1
fi

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Error: Vercel CLI is not installed. Please install it with: npm install -g vercel"
    exit 1
fi

# Environment check
if [ -z "$VERCEL_ORG_ID" ] || [ -z "$VERCEL_PROJECT_ID" ]; then
    echo "⚠️  Warning: VERCEL_ORG_ID and VERCEL_PROJECT_ID environment variables not set"
    echo "   This is required for automated deployments"
fi

# Run linting
echo "🔍 Running linter..."
npm run lint

# Run tests
echo "🧪 Running tests..."
npm run test

# Run build to verify everything compiles
echo "🏗️  Building application..."
npm run build

# Run E2E tests if available
if [ "$RUN_E2E" = "true" ]; then
    echo "🎭 Running E2E tests..."
    npm run test:e2e
fi

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
if [ "$1" = "production" ]; then
    echo "📈 Deploying to production..."
    vercel --prod
else
    echo "🔄 Deploying to preview..."
    vercel
fi

echo "✅ Deployment completed successfully!"

# Optional: Run post-deployment checks
if [ "$POST_DEPLOY_CHECKS" = "true" ]; then
    echo "🔍 Running post-deployment health checks..."
    
    # Wait for deployment to be available
    sleep 30
    
    # Check if the deployment is healthy
    if command -v curl &> /dev/null; then
        DEPLOYMENT_URL=$(vercel ls --json | jq -r '.[0].url' 2>/dev/null || echo "")
        if [ -n "$DEPLOYMENT_URL" ]; then
            echo "🏥 Checking deployment health at https://$DEPLOYMENT_URL..."
            curl -f "https://$DEPLOYMENT_URL/api/health" || echo "⚠️  Health check failed"
        fi
    fi
fi

echo "🎉 Deployment process completed!"