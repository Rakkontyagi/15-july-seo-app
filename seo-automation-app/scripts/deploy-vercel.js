#!/usr/bin/env node
/**
 * Automated Vercel Deployment Script with Environment Validation
 * Handles deployment to staging and production environments
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const deploymentConfig = require('../deployment.config.js');

class VercelDeployer {
  constructor(environment = 'staging') {
    this.environment = environment;
    this.config = deploymentConfig.environments[environment];
    
    if (!this.config) {
      throw new Error(`Invalid environment: ${environment}`);
    }
    
    this.projectRoot = path.resolve(__dirname, '..');
    this.logLevel = process.env.LOG_LEVEL || 'info';
  }

  log(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      environment: this.environment,
      ...data
    };
    
    console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`, 
      Object.keys(data).length > 0 ? data : '');
  }

  async validateEnvironment() {
    this.log('info', 'Validating environment configuration...');
    
    // Check if environment file exists
    const envFile = path.join(this.projectRoot, this.config.envFile);
    if (!fs.existsSync(envFile)) {
      throw new Error(`Environment file not found: ${this.config.envFile}`);
    }

    // Check if Vercel config exists
    const vercelConfig = path.join(this.projectRoot, this.config.vercelConfig);
    if (!fs.existsSync(vercelConfig)) {
      throw new Error(`Vercel config not found: ${this.config.vercelConfig}`);
    }

    // Validate required environment variables
    const requiredEnvVars = [
      'VERCEL_TOKEN',
      'VERCEL_ORG_ID',
      'VERCEL_PROJECT_ID',
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'OPENAI_API_KEY',
      'SERPER_API_KEY',
      'FIRECRAWL_API_KEY'
    ];

    const missingVars = requiredEnvVars.filter(varName => 
      !process.env[varName] && !this.getEnvVar(envFile, varName)
    );

    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }

    this.log('info', 'Environment validation passed');
  }

  getEnvVar(envFile, varName) {
    try {
      const envContent = fs.readFileSync(envFile, 'utf8');
      const match = envContent.match(new RegExp(`^${varName}=(.*)$`, 'm'));
      return match ? match[1].trim() : null;
    } catch (error) {
      return null;
    }
  }

  async runPreDeploymentChecks() {
    this.log('info', 'Running pre-deployment checks...');
    
    try {
      // Run type checking
      this.log('info', 'Running type checking...');
      execSync('npm run type-check', { 
        stdio: 'inherit', 
        cwd: this.projectRoot 
      });

      // Run linting
      this.log('info', 'Running linting...');
      execSync('npm run lint', { 
        stdio: 'inherit', 
        cwd: this.projectRoot 
      });

      // Run tests
      this.log('info', 'Running tests...');
      execSync('npm test', { 
        stdio: 'inherit', 
        cwd: this.projectRoot 
      });

      // Build the application
      this.log('info', 'Building application...');
      execSync('npm run build', { 
        stdio: 'inherit', 
        cwd: this.projectRoot 
      });

      this.log('info', 'Pre-deployment checks passed');
    } catch (error) {
      throw new Error(`Pre-deployment checks failed: ${error.message}`);
    }
  }

  async runDatabaseMigrations() {
    if (!this.config.database.migrationScript) {
      this.log('info', 'No database migrations configured');
      return;
    }

    this.log('info', 'Running database migrations...');
    
    try {
      // Create backup if enabled
      if (this.config.database.backupEnabled) {
        this.log('info', 'Creating database backup...');
        execSync('npm run deployment:backup', { 
          stdio: 'inherit', 
          cwd: this.projectRoot 
        });
      }

      // Run migrations
      execSync(`npm run ${this.config.database.migrationScript}`, { 
        stdio: 'inherit', 
        cwd: this.projectRoot 
      });

      this.log('info', 'Database migrations completed');
    } catch (error) {
      throw new Error(`Database migration failed: ${error.message}`);
    }
  }

  async deployToVercel() {
    this.log('info', `Deploying to Vercel (${this.environment})...`);
    
    try {
      const vercelArgs = this.environment === 'production' ? '--prod' : '';
      const configArg = `--local-config=${this.config.vercelConfig}`;
      
      const deployCommand = `vercel ${vercelArgs} ${configArg} --confirm --token=${process.env.VERCEL_TOKEN}`;
      
      const result = execSync(deployCommand, { 
        stdio: 'pipe', 
        cwd: this.projectRoot,
        encoding: 'utf8'
      });

      // Extract deployment URL from output
      const urlMatch = result.match(/https:\/\/[^\s]+/);
      const deploymentUrl = urlMatch ? urlMatch[0] : this.config.url;

      this.log('info', 'Deployment completed', { 
        deploymentUrl,
        environment: this.environment 
      });

      return deploymentUrl;
    } catch (error) {
      throw new Error(`Vercel deployment failed: ${error.message}`);
    }
  }

  async runHealthChecks(deploymentUrl) {
    this.log('info', 'Running health checks...');
    
    const healthChecks = deploymentConfig.healthChecks;
    const baseUrl = deploymentUrl || this.config.url;
    
    for (const endpoint of healthChecks.endpoints) {
      await this.checkEndpoint(`${baseUrl}${endpoint}`, healthChecks);
    }

    this.log('info', 'Health checks passed');
  }

  async checkEndpoint(url, config) {
    const maxRetries = config.retries || 3;
    const timeout = config.timeout || 5000;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.log('info', `Checking endpoint: ${url} (attempt ${attempt}/${maxRetries})`);
        
        const response = await fetch(url, {
          method: 'GET',
          timeout: timeout
        });

        if (response.ok) {
          this.log('info', `Health check passed: ${url}`);
          return;
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (error) {
        this.log('warn', `Health check failed: ${url}`, { 
          attempt, 
          error: error.message 
        });
        
        if (attempt === maxRetries) {
          throw new Error(`Health check failed after ${maxRetries} attempts: ${url}`);
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }

  async runSmokeTests(deploymentUrl) {
    if (this.environment !== 'production') {
      return;
    }

    this.log('info', 'Running smoke tests...');
    
    try {
      process.env.SMOKE_TEST_BASE_URL = deploymentUrl || this.config.url;
      execSync('npm run test:smoke', { 
        stdio: 'inherit', 
        cwd: this.projectRoot 
      });

      this.log('info', 'Smoke tests passed');
    } catch (error) {
      throw new Error(`Smoke tests failed: ${error.message}`);
    }
  }

  async sendNotification(status, deploymentUrl, error = null) {
    const notification = this.config.notifications;
    
    if (!notification.slack.enabled && !notification.email.enabled) {
      return;
    }

    const message = {
      environment: this.environment,
      status,
      deploymentUrl,
      timestamp: new Date().toISOString(),
      error: error?.message
    };

    this.log('info', 'Sending deployment notification', message);

    // In a real implementation, you would send to Slack/email here
    // For now, we'll just log the notification
    console.log('📧 Deployment Notification:', JSON.stringify(message, null, 2));
  }

  async deploy() {
    const startTime = Date.now();
    let deploymentUrl;

    try {
      this.log('info', `Starting deployment to ${this.environment}...`);

      // Step 1: Validate environment
      await this.validateEnvironment();

      // Step 2: Run pre-deployment checks
      await this.runPreDeploymentChecks();

      // Step 3: Run database migrations
      await this.runDatabaseMigrations();

      // Step 4: Deploy to Vercel
      deploymentUrl = await this.deployToVercel();

      // Step 5: Run health checks
      await this.runHealthChecks(deploymentUrl);

      // Step 6: Run smoke tests (production only)
      await this.runSmokeTests(deploymentUrl);

      const duration = Date.now() - startTime;
      this.log('info', `Deployment completed successfully in ${duration}ms`, {
        deploymentUrl,
        environment: this.environment
      });

      // Send success notification
      await this.sendNotification('success', deploymentUrl);

      return { success: true, deploymentUrl };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.log('error', `Deployment failed after ${duration}ms`, {
        error: error.message,
        environment: this.environment
      });

      // Send failure notification
      await this.sendNotification('failure', deploymentUrl, error);

      throw error;
    }
  }
}

// CLI interface
async function main() {
  const environment = process.argv[2] || 'staging';
  const deployer = new VercelDeployer(environment);
  
  try {
    await deployer.deploy();
    process.exit(0);
  } catch (error) {
    console.error('Deployment failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { VercelDeployer };