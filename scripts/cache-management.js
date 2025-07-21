#!/usr/bin/env node

/**
 * Cache Management Tool
 * Unified management interface for all caching services
 */

const { unifiedCache, getCacheReport, getCacheHealth } = require('../lib/cache/unified-cache-service');

const COMMAND = process.argv[2] || 'status';
const SERVICE = process.argv[3] || 'all';
const FORMAT = process.argv.includes('--json') ? 'json' : 'table';
const VERBOSE = process.argv.includes('--verbose');

class CacheManager {
  constructor() {
    this.cache = unifiedCache;
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: '📄',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      cache: '🚀'
    }[type] || '📄';
    
    console.log(`[${timestamp}] ${prefix} ${message}`);
  }

  async getStatus() {
    this.log('Getting cache system status...', 'info');
    
    try {
      const health = await getCacheHealth();
      const stats = health.metrics;

      if (FORMAT === 'json') {
        console.log(JSON.stringify({
          status: health.status,
          services: health.services,
          statistics: stats,
          timestamp: new Date().toISOString()
        }, null, 2));
        return;
      }

      // Display formatted status
      console.log('\n🚀 Cache System Status');
      console.log('='.repeat(50));
      console.log(`Overall Status: ${this.getStatusIcon(health.status)} ${health.status.toUpperCase()}`);
      console.log(`Hit Rate: ${(stats.overallHitRate * 100).toFixed(1)}%`);
      console.log(`Total Savings: $${stats.totalSavings.toFixed(2)}`);
      console.log('');

      // Service breakdown
      console.log('📊 Service Performance:');
      console.log('-'.repeat(80));
      console.log('Service'.padEnd(15) + 'Status'.padEnd(12) + 'Hit Rate'.padEnd(12) + 'Hits'.padEnd(10) + 'Misses'.padEnd(10) + 'Savings');
      console.log('-'.repeat(80));

      Object.entries(stats.serviceBreakdown).forEach(([service, breakdown]) => {
        const statusIcon = this.getStatusIcon(breakdown.status);
        const hitRate = (breakdown.hitRate * 100).toFixed(1) + '%';
        const savings = breakdown.savings > 0 ? `$${breakdown.savings.toFixed(2)}` : '-';
        
        console.log(
          service.padEnd(15) +
          `${statusIcon} ${breakdown.status}`.padEnd(12) +
          hitRate.padEnd(12) +
          breakdown.hits.toString().padEnd(10) +
          breakdown.misses.toString().padEnd(10) +
          savings
        );
      });

      console.log('');

      // System health
      console.log('🔧 System Health:');
      console.log('-'.repeat(30));
      Object.entries(health.services).forEach(([service, isHealthy]) => {
        const icon = isHealthy ? '✅' : '❌';
        console.log(`${icon} ${service}: ${isHealthy ? 'Connected' : 'Disconnected'}`);
      });

    } catch (error) {
      this.log(`Failed to get cache status: ${error.message}`, 'error');
    }
  }

  async getReport() {
    this.log('Generating comprehensive cache report...', 'info');
    
    try {
      const report = await getCacheReport();

      if (FORMAT === 'json') {
        console.log(JSON.stringify(report, null, 2));
        return;
      }

      // Display formatted report
      console.log('\n📊 Cache Performance Report');
      console.log('='.repeat(60));
      
      // Summary
      const summary = report.summary;
      console.log('\n📈 Performance Summary:');
      console.log(`• Total Requests: ${(summary.totalHits + summary.totalMisses).toLocaleString()}`);
      console.log(`• Cache Hits: ${summary.totalHits.toLocaleString()}`);
      console.log(`• Hit Rate: ${(summary.overallHitRate * 100).toFixed(1)}%`);
      console.log(`• Total Savings: $${summary.totalSavings.toFixed(2)}`);
      console.log(`• Projected Monthly Savings: $${report.costAnalysis.monthlyProjection.toFixed(2)}`);
      console.log(`• ROI: ${report.costAnalysis.roi.toFixed(1)}%`);

      // Recommendations
      if (report.recommendations.length > 0) {
        console.log('\n💡 Optimization Recommendations:');
        report.recommendations.forEach((rec, index) => {
          const priorityIcon = rec.priority === 'high' ? '🔴' : rec.priority === 'medium' ? '🟡' : '🟢';
          console.log(`${index + 1}. ${priorityIcon} [${rec.service.toUpperCase()}] ${rec.description}`);
          console.log(`   Impact: ${rec.impact} | Benefit: ${rec.estimatedBenefit}`);
        });
      }

      // Service details
      if (VERBOSE) {
        console.log('\n🔍 Detailed Service Metrics:');
        Object.entries(report.performance).forEach(([service, metrics]) => {
          console.log(`\n${service.toUpperCase()}:`);
          console.log(JSON.stringify(metrics, null, 2));
        });
      }

    } catch (error) {
      this.log(`Failed to generate cache report: ${error.message}`, 'error');
    }
  }

  async invalidateCache() {
    this.log(`Invalidating cache for: ${SERVICE}`, 'info');
    
    try {
      if (SERVICE === 'all') {
        await this.cache.invalidateAll();
        this.log('All caches invalidated successfully', 'success');
      } else if (['openai', 'firecrawl', 'core'].includes(SERVICE)) {
        await this.cache.invalidateService(SERVICE);
        this.log(`${SERVICE} cache invalidated successfully`, 'success');
      } else {
        this.log(`Invalid service: ${SERVICE}. Use: all, openai, firecrawl, or core`, 'error');
        return;
      }
    } catch (error) {
      this.log(`Failed to invalidate cache: ${error.message}`, 'error');
    }
  }

  async warmCache() {
    this.log(`Starting cache warmup for: ${SERVICE}`, 'info');
    
    try {
      const jobId = await this.cache.startCacheWarmup(SERVICE === 'all' ? 'all' : SERVICE);
      this.log(`Cache warmup job started: ${jobId}`, 'success');
      
      // Monitor job progress
      await this.monitorWarmupJob(jobId);
      
    } catch (error) {
      this.log(`Failed to start cache warmup: ${error.message}`, 'error');
    }
  }

  async monitorWarmupJob(jobId) {
    const checkInterval = 2000; // 2 seconds
    const maxWait = 300000; // 5 minutes
    let elapsed = 0;

    while (elapsed < maxWait) {
      const job = this.cache.getWarmupJob(jobId);
      
      if (!job) {
        this.log('Warmup job not found', 'error');
        return;
      }

      if (job.status === 'completed') {
        this.log(`Cache warmup completed: ${job.itemsProcessed}/${job.totalItems} items processed`, 'success');
        return;
      } else if (job.status === 'failed') {
        this.log(`Cache warmup failed: ${job.error}`, 'error');
        return;
      } else if (job.status === 'running') {
        this.log(`Cache warmup in progress: ${job.itemsProcessed}/${job.totalItems} items processed`, 'info');
      }

      await new Promise(resolve => setTimeout(resolve, checkInterval));
      elapsed += checkInterval;
    }

    this.log('Cache warmup monitoring timed out', 'warning');
  }

  async runMaintenance() {
    this.log('Running cache maintenance...', 'info');
    
    try {
      const taskId = await this.cache.scheduleMaintenance('cleanup');
      this.log(`Cleanup task scheduled: ${taskId}`, 'success');
      
      // Wait a moment for task to complete
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const compressionTaskId = await this.cache.scheduleMaintenance('compression');
      this.log(`Compression task scheduled: ${compressionTaskId}`, 'success');
      
      const statsTaskId = await this.cache.scheduleMaintenance('statistics_update');
      this.log(`Statistics update task scheduled: ${statsTaskId}`, 'success');
      
      this.log('Cache maintenance tasks scheduled successfully', 'success');
      
    } catch (error) {
      this.log(`Failed to run maintenance: ${error.message}`, 'error');
    }
  }

  async analyzePerformance() {
    this.log('Analyzing cache performance...', 'info');
    
    try {
      const report = await getCacheReport();
      const stats = report.summary;
      
      console.log('\n🔍 Performance Analysis');
      console.log('='.repeat(40));
      
      // Performance scoring
      const hitRateScore = stats.overallHitRate * 100;
      const savingsScore = Math.min(stats.totalSavings * 10, 100);
      const healthScore = Object.values(report.summary.systemHealth).filter(Boolean).length / 3 * 100;
      const overallScore = (hitRateScore + savingsScore + healthScore) / 3;
      
      console.log(`Overall Performance Score: ${overallScore.toFixed(1)}/100`);
      console.log(`• Hit Rate Score: ${hitRateScore.toFixed(1)}/100`);
      console.log(`• Cost Savings Score: ${savingsScore.toFixed(1)}/100`);
      console.log(`• System Health Score: ${healthScore.toFixed(1)}/100`);
      
      // Performance grade
      let grade = 'F';
      if (overallScore >= 90) grade = 'A';
      else if (overallScore >= 80) grade = 'B';
      else if (overallScore >= 70) grade = 'C';
      else if (overallScore >= 60) grade = 'D';
      
      console.log(`\nPerformance Grade: ${grade}`);
      
      // Recommendations based on score
      console.log('\n📋 Performance Recommendations:');
      if (hitRateScore < 60) {
        console.log('• Increase cache TTLs to improve hit rates');
      }
      if (savingsScore < 50) {
        console.log('• Enable caching for more expensive operations');
      }
      if (healthScore < 100) {
        console.log('• Address system health issues (Redis/Database connectivity)');
      }
      if (overallScore >= 80) {
        console.log('• Excellent cache performance! Consider expanding to more services');
      }
      
    } catch (error) {
      this.log(`Failed to analyze performance: ${error.message}`, 'error');
    }
  }

  getStatusIcon(status) {
    const icons = {
      healthy: '✅',
      degraded: '⚠️',
      error: '❌'
    };
    return icons[status] || '❓';
  }

  showHelp() {
    console.log(`
🚀 Cache Management Tool

Usage: npm run cache [command] [service] [options]

Commands:
  status              Show cache system status (default)
  report              Generate comprehensive cache report
  invalidate          Invalidate cache for service
  warm                Warm cache with popular content
  maintenance         Run cache maintenance tasks
  analyze             Analyze cache performance and provide insights

Services:
  all                 All cache services (default)
  openai              OpenAI cache service
  firecrawl           Firecrawl cache service
  core                Core multi-tier cache

Options:
  --json              Output in JSON format
  --verbose           Show detailed information

Examples:
  npm run cache                          # Show cache status
  npm run cache status openai            # Show OpenAI cache status
  npm run cache report -- --json         # Generate JSON report
  npm run cache invalidate all           # Invalidate all caches
  npm run cache warm firecrawl           # Warm Firecrawl cache
  npm run cache maintenance              # Run maintenance tasks
  npm run cache analyze                  # Analyze performance
`);
  }
}

async function main() {
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    new CacheManager().showHelp();
    return;
  }

  console.log('🚀 Cache Management Tool');
  console.log('========================\n');

  const manager = new CacheManager();

  try {
    switch (COMMAND) {
      case 'status':
        await manager.getStatus();
        break;
      case 'report':
        await manager.getReport();
        break;
      case 'invalidate':
        await manager.invalidateCache();
        break;
      case 'warm':
        await manager.warmCache();
        break;
      case 'maintenance':
        await manager.runMaintenance();
        break;
      case 'analyze':
        await manager.analyzePerformance();
        break;
      default:
        console.log(`Unknown command: ${COMMAND}`);
        manager.showHelp();
        process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
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

module.exports = { CacheManager };