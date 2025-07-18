/**
 * Deployment Configuration for SEO Automation App
 * Handles environment-specific deployment settings
 */

const deploymentConfig = {
  environments: {
    staging: {
      name: 'staging',
      url: 'https://seo-automation-app-staging.vercel.app',
      vercelConfig: 'vercel.staging.json',
      envFile: '.env.staging',
      database: {
        migrationScript: 'db:migrate:staging',
        backupEnabled: true,
        poolSize: 10
      },
      features: {
        enableAnalytics: true,
        enableSentry: true,
        enableDebugMode: true,
        enableMaintenanceMode: false
      },
      resources: {
        maxMemory: 1024,
        maxDuration: 30,
        regions: ['iad1']
      },
      notifications: {
        slack: {
          channel: '#deployments-staging',
          enabled: true
        },
        email: {
          recipients: ['dev-team@example.com'],
          enabled: true
        }
      }
    },
    production: {
      name: 'production',
      url: 'https://seo-automation-app.vercel.app',
      vercelConfig: 'vercel.json',
      envFile: '.env.production',
      database: {
        migrationScript: 'db:migrate:prod',
        backupEnabled: true,
        poolSize: 20
      },
      features: {
        enableAnalytics: true,
        enableSentry: true,
        enableDebugMode: false,
        enableMaintenanceMode: false
      },
      resources: {
        maxMemory: 3008,
        maxDuration: 300,
        regions: ['iad1', 'sfo1']
      },
      notifications: {
        slack: {
          channel: '#deployments-production',
          enabled: true
        },
        email: {
          recipients: ['dev-team@example.com', 'ops@example.com'],
          enabled: true
        }
      }
    }
  },

  // Health check configuration
  healthChecks: {
    endpoints: [
      '/api/health',
      '/api/serp/health',
      '/api/metrics'
    ],
    timeout: 5000,
    retries: 3,
    interval: 30000
  },

  // Rollback configuration
  rollback: {
    enabled: true,
    maxRollbackVersions: 5,
    autoRollbackOnFailure: true,
    rollbackTimeout: 300000
  },

  // Blue-green deployment configuration
  blueGreen: {
    enabled: true,
    trafficSplitPercent: 50,
    monitoringDuration: 300000, // 5 minutes
    successCriteria: {
      errorRate: 0.01, // 1%
      responseTime: 2000, // 2 seconds
      healthCheckSuccess: 0.95 // 95%
    }
  },

  // Database migration configuration
  migrations: {
    backupBeforeMigration: true,
    verifyMigration: true,
    rollbackOnFailure: true,
    timeout: 600000 // 10 minutes
  },

  // Monitoring configuration
  monitoring: {
    sentry: {
      enabled: true,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0
    },
    vercel: {
      enabled: true,
      analytics: true,
      speedInsights: true
    }
  }
};

module.exports = deploymentConfig;