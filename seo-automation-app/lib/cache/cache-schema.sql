-- Cache System Database Schema
-- Enhanced caching tables for multi-tier cache system

-- ============================================================================
-- API CACHE TABLE
-- ============================================================================

-- Main cache storage table
CREATE TABLE IF NOT EXISTS api_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cache_key VARCHAR(500) NOT NULL UNIQUE,
    service VARCHAR(50) NOT NULL,
    operation VARCHAR(100),
    data JSONB NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    access_count INTEGER DEFAULT 0,
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    size_bytes INTEGER DEFAULT 0,
    version VARCHAR(50),
    etag VARCHAR(100),
    compression_type VARCHAR(20) DEFAULT 'none',
    CONSTRAINT valid_expires_at CHECK (expires_at > created_at)
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_api_cache_service ON api_cache(service);
CREATE INDEX IF NOT EXISTS idx_api_cache_operation ON api_cache(service, operation);
CREATE INDEX IF NOT EXISTS idx_api_cache_expires_at ON api_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_api_cache_last_accessed ON api_cache(last_accessed);
CREATE INDEX IF NOT EXISTS idx_api_cache_service_expires ON api_cache(service, expires_at) WHERE expires_at > NOW();

-- Composite index for cache lookups
CREATE INDEX IF NOT EXISTS idx_api_cache_lookup ON api_cache(cache_key, expires_at) WHERE expires_at > NOW();

-- Index for cleanup operations
CREATE INDEX IF NOT EXISTS idx_api_cache_cleanup ON api_cache(expires_at, created_at) WHERE expires_at <= NOW();

-- ============================================================================
-- CACHE ANALYTICS TABLE
-- ============================================================================

-- Cache performance analytics
CREATE TABLE IF NOT EXISTS cache_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service VARCHAR(50) NOT NULL,
    operation VARCHAR(100),
    cache_key VARCHAR(500),
    hit_count INTEGER DEFAULT 0,
    miss_count INTEGER DEFAULT 0,
    total_requests INTEGER GENERATED ALWAYS AS (hit_count + miss_count) STORED,
    hit_rate NUMERIC GENERATED ALWAYS AS (
        CASE 
            WHEN (hit_count + miss_count) > 0 
            THEN hit_count::numeric / (hit_count + miss_count)::numeric 
            ELSE 0 
        END
    ) STORED,
    last_hit TIMESTAMP WITH TIME ZONE,
    last_miss TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT positive_counts CHECK (hit_count >= 0 AND miss_count >= 0)
);

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_cache_analytics_service ON cache_analytics(service);
CREATE INDEX IF NOT EXISTS idx_cache_analytics_operation ON cache_analytics(service, operation);
CREATE INDEX IF NOT EXISTS idx_cache_analytics_performance ON cache_analytics(hit_rate DESC, total_requests DESC);
CREATE INDEX IF NOT EXISTS idx_cache_analytics_updated ON cache_analytics(updated_at DESC);

-- Unique constraint for service + cache_key combination
CREATE UNIQUE INDEX IF NOT EXISTS idx_cache_analytics_unique ON cache_analytics(service, cache_key);

-- ============================================================================
-- CACHE COST SAVINGS TABLE
-- ============================================================================

-- Track cost savings from cache usage
CREATE TABLE IF NOT EXISTS cache_cost_savings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service VARCHAR(50) NOT NULL,
    operation VARCHAR(100),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    cache_hits INTEGER DEFAULT 0,
    estimated_cost_per_call NUMERIC(10,6) DEFAULT 0,
    total_savings NUMERIC(10,2) GENERATED ALWAYS AS (cache_hits * estimated_cost_per_call) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cost savings indexes
CREATE INDEX IF NOT EXISTS idx_cache_cost_savings_service ON cache_cost_savings(service);
CREATE INDEX IF NOT EXISTS idx_cache_cost_savings_date ON cache_cost_savings(date DESC);
CREATE INDEX IF NOT EXISTS idx_cache_cost_savings_total ON cache_cost_savings(total_savings DESC);

-- Unique constraint for service + operation + date
CREATE UNIQUE INDEX IF NOT EXISTS idx_cache_cost_savings_unique ON cache_cost_savings(service, operation, date);

-- ============================================================================
-- CACHE WARMUP JOBS TABLE
-- ============================================================================

-- Track cache warming jobs
CREATE TABLE IF NOT EXISTS cache_warmup_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service VARCHAR(50) NOT NULL,
    job_type VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    items_processed INTEGER DEFAULT 0,
    items_cached INTEGER DEFAULT 0,
    errors JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT valid_status CHECK (status IN ('pending', 'running', 'completed', 'failed'))
);

-- Warmup jobs indexes
CREATE INDEX IF NOT EXISTS idx_cache_warmup_jobs_service ON cache_warmup_jobs(service);
CREATE INDEX IF NOT EXISTS idx_cache_warmup_jobs_status ON cache_warmup_jobs(status);
CREATE INDEX IF NOT EXISTS idx_cache_warmup_jobs_created ON cache_warmup_jobs(created_at DESC);

-- ============================================================================
-- STORED PROCEDURES FOR CACHE OPERATIONS
-- ============================================================================

-- Function to get cache statistics
CREATE OR REPLACE FUNCTION get_cache_statistics(
    service_filter VARCHAR(50) DEFAULT NULL,
    hours_back INTEGER DEFAULT 24
)
RETURNS TABLE (
    service VARCHAR(50),
    operation VARCHAR(100),
    total_requests BIGINT,
    cache_hits BIGINT,
    cache_misses BIGINT,
    hit_rate NUMERIC,
    avg_size_bytes NUMERIC,
    total_savings NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ca.service,
        ca.operation,
        SUM(ca.total_requests)::BIGINT as total_requests,
        SUM(ca.hit_count)::BIGINT as cache_hits,
        SUM(ca.miss_count)::BIGINT as cache_misses,
        CASE 
            WHEN SUM(ca.total_requests) > 0 
            THEN SUM(ca.hit_count)::NUMERIC / SUM(ca.total_requests)::NUMERIC 
            ELSE 0 
        END as hit_rate,
        AVG(ac.size_bytes) as avg_size_bytes,
        COALESCE(SUM(ccs.total_savings), 0) as total_savings
    FROM cache_analytics ca
    LEFT JOIN api_cache ac ON ca.service = ac.service 
        AND ca.cache_key = ac.cache_key
        AND ac.created_at >= NOW() - (hours_back || ' hours')::INTERVAL
    LEFT JOIN cache_cost_savings ccs ON ca.service = ccs.service 
        AND ca.operation = ccs.operation
        AND ccs.date >= CURRENT_DATE - (hours_back / 24)::INTEGER
    WHERE (service_filter IS NULL OR ca.service = service_filter)
        AND ca.updated_at >= NOW() - (hours_back || ' hours')::INTERVAL
    GROUP BY ca.service, ca.operation
    ORDER BY hit_rate DESC, total_requests DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup expired cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_cache_entries()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete expired cache entries
    DELETE FROM api_cache 
    WHERE expires_at <= NOW() - INTERVAL '1 hour';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Update statistics
    ANALYZE api_cache;
    
    -- Log cleanup
    INSERT INTO cache_warmup_jobs (service, job_type, status, started_at, completed_at, items_processed)
    VALUES ('system', 'cleanup', 'completed', NOW(), NOW(), deleted_count);
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to update cache analytics
CREATE OR REPLACE FUNCTION update_cache_analytics(
    p_service VARCHAR(50),
    p_operation VARCHAR(100),
    p_cache_key VARCHAR(500),
    p_hit BOOLEAN
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO cache_analytics (service, operation, cache_key, hit_count, miss_count, last_hit, last_miss)
    VALUES (
        p_service, 
        p_operation, 
        p_cache_key,
        CASE WHEN p_hit THEN 1 ELSE 0 END,
        CASE WHEN p_hit THEN 0 ELSE 1 END,
        CASE WHEN p_hit THEN NOW() ELSE NULL END,
        CASE WHEN p_hit THEN NULL ELSE NOW() END
    )
    ON CONFLICT (service, cache_key) DO UPDATE SET
        hit_count = cache_analytics.hit_count + CASE WHEN p_hit THEN 1 ELSE 0 END,
        miss_count = cache_analytics.miss_count + CASE WHEN p_hit THEN 0 ELSE 1 END,
        last_hit = CASE WHEN p_hit THEN NOW() ELSE cache_analytics.last_hit END,
        last_miss = CASE WHEN p_hit THEN cache_analytics.last_miss ELSE NOW() END,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to get cache warmup candidates
CREATE OR REPLACE FUNCTION get_cache_warmup_candidates(
    p_service VARCHAR(50),
    p_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
    cache_key VARCHAR(500),
    access_count INTEGER,
    last_accessed TIMESTAMP WITH TIME ZONE,
    priority_score NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ac.cache_key,
        ac.access_count,
        ac.last_accessed,
        -- Calculate priority based on access frequency and recency
        (ac.access_count * 0.7 + 
         EXTRACT(EPOCH FROM (NOW() - ac.last_accessed)) / 3600 * 0.3) as priority_score
    FROM api_cache ac
    WHERE ac.service = p_service
        AND ac.expires_at <= NOW() + INTERVAL '1 day' -- About to expire
        AND ac.access_count > 1 -- Has been accessed multiple times
    ORDER BY priority_score DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to record cost savings
CREATE OR REPLACE FUNCTION record_cache_cost_savings(
    p_service VARCHAR(50),
    p_operation VARCHAR(100),
    p_cost_per_call NUMERIC(10,6),
    p_cache_hits INTEGER DEFAULT 1
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO cache_cost_savings (service, operation, cache_hits, estimated_cost_per_call)
    VALUES (p_service, p_operation, p_cache_hits, p_cost_per_call)
    ON CONFLICT (service, operation, date) DO UPDATE SET
        cache_hits = cache_cost_savings.cache_hits + p_cache_hits,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- CACHE PARTITIONING (For high-volume usage)
-- ============================================================================

-- Create partitioned table for high-volume cache analytics
CREATE TABLE IF NOT EXISTS cache_analytics_partitioned (
    LIKE cache_analytics INCLUDING ALL
) PARTITION BY RANGE (created_at);

-- Create monthly partitions for cache analytics
DO $$
DECLARE
    start_date DATE;
    end_date DATE;
    partition_name TEXT;
BEGIN
    FOR i IN 0..6 LOOP
        start_date := DATE_TRUNC('month', CURRENT_DATE) + (i || ' months')::INTERVAL;
        end_date := start_date + INTERVAL '1 month';
        partition_name := 'cache_analytics_' || TO_CHAR(start_date, 'YYYY_MM');
        
        EXECUTE format('
            CREATE TABLE IF NOT EXISTS %I PARTITION OF cache_analytics_partitioned
            FOR VALUES FROM (%L) TO (%L)',
            partition_name, start_date, end_date
        );
        
        -- Create indexes on each partition
        EXECUTE format('
            CREATE INDEX IF NOT EXISTS %I ON %I (service, created_at DESC)',
            'idx_' || partition_name || '_service', partition_name
        );
    END LOOP;
END $$;

-- ============================================================================
-- CACHE TRIGGERS AND AUTOMATION
-- ============================================================================

-- Trigger to update cache analytics access counts
CREATE OR REPLACE FUNCTION update_cache_access()
RETURNS TRIGGER AS $$
BEGIN
    -- Update analytics when cache is accessed
    PERFORM update_cache_analytics(
        NEW.service,
        COALESCE(NEW.operation, 'unknown'),
        NEW.cache_key,
        true -- It's a hit if we're updating access
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for cache access tracking
DROP TRIGGER IF EXISTS trigger_cache_access ON api_cache;
CREATE TRIGGER trigger_cache_access
    AFTER UPDATE OF access_count, last_accessed ON api_cache
    FOR EACH ROW
    EXECUTE FUNCTION update_cache_access();

-- Function to automatically schedule cache cleanup
CREATE OR REPLACE FUNCTION schedule_cache_maintenance()
RETURNS VOID AS $$
BEGIN
    -- This function would be called by a scheduler (cron, pg_cron, or application)
    PERFORM cleanup_expired_cache_entries();
    
    -- Vacuum and analyze cache tables weekly
    IF EXTRACT(DOW FROM NOW()) = 1 AND EXTRACT(HOUR FROM NOW()) = 2 THEN
        VACUUM ANALYZE api_cache;
        VACUUM ANALYZE cache_analytics;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- CACHE PERMISSIONS
-- ============================================================================

-- Grant permissions for cache operations
GRANT SELECT, INSERT, UPDATE, DELETE ON api_cache TO authenticated;
GRANT SELECT, INSERT, UPDATE ON cache_analytics TO authenticated;
GRANT SELECT ON cache_cost_savings TO authenticated;
GRANT SELECT ON cache_warmup_jobs TO authenticated;

-- Grant execute permissions on cache functions
GRANT EXECUTE ON FUNCTION get_cache_statistics TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_cache_entries TO service_role;
GRANT EXECUTE ON FUNCTION update_cache_analytics TO authenticated;
GRANT EXECUTE ON FUNCTION get_cache_warmup_candidates TO authenticated;
GRANT EXECUTE ON FUNCTION record_cache_cost_savings TO authenticated;
GRANT EXECUTE ON FUNCTION schedule_cache_maintenance TO service_role;

-- ============================================================================
-- CACHE VIEWS FOR REPORTING
-- ============================================================================

-- View for cache performance summary
CREATE OR REPLACE VIEW cache_performance_summary AS
SELECT 
    service,
    COUNT(*) as total_entries,
    SUM(access_count) as total_accesses,
    AVG(access_count) as avg_accesses_per_entry,
    SUM(size_bytes) as total_size_bytes,
    AVG(size_bytes) as avg_size_bytes,
    COUNT(*) FILTER (WHERE expires_at > NOW()) as active_entries,
    COUNT(*) FILTER (WHERE expires_at <= NOW()) as expired_entries
FROM api_cache
GROUP BY service;

-- View for daily cache statistics
CREATE OR REPLACE VIEW daily_cache_stats AS
SELECT 
    DATE(created_at) as date,
    service,
    COUNT(*) as entries_created,
    SUM(size_bytes) as total_bytes_cached,
    AVG(access_count) as avg_access_count
FROM api_cache
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(created_at), service
ORDER BY date DESC, service;

-- View for cache hit rates by service
CREATE OR REPLACE VIEW cache_hit_rates AS
SELECT 
    ca.service,
    ca.operation,
    ca.hit_count,
    ca.miss_count,
    ca.total_requests,
    ca.hit_rate,
    COALESCE(ccs.total_savings, 0) as estimated_savings
FROM cache_analytics ca
LEFT JOIN cache_cost_savings ccs ON ca.service = ccs.service 
    AND ca.operation = ccs.operation
    AND ccs.date = CURRENT_DATE
WHERE ca.total_requests > 0
ORDER BY ca.hit_rate DESC, ca.total_requests DESC;

-- Grant access to views
GRANT SELECT ON cache_performance_summary TO authenticated;
GRANT SELECT ON daily_cache_stats TO authenticated;
GRANT SELECT ON cache_hit_rates TO authenticated;

-- ============================================================================
-- INITIAL DATA AND CONFIGURATION
-- ============================================================================

-- Insert default cost configurations
INSERT INTO cache_cost_savings (service, operation, date, estimated_cost_per_call, cache_hits) 
VALUES 
    ('openai', 'content_generation', CURRENT_DATE, 0.030, 0),
    ('openai', 'quality_analysis', CURRENT_DATE, 0.015, 0),
    ('serper', 'keyword_analysis', CURRENT_DATE, 0.001, 0),
    ('serper', 'competitor_analysis', CURRENT_DATE, 0.001, 0),
    ('firecrawl', 'page_scraping', CURRENT_DATE, 0.010, 0),
    ('firecrawl', 'sitemap_extraction', CURRENT_DATE, 0.005, 0)
ON CONFLICT (service, operation, date) DO NOTHING;

-- ============================================================================
-- CACHE MONITORING QUERIES
-- ============================================================================

-- Query to monitor cache performance
/*
-- Get overall cache statistics
SELECT * FROM get_cache_statistics();

-- Get cache statistics for specific service
SELECT * FROM get_cache_statistics('openai');

-- Check cache hit rates
SELECT * FROM cache_hit_rates;

-- Monitor cache size and growth
SELECT service, 
       COUNT(*) as entries,
       pg_size_pretty(SUM(size_bytes)) as total_size,
       AVG(access_count) as avg_accesses
FROM api_cache 
GROUP BY service;

-- Find most accessed cache entries
SELECT service, cache_key, access_count, last_accessed, expires_at
FROM api_cache 
WHERE expires_at > NOW()
ORDER BY access_count DESC 
LIMIT 20;

-- Check for expired entries that need cleanup
SELECT service, COUNT(*) as expired_entries
FROM api_cache 
WHERE expires_at <= NOW()
GROUP BY service;
*/