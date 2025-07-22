/**
 * Vercel Deployment Manager
 * Production deployment orchestration with blue-green deployment strategy
 */

import { logger } from '@/lib/logging/logger';

interface DeploymentConfig {
  project: string;
  team?: string;
  environment: 'preview' | 'production';
  branch: string;
  buildCommand: string;
  outputDirectory: string;
  environmentVariables: Record<string, string>;
  regions: string[];
  functions: FunctionConfig[];
}

interface FunctionConfig {
  src: string;
  use: string;
  config: {
    runtime: string;
    memory: number;
    maxDuration: number;
    regions?: string[];
  };
}

interface DeploymentStatus {
  id: string;
  url: string;
  state: 'BUILDING' | 'ERROR' | 'INITIALIZING' | 'QUEUED' | 'READY' | 'CANCELED';
  type: 'LAMBDAS';
  created: number;
  creator: {
    uid: string;
    email: string;
    username: string;
  };
  meta: {
    buildId: string;
    buildUrl: string;
    githubCommitSha?: string;
    githubCommitMessage?: string;
  };
  target: 'production' | 'staging';
  alias: string[];
}

interface BlueGreenConfig {
  enabled: boolean;
  healthCheckUrl: string;
  healthCheckTimeout: number;
  rollbackThreshold: {
    errorRate: number;
    responseTime: number;
  };
  trafficSplit: {
    blue: number;
    green: number;
  };
}

interface EnvironmentConfig {
  name: string;
  variables: Record<string, string>;
  secrets: Record<string, string>;
  domains: string[];
  regions: string[];
}

export class VercelDeploymentManager {
  private static instance: VercelDeploymentManager;
  private apiToken: string;
  private teamId?: string;
  private baseUrl = 'https://api.vercel.com';

  static getInstance(): VercelDeploymentManager {
    if (!VercelDeploymentManager.instance) {
      VercelDeploymentManager.instance = new VercelDeploymentManager();
    }
    return VercelDeploymentManager.instance;
  }

  constructor() {
    this.apiToken = process.env.VERCEL_TOKEN || '';
    this.teamId = process.env.VERCEL_TEAM_ID;
    
    if (!this.apiToken) {
      logger.warn('Vercel API token not configured');
    }
  }

  /**
   * Deploy to Vercel with blue-green strategy
   */
  async deployWithBlueGreen(
    config: DeploymentConfig,
    blueGreenConfig: BlueGreenConfig
  ): Promise<{
    success: boolean;
    deploymentId: string;
    url: string;
    error?: string;
  }> {
    try {
      logger.info('Starting blue-green deployment', {
        project: config.project,
        environment: config.environment,
        branch: config.branch,
      });

      // Step 1: Deploy to staging environment (green)
      const stagingDeployment = await this.createDeployment({
        ...config,
        environment: 'preview',
      });

      if (!stagingDeployment.success) {
        throw new Error(`Staging deployment failed: ${stagingDeployment.error}`);
      }

      logger.info('Staging deployment created', {
        deploymentId: stagingDeployment.deploymentId,
        url: stagingDeployment.url,
      });

      // Step 2: Wait for deployment to be ready
      await this.waitForDeployment(stagingDeployment.deploymentId);

      // Step 3: Run health checks on staging
      const healthCheckPassed = await this.performHealthCheck(
        stagingDeployment.url + blueGreenConfig.healthCheckUrl,
        blueGreenConfig.healthCheckTimeout
      );

      if (!healthCheckPassed) {
        throw new Error('Staging health check failed');
      }

      // Step 4: Gradual traffic shift if enabled
      if (blueGreenConfig.enabled) {
        await this.performGradualTrafficShift(config, stagingDeployment, blueGreenConfig);
      }

      // Step 5: Promote to production
      const productionDeployment = await this.promoteToProduction(config, stagingDeployment);

      logger.info('Blue-green deployment completed successfully', {
        stagingId: stagingDeployment.deploymentId,
        productionId: productionDeployment.deploymentId,
      });

      return {
        success: true,
        deploymentId: productionDeployment.deploymentId,
        url: productionDeployment.url,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      logger.error('Blue-green deployment failed', {
        error: errorMessage,
        project: config.project,
      });

      return {
        success: false,
        deploymentId: '',
        url: '',
        error: errorMessage,
      };
    }
  }

  /**
   * Create a new deployment
   */
  async createDeployment(config: DeploymentConfig): Promise<{
    success: boolean;
    deploymentId: string;
    url: string;
    error?: string;
  }> {
    try {
      const deploymentPayload = {
        name: config.project,
        project: config.project,
        target: config.environment,
        gitSource: {
          type: 'github',
          ref: config.branch,
        },
        buildCommand: config.buildCommand,
        outputDirectory: config.outputDirectory,
        env: config.environmentVariables,
        regions: config.regions,
        functions: config.functions.reduce((acc, func) => {
          acc[func.src] = {
            runtime: func.config.runtime,
            memory: func.config.memory,
            maxDuration: func.config.maxDuration,
            regions: func.config.regions,
          };
          return acc;
        }, {} as Record<string, any>),
      };

      const response = await this.makeVercelRequest('/v13/deployments', {
        method: 'POST',
        body: JSON.stringify(deploymentPayload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Vercel API error: ${error.error?.message || response.statusText}`);
      }

      const deployment = await response.json();

      return {
        success: true,
        deploymentId: deployment.id,
        url: deployment.url,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        deploymentId: '',
        url: '',
        error: errorMessage,
      };
    }
  }

  /**
   * Wait for deployment to be ready
   */
  async waitForDeployment(deploymentId: string, maxWaitTime: number = 600000): Promise<boolean> {
    const startTime = Date.now();
    const pollInterval = 10000; // 10 seconds

    while (Date.now() - startTime < maxWaitTime) {
      try {
        const status = await this.getDeploymentStatus(deploymentId);
        
        logger.info('Deployment status check', {
          deploymentId,
          state: status.state,
          elapsed: Date.now() - startTime,
        });

        if (status.state === 'READY') {
          return true;
        }

        if (status.state === 'ERROR' || status.state === 'CANCELED') {
          logger.error('Deployment failed', {
            deploymentId,
            state: status.state,
          });
          return false;
        }

        await new Promise(resolve => setTimeout(resolve, pollInterval));

      } catch (error) {
        logger.error('Error checking deployment status', {
          deploymentId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        return false;
      }
    }

    logger.error('Deployment timeout', { deploymentId, maxWaitTime });
    return false;
  }

  /**
   * Get deployment status
   */
  async getDeploymentStatus(deploymentId: string): Promise<DeploymentStatus> {
    const response = await this.makeVercelRequest(`/v13/deployments/${deploymentId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to get deployment status: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Perform health check on deployment
   */
  async performHealthCheck(url: string, timeout: number = 30000): Promise<boolean> {
    try {
      logger.info('Performing health check', { url, timeout });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        logger.warn('Health check failed - HTTP error', {
          url,
          status: response.status,
          statusText: response.statusText,
        });
        return false;
      }

      const healthData = await response.json();
      const isHealthy = healthData.status === 'healthy' || healthData.status === 'ok';

      logger.info('Health check result', {
        url,
        healthy: isHealthy,
        status: healthData.status,
        responseTime: response.headers.get('x-response-time'),
      });

      return isHealthy;

    } catch (error) {
      logger.error('Health check error', {
        url,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  /**
   * Perform gradual traffic shift
   */
  async performGradualTrafficShift(
    config: DeploymentConfig,
    stagingDeployment: any,
    blueGreenConfig: BlueGreenConfig
  ): Promise<void> {
    logger.info('Starting gradual traffic shift', {
      blueWeight: blueGreenConfig.trafficSplit.blue,
      greenWeight: blueGreenConfig.trafficSplit.green,
    });

    // Implement traffic splitting logic
    // This would integrate with Vercel's traffic splitting features
    // For now, we'll simulate the process

    const stages = [
      { green: 10, blue: 90 },
      { green: 25, blue: 75 },
      { green: 50, blue: 50 },
      { green: 75, blue: 25 },
      { green: 100, blue: 0 },
    ];

    for (const stage of stages) {
      logger.info('Traffic shift stage', {
        green: stage.green,
        blue: stage.blue,
      });

      // Monitor metrics during traffic shift
      await this.monitorTrafficShift(stagingDeployment.url, blueGreenConfig);

      // Wait between stages
      await new Promise(resolve => setTimeout(resolve, 60000)); // 1 minute
    }

    logger.info('Traffic shift completed');
  }

  /**
   * Monitor traffic during shift
   */
  async monitorTrafficShift(url: string, config: BlueGreenConfig): Promise<boolean> {
    try {
      // Perform multiple health checks
      const healthChecks = await Promise.all([
        this.performHealthCheck(url + '/api/health'),
        this.performHealthCheck(url + '/api/health'),
        this.performHealthCheck(url + '/api/health'),
      ]);

      const healthyCount = healthChecks.filter(Boolean).length;
      const successRate = healthyCount / healthChecks.length;

      // Check if error rate is within threshold
      if (successRate < (1 - config.rollbackThreshold.errorRate)) {
        logger.error('Traffic shift monitoring failed - high error rate', {
          successRate,
          threshold: config.rollbackThreshold.errorRate,
        });
        return false;
      }

      logger.info('Traffic shift monitoring passed', {
        successRate,
        healthyChecks: healthyCount,
        totalChecks: healthChecks.length,
      });

      return true;

    } catch (error) {
      logger.error('Traffic shift monitoring error', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  /**
   * Promote deployment to production
   */
  async promoteToProduction(config: DeploymentConfig, stagingDeployment: any): Promise<any> {
    try {
      logger.info('Promoting to production', {
        stagingId: stagingDeployment.deploymentId,
      });

      // Create production deployment
      const productionConfig = {
        ...config,
        environment: 'production' as const,
      };

      const productionDeployment = await this.createDeployment(productionConfig);

      if (!productionDeployment.success) {
        throw new Error(`Production deployment failed: ${productionDeployment.error}`);
      }

      // Wait for production deployment
      const isReady = await this.waitForDeployment(productionDeployment.deploymentId);

      if (!isReady) {
        throw new Error('Production deployment not ready within timeout');
      }

      logger.info('Production deployment ready', {
        deploymentId: productionDeployment.deploymentId,
        url: productionDeployment.url,
      });

      return productionDeployment;

    } catch (error) {
      logger.error('Production promotion failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Rollback deployment
   */
  async rollbackDeployment(projectName: string, targetDeploymentId?: string): Promise<boolean> {
    try {
      logger.info('Starting rollback', {
        project: projectName,
        targetDeploymentId,
      });

      // Get previous successful deployment
      const previousDeployment = targetDeploymentId || 
        await this.getPreviousSuccessfulDeployment(projectName);

      if (!previousDeployment) {
        throw new Error('No previous deployment found for rollback');
      }

      // Promote previous deployment to production
      const response = await this.makeVercelRequest(`/v9/projects/${projectName}/promote/${previousDeployment}`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`Rollback failed: ${response.statusText}`);
      }

      logger.info('Rollback completed', {
        project: projectName,
        rolledBackTo: previousDeployment,
      });

      return true;

    } catch (error) {
      logger.error('Rollback failed', {
        project: projectName,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  /**
   * Get previous successful deployment
   */
  async getPreviousSuccessfulDeployment(projectName: string): Promise<string | null> {
    try {
      const response = await this.makeVercelRequest(`/v6/deployments?projectId=${projectName}&limit=10`);
      
      if (!response.ok) {
        throw new Error(`Failed to get deployments: ${response.statusText}`);
      }

      const data = await response.json();
      const deployments = data.deployments || [];

      // Find the most recent successful production deployment
      const successfulDeployment = deployments.find((dep: any) => 
        dep.state === 'READY' && 
        dep.target === 'production' &&
        dep.type === 'LAMBDAS'
      );

      return successfulDeployment?.id || null;

    } catch (error) {
      logger.error('Error getting previous deployment', {
        project: projectName,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return null;
    }
  }

  /**
   * Manage environment variables
   */
  async updateEnvironmentVariables(
    projectName: string,
    variables: Record<string, string>,
    environment: 'development' | 'preview' | 'production' = 'production'
  ): Promise<boolean> {
    try {
      logger.info('Updating environment variables', {
        project: projectName,
        environment,
        variableCount: Object.keys(variables).length,
      });

      const envVars = Object.entries(variables).map(([key, value]) => ({
        key,
        value,
        target: [environment],
        type: 'encrypted',
      }));

      for (const envVar of envVars) {
        const response = await this.makeVercelRequest(`/v9/projects/${projectName}/env`, {
          method: 'POST',
          body: JSON.stringify(envVar),
        });

        if (!response.ok) {
          logger.warn(`Failed to update environment variable: ${envVar.key}`, {
            status: response.status,
            statusText: response.statusText,
          });
        }
      }

      logger.info('Environment variables updated', {
        project: projectName,
        environment,
      });

      return true;

    } catch (error) {
      logger.error('Failed to update environment variables', {
        project: projectName,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  /**
   * Configure custom domains
   */
  async configureDomains(projectName: string, domains: string[]): Promise<boolean> {
    try {
      logger.info('Configuring domains', {
        project: projectName,
        domains,
      });

      for (const domain of domains) {
        const response = await this.makeVercelRequest(`/v9/projects/${projectName}/domains`, {
          method: 'POST',
          body: JSON.stringify({ name: domain }),
        });

        if (!response.ok) {
          logger.warn(`Failed to configure domain: ${domain}`, {
            status: response.status,
            statusText: response.statusText,
          });
        } else {
          logger.info(`Domain configured: ${domain}`);
        }
      }

      return true;

    } catch (error) {
      logger.error('Domain configuration failed', {
        project: projectName,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  /**
   * Get deployment logs
   */
  async getDeploymentLogs(deploymentId: string): Promise<string[]> {
    try {
      const response = await this.makeVercelRequest(`/v2/deployments/${deploymentId}/events`);
      
      if (!response.ok) {
        throw new Error(`Failed to get deployment logs: ${response.statusText}`);
      }

      const data = await response.json();
      return data.events?.map((event: any) => event.text || event.payload?.text).filter(Boolean) || [];

    } catch (error) {
      logger.error('Failed to get deployment logs', {
        deploymentId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return [];
    }
  }

  /**
   * Make authenticated request to Vercel API
   */
  private async makeVercelRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const url = `${this.baseUrl}${endpoint}${this.teamId ? `?teamId=${this.teamId}` : ''}`;
    
    const headers = {
      'Authorization': `Bearer ${this.apiToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    return fetch(url, {
      ...options,
      headers,
    });
  }

  /**
   * Get default deployment configuration
   */
  getDefaultConfig(environment: 'preview' | 'production'): DeploymentConfig {
    return {
      project: 'seo-automation-app',
      environment,
      branch: environment === 'production' ? 'main' : 'develop',
      buildCommand: 'npm run build',
      outputDirectory: '.next',
      environmentVariables: {
        NODE_ENV: environment === 'production' ? 'production' : 'development',
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        // Add other environment variables
      },
      regions: ['iad1', 'pdx1', 'lhr1', 'fra1', 'sin1', 'nrt1'],
      functions: [
        {
          src: 'src/app/api/content/generate/route.ts',
          use: '@vercel/node',
          config: {
            runtime: 'nodejs18.x',
            memory: 3008,
            maxDuration: 300,
            regions: ['iad1', 'pdx1', 'lhr1'],
          },
        },
        {
          src: 'src/app/api/serp/analyze/route.ts',
          use: '@vercel/node',
          config: {
            runtime: 'nodejs18.x',
            memory: 1024,
            maxDuration: 60,
          },
        },
        {
          src: 'src/app/api/health/route.ts',
          use: '@vercel/node',
          config: {
            runtime: 'edge',
            memory: 128,
            maxDuration: 10,
          },
        },
      ],
    };
  }

  /**
   * Get default blue-green configuration
   */
  getDefaultBlueGreenConfig(): BlueGreenConfig {
    return {
      enabled: true,
      healthCheckUrl: '/api/health',
      healthCheckTimeout: 30000,
      rollbackThreshold: {
        errorRate: 0.05, // 5%
        responseTime: 2000, // 2 seconds
      },
      trafficSplit: {
        blue: 0,
        green: 100,
      },
    };
  }
}

// Export singleton instance
export const vercelDeploymentManager = VercelDeploymentManager.getInstance();

// Export types
export type { 
  DeploymentConfig, 
  BlueGreenConfig, 
  DeploymentStatus, 
  FunctionConfig,
  EnvironmentConfig 
};