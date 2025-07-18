-- Database Query Optimization Schema
-- Implements advanced indexing, partitioning, and materialized views for sub-second response times

-- ============================================================================
-- ADVANCED INDEXING STRATEGY
-- ============================================================================

-- Composite indexes for high-frequency SERP cache lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_serp_analysis_composite 
ON serp_analysis(keyword, country, language, expires_at) 
WHERE expires_at > NOW();

-- JSONB indexes for metadata and results queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_serp_analysis_jsonb_gin 
ON serp_analysis USING GIN(results);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_serp_analysis_metadata_gin 
ON serp_analysis USING GIN(metadata);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_competitor_analysis_jsonb_gin 
ON competitor_analysis USING GIN(analysis_data);

-- Partial indexes for active content queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_generated_content_active 
ON generated_content(project_id, created_at DESC) 
WHERE status != 'archived' AND status != 'deleted';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_generated_content_user_active 
ON generated_content(user_id, created_at DESC) 
WHERE status != 'archived' AND status != 'deleted';

-- Time-based composite indexes for analytics
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_usage_analytics_time_user 
ON usage_analytics(created_at DESC, user_id, action_type);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_usage_analytics_user_time 
ON usage_analytics(user_id, created_at DESC) 
WHERE success = true;

-- Keyword frequency tracking index
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_serp_analysis_keyword_frequency 
ON serp_analysis(keyword, created_at DESC) 
WHERE expires_at > NOW();

-- Project performance optimization indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_user_status 
ON projects(user_id, status, updated_at DESC) 
WHERE status = 'active';

-- Cache expiration optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_serp_analysis_expires_cleanup 
ON serp_analysis(expires_at) 
WHERE expires_at <= NOW();

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_competitor_analysis_expires_cleanup 
ON competitor_analysis(expires_at) 
WHERE expires_at <= NOW();

-- ============================================================================
-- MATERIALIZED VIEWS FOR ANALYTICS
-- ============================================================================

-- User analytics summary materialized view
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

-- Index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_analytics_summary_unique 
ON user_analytics_summary(user_id, date);

-- Keyword popularity materialized view
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

-- Index on keyword popularity
CREATE INDEX IF NOT EXISTS idx_keyword_popularity_frequency 
ON keyword_popularity_summary(search_frequency DESC, last_searched DESC);

-- Project content summary materialized view
CREATE MATERIALIZED VIEW IF NOT EXISTS project_content_summary AS
SELECT 
  p.id as project_id,
  p.user_id,
  p.name as project_name,
  COUNT(gc.id) as total_content,
  COUNT(gc.id) FILTER (WHERE gc.status = 'published') as published_content,
  MAX(gc.created_at) as last_content_created,
  AVG(LENGTH(gc.content)) as avg_content_length
FROM projects p
LEFT JOIN generated_content gc ON p.id = gc.project_id
WHERE p.status = 'active'
GROUP BY p.id, p.user_id, p.name;

-- Index on project summary
CREATE UNIQUE INDEX IF NOT EXISTS idx_project_content_summary_unique 
ON project_content_summary(project_id);

-- ============================================================================
-- STORED PROCEDURES FOR OPTIMIZED QUERIES
-- ============================================================================

-- Optimized user analytics retrieval function
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
    SUM(uas.total_actions) as total_actions,
    SUM(uas.total_tokens) as total_tokens,
    jsonb_object_agg(DISTINCT action_type, action_count) as action_type_counts,
    AVG(uas.avg_processing_time) as avg_processing_time,
    AVG(uas.success_rate) as success_rate,
    jsonb_agg(
      jsonb_build_object(
        'date', uas.date,
        'actions', uas.total_actions,
        'tokens', uas.total_tokens,
        'success_rate', uas.success_rate
      ) ORDER BY uas.date DESC
    ) as daily_breakdown
  FROM user_analytics_summary uas
  CROSS JOIN LATERAL (
    SELECT key as action_type, value::bigint as action_count
    FROM jsonb_each(uas.action_type_counts)
  ) as action_breakdown
  WHERE uas.user_id = user_id_param 
    AND uas.date >= CURRENT_DATE - INTERVAL '1 day' * days_back
  GROUP BY uas.user_id;
END;
$$ LANGUAGE plpgsql;

-- Optimized SERP cache lookup with fallback
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
$$ LANGUAGE plpgsql;

-- Batch SERP analysis insertion with conflict resolution
CREATE OR REPLACE FUNCTION insert_serp_analysis_batch(
  analyses JSONB
)
RETURNS TABLE (
  inserted_count INTEGER,
  updated_count INTEGER,
  skipped_count INTEGER
) AS $$
DECLARE
  analysis JSONB;
  inserted_cnt INTEGER := 0;
  updated_cnt INTEGER := 0;
  skipped_cnt INTEGER := 0;
BEGIN
  FOR analysis IN SELECT jsonb_array_elements(analyses)
  LOOP
    INSERT INTO serp_analysis (
      id, keyword, country, language, results, metadata, expires_at, created_at
    )
    VALUES (
      (analysis->>'id')::UUID,
      analysis->>'keyword',
      analysis->>'country',
      analysis->>'language',
      analysis->'results',
      analysis->'metadata',
      (analysis->>'expires_at')::TIMESTAMP WITH TIME ZONE,
      NOW()
    )
    ON CONFLICT (keyword, country, language) 
    DO UPDATE SET
      results = EXCLUDED.results,
      metadata = EXCLUDED.metadata,
      expires_at = EXCLUDED.expires_at,
      updated_at = NOW()
    WHERE serp_analysis.expires_at < NOW() + INTERVAL '6 hours';
    
    GET DIAGNOSTICS inserted_cnt = ROW_COUNT;
    
    IF inserted_cnt = 0 THEN
      skipped_cnt := skipped_cnt + 1;
    ELSIF TG_OP = 'UPDATE' THEN
      updated_cnt := updated_cnt + 1;
    ELSE
      inserted_cnt := inserted_cnt + 1;
    END IF;
  END LOOP;
  
  RETURN QUERY SELECT inserted_cnt, updated_cnt, skipped_cnt;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TABLE PARTITIONING FOR ANALYTICS
-- ============================================================================

-- Create parent table for partitioned usage analytics
CREATE TABLE IF NOT EXISTS usage_analytics_partitioned (
  LIKE usage_analytics INCLUDING ALL
) PARTITION BY RANGE (created_at);

-- Create monthly partitions for current and next 6 months
DO $$
DECLARE
  start_date DATE;
  end_date DATE;
  partition_name TEXT;
BEGIN
  FOR i IN 0..6 LOOP
    start_date := DATE_TRUNC('month', CURRENT_DATE) + (i || ' months')::INTERVAL;
    end_date := start_date + INTERVAL '1 month';
    partition_name := 'usage_analytics_' || TO_CHAR(start_date, 'YYYY_MM');
    
    EXECUTE format('
      CREATE TABLE IF NOT EXISTS %I PARTITION OF usage_analytics_partitioned
      FOR VALUES FROM (%L) TO (%L)',
      partition_name, start_date, end_date
    );
    
    -- Create indexes on each partition
    EXECUTE format('
      CREATE INDEX IF NOT EXISTS %I ON %I (user_id, created_at DESC)',
      'idx_' || partition_name || '_user_time', partition_name
    );
    
    EXECUTE format('
      CREATE INDEX IF NOT EXISTS %I ON %I (action_type, created_at DESC)',
      'idx_' || partition_name || '_action_time', partition_name
    );
  END LOOP;
END $$;

-- ============================================================================
-- AUTOMATIC MAINTENANCE PROCEDURES
-- ============================================================================

-- Cache cleanup procedure
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Clean up expired SERP analysis
  DELETE FROM serp_analysis WHERE expires_at <= NOW() - INTERVAL '1 day';
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Clean up expired competitor analysis
  DELETE FROM competitor_analysis WHERE expires_at <= NOW() - INTERVAL '1 day';
  
  -- Update statistics
  ANALYZE serp_analysis;
  ANALYZE competitor_analysis;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Materialized view refresh procedure
CREATE OR REPLACE FUNCTION refresh_analytics_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY user_analytics_summary;
  REFRESH MATERIALIZED VIEW CONCURRENTLY keyword_popularity_summary;
  REFRESH MATERIALIZED VIEW CONCURRENTLY project_content_summary;
END;
$$ LANGUAGE plpgsql;

-- Query performance monitoring table
CREATE TABLE IF NOT EXISTS query_performance_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_type TEXT NOT NULL,
  table_name TEXT NOT NULL,
  execution_time_ms INTEGER NOT NULL,
  success BOOLEAN NOT NULL,
  row_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for performance monitoring
CREATE INDEX IF NOT EXISTS idx_query_performance_log_time 
ON query_performance_log(created_at DESC, query_type);

-- ============================================================================
-- SCHEDULED MAINTENANCE JOBS
-- ============================================================================

-- Schedule cache cleanup (run every hour)
-- Note: This would be implemented in the application or via pg_cron extension
CREATE OR REPLACE FUNCTION schedule_maintenance_jobs()
RETURNS void AS $$
BEGIN
  -- This function serves as documentation for required scheduled jobs
  -- Implement these in your application scheduler or pg_cron:
  
  -- 1. Cache cleanup (hourly)
  -- SELECT cleanup_expired_cache();
  
  -- 2. Analytics view refresh (every 15 minutes)
  -- SELECT refresh_analytics_views();
  
  -- 3. Table statistics update (daily)
  -- ANALYZE usage_analytics, serp_analysis, competitor_analysis;
  
  -- 4. Vacuum old partitions (weekly)
  -- VACUUM ANALYZE usage_analytics_partitioned;
  
  RAISE NOTICE 'Maintenance jobs documented. Implement in application scheduler.';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PERFORMANCE MONITORING FUNCTIONS
-- ============================================================================

-- Query performance statistics
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
$$ LANGUAGE plpgsql;

-- Create alerts for slow queries
CREATE OR REPLACE FUNCTION check_slow_queries(
  threshold_ms INTEGER DEFAULT 1000
)
RETURNS TABLE (
  query_type TEXT,
  table_name TEXT,
  execution_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    qpl.query_type,
    qpl.table_name,
    qpl.execution_time_ms,
    qpl.created_at
  FROM query_performance_log qpl
  WHERE qpl.execution_time_ms > threshold_ms
    AND qpl.created_at >= NOW() - INTERVAL '1 hour'
  ORDER BY qpl.execution_time_ms DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMPLETION VERIFICATION
-- ============================================================================

-- Function to verify optimization implementation
CREATE OR REPLACE FUNCTION verify_database_optimizations()
RETURNS TABLE (
  optimization_type TEXT,
  status TEXT,
  details TEXT
) AS $$
BEGIN
  -- Check indexes
  RETURN QUERY
  SELECT 
    'Indexes' as optimization_type,
    CASE WHEN COUNT(*) >= 10 THEN 'IMPLEMENTED' ELSE 'PARTIAL' END as status,
    COUNT(*)::TEXT || ' performance indexes created' as details
  FROM pg_indexes 
  WHERE indexname LIKE 'idx_%_composite' 
     OR indexname LIKE 'idx_%_gin'
     OR indexname LIKE 'idx_%_active';
  
  -- Check materialized views
  RETURN QUERY
  SELECT 
    'Materialized Views' as optimization_type,
    CASE WHEN COUNT(*) >= 3 THEN 'IMPLEMENTED' ELSE 'PARTIAL' END as status,
    COUNT(*)::TEXT || ' materialized views created' as details
  FROM pg_matviews 
  WHERE matviewname IN ('user_analytics_summary', 'keyword_popularity_summary', 'project_content_summary');
  
  -- Check functions
  RETURN QUERY
  SELECT 
    'Stored Procedures' as optimization_type,
    CASE WHEN COUNT(*) >= 5 THEN 'IMPLEMENTED' ELSE 'PARTIAL' END as status,
    COUNT(*)::TEXT || ' optimization functions created' as details
  FROM pg_proc 
  WHERE proname IN ('get_user_analytics_optimized', 'get_serp_analysis_optimized', 'insert_serp_analysis_batch');
  
  -- Check partitions
  RETURN QUERY
  SELECT 
    'Table Partitioning' as optimization_type,
    CASE WHEN COUNT(*) > 0 THEN 'IMPLEMENTED' ELSE 'NOT_IMPLEMENTED' END as status,
    COUNT(*)::TEXT || ' partitioned tables created' as details
  FROM pg_tables 
  WHERE tablename LIKE 'usage_analytics_%' 
    AND tablename != 'usage_analytics_partitioned';
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_user_analytics_optimized TO authenticated;
GRANT EXECUTE ON FUNCTION get_serp_analysis_optimized TO authenticated;
GRANT EXECUTE ON FUNCTION insert_serp_analysis_batch TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_expired_cache TO service_role;
GRANT EXECUTE ON FUNCTION refresh_analytics_views TO service_role;
GRANT EXECUTE ON FUNCTION get_query_performance_stats TO authenticated;
GRANT EXECUTE ON FUNCTION check_slow_queries TO authenticated;
GRANT EXECUTE ON FUNCTION verify_database_optimizations TO authenticated;

-- Final verification
SELECT * FROM verify_database_optimizations();