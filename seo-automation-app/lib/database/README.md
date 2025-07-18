# Database Query Optimization System

This directory contains a comprehensive database optimization system designed to achieve sub-second response times for all database operations in the SEO Automation App.

## Overview

The optimization system implements multiple layers of performance enhancements:
- **Advanced Indexing**: Composite and partial indexes for high-frequency queries
- **Connection Pooling**: Optimized Supabase client configuration
- **Multi-tier Caching**: Memory + Redis + Database caching strategy
- **Query Optimization**: Stored procedures and materialized views
- **Performance Monitoring**: Real-time query tracking and analysis
- **Automated Maintenance**: Scheduled cleanup and optimization tasks

## Files Structure

```
lib/database/
├── README.md                    # This documentation
├── optimization.sql             # Database schema optimizations
├── optimized-client.ts          # Enhanced database client with caching
└── types.ts                     # TypeScript type definitions

scripts/
├── apply-database-optimizations.js  # Migration script for optimizations
├── get-performance-stats.js         # Performance monitoring tool
└── database-maintenance.js          # Automated maintenance tasks
```

## Quick Start

### 1. Apply Database Optimizations

```bash
# Review what will be applied (dry run)
npm run db:optimize:dry-run

# Apply optimizations to your database
npm run db:optimize

# Apply with detailed output
npm run db:optimize:verbose
```

### 2. Monitor Performance

```bash
# Get current performance statistics
npm run db:performance:stats

# Get stats for last 48 hours in JSON format
npm run db:performance:stats -- --hours=48 --json
```

### 3. Run Maintenance

```bash
# Run all maintenance tasks
npm run db:maintenance

# Run specific maintenance task
npm run db:maintenance -- --task=cache

# See what maintenance would do
npm run db:maintenance -- --dry-run
```

## Performance Optimizations

### Indexing Strategy

The system implements several types of optimized indexes:

#### Composite Indexes
- **SERP Cache Lookups**: `(keyword, country, language, expires_at)`
- **User Analytics**: `(created_at DESC, user_id, action_type)`
- **Active Content**: `(project_id, created_at DESC)`

#### JSONB Indexes
- **SERP Results**: GIN index on `results` column for fast JSONB queries
- **Competitor Analysis**: GIN index on `analysis_data` for metadata searches
- **Content Metadata**: GIN index for content analysis data

#### Partial Indexes
- **Active Content Only**: Indexes excluding archived/deleted content
- **Valid Cache Entries**: Indexes only non-expired cache entries
- **Successful Operations**: Indexes for successful user actions only

### Caching Architecture

#### Multi-Tier Cache System

1. **L1 - Memory Cache**
   - **TTL**: 5 minutes
   - **Size**: 1000 entries max
   - **Use Case**: Frequently accessed data within single request cycle

2. **L2 - Redis Cache**
   - **TTL**: 1-2 hours (configurable)
   - **Size**: Unlimited (with Redis memory limits)
   - **Use Case**: Cross-request data sharing, session data

3. **L3 - Database Cache**
   - **TTL**: 24 hours (SERP), 7 days (competitor data)
   - **Size**: Database storage limits
   - **Use Case**: Expensive external API results

#### Cache Keys Strategy

```typescript
// SERP Analysis
`serp:${keyword}:${country}:${language}`

// User Analytics
`user_analytics:${userId}:${daysBack}`

// Content Queries
`active_content:${projectId}:${limit}:${offset}`
`user_content:${userId}:${limit}`

// Project Data
`user_projects:${userId}`
`project_summary:${projectId}`
```

### Query Optimizations

#### Stored Procedures

**`get_user_analytics_optimized(user_id, days_back)`**
- Replaces multiple queries with single optimized procedure
- Uses materialized views when available
- Returns aggregated analytics with daily breakdown

**`get_serp_analysis_optimized(keyword, country, language)`**
- Optimized cache lookup with freshness indicators
- Single query replacing multiple conditional lookups
- Built-in cache expiration handling

**`insert_serp_analysis_batch(analyses)`**
- Batch insertion with conflict resolution
- Reduces database round trips for multiple analyses
- Automatic cache invalidation

#### Materialized Views

**`user_analytics_summary`**
- Pre-aggregated daily user statistics
- Refreshed every 15 minutes
- Reduces complex aggregation queries to simple lookups

**`keyword_popularity_summary`**
- Popular keywords with frequency data
- Used for cache preloading decisions
- Updated daily with trending keywords

**`project_content_summary`**
- Project statistics with content counts
- Faster project dashboard loading
- Real-time project health metrics

## Usage Examples

### Basic Database Operations

```typescript
import { optimizedDb } from '@/lib/database/optimized-client';

// Optimized SERP analysis lookup
const serpData = await optimizedDb.getSerpAnalysis('SEO tools', 'US', 'en');
console.log('From cache:', serpData.fromCache);

// Batch keyword processing
const keywords = ['SEO', 'marketing', 'content'];
const results = await optimizedDb.batchProcessKeywords(keywords, 'US');

// User analytics with caching
const analytics = await optimizedDb.getUserAnalytics(userId, 30);
```

### Cache Management

```typescript
// Invalidate user-specific cache
await optimizedDb.invalidateUserCache(userId);

// Invalidate project-specific cache
await optimizedDb.invalidateProjectCache(projectId);

// Preload popular keywords
await optimizedDb.preloadPopularKeywords();
```

### Performance Monitoring

```typescript
// Get performance statistics
const stats = await optimizedDb.getPerformanceStats(24);

// Check for slow queries
const slowQueries = await optimizedDb.getSlowQueries(1000);

// Health check
const health = await optimizedDb.healthCheck();
console.log('Database healthy:', health.database);
console.log('Cache healthy:', health.cache);
```

## Performance Thresholds

### Response Time Targets

| Operation Type | Target | Threshold |
|----------------|---------|-----------|
| Cache Lookups | < 50ms | < 100ms |
| User Content Queries | < 200ms | < 500ms |
| SERP Analysis | < 500ms | < 1000ms |
| Analytics Aggregation | < 300ms | < 800ms |
| Batch Processing | < 100ms per item | < 200ms per item |

### Success Rate Targets

- **Overall Success Rate**: > 99.5%
- **Cache Hit Rate**: > 80%
- **Query Success Rate**: > 99.9%
- **Connection Success Rate**: > 99.95%

## Monitoring and Alerts

### Real-time Monitoring

The system tracks every database operation and provides:

- **Query Performance**: Execution time, success rate, row counts
- **Cache Performance**: Hit rates, miss rates, eviction rates
- **Connection Health**: Pool utilization, connection errors
- **Error Tracking**: Failed queries, timeout errors, connection issues

### Performance Alerts

Automatic alerts for:
- Queries exceeding 1000ms execution time
- Cache hit rate below 70%
- Connection pool utilization above 80%
- Error rate above 1%

### Dashboard Integration

Performance metrics are available through:
- **CLI Tools**: Real-time stats and recommendations
- **Application Logs**: Structured logging with performance data
- **Database Views**: Query performance history and trends

## Maintenance Schedule

### Automated Tasks

| Task | Frequency | Purpose |
|------|-----------|---------|
| Cache Cleanup | Hourly | Remove expired cache entries |
| View Refresh | 15 minutes | Update materialized views |
| Statistics Update | Daily | Update table statistics for query planner |
| Partition Maintenance | Monthly | Create/maintain table partitions |
| Performance Log Cleanup | Daily | Remove old performance logs |

### Manual Tasks

| Task | Frequency | Purpose |
|------|-----------|---------|
| Index Analysis | Weekly | Review index usage and effectiveness |
| Query Review | Weekly | Identify new optimization opportunities |
| Cache Strategy Review | Monthly | Adjust cache TTLs and strategies |
| Performance Baseline Update | Monthly | Update performance targets |

## Troubleshooting

### Common Issues

#### Slow Query Performance

```bash
# Check for slow queries
npm run db:performance:stats

# Look for specific patterns
npm run db:performance:stats -- --hours=1

# Check optimization status
npm run db:optimize:dry-run
```

#### Cache Issues

```typescript
// Test cache connectivity
const health = await optimizedDb.healthCheck();
console.log('Cache status:', health.cache);

// Clear problematic cache
await optimizedDb.invalidateUserCache(userId);
```

#### Connection Pool Issues

```typescript
// Monitor connection health
const stats = await optimizedDb.getPerformanceStats();
const connectionErrors = stats.filter(s => s.query_type.includes('connection'));
```

### Performance Degradation

1. **Check System Resources**
   ```bash
   npm run db:performance:stats -- --hours=24
   ```

2. **Run Maintenance**
   ```bash
   npm run db:maintenance
   ```

3. **Verify Optimizations**
   ```bash
   npm run db:optimize:dry-run
   ```

4. **Review Cache Performance**
   ```typescript
   const health = await optimizedDb.healthCheck();
   ```

## Development Guidelines

### Adding New Queries

1. **Use Optimized Client**
   ```typescript
   import { optimizedDb } from '@/lib/database/optimized-client';
   ```

2. **Add Performance Tracking**
   ```typescript
   @trackDatabaseQuery('table_name', 'operation_type')
   async myQuery() { ... }
   ```

3. **Implement Caching**
   ```typescript
   const cacheKey = `operation:${params}`;
   const cached = await this.cache.get(cacheKey);
   if (cached) return cached;
   
   const result = await query();
   await this.cache.set(cacheKey, result, ttl);
   ```

4. **Add Error Handling**
   ```typescript
   try {
     const result = await optimizedQuery();
     return result;
   } catch (error) {
     // Fallback to basic query
     return await basicQuery();
   }
   ```

### Testing Performance

1. **Baseline Testing**
   ```bash
   npm run performance:baseline
   ```

2. **Load Testing**
   ```bash
   npm run performance:load
   ```

3. **Database Monitoring**
   ```bash
   npm run db:performance:stats
   ```

## Configuration

### Environment Variables

```env
# Redis Configuration (optional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_password
REDIS_URL=redis://localhost:6379

# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Performance Monitoring
ENABLE_QUERY_TRACKING=true
SLOW_QUERY_THRESHOLD=1000
CACHE_PRELOAD_ENABLED=true
```

### Customization

#### Cache TTL Configuration

```typescript
// In optimized-client.ts
const CACHE_TTLS = {
  serpAnalysis: 7200,      // 2 hours
  userAnalytics: 900,      // 15 minutes
  projectSummary: 600,     // 10 minutes
  userContent: 300         // 5 minutes
};
```

#### Performance Thresholds

```typescript
// In optimized-client.ts
const PERFORMANCE_THRESHOLDS = {
  slowQuery: 1000,         // 1 second
  verySlowQuery: 5000,     // 5 seconds
  errorRateAlert: 0.01,    // 1%
  cacheHitTarget: 0.8      // 80%
};
```

## Best Practices

### Query Design

1. **Use Composite Indexes**: Design queries to use multiple column indexes
2. **Limit Result Sets**: Always use appropriate LIMIT clauses
3. **Avoid N+1 Queries**: Use JOINs or batch operations
4. **Use Prepared Statements**: Leverage Supabase's query optimization

### Caching Strategy

1. **Cache at Multiple Levels**: Use memory, Redis, and database caching
2. **Appropriate TTLs**: Set cache expiration based on data volatility
3. **Cache Invalidation**: Implement proper cache invalidation strategies
4. **Preload Hot Data**: Proactively cache frequently accessed data

### Monitoring

1. **Track All Operations**: Use performance decorators consistently
2. **Set Appropriate Alerts**: Monitor for performance degradation
3. **Regular Reviews**: Analyze performance trends weekly
4. **Capacity Planning**: Monitor resource usage trends

## Security Considerations

- **Service Role Key**: Required for optimization functions, keep secure
- **Connection Limits**: Monitor connection pool usage
- **Query Logging**: Ensure no sensitive data in performance logs
- **Cache Security**: Use secure Redis configuration in production

## Support and Maintenance

For issues or questions:
1. Check performance stats: `npm run db:performance:stats`
2. Run maintenance: `npm run db:maintenance`
3. Review optimization status: `npm run db:optimize:dry-run`
4. Check application logs for database-related errors

Regular maintenance ensures optimal performance and prevents degradation over time.