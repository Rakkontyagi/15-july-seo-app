#!/usr/bin/env node

/**
 * Database Maintenance Tool
 * Performs regular maintenance tasks for optimal performance
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DRY_RUN = process.argv.includes('--dry-run');
const VERBOSE = process.argv.includes('--verbose');
const TASK = process.argv.find(arg => arg.startsWith('--task='))?.split('=')[1] || 'all';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

class DatabaseMaintenance {
  constructor() {
    this.results = {
      cacheCleanup: { deleted: 0, success: false },
      viewRefresh: { refreshed: 0, success: false },
      statistics: { updated: 0, success: false },
      partitionMaintenance: { processed: 0, success: false },
      performanceLog: { cleaned: 0, success: false }
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: '📄',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      cleanup: '🧹'
    }[type] || '📄';
    
    console.log(`[${timestamp}] ${prefix} ${message}`);
  }

  async executeMaintenanceTask(taskName, taskFunction) {
    if (DRY_RUN) {
      this.log(`DRY RUN: Would execute ${taskName}`, 'info');
      return { success: true, dryRun: true };
    }

    try {
      if (VERBOSE) {
        this.log(`Starting ${taskName}...`, 'info');
      }

      const result = await taskFunction();
      
      this.log(`Completed ${taskName}`, 'success');
      return { success: true, ...result };
    } catch (error) {
      this.log(`Failed ${taskName}: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  }

  async cleanupExpiredCache() {
    return await this.executeMaintenanceTask('Cache Cleanup', async () => {
      const { data, error } = await supabase.rpc('cleanup_expired_cache');
      
      if (error) {
        throw error;
      }

      const deletedCount = data || 0;
      this.results.cacheCleanup = { deleted: deletedCount, success: true };
      
      this.log(`Cleaned up ${deletedCount} expired cache entries`, 'cleanup');
      return { deleted: deletedCount };
    });
  }

  async refreshMaterializedViews() {
    return await this.executeMaintenanceTask('Materialized View Refresh', async () => {
      // Refresh user analytics summary
      const { error: analyticsError } = await supabase.rpc('refresh_materialized_view', {
        view_name: 'user_analytics_summary'
      });

      // Refresh keyword popularity summary
      const { error: keywordError } = await supabase.rpc('refresh_materialized_view', {
        view_name: 'keyword_popularity_summary'
      });

      // If individual refresh functions don't exist, try the batch refresh
      if (analyticsError || keywordError) {
        const { error: batchError } = await supabase.rpc('refresh_analytics_views');
        if (batchError) {
          throw batchError;
        }
      }

      this.results.viewRefresh = { refreshed: 2, success: true };
      this.log('Refreshed materialized views for better query performance', 'cleanup');
      
      return { refreshed: 2 };
    });
  }

  async updateTableStatistics() {
    return await this.executeMaintenanceTask('Table Statistics Update', async () => {
      const tables = [
        'users',
        'projects', 
        'generated_content',
        'serp_analysis',
        'competitor_analysis',
        'usage_analytics'
      ];

      let updatedCount = 0;

      for (const table of tables) {
        try {
          const { error } = await supabase.rpc('analyze_table', { table_name: table });
          
          if (error) {
            // If analyze_table function doesn't exist, try direct SQL
            const { error: directError } = await supabase.rpc('exec_sql', {
              sql_query: `ANALYZE ${table};`
            });
            
            if (directError) {
              this.log(`Could not analyze table ${table}: ${directError.message}`, 'warning');
              continue;
            }
          }
          
          updatedCount++;
          
          if (VERBOSE) {
            this.log(`Updated statistics for ${table}`, 'info');
          }
        } catch (error) {
          this.log(`Warning: Could not update statistics for ${table}: ${error.message}`, 'warning');
        }
      }

      this.results.statistics = { updated: updatedCount, success: updatedCount > 0 };
      this.log(`Updated statistics for ${updatedCount} tables`, 'cleanup');
      
      return { updated: updatedCount };
    });
  }

  async cleanupPerformanceLogs() {
    return await this.executeMaintenanceTask('Performance Log Cleanup', async () => {
      // Keep only last 30 days of performance logs
      const { data, error } = await supabase
        .from('query_performance_log')
        .delete()
        .lt('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (error) {
        throw error;
      }

      const cleanedCount = data?.length || 0;
      this.results.performanceLog = { cleaned: cleanedCount, success: true };
      
      this.log(`Cleaned up ${cleanedCount} old performance log entries`, 'cleanup');
      return { cleaned: cleanedCount };
    });
  }

  async maintainPartitions() {
    return await this.executeMaintenanceTask('Partition Maintenance', async () => {
      // Create next month's partition if it doesn't exist
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      const partitionName = `usage_analytics_${nextMonth.getFullYear()}_${(nextMonth.getMonth() + 1).toString().padStart(2, '0')}`;
      
      const startDate = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 1);
      const endDate = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 1);

      try {
        const { error } = await supabase.rpc('exec_sql', {
          sql_query: `
            CREATE TABLE IF NOT EXISTS ${partitionName} PARTITION OF usage_analytics_partitioned
            FOR VALUES FROM ('${startDate.toISOString().split('T')[0]}') TO ('${endDate.toISOString().split('T')[0]}');
            
            CREATE INDEX IF NOT EXISTS idx_${partitionName}_user_time 
            ON ${partitionName} (user_id, created_at DESC);
          `
        });

        if (error) {
          throw error;
        }

        this.results.partitionMaintenance = { processed: 1, success: true };
        this.log(`Created/verified partition ${partitionName}`, 'cleanup');
        
        return { processed: 1 };
      } catch (error) {
        // Partitioning might not be set up yet, which is okay
        this.log(`Partition maintenance skipped: ${error.message}`, 'warning');
        this.results.partitionMaintenance = { processed: 0, success: true };
        return { processed: 0 };
      }
    });
  }

  async runOptimizationChecks() {
    this.log('Running optimization health checks...', 'info');

    try {
      // Check if optimizations are properly implemented
      const { data: optimizationStatus, error } = await supabase.rpc('verify_database_optimizations');
      
      if (error) {
        this.log('Could not verify optimizations - they may not be installed yet', 'warning');
        return;
      }

      if (optimizationStatus) {
        this.log('🔍 Database Optimization Status:', 'info');
        optimizationStatus.forEach(status => {
          const icon = status.status === 'IMPLEMENTED' ? '✅' : '⚠️';
          this.log(`${icon} ${status.optimization_type}: ${status.status} - ${status.details}`, 'info');
        });
      }

      // Check for slow queries
      const { data: slowQueries } = await supabase.rpc('check_slow_queries', { threshold_ms: 1000 });
      
      if (slowQueries && slowQueries.length > 0) {
        this.log(`⚠️ Found ${slowQueries.length} slow queries in the last hour`, 'warning');
        if (VERBOSE) {
          slowQueries.slice(0, 5).forEach(query => {
            this.log(`   ${query.query_type} on ${query.table_name}: ${query.execution_time_ms}ms`, 'warning');
          });
        }
      } else {
        this.log('✅ No slow queries detected in the last hour', 'success');
      }

    } catch (error) {
      this.log(`Optimization check failed: ${error.message}`, 'warning');
    }
  }

  async run() {
    const startTime = Date.now();
    
    this.log('🧹 Starting database maintenance...', 'info');
    
    if (DRY_RUN) {
      this.log('Running in DRY RUN mode - no changes will be applied', 'warning');
    }

    const tasks = {
      cache: () => this.cleanupExpiredCache(),
      views: () => this.refreshMaterializedViews(),
      stats: () => this.updateTableStatistics(),
      partitions: () => this.maintainPartitions(),
      logs: () => this.cleanupPerformanceLogs(),
      all: async () => {
        await this.cleanupExpiredCache();
        await this.refreshMaterializedViews();
        await this.updateTableStatistics();
        await this.maintainPartitions();
        await this.cleanupPerformanceLogs();
      }
    };

    try {
      if (tasks[TASK]) {
        await tasks[TASK]();
      } else {
        this.log(`Unknown task: ${TASK}. Available tasks: ${Object.keys(tasks).join(', ')}`, 'error');
        process.exit(1);
      }

      await this.runOptimizationChecks();

      const duration = Date.now() - startTime;
      
      this.log('📊 Maintenance Summary:', 'info');
      this.log(`   Cache cleanup: ${this.results.cacheCleanup.deleted} entries deleted`, 'info');
      this.log(`   View refresh: ${this.results.viewRefresh.refreshed} views refreshed`, 'info');
      this.log(`   Statistics: ${this.results.statistics.updated} tables updated`, 'info');
      this.log(`   Partitions: ${this.results.partitionMaintenance.processed} partitions maintained`, 'info');
      this.log(`   Performance logs: ${this.results.performanceLog.cleaned} old entries cleaned`, 'info');
      this.log(`   Duration: ${duration}ms`, 'info');

      const totalTasks = Object.values(this.results).filter(r => r.success).length;
      this.log(`✅ Database maintenance completed successfully! (${totalTasks} tasks completed)`, 'success');

      return true;

    } catch (error) {
      this.log(`❌ Maintenance failed: ${error.message}`, 'error');
      if (VERBOSE) {
        console.error(error);
      }
      return false;
    }
  }

  static showHelp() {
    console.log(`
🧹 Database Maintenance Tool

Usage: npm run db:maintenance [options]

Options:
  --task=<task>     Specific task to run (default: all)
  --dry-run        Show what would be done without making changes
  --verbose        Show detailed output

Available tasks:
  all             Run all maintenance tasks (default)
  cache           Clean up expired cache entries
  views           Refresh materialized views
  stats           Update table statistics
  partitions      Maintain table partitions
  logs            Clean up old performance logs

Examples:
  npm run db:maintenance                    # Run all maintenance tasks
  npm run db:maintenance -- --task=cache   # Only clean up cache
  npm run db:maintenance -- --dry-run      # See what would be done
  npm run db:maintenance -- --verbose      # Show detailed output
`);
  }
}

async function main() {
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    DatabaseMaintenance.showHelp();
    return;
  }

  console.log('🧹 Database Maintenance Tool');
  console.log('============================\n');

  const maintenance = new DatabaseMaintenance();
  const success = await maintenance.run();

  process.exit(success ? 0 : 1);
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = { DatabaseMaintenance };