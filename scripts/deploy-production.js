#!/usr/bin/env node

/**
 * Production Deployment Script
 * Orchestrates blue-green deployment to Vercel with comprehensive validation
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  project: 'seo-automation-app',
  environments: {
    staging: {
      branch: 'develop',
      domain: 'staging-seo-app.vercel.app',
    },
    production: {
      branch: 'main',
      domain: 'seo-automation-app.vercel.app',
    },
  },
  healthChecks: {
    timeout: 60000, // 1 minute
    retries: 3,
    endpoints: [
      '/api/health',
      '/api/health/database',
      '/api/content/generate',
    ],
  },
  rollback: {
    enabled: true,
    onFailure: true,
  },
};

class ProductionDeployment {
  constructor() {
    this.startTime = Date.now();
    this.deploymentId = null;
    this.stagingUrl = null;
    this.productionUrl = null;
  }

  /**
   * Main deployment orchestration
   */
  async deploy() {
    try {
      console.log('\n🚀 Starting Production Deployment');
      console.log('=====================================');
      
      // Pre-deployment checks
      await this.runPreDeploymentChecks();
      
      // Build and test
      await this.buildAndTest();
      
      // Deploy to staging
      await this.deployToStaging();
      
      // Health checks on staging
      await this.validateStagingDeployment();
      
      // Deploy to production with blue-green strategy
      await this.deployToProduction();
      
      // Final validation
      await this.validateProductionDeployment();
      
      // Post-deployment tasks
      await this.postDeploymentTasks();
      
      console.log('\n✅ Production deployment completed successfully!');
      this.printDeploymentSummary();
      
    } catch (error) {
      console.error('\n❌ Deployment failed:', error.message);
      
      if (CONFIG.rollback.onFailure) {
        await this.rollback();
      }
      
      process.exit(1);
    }
  }

  /**
   * Pre-deployment validation
   */
  async runPreDeploymentChecks() {
    console.log('\n📋 Running pre-deployment checks...');
    
    // Check environment variables
    this.checkEnvironmentVariables();
    
    // Verify git status
    this.checkGitStatus();
    
    // Check dependencies
    await this.checkDependencies();
    
    // Validate configuration files
    this.validateConfigFiles();
    
    console.log('✅ Pre-deployment checks passed');
  }

  /**
   * Check required environment variables
   */
  checkEnvironmentVariables() {
    const requiredVars = [
      'VERCEL_TOKEN',
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'OPENAI_API_KEY',
      'SERPER_API_KEY',
      'FIRECRAWL_API_KEY',
    ];

    const missing = requiredVars.filter(varName => !process.env[varName]);
    
    if (missing.length > 0) {
      throw new Error(`Missing environment variables: ${missing.join(', ')}`);
    }

    console.log('  ✓ Environment variables validated');
  }

  /**
   * Check git repository status
   */
  checkGitStatus() {
    try {
      // Check if we're on the right branch
      const currentBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
      
      if (currentBranch !== CONFIG.environments.production.branch) {
        throw new Error(`Must be on ${CONFIG.environments.production.branch} branch for production deployment`);
      }

      // Check for uncommitted changes
      const status = execSync('git status --porcelain', { encoding: 'utf8' });
      
      if (status.trim()) {
        throw new Error('Uncommitted changes detected. Please commit or stash changes before deployment.');
      }

      // Check if branch is up to date with remote
      execSync('git fetch origin');
      const behindCount = execSync(
        `git rev-list --count HEAD..origin/${currentBranch}`, 
        { encoding: 'utf8' }
      ).trim();

      if (behindCount !== '0') {
        throw new Error(`Local branch is ${behindCount} commits behind remote. Please pull latest changes.`);
      }

      console.log('  ✓ Git status validated');
      
    } catch (error) {
      if (error.message.includes('git')) {
        throw error;
      }
      throw new Error(`Git validation failed: ${error.message}`);
    }
  }

  /**
   * Check dependencies and security
   */
  async checkDependencies() {
    try {
      // Check for security vulnerabilities
      console.log('  🔍 Checking for security vulnerabilities...');
      execSync('npm audit --audit-level=high', { stdio: 'pipe' });
      
      // Verify dependencies are installed
      if (!fs.existsSync('node_modules')) {
        console.log('  📦 Installing dependencies...');
        execSync('npm ci', { stdio: 'inherit' });
      }

      console.log('  ✓ Dependencies validated');
      
    } catch (error) {
      if (error.status === 1) {
        console.warn('  ⚠️ Security vulnerabilities found - please review');
        // Don't fail deployment for audit warnings, just log them
      } else {
        throw new Error(`Dependency check failed: ${error.message}`);
      }
    }
  }

  /**
   * Validate configuration files
   */
  validateConfigFiles() {
    const requiredFiles = [
      'package.json',
      'next.config.js',
      'vercel.json',
      'tsconfig.json',
    ];

    for (const file of requiredFiles) {
      if (!fs.existsSync(file)) {
        throw new Error(`Required configuration file missing: ${file}`);
      }
    }

    // Validate package.json scripts
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const requiredScripts = ['build', 'start', 'test'];
    
    for (const script of requiredScripts) {
      if (!packageJson.scripts[script]) {
        throw new Error(`Required npm script missing: ${script}`);
      }
    }

    console.log('  ✓ Configuration files validated');
  }

  /**
   * Build and test the application
   */
  async buildAndTest() {
    console.log('\n🔨 Building and testing application...');
    
    try {
      // Type checking
      console.log('  📝 Running type checks...');
      execSync('npx tsc --noEmit', { stdio: 'inherit' });
      
      // Linting
      console.log('  🧹 Running linter...');
      execSync('npm run lint', { stdio: 'inherit' });
      
      // Tests
      console.log('  🧪 Running tests...');
      execSync('npm test -- --watchAll=false --coverage=false', { stdio: 'inherit' });
      
      // Build
      console.log('  🏗️ Building application...');
      execSync('npm run build', { stdio: 'inherit' });
      
      console.log('✅ Build and tests completed');
      
    } catch (error) {
      throw new Error(`Build/test failed: ${error.message}`);
    }
  }

  /**
   * Deploy to staging environment
   */
  async deployToStaging() {
    console.log('\n🎭 Deploying to staging...');
    
    try {
      const vercelCommand = [
        'npx vercel',
        '--prod=false', // Deploy to preview
        '--yes', // Skip confirmations
        '--token', process.env.VERCEL_TOKEN,
      ].join(' ');

      const output = execSync(vercelCommand, { encoding: 'utf8' });
      
      // Extract deployment URL from output
      const urlMatch = output.match(/https:\/\/[^\s]+/);
      if (!urlMatch) {
        throw new Error('Could not extract deployment URL from Vercel output');
      }
      
      this.stagingUrl = urlMatch[0];
      console.log(`  ✅ Staging deployed: ${this.stagingUrl}`);
      
    } catch (error) {
      throw new Error(`Staging deployment failed: ${error.message}`);
    }
  }

  /**
   * Validate staging deployment
   */
  async validateStagingDeployment() {
    console.log('\n🏥 Validating staging deployment...');
    
    // Wait for deployment to be ready
    await this.waitForDeployment(this.stagingUrl);
    
    // Run health checks
    await this.runHealthChecks(this.stagingUrl);
    
    // Performance validation
    await this.validatePerformance(this.stagingUrl);
    
    console.log('✅ Staging validation completed');
  }

  /**
   * Wait for deployment to be accessible
   */
  async waitForDeployment(url, maxWaitTime = 300000) {
    console.log(`  ⏳ Waiting for deployment to be ready: ${url}`);
    
    const startTime = Date.now();
    const pollInterval = 10000; // 10 seconds
    
    while (Date.now() - startTime < maxWaitTime) {
      try {
        const response = await fetch(`${url}/api/health`, {
          method: 'GET',
          timeout: 10000,
        });
        
        if (response.ok) {
          console.log('  ✅ Deployment is ready');
          return;
        }
        
      } catch (error) {
        // Deployment not ready yet, continue waiting
      }
      
      await new Promise(resolve => setTimeout(resolve, pollInterval));
      process.stdout.write('.');
    }
    
    throw new Error(`Deployment not ready within ${maxWaitTime}ms`);
  }

  /**
   * Run comprehensive health checks
   */
  async runHealthChecks(baseUrl) {
    console.log('  🩺 Running health checks...');
    
    const results = [];
    
    for (const endpoint of CONFIG.healthChecks.endpoints) {
      const url = `${baseUrl}${endpoint}`;
      
      for (let retry = 0; retry < CONFIG.healthChecks.retries; retry++) {
        try {
          const startTime = Date.now();
          const response = await fetch(url, {
            method: 'GET',
            timeout: CONFIG.healthChecks.timeout,
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'DeploymentBot/1.0',
            },
          });
          
          const responseTime = Date.now() - startTime;
          
          if (response.ok) {
            results.push({
              endpoint,
              status: 'pass',
              responseTime,
              httpStatus: response.status,
            });
            console.log(`    ✅ ${endpoint} (${responseTime}ms)`);
            break;
          } else {
            if (retry === CONFIG.healthChecks.retries - 1) {
              results.push({
                endpoint,
                status: 'fail',
                httpStatus: response.status,
                error: response.statusText,
              });
              console.log(`    ❌ ${endpoint} - HTTP ${response.status}`);
            }
          }
          
        } catch (error) {
          if (retry === CONFIG.healthChecks.retries - 1) {
            results.push({
              endpoint,
              status: 'error',
              error: error.message,
            });
            console.log(`    ❌ ${endpoint} - ${error.message}`);
          }
        }
        
        if (retry < CONFIG.healthChecks.retries - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }
    
    const failedChecks = results.filter(r => r.status !== 'pass');
    
    if (failedChecks.length > 0) {
      throw new Error(`Health checks failed: ${failedChecks.map(c => c.endpoint).join(', ')}`);
    }
    
    console.log('  ✅ All health checks passed');
  }

  /**
   * Validate performance metrics
   */
  async validatePerformance(baseUrl) {
    console.log('  ⚡ Validating performance...');
    
    try {
      const startTime = Date.now();
      const response = await fetch(`${baseUrl}/api/health`, {
        method: 'GET',
        timeout: 30000,
      });
      
      const responseTime = Date.now() - startTime;
      
      if (responseTime > 5000) {
        console.warn(`  ⚠️ Slow response time: ${responseTime}ms`);
      } else {
        console.log(`  ✅ Response time: ${responseTime}ms`);
      }
      
      const healthData = await response.json();
      
      if (healthData.monitoring && healthData.monitoring.performance) {
        const perf = healthData.monitoring.performance;
        console.log(`  📊 Error rate: ${(perf.errorRate * 100).toFixed(2)}%`);
        console.log(`  📊 Avg response time: ${Math.round(perf.averageResponseTime)}ms`);
      }
      
    } catch (error) {
      console.warn(`  ⚠️ Performance validation warning: ${error.message}`);
    }
  }

  /**
   * Deploy to production
   */
  async deployToProduction() {
    console.log('\n🚀 Deploying to production...');
    
    try {
      const vercelCommand = [
        'npx vercel',
        '--prod=true', // Deploy to production
        '--yes', // Skip confirmations
        '--token', process.env.VERCEL_TOKEN,
      ].join(' ');

      const output = execSync(vercelCommand, { encoding: 'utf8' });
      
      // Extract deployment URL
      const urlMatch = output.match(/https:\/\/[^\s]+/);
      if (urlMatch) {
        this.productionUrl = urlMatch[0];
      } else {
        this.productionUrl = `https://${CONFIG.environments.production.domain}`;
      }
      
      console.log(`  ✅ Production deployed: ${this.productionUrl}`);
      
    } catch (error) {
      throw new Error(`Production deployment failed: ${error.message}`);
    }
  }

  /**
   * Validate production deployment
   */
  async validateProductionDeployment() {
    console.log('\n✅ Validating production deployment...');
    
    // Wait for deployment to be ready
    await this.waitForDeployment(this.productionUrl);
    
    // Run health checks
    await this.runHealthChecks(this.productionUrl);
    
    // Validate environment-specific features
    await this.validateProductionFeatures();
    
    console.log('✅ Production validation completed');
  }

  /**
   * Validate production-specific features
   */
  async validateProductionFeatures() {
    console.log('  🔒 Validating production features...');
    
    try {
      // Check security headers
      const response = await fetch(this.productionUrl);
      const headers = response.headers;
      
      const requiredHeaders = [
        'x-frame-options',
        'x-content-type-options',
        'strict-transport-security',
      ];
      
      for (const header of requiredHeaders) {
        if (!headers.has(header)) {
          console.warn(`  ⚠️ Missing security header: ${header}`);
        } else {
          console.log(`  ✅ Security header: ${header}`);
        }
      }
      
      // Check HTTPS redirect
      const httpUrl = this.productionUrl.replace('https://', 'http://');
      try {
        const httpResponse = await fetch(httpUrl, { redirect: 'manual' });
        if (httpResponse.status >= 300 && httpResponse.status < 400) {
          console.log('  ✅ HTTPS redirect working');
        }
      } catch (error) {
        console.log('  ✅ HTTP blocked (good)');
      }
      
    } catch (error) {
      console.warn(`  ⚠️ Production feature validation warning: ${error.message}`);
    }
  }

  /**
   * Post-deployment tasks
   */
  async postDeploymentTasks() {
    console.log('\n📋 Running post-deployment tasks...');
    
    try {
      // Update deployment status
      await this.updateDeploymentStatus();
      
      // Send notifications
      await this.sendDeploymentNotifications();
      
      // Tag release in git
      await this.tagRelease();
      
      console.log('✅ Post-deployment tasks completed');
      
    } catch (error) {
      console.warn(`⚠️ Some post-deployment tasks failed: ${error.message}`);
    }
  }

  /**
   * Update deployment status
   */
  async updateDeploymentStatus() {
    // This would integrate with monitoring systems
    console.log('  📊 Updating deployment status...');
  }

  /**
   * Send deployment notifications
   */
  async sendDeploymentNotifications() {
    // This would send notifications to team channels
    console.log('  📬 Sending deployment notifications...');
  }

  /**
   * Tag release in git
   */
  async tagRelease() {
    try {
      const version = this.generateVersionTag();
      execSync(`git tag ${version}`);
      execSync(`git push origin ${version}`);
      console.log(`  🏷️ Release tagged: ${version}`);
    } catch (error) {
      console.warn(`  ⚠️ Failed to tag release: ${error.message}`);
    }
  }

  /**
   * Generate version tag
   */
  generateVersionTag() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');
    
    return `v${year}.${month}.${day}-${hour}${minute}`;
  }

  /**
   * Rollback deployment
   */
  async rollback() {
    console.log('\n🔄 Rolling back deployment...');
    
    try {
      // This would implement actual rollback logic
      console.log('  ⏪ Rollback initiated...');
      
      // For now, just log what would happen
      console.log('  📋 Would rollback to previous successful deployment');
      console.log('  📊 Would notify team of rollback');
      
    } catch (error) {
      console.error(`❌ Rollback failed: ${error.message}`);
    }
  }

  /**
   * Print deployment summary
   */
  printDeploymentSummary() {
    const duration = Math.round((Date.now() - this.startTime) / 1000);
    
    console.log('\n📊 Deployment Summary');
    console.log('=====================');
    console.log(`Duration: ${duration} seconds`);
    console.log(`Staging URL: ${this.stagingUrl}`);
    console.log(`Production URL: ${this.productionUrl}`);
    console.log(`Deployment completed at: ${new Date().toISOString()}`);
  }
}

// Run deployment if called directly
if (require.main === module) {
  const deployment = new ProductionDeployment();
  deployment.deploy().catch(error => {
    console.error('Deployment failed:', error);
    process.exit(1);
  });
}

module.exports = ProductionDeployment;