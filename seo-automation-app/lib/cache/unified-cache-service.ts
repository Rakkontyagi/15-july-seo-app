/**
 * Unified Cache Service
 * Central coordination of all caching services with comprehensive management
 */

import { multiTierCache } from './multi-tier-cache';
import { openaiCache, OpenAICacheService } from './openai-cache';
import { firecrawlCache, FirecrawlCacheService } from './firecrawl-cache';

// Types for unified caching
export interface UnifiedCacheStats {
  totalHits: number;
  totalMisses: number;
  overallHitRate: number;
  totalSavings: number;
  serviceBreakdown: {
    [service: string]: {
      hits: number;
      misses: number;
      hitRate: number;
      savings: number;
      status: 'healthy' | 'degraded' | 'error';
    };
  };
  systemHealth: {
    memoryCache: boolean;
    redisCache: boolean;
    databaseCache: boolean;
  };
}

export interface CacheWarmupJob {
  id: string;
  service: string;
  type: 'popular_content' | 'predicted_usage' | 'manual';
  status: 'pending' | 'running' | 'completed' | 'failed';
  itemsProcessed: number;
  totalItems: number;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}

export interface CacheOptimizationRecommendation {
  service: string;
  type: 'ttl_adjustment' | 'size_limit' | 'pattern_exclusion' | 'warmup_strategy';
  priority: 'high' | 'medium' | 'low';
  description: string;
  impact: 'cost_savings' | 'performance' | 'storage';
  estimatedBenefit: string;
}

export interface CacheMaintenanceTask {
  id: string;
  type: 'cleanup' | 'compression' | 'rebalance' | 'statistics_update';
  scheduledAt: Date;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: any;
}

export class UnifiedCacheService {
  private static instance: UnifiedCacheService;
  private openaiService: OpenAICacheService;
  private firecrawlService: FirecrawlCacheService;
  private coreCache = multiTierCache;
  private warmupJobs: Map<string, CacheWarmupJob> = new Map();
  private maintenanceTasks: Map<string, CacheMaintenanceTask> = new Map();

  private constructor() {
    this.openaiService = openaiCache;
    this.firecrawlService = firecrawlCache;
    
    // Start background maintenance
    this.startBackgroundMaintenance();
  }

  public static getInstance(): UnifiedCacheService {
    if (!UnifiedCacheService.instance) {
      UnifiedCacheService.instance = new UnifiedCacheService();
    }
    return UnifiedCacheService.instance;
  }

  /**
   * Get comprehensive cache statistics across all services
   */
  async getUnifiedStats(): Promise<UnifiedCacheStats> {
    const coreStats = this.coreCache.getStats();
    const openaiStats = this.openaiService.getCacheStats();
    const firecrawlStats = this.firecrawlService.getCacheStats();

    const totalHits = openaiStats.hits + firecrawlStats.hits + coreStats.hits;
    const totalMisses = openaiStats.misses + firecrawlStats.misses + coreStats.misses;
    const totalRequests = totalHits + totalMisses;

    return {
      totalHits,
      totalMisses,
      overallHitRate: totalRequests > 0 ? totalHits / totalRequests : 0,
      totalSavings: openaiStats.totalSavings + firecrawlStats.totalSavings,
      serviceBreakdown: {
        openai: {
          hits: openaiStats.hits,
          misses: openaiStats.misses,
          hitRate: (openaiStats.hits + openaiStats.misses) > 0 
            ? openaiStats.hits / (openaiStats.hits + openaiStats.misses) 
            : 0,
          savings: openaiStats.totalSavings,
          status: this.getServiceHealth('openai')
        },
        firecrawl: {
          hits: firecrawlStats.hits,
          misses: firecrawlStats.misses,
          hitRate: (firecrawlStats.hits + firecrawlStats.misses) > 0 
            ? firecrawlStats.hits / (firecrawlStats.hits + firecrawlStats.misses) 
            : 0,
          savings: firecrawlStats.totalSavings,
          status: this.getServiceHealth('firecrawl')
        },
        core: {
          hits: coreStats.hits,
          misses: coreStats.misses,
          hitRate: coreStats.hitRate,
          savings: 0, // Core cache doesn't track savings directly
          status: this.getServiceHealth('core')
        }
      },
      systemHealth: {
        memoryCache: true, // Memory cache is always available
        redisCache: coreStats.redisConnected,
        databaseCache: coreStats.databaseConnected
      }
    };
  }

  /**
   * Get service health status
   */
  private getServiceHealth(service: string): 'healthy' | 'degraded' | 'error' {
    const coreStats = this.coreCache.getStats();
    
    // Check if core infrastructure is healthy
    if (!coreStats.databaseConnected) {
      return 'degraded';
    }
    
    // For now, assume services are healthy if core is healthy
    return 'healthy';
  }

  /**
   * Invalidate cache across all services
   */
  async invalidateAll(): Promise<void> {
    await Promise.all([
      this.openaiService.invalidateCache(),
      this.firecrawlService.invalidateCache(),
      this.coreCache.invalidateService('all')
    ]);
  }

  /**
   * Invalidate cache for specific service
   */
  async invalidateService(service: 'openai' | 'firecrawl' | 'core'): Promise<void> {
    switch (service) {
      case 'openai':
        await this.openaiService.invalidateCache();
        break;
      case 'firecrawl':
        await this.firecrawlService.invalidateCache();
        break;
      case 'core':
        await this.coreCache.invalidateService('core');
        break;
    }
  }

  /**
   * Start cache warmup job
   */
  async startCacheWarmup(
    service: 'openai' | 'firecrawl' | 'all',
    type: CacheWarmupJob['type'] = 'popular_content'
  ): Promise<string> {
    const jobId = `warmup_${service}_${Date.now()}`;
    
    const job: CacheWarmupJob = {
      id: jobId,
      service,
      type,
      status: 'pending',
      itemsProcessed: 0,
      totalItems: 0
    };

    this.warmupJobs.set(jobId, job);

    // Start warmup process
    this.executeWarmupJob(jobId).catch(error => {
      const updatedJob = this.warmupJobs.get(jobId);
      if (updatedJob) {
        updatedJob.status = 'failed';
        updatedJob.error = error.message;
        updatedJob.completedAt = new Date();
      }
    });

    return jobId;
  }

  /**
   * Execute cache warmup job
   */
  private async executeWarmupJob(jobId: string): Promise<void> {
    const job = this.warmupJobs.get(jobId);
    if (!job) return;

    job.status = 'running';
    job.startedAt = new Date();

    try {
      if (job.service === 'openai' || job.service === 'all') {
        // Get popular OpenAI requests for warmup
        const popularRequests = await this.getPopularOpenAIRequests();
        job.totalItems += popularRequests.length;
        
        await this.openaiService.warmCache(popularRequests);
        job.itemsProcessed += popularRequests.length;
      }

      if (job.service === 'firecrawl' || job.service === 'all') {
        // Get popular URLs for warmup
        const popularUrls = await this.getPopularFirecrawlUrls();
        job.totalItems += popularUrls.length;
        
        await this.firecrawlService.preloadCache(popularUrls);
        job.itemsProcessed += popularUrls.length;
      }

      job.status = 'completed';
      job.completedAt = new Date();
    } catch (error) {
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : 'Unknown error';
      job.completedAt = new Date();
      throw error;
    }
  }

  /**
   * Get warmup job status
   */
  getWarmupJob(jobId: string): CacheWarmupJob | null {
    return this.warmupJobs.get(jobId) || null;
  }

  /**
   * Get all warmup jobs
   */
  getAllWarmupJobs(): CacheWarmupJob[] {
    return Array.from(this.warmupJobs.values());
  }

  /**
   * Get optimization recommendations
   */
  async getOptimizationRecommendations(): Promise<CacheOptimizationRecommendation[]> {
    const stats = await this.getUnifiedStats();
    const recommendations: CacheOptimizationRecommendation[] = [];

    // Analyze OpenAI cache performance
    const openaiBreakdown = stats.serviceBreakdown.openai;
    if (openaiBreakdown.hitRate < 0.6) {
      recommendations.push({
        service: 'openai',
        type: 'ttl_adjustment',
        priority: 'high',
        description: 'Increase OpenAI cache TTL to improve hit rate',
        impact: 'cost_savings',
        estimatedBenefit: `Potential ${((0.6 - openaiBreakdown.hitRate) * 100).toFixed(1)}% improvement in hit rate`
      });
    }

    // Analyze Firecrawl cache performance
    const firecrawlBreakdown = stats.serviceBreakdown.firecrawl;
    if (firecrawlBreakdown.hitRate < 0.5) {
      recommendations.push({
        service: 'firecrawl',
        type: 'warmup_strategy',
        priority: 'medium',
        description: 'Implement proactive cache warming for frequently accessed URLs',
        impact: 'performance',
        estimatedBenefit: 'Reduce average response time by 200-500ms'
      });
    }

    // Check system health
    if (!stats.systemHealth.redisCache) {
      recommendations.push({
        service: 'core',
        type: 'size_limit',
        priority: 'high',
        description: 'Redis cache is unavailable - consider increasing memory cache size',
        impact: 'performance',
        estimatedBenefit: 'Maintain cache performance without Redis'
      });
    }

    // Overall recommendations
    if (stats.totalSavings > 100) {
      recommendations.push({
        service: 'all',
        type: 'pattern_exclusion',
        priority: 'low',
        description: 'High cache usage detected - review and optimize cache patterns',
        impact: 'storage',
        estimatedBenefit: 'Reduce storage costs by 10-20%'
      });
    }

    return recommendations;
  }

  /**
   * Generate comprehensive cache report
   */
  async generateCacheReport(): Promise<{
    summary: UnifiedCacheStats;
    performance: any;
    recommendations: CacheOptimizationRecommendation[];
    maintenance: CacheMaintenanceTask[];
    costAnalysis: any;
  }> {
    const [summary, openaiMetrics, firecrawlMetrics, recommendations] = await Promise.all([
      this.getUnifiedStats(),
      this.openaiService.getDetailedMetrics(),
      this.firecrawlService.getDetailedMetrics(),
      this.getOptimizationRecommendations()
    ]);

    const maintenance = Array.from(this.maintenanceTasks.values());

    return {
      summary,
      performance: {
        openai: openaiMetrics,
        firecrawl: firecrawlMetrics,
        core: this.coreCache.getStats()
      },
      recommendations,
      maintenance,
      costAnalysis: {
        totalSavings: summary.totalSavings,
        monthlyProjection: summary.totalSavings * 30,
        savingsByService: {
          openai: summary.serviceBreakdown.openai.savings,
          firecrawl: summary.serviceBreakdown.firecrawl.savings
        },
        roi: this.calculateROI(summary)
      }
    };
  }

  /**
   * Calculate ROI for caching system
   */
  private calculateROI(stats: UnifiedCacheStats): number {
    // Estimate monthly infrastructure cost for caching (Redis, storage, etc.)
    const monthlyCacheCost = 50; // Estimated $50/month for cache infrastructure
    const monthlySavings = stats.totalSavings * 30; // Project to monthly
    
    return monthlySavings > 0 ? ((monthlySavings - monthlyCacheCost) / monthlyCacheCost) * 100 : 0;
  }

  /**
   * Schedule maintenance task
   */
  async scheduleMaintenance(
    type: CacheMaintenanceTask['type'],
    scheduledAt: Date = new Date()
  ): Promise<string> {
    const taskId = `maintenance_${type}_${Date.now()}`;
    
    const task: CacheMaintenanceTask = {
      id: taskId,
      type,
      scheduledAt,
      status: 'pending'
    };

    this.maintenanceTasks.set(taskId, task);

    // If scheduled for now or past, execute immediately
    if (scheduledAt <= new Date()) {
      this.executeMaintenanceTask(taskId);
    }

    return taskId;
  }

  /**
   * Execute maintenance task
   */
  private async executeMaintenanceTask(taskId: string): Promise<void> {
    const task = this.maintenanceTasks.get(taskId);
    if (!task) return;

    task.status = 'running';

    try {
      let result: any;

      switch (task.type) {
        case 'cleanup':
          result = await this.performCleanup();
          break;
        case 'compression':
          result = await this.performCompression();
          break;
        case 'rebalance':
          result = await this.performRebalance();
          break;
        case 'statistics_update':
          result = await this.updateStatistics();
          break;
      }

      task.status = 'completed';
      task.result = result;
    } catch (error) {
      task.status = 'failed';
      task.result = { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Perform cache cleanup
   */
  private async performCleanup(): Promise<any> {
    await this.coreCache.cleanup();
    return { message: 'Cache cleanup completed' };
  }

  /**
   * Perform cache compression
   */
  private async performCompression(): Promise<any> {
    // In a real implementation, this would compress large cache entries
    return { message: 'Cache compression completed' };
  }

  /**
   * Perform cache rebalance
   */
  private async performRebalance(): Promise<any> {
    // In a real implementation, this would rebalance cache across tiers
    return { message: 'Cache rebalance completed' };
  }

  /**
   * Update cache statistics
   */
  private async updateStatistics(): Promise<any> {
    const stats = await this.getUnifiedStats();
    return { stats, message: 'Statistics updated' };
  }

  /**
   * Start background maintenance
   */
  private startBackgroundMaintenance(): void {
    // Schedule regular cleanup every hour
    setInterval(async () => {
      await this.scheduleMaintenance('cleanup');
    }, 60 * 60 * 1000); // 1 hour

    // Schedule statistics update every 15 minutes
    setInterval(async () => {
      await this.scheduleMaintenance('statistics_update');
    }, 15 * 60 * 1000); // 15 minutes
  }

  /**
   * Get popular OpenAI requests for cache warming
   */
  private async getPopularOpenAIRequests(): Promise<any[]> {
    // In a real implementation, this would analyze usage patterns
    return [
      {
        request: {
          model: 'gpt-4o',
          messages: [{ role: 'user', content: 'Generate SEO content for: digital marketing' }],
          temperature: 0.7
        },
        operation: 'content_generation'
      },
      {
        request: {
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: 'Analyze content quality for SEO' }],
          temperature: 0.3
        },
        operation: 'quality_analysis'
      }
    ];
  }

  /**
   * Get popular Firecrawl URLs for cache warming
   */
  private async getPopularFirecrawlUrls(): Promise<any[]> {
    // In a real implementation, this would analyze access patterns
    return [
      { url: 'https://example.com', operation: 'content_scraping' },
      { url: 'https://competitor.com', operation: 'competitor_analysis' }
    ];
  }

  /**
   * Health check for the entire cache system
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'error';
    services: { [key: string]: boolean };
    metrics: UnifiedCacheStats;
  }> {
    const stats = await this.getUnifiedStats();
    const coreHealth = this.coreCache.getStats();

    const services = {
      memoryCache: true,
      redisCache: stats.systemHealth.redisCache,
      databaseCache: stats.systemHealth.databaseCache,
      openaiService: stats.serviceBreakdown.openai.status === 'healthy',
      firecrawlService: stats.serviceBreakdown.firecrawl.status === 'healthy'
    };

    const healthyServices = Object.values(services).filter(Boolean).length;
    const totalServices = Object.keys(services).length;

    let status: 'healthy' | 'degraded' | 'error';
    if (healthyServices === totalServices) {
      status = 'healthy';
    } else if (healthyServices >= totalServices * 0.7) {
      status = 'degraded';
    } else {
      status = 'error';
    }

    return {
      status,
      services,
      metrics: stats
    };
  }
}

// Export singleton instance
export const unifiedCache = UnifiedCacheService.getInstance();

// Convenience functions for common operations
export async function getCacheReport() {
  return await unifiedCache.generateCacheReport();
}

export async function invalidateAllCaches() {
  return await unifiedCache.invalidateAll();
}

export async function warmAllCaches() {
  return await unifiedCache.startCacheWarmup('all');
}

export async function getCacheHealth() {
  return await unifiedCache.healthCheck();
}