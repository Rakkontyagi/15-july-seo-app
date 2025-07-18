#!/usr/bin/env node

/**
 * Database Optimization Migration Script
 * Applies performance optimizations including indexes, materialized views, and stored procedures
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DRY_RUN = process.argv.includes('--dry-run');
const VERBOSE = process.argv.includes('--verbose');

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

class DatabaseOptimizer {
  constructor() {
    this.results = {
      indexes: { created: 0, failed: 0, skipped: 0 },
      views: { created: 0, failed: 0, skipped: 0 },
      functions: { created: 0, failed: 0, skipped: 0 },
      partitions: { created: 0, failed: 0, skipped: 0 },
      errors: []
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: '📄',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      skip: '⏭️'
    }[type] || '📄';
    
    console.log(`[${timestamp}] ${prefix} ${message}`);
  }

  async executeSQL(sql, description) {
    if (DRY_RUN) {
      this.log(`DRY RUN: Would execute - ${description}`, 'info');
      if (VERBOSE) {
        console.log('SQL:', sql.substring(0, 200) + '...');
      }
      return { success: true, dryRun: true };
    }

    try {
      if (VERBOSE) {
        this.log(`Executing: ${description}`, 'info');
      }

      const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
      
      if (error) {
        throw error;
      }

      this.log(`Successfully executed: ${description}`, 'success');
      return { success: true, data };
    } catch (error) {
      this.log(`Failed to execute: ${description} - ${error.message}`, 'error');
      this.results.errors.push({ description, error: error.message, sql });
      return { success: false, error };
    }
  }

  async checkPrerequisites() {
    this.log('Checking prerequisites...', 'info');

    // Check if we can execute SQL
    try {
      const { data, error } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .limit(1);

      if (error) {
        throw new Error(`Database connection test failed: ${error.message}`);
      }

      this.log('Database connection verified', 'success');
    } catch (error) {
      this.log(`Prerequisites check failed: ${error.message}`, 'error');
      throw error;
    }

    // Check for required extensions
    const extensionsToCheck = ['pg_stat_statements', 'pg_trgm'];
    for (const extension of extensionsToCheck) {
      try {
        const { data, error } = await supabase.rpc('check_extension', { 
          extension_name: extension 
        });
        
        if (error) {
          this.log(`Extension ${extension} may not be available (this is usually okay)`, 'warning');
        } else {
          this.log(`Extension ${extension} is available`, 'success');
        }
      } catch (error) {
        this.log(`Could not check extension ${extension}: ${error.message}`, 'warning');
      }
    }
  }

  async createOptimizationIndexes() {
    this.log('Creating performance optimization indexes...', 'info');

    const indexes = [
      {
        name: 'idx_serp_analysis_composite',
        sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_serp_analysis_composite 
              ON serp_analysis(keyword, country, language, expires_at) 
              WHERE expires_at > NOW()`,
        description: 'Composite index for SERP cache lookups'
      },
      {
        name: 'idx_serp_analysis_jsonb_gin',
        sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_serp_analysis_jsonb_gin 
              ON serp_analysis USING GIN(results)`,
        description: 'GIN index for SERP results JSONB queries'
      },
      {
        name: 'idx_competitor_analysis_jsonb_gin',
        sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_competitor_analysis_jsonb_gin 
              ON competitor_analysis USING GIN(analysis_data)`,
        description: 'GIN index for competitor analysis JSONB queries'
      },
      {
        name: 'idx_generated_content_active',
        sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_generated_content_active 
              ON generated_content(project_id, created_at DESC) 
              WHERE status != 'archived' AND status != 'deleted'`,
        description: 'Partial index for active content queries'
      },
      {
        name: 'idx_usage_analytics_time_user',
        sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_usage_analytics_time_user 
              ON usage_analytics(created_at DESC, user_id, action_type)`,
        description: 'Composite index for time-based user analytics'
      },
      {
        name: 'idx_projects_user_status',
        sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_user_status 
              ON projects(user_id, status, updated_at DESC) 
              WHERE status = 'active'`,
        description: 'Partial index for active user projects'
      }
    ];

    for (const index of indexes) {
      const result = await this.executeSQL(index.sql, index.description);
      
      if (result.success) {
        this.results.indexes.created++;
      } else {
        this.results.indexes.failed++;
      }
    }

    this.log(`Index creation completed: ${this.results.indexes.created} created, ${this.results.indexes.failed} failed`, 'info');
  }

  async createStoredProcedures() {
    this.log('Creating optimized stored procedures...', 'info');

    const procedures = [
      {
        name: 'get_user_analytics_optimized',
        sql: `
        CREATE OR REPLACE FUNCTION get_user_analytics_optimized(
          user_id_param UUID,
          days_back INTEGER DEFAULT 30
        )
        RETURNS TABLE (
          total_actions BIGINT,
          total_tokens BIGINT,
          action_type_counts JSONB,
          avg_processing_time NUMERIC,
          success_rate NUMERIC,
          daily_breakdown JSONB
        ) AS $$
        BEGIN
          RETURN QUERY
          SELECT 
            COUNT(*) as total_actions,
            SUM(tokens_used) as total_tokens,
            jsonb_object_agg(action_type, COUNT(*)) as action_type_counts,
            AVG(processing_time_ms) as avg_processing_time,
            COUNT(*) FILTER (WHERE success = true)::decimal / COUNT(*) as success_rate,
            jsonb_agg(
              jsonb_build_object(
                'date', DATE_TRUNC('day', created_at),
                'actions', COUNT(*),
                'tokens', SUM(tokens_used),
                'success_rate', COUNT(*) FILTER (WHERE success = true)::decimal / COUNT(*)
              ) ORDER BY DATE_TRUNC('day', created_at) DESC
            ) as daily_breakdown
          FROM usage_analytics
          WHERE user_id = user_id_param 
            AND created_at >= NOW() - (days_back || ' days')::INTERVAL
          GROUP BY DATE_TRUNC('day', created_at);
        END;
        $$ LANGUAGE plpgsql;`,
        description: 'Optimized user analytics aggregation function'
      },
      {
        name: 'get_serp_analysis_optimized',
        sql: `
        CREATE OR REPLACE FUNCTION get_serp_analysis_optimized(
          keyword_param TEXT,
          country_param TEXT,
          language_param TEXT DEFAULT 'en'
        )
        RETURNS TABLE (
          id UUID,
          results JSONB,
          metadata JSONB,
          created_at TIMESTAMP WITH TIME ZONE,
          expires_at TIMESTAMP WITH TIME ZONE,
          is_fresh BOOLEAN
        ) AS $$
        BEGIN
          RETURN QUERY
          SELECT 
            sa.id,
            sa.results,
            sa.metadata,
            sa.created_at,
            sa.expires_at,
            (sa.expires_at > NOW() + INTERVAL '1 hour') as is_fresh
          FROM serp_analysis sa
          WHERE sa.keyword = keyword_param
            AND sa.country = country_param
            AND sa.language = language_param
            AND sa.expires_at > NOW()
          ORDER BY sa.created_at DESC
          LIMIT 1;
        END;
        $$ LANGUAGE plpgsql;`,
        description: 'Optimized SERP cache lookup function'
      },
      {
        name: 'cleanup_expired_cache',
        sql: `
        CREATE OR REPLACE FUNCTION cleanup_expired_cache()
        RETURNS INTEGER AS $$
        DECLARE
          deleted_count INTEGER;
        BEGIN
          DELETE FROM serp_analysis WHERE expires_at <= NOW() - INTERVAL '1 day';
          GET DIAGNOSTICS deleted_count = ROW_COUNT;
          
          DELETE FROM competitor_analysis WHERE expires_at <= NOW() - INTERVAL '1 day';
          
          RETURN deleted_count;
        END;
        $$ LANGUAGE plpgsql;`,
        description: 'Cache cleanup maintenance function'
      }
    ];

    for (const procedure of procedures) {
      const result = await this.executeSQL(procedure.sql, procedure.description);
      
      if (result.success) {
        this.results.functions.created++;
      } else {
        this.results.functions.failed++;
      }
    }

    this.log(`Stored procedure creation completed: ${this.results.functions.created} created, ${this.results.functions.failed} failed`, 'info');
  }

  async createMaterializedViews() {
    this.log('Creating materialized views for analytics...', 'info');

    const views = [
      {
        name: 'user_analytics_summary',
        sql: `
        CREATE MATERIALIZED VIEW IF NOT EXISTS user_analytics_summary AS
        SELECT 
          user_id,
          DATE_TRUNC('day', created_at) as date,
          COUNT(*) as total_actions,
          SUM(tokens_used) as total_tokens,
          AVG(processing_time_ms) as avg_processing_time,
          COUNT(*) FILTER (WHERE success = true)::decimal / COUNT(*) as success_rate,
          jsonb_object_agg(action_type, COUNT(*)) as action_type_counts
        FROM usage_analytics
        WHERE created_at >= NOW() - INTERVAL '90 days'
        GROUP BY user_id, DATE_TRUNC('day', created_at);
        
        CREATE UNIQUE INDEX IF NOT EXISTS idx_user_analytics_summary_unique 
        ON user_analytics_summary(user_id, date);`,
        description: 'User analytics summary materialized view'
      },
      {
        name: 'keyword_popularity_summary',
        sql: `
        CREATE MATERIALIZED VIEW IF NOT EXISTS keyword_popularity_summary AS
        SELECT 
          keyword,
          country,
          COUNT(*) as search_frequency,
          MAX(created_at) as last_searched,
          AVG(EXTRACT(EPOCH FROM (expires_at - created_at))) as avg_cache_duration
        FROM serp_analysis
        WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY keyword, country
        HAVING COUNT(*) > 1;
        
        CREATE INDEX IF NOT EXISTS idx_keyword_popularity_frequency 
        ON keyword_popularity_summary(search_frequency DESC, last_searched DESC);`,
        description: 'Keyword popularity summary materialized view'
      }
    ];

    for (const view of views) {
      const result = await this.executeSQL(view.sql, view.description);
      
      if (result.success) {
        this.results.views.created++;
      } else {
        this.results.views.failed++;
      }
    }

    this.log(`Materialized view creation completed: ${this.results.views.created} created, ${this.results.views.failed} failed`, 'info');
  }

  async createPerformanceMonitoring() {
    this.log('Setting up performance monitoring...', 'info');

    const monitoringSQL = `
    CREATE TABLE IF NOT EXISTS query_performance_log (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      query_type TEXT NOT NULL,
      table_name TEXT NOT NULL,
      execution_time_ms INTEGER NOT NULL,
      success BOOLEAN NOT NULL,
      row_count INTEGER,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_query_performance_log_time 
    ON query_performance_log(created_at DESC, query_type);

    CREATE OR REPLACE FUNCTION get_query_performance_stats(
      hours_back INTEGER DEFAULT 24
    )
    RETURNS TABLE (
      query_type TEXT,
      table_name TEXT,
      avg_execution_time NUMERIC,
      max_execution_time INTEGER,
      total_queries BIGINT,
      success_rate NUMERIC,
      avg_row_count NUMERIC
    ) AS $$
    BEGIN
      RETURN QUERY
      SELECT 
        qpl.query_type,
        qpl.table_name,
        AVG(qpl.execution_time_ms) as avg_execution_time,
        MAX(qpl.execution_time_ms) as max_execution_time,
        COUNT(*) as total_queries,
        COUNT(*) FILTER (WHERE qpl.success = true)::decimal / COUNT(*) as success_rate,
        AVG(qpl.row_count) as avg_row_count
      FROM query_performance_log qpl
      WHERE qpl.created_at >= NOW() - (hours_back || ' hours')::INTERVAL
      GROUP BY qpl.query_type, qpl.table_name
      ORDER BY avg_execution_time DESC;
    END;
    $$ LANGUAGE plpgsql;`;

    const result = await this.executeSQL(monitoringSQL, 'Performance monitoring setup');
    
    if (result.success) {
      this.results.functions.created++;
      this.log('Performance monitoring setup completed', 'success');
    } else {
      this.results.functions.failed++;
    }
  }

  async grantPermissions() {
    this.log('Setting up permissions...', 'info');

    const permissionsSQL = `
    -- Grant execute permissions on optimization functions
    GRANT EXECUTE ON FUNCTION get_user_analytics_optimized TO authenticated;
    GRANT EXECUTE ON FUNCTION get_serp_analysis_optimized TO authenticated;
    GRANT EXECUTE ON FUNCTION cleanup_expired_cache TO service_role;
    GRANT EXECUTE ON FUNCTION get_query_performance_stats TO authenticated;

    -- Grant select permissions on materialized views
    GRANT SELECT ON user_analytics_summary TO authenticated;
    GRANT SELECT ON keyword_popularity_summary TO authenticated;
    GRANT SELECT ON query_performance_log TO authenticated;`;

    const result = await this.executeSQL(permissionsSQL, 'Permission grants');
    
    if (result.success) {
      this.log('Permissions granted successfully', 'success');
    }
  }

  async verifyOptimizations() {
    this.log('Verifying optimization implementation...', 'info');

    try {
      // Create verification function
      const verificationSQL = `
      CREATE OR REPLACE FUNCTION verify_database_optimizations()
      RETURNS TABLE (
        optimization_type TEXT,
        status TEXT,
        details TEXT
      ) AS $$
      BEGIN
        RETURN QUERY
        SELECT 
          'Indexes' as optimization_type,
          CASE WHEN COUNT(*) >= 5 THEN 'IMPLEMENTED' ELSE 'PARTIAL' END as status,
          COUNT(*)::TEXT || ' performance indexes created' as details
        FROM pg_indexes 
        WHERE indexname LIKE 'idx_%_composite' 
           OR indexname LIKE 'idx_%_gin'
           OR indexname LIKE 'idx_%_active';
        
        RETURN QUERY
        SELECT 
          'Materialized Views' as optimization_type,
          CASE WHEN COUNT(*) >= 2 THEN 'IMPLEMENTED' ELSE 'PARTIAL' END as status,
          COUNT(*)::TEXT || ' materialized views created' as details
        FROM pg_matviews 
        WHERE matviewname IN ('user_analytics_summary', 'keyword_popularity_summary');
        
        RETURN QUERY
        SELECT 
          'Stored Procedures' as optimization_type,
          CASE WHEN COUNT(*) >= 3 THEN 'IMPLEMENTED' ELSE 'PARTIAL' END as status,
          COUNT(*)::TEXT || ' optimization functions created' as details
        FROM pg_proc 
        WHERE proname IN ('get_user_analytics_optimized', 'get_serp_analysis_optimized', 'cleanup_expired_cache');
      END;
      $$ LANGUAGE plpgsql;`;

      await this.executeSQL(verificationSQL, 'Creating verification function');

      // Run verification
      if (!DRY_RUN) {
        const { data, error } = await supabase.rpc('verify_database_optimizations');
        
        if (error) {
          throw error;
        }

        this.log('📊 Optimization Verification Results:', 'info');
        if (data) {
          data.forEach(result => {
            const status = result.status === 'IMPLEMENTED' ? '✅' : '⚠️';
            this.log(`${status} ${result.optimization_type}: ${result.status} - ${result.details}`, 'info');
          });
        }
      }
    } catch (error) {
      this.log(`Verification failed: ${error.message}`, 'error');
    }
  }

  async run() {
    const startTime = Date.now();
    
    this.log('🚀 Starting database optimization migration...', 'info');
    
    if (DRY_RUN) {
      this.log('Running in DRY RUN mode - no changes will be applied', 'warning');
    }

    try {
      await this.checkPrerequisites();
      await this.createOptimizationIndexes();
      await this.createStoredProcedures();
      await this.createMaterializedViews();
      await this.createPerformanceMonitoring();
      await this.grantPermissions();
      await this.verifyOptimizations();

      const duration = Date.now() - startTime;
      
      this.log('📊 Migration Summary:', 'info');
      this.log(`   Indexes: ${this.results.indexes.created} created, ${this.results.indexes.failed} failed`, 'info');
      this.log(`   Views: ${this.results.views.created} created, ${this.results.views.failed} failed`, 'info');
      this.log(`   Functions: ${this.results.functions.created} created, ${this.results.functions.failed} failed`, 'info');
      this.log(`   Duration: ${duration}ms`, 'info');

      if (this.results.errors.length > 0) {
        this.log(`⚠️ ${this.results.errors.length} errors occurred during migration:`, 'warning');
        this.results.errors.forEach((error, index) => {
          this.log(`   ${index + 1}. ${error.description}: ${error.error}`, 'error');
        });
      }

      const totalSuccess = this.results.indexes.created + this.results.views.created + this.results.functions.created;
      const totalFailed = this.results.indexes.failed + this.results.views.failed + this.results.functions.failed;

      if (totalFailed === 0) {
        this.log('✅ Database optimization migration completed successfully!', 'success');
        return true;
      } else {
        this.log(`⚠️ Migration completed with ${totalFailed} failures and ${totalSuccess} successes`, 'warning');
        return false;
      }

    } catch (error) {
      this.log(`❌ Migration failed: ${error.message}`, 'error');
      if (VERBOSE) {
        console.error(error);
      }
      return false;
    }
  }
}

// Helper function to create exec_sql RPC if it doesn't exist
async function ensureExecSqlFunction() {
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: 'SELECT 1' });
    if (error && error.message.includes('function exec_sql')) {
      console.log('📄 Creating exec_sql helper function...');
      
      // Create the function using direct SQL execution
      const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION exec_sql(sql_query TEXT)
      RETURNS VOID AS $$
      BEGIN
        EXECUTE sql_query;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;`;

      // This would need to be executed directly in Supabase dashboard or via another method
      console.log('⚠️ Please execute the following SQL in your Supabase dashboard:');
      console.log(createFunctionSQL);
      console.log('Then run this script again.');
      process.exit(1);
    }
  } catch (error) {
    console.warn('Could not verify exec_sql function:', error.message);
  }
}

// Main execution
async function main() {
  console.log('🔧 Database Optimization Migration Tool');
  console.log('=====================================\n');

  await ensureExecSqlFunction();

  const optimizer = new DatabaseOptimizer();
  const success = await optimizer.run();

  process.exit(success ? 0 : 1);
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = { DatabaseOptimizer };