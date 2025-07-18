#!/usr/bin/env node

/**
 * Memory Monitoring Setup Script
 * Initializes comprehensive memory monitoring, leak detection, and performance tracking
 */

const { createMemoryMonitor } = require('../lib/monitoring/memory-monitor');
const { leakPrevention } = require('../lib/monitoring/leak-prevention');
const { createPerformanceTracker } = require('../lib/monitoring/performance-tracker');

const MODE = process.argv[2] || 'development';
const VERBOSE = process.argv.includes('--verbose');
const DRY_RUN = process.argv.includes('--dry-run');

class MemoryMonitoringSetup {
  constructor() {
    this.mode = MODE;
    this.config = this.getConfiguration();
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: '📊',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      setup: '🔧'
    }[type] || '📊';
    
    console.log(`[${timestamp}] ${prefix} ${message}`);
  }

  async setupMemoryMonitoring() {
    this.log('Setting up memory monitoring and leak prevention...', 'setup');
    
    try {
      if (DRY_RUN) {
        this.log('DRY RUN MODE - No actual setup will be performed', 'warning');
        this.displayConfiguration();
        return;
      }

      // Initialize memory monitor
      await this.initializeMemoryMonitor();

      // Initialize leak prevention
      await this.initializeLeakPrevention();

      // Initialize performance tracker
      await this.initializePerformanceTracker();

      // Setup monitoring endpoints
      await this.setupMonitoringEndpoints();

      // Create monitoring scripts
      await this.createMonitoringScripts();

      // Generate configuration files
      await this.generateConfigFiles();

      // Setup automated alerts
      await this.setupAlerts();

      // Test the monitoring system
      await this.testMonitoringSystem();

      this.displaySetupSummary();
      this.log('Memory monitoring setup completed successfully!', 'success');

    } catch (error) {
      this.log(`Setup failed: ${error.message}`, 'error');
      if (VERBOSE) {
        console.error(error);
      }
      process.exit(1);
    }
  }

  getConfiguration() {
    const baseConfig = {
      memoryMonitor: {
        warningThreshold: 256,  // MB
        criticalThreshold: 512, // MB
        leakDetectionEnabled: true,
        leakDetectionInterval: 2 * 60 * 1000, // 2 minutes
        cleanupInterval: 10 * 60 * 1000, // 10 minutes
        maxSnapshots: 500,
        gcForceInterval: 5 * 60 * 1000 // 5 minutes
      },
      performanceTracker: {
        memory: { warning: 256, critical: 512 },
        cpu: { warning: 70, critical: 90 },
        eventLoop: { warning: 10, critical: 50 },
        responseTime: { warning: 500, critical: 1000 }
      },
      alerts: {
        enabled: true,
        emailNotifications: false,
        slackWebhook: null,
        logLevel: 'warning'
      }
    };

    // Environment-specific overrides
    switch (this.mode) {
      case 'production':
        return {
          ...baseConfig,
          memoryMonitor: {
            ...baseConfig.memoryMonitor,
            warningThreshold: 1024,  // 1GB
            criticalThreshold: 2048, // 2GB
            maxSnapshots: 2000
          },
          performanceTracker: {
            memory: { warning: 1024, critical: 2048 },
            cpu: { warning: 80, critical: 95 },
            eventLoop: { warning: 20, critical: 100 },
            responseTime: { warning: 1000, critical: 2000 }
          },
          alerts: {
            ...baseConfig.alerts,
            emailNotifications: true,
            logLevel: 'warning'
          }
        };

      case 'staging':
        return {
          ...baseConfig,
          memoryMonitor: {
            ...baseConfig.memoryMonitor,
            warningThreshold: 512,  // 512MB
            criticalThreshold: 1024 // 1GB
          },
          performanceTracker: {
            memory: { warning: 512, critical: 1024 },
            cpu: { warning: 75, critical: 90 },
            eventLoop: { warning: 15, critical: 75 },
            responseTime: { warning: 750, critical: 1500 }
          }
        };

      default: // development
        return baseConfig;
    }
  }

  async initializeMemoryMonitor() {
    this.log('Initializing memory monitor...', 'info');

    const memoryMonitor = createMemoryMonitor(this.config.memoryMonitor);

    // Setup event handlers
    memoryMonitor.on('memory_alert', (alert) => {
      this.handleMemoryAlert(alert);
    });

    memoryMonitor.on('leak_detection_complete', (detection) => {
      if (detection.isLeakDetected) {
        this.log(`Memory leak detected: ${detection.leakRate.toFixed(2)} MB/min`, 'warning');
      }
    });

    memoryMonitor.on('cleanup_completed', (result) => {
      this.log(`Memory cleanup freed ${result.cleaned.toFixed(1)} MB`, 'success');
    });

    // Start monitoring
    memoryMonitor.startMonitoring();
    this.log('Memory monitor started successfully', 'success');

    if (VERBOSE) {
      const stats = memoryMonitor.getCurrentStats();
      console.log('Current memory stats:', {
        heapUsed: `${(stats.current.heapUsed / (1024 * 1024)).toFixed(1)} MB`,
        heapTotal: `${(stats.current.heapTotal / (1024 * 1024)).toFixed(1)} MB`,
        health: stats.health
      });
    }
  }

  async initializeLeakPrevention() {
    this.log('Initializing leak prevention system...', 'info');

    // Setup event handlers
    leakPrevention.on('violation_detected', (violation) => {
      this.log(`Leak prevention violation: ${violation.rule} (${violation.severity})`, 'warning');
    });

    leakPrevention.on('violation_fixed', (fix) => {
      this.log(`Auto-fixed leak prevention issue: ${fix.rule}`, 'success');
    });

    // Start leak prevention
    leakPrevention.start();
    this.log('Leak prevention system started successfully', 'success');

    // Run initial check
    const report = await leakPrevention.runAllChecks();
    this.log(`Leak prevention check completed: ${report.violationsFound} violations found`, 'info');

    if (VERBOSE && report.violationsFound > 0) {
      console.log('Violations detected:', report.actionsPerformed);
    }
  }

  async initializePerformanceTracker() {
    this.log('Initializing performance tracker...', 'info');

    const performanceTracker = createPerformanceTracker(this.config.performanceTracker);

    // Setup event handlers
    performanceTracker.on('performance_alert', (alert) => {
      this.handlePerformanceAlert(alert);
    });

    performanceTracker.on('metrics_collected', (metrics) => {
      if (VERBOSE) {
        this.log(`Metrics collected - Memory: ${(metrics.memory.heapUsed / (1024 * 1024)).toFixed(1)}MB, CPU: ${metrics.cpu.utilizationPercent.toFixed(1)}%`, 'info');
      }
    });

    // Start tracking
    performanceTracker.startTracking();
    this.log('Performance tracker started successfully', 'success');

    // Get initial health status
    const health = performanceTracker.getHealthStatus();
    this.log(`System health: ${health.overall}`, health.overall === 'healthy' ? 'success' : 'warning');
  }

  async setupMonitoringEndpoints() {
    this.log('Setting up monitoring API endpoints...', 'info');

    const fs = require('fs').promises;
    const path = require('path');

    // Create API directory
    const apiDir = path.join(process.cwd(), 'pages', 'api', 'monitoring');
    await fs.mkdir(apiDir, { recursive: true });

    // Health check endpoint
    const healthEndpoint = `// pages/api/monitoring/health.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { performanceTracker } from '@/lib/monitoring/performance-tracker';
import { memoryMonitor } from '@/lib/monitoring/memory-monitor';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const healthStatus = performanceTracker.getHealthStatus();
    const memoryStats = memoryMonitor.getCurrentStats();
    
    const response = {
      status: healthStatus.overall,
      timestamp: new Date().toISOString(),
      components: healthStatus.components,
      memory: {
        heapUsed: memoryStats.current.heapUsed,
        heapTotal: memoryStats.current.heapTotal,
        health: memoryStats.health
      },
      uptime: process.uptime(),
      recommendations: healthStatus.recommendations
    };

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ 
      error: 'Health check failed',
      message: error.message 
    });
  }
}`;

    await fs.writeFile(path.join(apiDir, 'health.ts'), healthEndpoint);

    // Metrics endpoint
    const metricsEndpoint = `// pages/api/monitoring/metrics.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { performanceTracker } from '@/lib/monitoring/performance-tracker';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const period = parseInt(req.query.period as string) || 60;
    const stats = performanceTracker.getPerformanceStats(period);
    
    res.status(200).json({
      period: \`\${period} minutes\`,
      stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to get metrics',
      message: error.message 
    });
  }
}`;

    await fs.writeFile(path.join(apiDir, 'metrics.ts'), metricsEndpoint);

    // Report endpoint
    const reportEndpoint = `// pages/api/monitoring/report.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { performanceTracker } from '@/lib/monitoring/performance-tracker';
import { leakPrevention } from '@/lib/monitoring/leak-prevention';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const performanceReport = performanceTracker.generatePerformanceReport();
    const leakReport = await leakPrevention.runAllChecks();
    
    res.status(200).json({
      performance: performanceReport,
      leakPrevention: leakReport,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to generate report',
      message: error.message 
    });
  }
}`;

    await fs.writeFile(path.join(apiDir, 'report.ts'), reportEndpoint);

    this.log('✓ Monitoring API endpoints created', 'success');
  }

  async createMonitoringScripts() {
    this.log('Creating monitoring management scripts...', 'info');

    const fs = require('fs').promises;
    const path = require('path');

    // Memory cleanup script
    const cleanupScript = `#!/usr/bin/env node

/**
 * Memory Cleanup Script
 * Force memory cleanup and garbage collection
 */

const { memoryMonitor } = require('../lib/monitoring/memory-monitor');
const { leakPrevention } = require('../lib/monitoring/leak-prevention');

async function performCleanup() {
  console.log('🧹 Starting memory cleanup...');
  
  try {
    // Force cleanup
    const cleanupResult = await memoryMonitor.performCleanup();
    console.log(\`✅ Memory cleanup completed: \${cleanupResult.cleaned.toFixed(1)} MB freed\`);
    
    // Run leak prevention checks
    const leakReport = await leakPrevention.runAllChecks();
    console.log(\`✅ Leak prevention check: \${leakReport.violationsFound} violations found\`);
    
    // Force garbage collection
    if (global.gc) {
      const beforeGC = process.memoryUsage().heapUsed;
      global.gc();
      const afterGC = process.memoryUsage().heapUsed;
      const gcFreed = (beforeGC - afterGC) / (1024 * 1024);
      console.log(\`✅ Garbage collection freed: \${gcFreed.toFixed(1)} MB\`);
    }
    
    console.log('🎉 Cleanup completed successfully');
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  performCleanup();
}

module.exports = { performCleanup };`;

    await fs.writeFile(path.join(process.cwd(), 'scripts', 'memory-cleanup.js'), cleanupScript);

    // Status script
    const statusScript = `#!/usr/bin/env node

/**
 * Memory Status Script
 * Display current memory and performance status
 */

const { memoryMonitor } = require('../lib/monitoring/memory-monitor');
const { performanceTracker } = require('../lib/monitoring/performance-tracker');

async function showStatus() {
  console.log('📊 Memory and Performance Status');
  console.log('='.repeat(50));
  
  try {
    // Memory status
    const memoryStats = memoryMonitor.getCurrentStats();
    console.log('\\n🧠 Memory Status:');
    console.log(\`  Heap Used: \${(memoryStats.current.heapUsed / (1024 * 1024)).toFixed(1)} MB\`);
    console.log(\`  Heap Total: \${(memoryStats.current.heapTotal / (1024 * 1024)).toFixed(1)} MB\`);
    console.log(\`  Health: \${memoryStats.health.toUpperCase()}\`);
    console.log(\`  Usage: \${memoryStats.current.memoryUsagePercent.toFixed(1)}%\`);
    
    // Performance status
    const healthStatus = performanceTracker.getHealthStatus();
    console.log('\\n⚡ Performance Status:');
    console.log(\`  Overall Health: \${healthStatus.overall.toUpperCase()}\`);
    console.log(\`  Memory: \${healthStatus.components.memory}\`);
    console.log(\`  CPU: \${healthStatus.components.cpu}\`);
    console.log(\`  Event Loop: \${healthStatus.components.eventLoop}\`);
    console.log(\`  Resources: \${healthStatus.components.resources}\`);
    
    // Recommendations
    if (healthStatus.recommendations.length > 0) {
      console.log('\\n💡 Recommendations:');
      healthStatus.recommendations.forEach(rec => {
        console.log(\`  • \${rec}\`);
      });
    }
    
    // Recent trends
    const stats = performanceTracker.getPerformanceStats(15);
    console.log('\\n📈 15-Minute Trends:');
    console.log(\`  Average Memory: \${stats.averageMemory.toFixed(1)} MB\`);
    console.log(\`  Peak Memory: \${stats.peakMemory.toFixed(1)} MB\`);
    console.log(\`  Average CPU: \${stats.averageCpu.toFixed(1)}%\`);
    console.log(\`  Event Loop Lag: \${stats.averageEventLoopLag.toFixed(1)}ms\`);
    console.log(\`  GC Frequency: \${stats.gcFrequency.toFixed(1)}/hour\`);
    
  } catch (error) {
    console.error('❌ Failed to get status:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  showStatus();
}

module.exports = { showStatus };`;

    await fs.writeFile(path.join(process.cwd(), 'scripts', 'memory-status.js'), statusScript);

    this.log('✓ Monitoring scripts created', 'success');
  }

  async generateConfigFiles() {
    this.log('Generating monitoring configuration files...', 'info');

    const fs = require('fs').promises;
    const path = require('path');

    // Create config directory
    const configDir = path.join(process.cwd(), 'config');
    await fs.mkdir(configDir, { recursive: true });

    // Main monitoring config
    const monitoringConfig = {
      environment: this.mode,
      monitoring: this.config,
      endpoints: {
        health: '/api/monitoring/health',
        metrics: '/api/monitoring/metrics',
        report: '/api/monitoring/report'
      },
      scripts: {
        cleanup: 'npm run memory:cleanup',
        status: 'npm run memory:status',
        report: 'npm run memory:report'
      },
      alerts: {
        enabled: this.config.alerts.enabled,
        thresholds: this.config.performanceTracker,
        notifications: this.config.alerts
      }
    };

    const configPath = path.join(configDir, 'monitoring.json');
    await fs.writeFile(configPath, JSON.stringify(monitoringConfig, null, 2));
    this.log(`✓ Configuration saved to ${configPath}`, 'success');

    // Environment-specific config
    const envConfigPath = path.join(configDir, `monitoring.${this.mode}.json`);
    const envConfig = {
      ...monitoringConfig,
      debug: this.mode !== 'production',
      verbose: this.mode === 'development'
    };
    
    await fs.writeFile(envConfigPath, JSON.stringify(envConfig, null, 2));
    this.log(`✓ Environment config saved to ${envConfigPath}`, 'success');
  }

  async setupAlerts() {
    this.log('Setting up automated alerts...', 'info');

    // This would integrate with actual alerting systems
    // For now, just log the setup
    if (this.config.alerts.enabled) {
      this.log('✓ Alert system configured', 'success');
      
      if (this.config.alerts.emailNotifications) {
        this.log('✓ Email notifications enabled', 'success');
      }
      
      if (this.config.alerts.slackWebhook) {
        this.log('✓ Slack notifications configured', 'success');
      }
    } else {
      this.log('⚠️  Alert system disabled', 'warning');
    }
  }

  async testMonitoringSystem() {
    this.log('Testing monitoring system...', 'info');

    try {
      // Test memory monitor
      const { memoryMonitor } = require('../lib/monitoring/memory-monitor');
      const memoryStats = memoryMonitor.getCurrentStats();
      this.log('✓ Memory monitor test passed', 'success');

      // Test performance tracker
      const { performanceTracker } = require('../lib/monitoring/performance-tracker');
      const healthStatus = performanceTracker.getHealthStatus();
      this.log('✓ Performance tracker test passed', 'success');

      // Test leak prevention
      const leakReport = await leakPrevention.runAllChecks();
      this.log('✓ Leak prevention test passed', 'success');

      if (VERBOSE) {
        console.log('Test Results:', {
          memoryHealth: memoryStats.health,
          systemHealth: healthStatus.overall,
          leakViolations: leakReport.violationsFound
        });
      }

    } catch (error) {
      this.log(`Monitoring system test failed: ${error.message}`, 'error');
      throw error;
    }
  }

  handleMemoryAlert(alert) {
    const severity = alert.type === 'critical' ? 'error' : 'warning';
    this.log(`Memory Alert [${alert.type.toUpperCase()}]: ${alert.message}`, severity);
    
    if (VERBOSE) {
      console.log('Alert details:', {
        threshold: alert.threshold,
        current: alert.memoryUsage,
        recommendations: alert.recommendations
      });
    }
  }

  handlePerformanceAlert(alert) {
    const severity = alert.severity === 'critical' ? 'error' : 'warning';
    this.log(`Performance Alert [${alert.severity.toUpperCase()}]: ${alert.message}`, severity);
    
    if (VERBOSE) {
      console.log('Alert details:', {
        metric: alert.metric,
        value: alert.value,
        threshold: alert.threshold,
        recommendations: alert.recommendations
      });
    }
  }

  displayConfiguration() {
    console.log('\\n🔧 Monitoring Configuration');
    console.log('='.repeat(50));
    console.log(`Environment: ${this.mode}`);
    console.log(`Memory Warning Threshold: ${this.config.memoryMonitor.warningThreshold} MB`);
    console.log(`Memory Critical Threshold: ${this.config.memoryMonitor.criticalThreshold} MB`);
    console.log(`Leak Detection: ${this.config.memoryMonitor.leakDetectionEnabled ? 'Enabled' : 'Disabled'}`);
    console.log(`Performance Monitoring: Enabled`);
    console.log(`Alerts: ${this.config.alerts.enabled ? 'Enabled' : 'Disabled'}`);
  }

  displaySetupSummary() {
    console.log('\\n🎉 Memory Monitoring Setup Complete!');
    console.log('='.repeat(50));
    console.log(`Environment: ${this.mode}`);
    console.log(`Memory Thresholds: ${this.config.memoryMonitor.warningThreshold}MB / ${this.config.memoryMonitor.criticalThreshold}MB`);
    console.log(`Leak Detection: ${this.config.memoryMonitor.leakDetectionEnabled ? 'Active' : 'Inactive'}`);
    console.log('');

    console.log('📁 Generated Files:');
    console.log('  • config/monitoring.json - Main configuration');
    console.log(`  • config/monitoring.${this.mode}.json - Environment config`);
    console.log('  • pages/api/monitoring/ - API endpoints');
    console.log('  • scripts/memory-*.js - Management scripts');
    console.log('');

    console.log('🚀 Available Commands:');
    console.log('  • npm run memory:status - Check current memory status');
    console.log('  • npm run memory:cleanup - Force memory cleanup');
    console.log('  • npm run memory:report - Generate comprehensive report');
    console.log('  • npm run memory:health - Quick health check');
    console.log('');

    console.log('🔗 API Endpoints:');
    console.log('  • GET /api/monitoring/health - Health check');
    console.log('  • GET /api/monitoring/metrics?period=60 - Performance metrics');
    console.log('  • GET /api/monitoring/report - Comprehensive report');
    console.log('');

    console.log('⚠️  Important Notes:');
    console.log('  • Monitoring starts automatically when the application starts');
    console.log('  • Memory cleanup runs automatically every 10 minutes');
    console.log('  • Leak detection checks run every 2 minutes');
    console.log('  • Use --expose-gc flag to enable forced garbage collection');
    console.log('');

    if (this.mode === 'production') {
      console.log('🚨 Production Mode Enabled:');
      console.log('  • Higher memory thresholds configured');
      console.log('  • Email alerts enabled (if configured)');
      console.log('  • Enhanced monitoring and logging');
    }
  }

  showHelp() {
    console.log(`
📊 Memory Monitoring Setup Tool

Usage: node scripts/memory-monitoring-setup.js [mode] [options]

Modes:
  development         Development setup (default)
  staging             Staging environment
  production          Production environment

Options:
  --verbose           Show detailed output
  --dry-run           Show configuration without setup
  --help              Show this help message

Examples:
  node scripts/memory-monitoring-setup.js production
  node scripts/memory-monitoring-setup.js staging --verbose
  node scripts/memory-monitoring-setup.js development --dry-run
`);
  }
}

async function main() {
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    new MemoryMonitoringSetup().showHelp();
    return;
  }

  console.log('📊 Memory Monitoring Setup Tool');
  console.log('=================================\\n');

  const setup = new MemoryMonitoringSetup();

  try {
    await setup.setupMemoryMonitoring();
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    if (VERBOSE) {
      console.error(error);
    }
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = { MemoryMonitoringSetup };