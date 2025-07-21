#!/usr/bin/env node

/**
 * Database Performance Statistics Tool
 * Retrieves and displays query performance metrics
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const HOURS_BACK = parseInt(process.argv.find(arg => arg.startsWith('--hours='))?.split('=')[1]) || 24;
const FORMAT = process.argv.includes('--json') ? 'json' : 'table';

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

async function getPerformanceStats() {
  try {
    const { data, error } = await supabase.rpc('get_query_performance_stats', {
      hours_back: HOURS_BACK
    });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('❌ Failed to get performance stats:', error.message);
    return null;
  }
}

async function getSlowQueries() {
  try {
    const { data, error } = await supabase.rpc('check_slow_queries', {
      threshold_ms: 1000
    });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.warn('⚠️ Could not get slow queries:', error.message);
    return [];
  }
}

function formatTable(data, title) {
  if (!data || data.length === 0) {
    console.log(`\n📊 ${title}: No data available\n`);
    return;
  }

  console.log(`\n📊 ${title}:`);
  console.log('='.repeat(80));

  // Get column widths
  const columns = Object.keys(data[0]);
  const widths = columns.map(col => 
    Math.max(col.length, ...data.map(row => String(row[col] || '').length))
  );

  // Header
  const header = columns.map((col, i) => col.padEnd(widths[i])).join(' | ');
  console.log(header);
  console.log('-'.repeat(header.length));

  // Rows
  data.forEach(row => {
    const rowString = columns.map((col, i) => {
      let value = row[col];
      if (typeof value === 'number' && col.includes('time')) {
        value = value.toFixed(2) + 'ms';
      } else if (typeof value === 'number' && col.includes('rate')) {
        value = (value * 100).toFixed(1) + '%';
      } else if (typeof value === 'number') {
        value = value.toLocaleString();
      }
      return String(value || '').padEnd(widths[i]);
    }).join(' | ');
    console.log(rowString);
  });

  console.log('');
}

function generateRecommendations(stats, slowQueries) {
  console.log('💡 Performance Recommendations:');
  console.log('='.repeat(50));

  if (!stats || stats.length === 0) {
    console.log('• No performance data available for analysis');
    return;
  }

  // Find slow operations
  const slowOps = stats.filter(stat => stat.avg_execution_time > 1000);
  if (slowOps.length > 0) {
    console.log('🐌 Slow Operations Detected:');
    slowOps.forEach(op => {
      console.log(`  • ${op.query_type} on ${op.table_name}: ${op.avg_execution_time.toFixed(0)}ms avg`);
      
      if (op.table_name === 'serp_analysis' && op.avg_execution_time > 500) {
        console.log('    → Consider adding more specific indexes for SERP queries');
      }
      if (op.table_name === 'usage_analytics' && op.avg_execution_time > 300) {
        console.log('    → Consider implementing table partitioning for analytics');
      }
      if (op.success_rate < 0.95) {
        console.log(`    → Low success rate (${(op.success_rate * 100).toFixed(1)}%) - investigate error causes`);
      }
    });
    console.log('');
  }

  // Check for high frequency operations
  const highFreq = stats.filter(stat => stat.total_queries > 1000);
  if (highFreq.length > 0) {
    console.log('🔥 High Frequency Operations:');
    highFreq.forEach(op => {
      console.log(`  • ${op.query_type} on ${op.table_name}: ${op.total_queries} queries`);
      if (op.avg_execution_time > 100) {
        console.log('    → Consider implementing caching for frequently accessed data');
      }
    });
    console.log('');
  }

  // General recommendations
  console.log('📝 General Recommendations:');
  const avgResponseTime = stats.reduce((sum, stat) => sum + stat.avg_execution_time, 0) / stats.length;
  
  if (avgResponseTime > 500) {
    console.log('  • Overall response times are high - consider database optimization');
  }
  if (slowQueries.length > 10) {
    console.log(`  • ${slowQueries.length} slow queries detected in the last hour - investigate query patterns`);
  }
  
  console.log('  • Run database maintenance regularly: npm run db:maintenance');
  console.log('  • Monitor performance trends: npm run db:performance:stats');
  console.log('  • Consider implementing read replicas for read-heavy workloads');
  console.log('');
}

async function main() {
  console.log('📊 Database Performance Statistics');
  console.log(`📅 Time Range: Last ${HOURS_BACK} hours`);
  console.log('='.repeat(40));

  const [stats, slowQueries] = await Promise.all([
    getPerformanceStats(),
    getSlowQueries()
  ]);

  if (stats === null) {
    console.error('❌ Failed to retrieve performance data');
    process.exit(1);
  }

  if (FORMAT === 'json') {
    console.log(JSON.stringify({
      timeRange: `${HOURS_BACK} hours`,
      timestamp: new Date().toISOString(),
      performanceStats: stats,
      slowQueries: slowQueries,
      summary: {
        totalOperations: stats.length,
        averageResponseTime: stats.length > 0 
          ? stats.reduce((sum, stat) => sum + stat.avg_execution_time, 0) / stats.length 
          : 0,
        totalQueries: stats.reduce((sum, stat) => sum + stat.total_queries, 0),
        slowQueriesCount: slowQueries.length
      }
    }, null, 2));
  } else {
    formatTable(stats, 'Query Performance Statistics');
    
    if (slowQueries.length > 0) {
      formatTable(slowQueries, 'Recent Slow Queries (>1000ms)');
    }

    generateRecommendations(stats, slowQueries);

    // Summary
    console.log('📈 Summary:');
    console.log('='.repeat(20));
    console.log(`• Total operation types: ${stats.length}`);
    console.log(`• Total queries analyzed: ${stats.reduce((sum, stat) => sum + stat.total_queries, 0).toLocaleString()}`);
    if (stats.length > 0) {
      const avgTime = stats.reduce((sum, stat) => sum + stat.avg_execution_time, 0) / stats.length;
      console.log(`• Average response time: ${avgTime.toFixed(2)}ms`);
    }
    console.log(`• Slow queries (last hour): ${slowQueries.length}`);
    console.log(`• Report generated: ${new Date().toISOString()}`);
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
}