#!/usr/bin/env node
/**
 * Blue-Green Deployment Strategy Implementation
 * Enables zero-downtime deployments by maintaining two identical environments
 */

const { execSync } = require('child_process');
const deploymentConfig = require('../deployment.config.js');
const { DeploymentNotifications } = require('./deployment-notifications.js');
const { HealthChecker } = require('./health-check.js');

class BlueGreenDeployment {
  constructor(environment = 'production') {
    this.environment = environment;
    this.config = deploymentConfig.environments[environment];
    this.blueGreenConfig = deploymentConfig.blueGreen;
    this.notifications = new DeploymentNotifications(environment);
    this.healthChecker = new HealthChecker();
    this.deploymentLog = [];
    this.currentEnvironment = null;
    this.targetEnvironment = null;
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
    
    this.deploymentLog.push(logEntry);
    
    const prefix = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : '✅';
    console.log(`[${timestamp}] ${prefix} ${message}`, 
      Object.keys(data).length > 0 ? JSON.stringify(data, null, 2) : '');
  }

  async getCurrentEnvironment() {
    try {
      // Check which environment is currently live
      const command = `vercel alias ls --token=${process.env.VERCEL_TOKEN}`;
      const output = execSync(command, { encoding: 'utf8' });
      
      // Parse the output to determine current environment
      const lines = output.split('\n');
      const prodAlias = lines.find(line => line.includes(this.config.url));
      
      if (prodAlias) {
        // Extract the deployment URL to determine if it's blue or green
        const deploymentUrl = prodAlias.split(/\s+/)[1];
        
        if (deploymentUrl.includes('blue')) {
          return 'blue';
        } else if (deploymentUrl.includes('green')) {
          return 'green';
        } else {
          // Default to blue if can't determine
          return 'blue';
        }
      }
      
      return 'blue'; // Default to blue
    } catch (error) {
      this.log('warn', 'Could not determine current environment, defaulting to blue', {
        error: error.message
      });
      return 'blue';
    }
  }

  getTargetEnvironment(current) {
    return current === 'blue' ? 'green' : 'blue';
  }

  async deployToTargetEnvironment(targetEnv) {
    this.log('info', `Deploying to ${targetEnv} environment...`);
    
    try {
      // Deploy to target environment with specific alias
      const deployCommand = `vercel --prod --token=${process.env.VERCEL_TOKEN} --meta environment=${targetEnv}`;
      const output = execSync(deployCommand, { 
        encoding: 'utf8',
        cwd: process.cwd()
      });
      
      // Extract deployment URL
      const urlMatch = output.match(/https:\/\/[^\s]+/);
      const deploymentUrl = urlMatch ? urlMatch[0] : null;
      
      if (!deploymentUrl) {
        throw new Error('Could not extract deployment URL');
      }
      
      // Create environment-specific alias
      const envAlias = `${this.config.url.replace('https://', `${targetEnv}-`)}`;
      const aliasCommand = `vercel alias ${deploymentUrl} ${envAlias} --token=${process.env.VERCEL_TOKEN}`;
      
      execSync(aliasCommand, { stdio: 'inherit' });
      
      this.log('info', `Successfully deployed to ${targetEnv} environment`, {
        deploymentUrl,
        envAlias
      });
      
      return { deploymentUrl, envAlias };
    } catch (error) {
      throw new Error(`Failed to deploy to ${targetEnv} environment: ${error.message}`);
    }
  }

  async runHealthChecks(environmentUrl) {
    this.log('info', 'Running health checks on target environment...');
    
    const healthChecker = new HealthChecker(environmentUrl, this.environment);
    const result = await healthChecker.run();
    
    if (!result.success) {
      throw new Error('Health checks failed on target environment');
    }
    
    this.log('info', 'Health checks passed on target environment');
    return result;
  }

  async runSmokeTests(environmentUrl) {
    this.log('info', 'Running smoke tests on target environment...');
    
    try {
      // Run smoke tests against the target environment
      const smokeTestCommand = `npm run test:smoke`;
      const env = {
        ...process.env,
        SMOKE_TEST_BASE_URL: environmentUrl
      };
      
      execSync(smokeTestCommand, { 
        stdio: 'inherit',
        env
      });
      
      this.log('info', 'Smoke tests passed on target environment');
      return true;
    } catch (error) {
      throw new Error(`Smoke tests failed: ${error.message}`);
    }
  }

  async performTrafficSplit(targetEnvUrl) {
    if (!this.blueGreenConfig.enabled) {
      this.log('info', 'Traffic splitting disabled, skipping gradual rollout');
      return;
    }
    
    const splitPercent = this.blueGreenConfig.trafficSplitPercent;
    const monitoringDuration = this.blueGreenConfig.monitoringDuration;
    
    this.log('info', `Starting traffic split: ${splitPercent}% to new environment`);
    
    try {
      // In a real implementation, this would use a load balancer or edge service
      // For this example, we'll simulate traffic splitting
      
      // Create a weighted alias that sends some traffic to new environment
      const weightedAlias = `${this.config.url.replace('https://', 'canary-')}`;
      const aliasCommand = `vercel alias ${targetEnvUrl} ${weightedAlias} --token=${process.env.VERCEL_TOKEN}`;
      
      execSync(aliasCommand, { stdio: 'inherit' });
      
      this.log('info', `Traffic split active, monitoring for ${monitoringDuration}ms...`);
      
      // Monitor the split for the specified duration
      const monitoringInterval = setInterval(async () => {
        const metrics = await this.collectMetrics(targetEnvUrl);
        
        if (!this.evaluateMetrics(metrics)) {
          clearInterval(monitoringInterval);
          throw new Error('Traffic split monitoring failed, metrics exceeded thresholds');
        }
      }, 30000); // Check every 30 seconds
      
      // Wait for monitoring period
      await new Promise(resolve => setTimeout(resolve, monitoringDuration));
      clearInterval(monitoringInterval);
      
      this.log('info', 'Traffic split monitoring completed successfully');
    } catch (error) {
      throw new Error(`Traffic split failed: ${error.message}`);
    }
  }

  async collectMetrics(environmentUrl) {
    try {
      // Collect metrics from the target environment
      const healthResult = await this.healthChecker.run();
      
      // In a real implementation, this would collect from APM tools
      const metrics = {
        errorRate: 0.001, // 0.1%
        responseTime: 150, // 150ms average
        healthCheckSuccess: healthResult.success ? 1.0 : 0.0,
        timestamp: new Date().toISOString()
      };
      
      return metrics;
    } catch (error) {
      this.log('error', 'Failed to collect metrics', { error: error.message });
      return null;
    }
  }

  evaluateMetrics(metrics) {
    if (!metrics) {
      return false;
    }
    
    const criteria = this.blueGreenConfig.successCriteria;
    
    const checks = {
      errorRate: metrics.errorRate <= criteria.errorRate,
      responseTime: metrics.responseTime <= criteria.responseTime,
      healthCheck: metrics.healthCheckSuccess >= criteria.healthCheckSuccess
    };
    
    const allChecksPassed = Object.values(checks).every(check => check);
    
    this.log('info', 'Metrics evaluation', {
      metrics,
      criteria,
      checks,
      passed: allChecksPassed
    });
    
    return allChecksPassed;
  }

  async switchTraffic(targetEnvUrl) {
    this.log('info', 'Switching traffic to new environment...');
    
    try {
      // Switch main production traffic to target environment
      const switchCommand = `vercel alias ${targetEnvUrl} ${this.config.url} --token=${process.env.VERCEL_TOKEN}`;
      
      execSync(switchCommand, { stdio: 'inherit' });
      
      this.log('info', 'Traffic successfully switched to new environment', {
        newEnvironmentUrl: targetEnvUrl,
        productionUrl: this.config.url
      });
      
      // Wait for DNS propagation
      await new Promise(resolve => setTimeout(resolve, 30000));
      
      // Verify the switch was successful
      const verifyResult = await this.runHealthChecks(this.config.url);
      
      if (!verifyResult.success) {
        throw new Error('Traffic switch verification failed');
      }
      
      return true;
    } catch (error) {
      throw new Error(`Traffic switch failed: ${error.message}`);
    }
  }

  async cleanupOldEnvironment(oldEnvUrl) {
    this.log('info', 'Cleaning up old environment...');
    
    try {
      // Wait before cleanup to ensure stability
      await new Promise(resolve => setTimeout(resolve, 60000));
      
      // Remove old environment alias
      const removeCommand = `vercel alias rm ${oldEnvUrl} --token=${process.env.VERCEL_TOKEN}`;
      
      execSync(removeCommand, { stdio: 'inherit' });
      
      this.log('info', 'Old environment cleaned up successfully');
    } catch (error) {
      this.log('warn', 'Failed to clean up old environment', { error: error.message });
      // Don't fail deployment for cleanup issues
    }
  }

  async rollbackTrafficSwitch(rollbackUrl) {
    this.log('info', 'Rolling back traffic switch...');
    
    try {
      const rollbackCommand = `vercel alias ${rollbackUrl} ${this.config.url} --token=${process.env.VERCEL_TOKEN}`;
      
      execSync(rollbackCommand, { stdio: 'inherit' });
      
      this.log('info', 'Traffic rollback completed successfully');
      
      // Verify rollback
      const verifyResult = await this.runHealthChecks(this.config.url);
      
      if (!verifyResult.success) {
        throw new Error('Rollback verification failed');
      }
      
      return true;
    } catch (error) {
      throw new Error(`Traffic rollback failed: ${error.message}`);
    }
  }

  async executeBlueGreenDeployment() {
    const startTime = Date.now();
    let targetEnvUrl = null;
    let currentEnvUrl = null;
    
    try {
      this.log('info', 'Starting blue-green deployment...');
      
      // Step 1: Determine current environment
      this.currentEnvironment = await this.getCurrentEnvironment();
      this.targetEnvironment = this.getTargetEnvironment(this.currentEnvironment);
      
      this.log('info', 'Environment configuration', {
        current: this.currentEnvironment,
        target: this.targetEnvironment
      });
      
      // Step 2: Deploy to target environment
      const deployment = await this.deployToTargetEnvironment(this.targetEnvironment);
      targetEnvUrl = deployment.deploymentUrl;
      currentEnvUrl = this.config.url;
      
      // Step 3: Run health checks on target environment
      await this.runHealthChecks(targetEnvUrl);
      
      // Step 4: Run smoke tests on target environment
      await this.runSmokeTests(targetEnvUrl);
      
      // Step 5: Perform traffic split (if enabled)
      if (this.blueGreenConfig.enabled) {
        await this.performTrafficSplit(targetEnvUrl);
      }
      
      // Step 6: Switch traffic to target environment
      await this.switchTraffic(targetEnvUrl);
      
      // Step 7: Monitor new environment
      await this.runHealthChecks(this.config.url);
      
      // Step 8: Clean up old environment
      await this.cleanupOldEnvironment(currentEnvUrl);
      
      const duration = Date.now() - startTime;
      
      this.log('info', 'Blue-green deployment completed successfully', {
        duration: `${duration}ms`,
        deployedEnvironment: this.targetEnvironment,
        deploymentUrl: targetEnvUrl
      });
      
      // Send success notification
      await this.notifications.notifyDeploymentSuccess({
        url: this.config.url,
        duration,
        healthCheck: true,
        version: this.targetEnvironment
      });
      
      return {
        success: true,
        duration,
        deployedEnvironment: this.targetEnvironment,
        deploymentUrl: targetEnvUrl
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.log('error', 'Blue-green deployment failed', {
        error: error.message,
        duration: `${duration}ms`
      });
      
      // Attempt rollback if traffic was switched
      if (targetEnvUrl && currentEnvUrl) {
        try {
          await this.rollbackTrafficSwitch(currentEnvUrl);
        } catch (rollbackError) {
          this.log('error', 'Rollback also failed', { error: rollbackError.message });
        }
      }
      
      // Send failure notification
      await this.notifications.notifyDeploymentFailure({
        duration,
        failedStage: 'blue-green-deployment'
      }, error);
      
      return {
        success: false,
        error: error.message,
        duration
      };
    }
  }

  async getDeploymentStatus() {
    try {
      const current = await this.getCurrentEnvironment();
      const currentUrl = this.config.url;
      
      const status = {
        currentEnvironment: current,
        productionUrl: currentUrl,
        blueGreenEnabled: this.blueGreenConfig.enabled,
        lastDeployment: new Date().toISOString(),
        healthStatus: 'unknown'
      };
      
      // Check current health
      const healthResult = await this.runHealthChecks(currentUrl);
      status.healthStatus = healthResult.success ? 'healthy' : 'unhealthy';
      
      return status;
    } catch (error) {
      this.log('error', 'Failed to get deployment status', { error: error.message });
      return null;
    }
  }

  async generateDeploymentReport() {
    const status = await this.getDeploymentStatus();
    
    const report = {
      timestamp: new Date().toISOString(),
      environment: this.environment,
      strategy: 'blue-green',
      deploymentLog: this.deploymentLog,
      currentStatus: status,
      configuration: {
        blueGreenEnabled: this.blueGreenConfig.enabled,
        trafficSplitPercent: this.blueGreenConfig.trafficSplitPercent,
        monitoringDuration: this.blueGreenConfig.monitoringDuration,
        successCriteria: this.blueGreenConfig.successCriteria
      }
    };
    
    return report;
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const environment = args.find(arg => arg.startsWith('--env='))?.split('=')[1] || 'production';
  const action = args.find(arg => arg.startsWith('--action='))?.split('=')[1] || 'deploy';
  
  const blueGreen = new BlueGreenDeployment(environment);
  
  try {
    let result;
    
    switch (action) {
      case 'deploy':
        result = await blueGreen.executeBlueGreenDeployment();
        break;
      case 'status':
        result = await blueGreen.getDeploymentStatus();
        console.log('\n📊 Deployment Status:');
        console.log(JSON.stringify(result, null, 2));
        return;
      case 'report':
        result = await blueGreen.generateDeploymentReport();
        console.log('\n📋 Deployment Report:');
        console.log(JSON.stringify(result, null, 2));
        return;
      default:
        console.log('Usage: node blue-green-deployment.js --env=<environment> --action=<action>');
        console.log('Actions: deploy, status, report');
        process.exit(1);
    }
    
    if (result.success) {
      console.log(`\n✅ Blue-green deployment completed successfully`);
      console.log(`Duration: ${result.duration}ms`);
      console.log(`Deployed Environment: ${result.deployedEnvironment}`);
    } else {
      console.log(`\n❌ Blue-green deployment failed`);
      console.log(`Error: ${result.error}`);
    }
    
    process.exit(result.success ? 0 : 1);
  } catch (error) {
    console.error('Blue-green deployment process failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { BlueGreenDeployment };