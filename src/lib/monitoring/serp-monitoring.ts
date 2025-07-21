import { logger } from '@/lib/logging/logger';

export interface SERPMetrics {
  keyword: string;
  location: string;
  provider: string;
  responseTime: number;
  resultCount: number;
  cached: boolean;
  success: boolean;
  error?: string;
  timestamp: Date;
}

export interface ProviderMetrics {
  provider: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  errorRate: number;
  lastError?: string;
  lastErrorTime?: Date;
}

export class SERPMonitoringService {
  private metrics: SERPMetrics[] = [];
  private providerMetrics: Map<string, ProviderMetrics> = new Map();

  recordAnalysis(metrics: Omit<SERPMetrics, 'timestamp'>) {
    const fullMetrics: SERPMetrics = {
      ...metrics,
      timestamp: new Date()
    };

    this.metrics.push(fullMetrics);
    this.updateProviderMetrics(fullMetrics);

    // Log to external monitoring service
    logger.info('SERP analysis recorded', {
      keyword: metrics.keyword,
      location: metrics.location,
      provider: metrics.provider,
      responseTime: metrics.responseTime,
      success: metrics.success,
      cached: metrics.cached
    });

    // Keep only last 1000 metrics in memory
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
  }

  private updateProviderMetrics(metrics: SERPMetrics) {
    const provider = metrics.provider;
    const existing = this.providerMetrics.get(provider) || {
      provider,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      errorRate: 0
    };

    existing.totalRequests++;
    
    if (metrics.success) {
      existing.successfulRequests++;
    } else {
      existing.failedRequests++;
      existing.lastError = metrics.error;
      existing.lastErrorTime = metrics.timestamp;
    }

    // Update average response time
    const previousTotal = (existing.totalRequests - 1) * existing.averageResponseTime;
    existing.averageResponseTime = (previousTotal + metrics.responseTime) / existing.totalRequests;

    // Update error rate
    existing.errorRate = (existing.failedRequests / existing.totalRequests) * 100;

    this.providerMetrics.set(provider, existing);
  }

  getProviderMetrics(): ProviderMetrics[] {
    return Array.from(this.providerMetrics.values());
  }

  getRecentMetrics(minutes: number = 60): SERPMetrics[] {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);
    return this.metrics.filter(m => m.timestamp > cutoff);
  }

  getKeywordPerformance(keyword: string): {
    averageResponseTime: number;
    successRate: number;
    cacheHitRate: number;
    totalAnalyses: number;
  } {
    const keywordMetrics = this.metrics.filter(m => m.keyword === keyword);
    
    if (keywordMetrics.length === 0) {
      return {
        averageResponseTime: 0,
        successRate: 0,
        cacheHitRate: 0,
        totalAnalyses: 0
      };
    }

    const totalResponseTime = keywordMetrics.reduce((sum, m) => sum + m.responseTime, 0);
    const successfulAnalyses = keywordMetrics.filter(m => m.success).length;
    const cachedAnalyses = keywordMetrics.filter(m => m.cached).length;

    return {
      averageResponseTime: totalResponseTime / keywordMetrics.length,
      successRate: (successfulAnalyses / keywordMetrics.length) * 100,
      cacheHitRate: (cachedAnalyses / keywordMetrics.length) * 100,
      totalAnalyses: keywordMetrics.length
    };
  }

  async checkQuotaUsage(): Promise<{
    provider: string;
    used: number;
    limit: number;
    percentageUsed: number;
    estimatedDaysRemaining: number;
  }[]> {
    // This would integrate with the SERP service to get actual quota data
    // For now, return mock data
    return [
      {
        provider: 'serper',
        used: 2500,
        limit: 10000,
        percentageUsed: 25,
        estimatedDaysRemaining: 22
      },
      {
        provider: 'serpapi',
        used: 100,
        limit: 5000,
        percentageUsed: 2,
        estimatedDaysRemaining: 245
      }
    ];
  }

  generatePerformanceReport(): {
    summary: {
      totalAnalyses: number;
      successRate: number;
      averageResponseTime: number;
      cacheHitRate: number;
    };
    providers: ProviderMetrics[];
    topKeywords: Array<{
      keyword: string;
      count: number;
      averageResponseTime: number;
    }>;
    recentErrors: Array<{
      provider: string;
      error: string;
      timestamp: Date;
    }>;
  } {
    const successfulAnalyses = this.metrics.filter(m => m.success).length;
    const cachedAnalyses = this.metrics.filter(m => m.cached).length;
    const totalResponseTime = this.metrics.reduce((sum, m) => sum + m.responseTime, 0);

    // Get top keywords
    const keywordCounts = new Map<string, { count: number; totalTime: number }>();
    this.metrics.forEach(m => {
      const existing = keywordCounts.get(m.keyword) || { count: 0, totalTime: 0 };
      existing.count++;
      existing.totalTime += m.responseTime;
      keywordCounts.set(m.keyword, existing);
    });

    const topKeywords = Array.from(keywordCounts.entries())
      .map(([keyword, data]) => ({
        keyword,
        count: data.count,
        averageResponseTime: data.totalTime / data.count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Get recent errors
    const recentErrors = Array.from(this.providerMetrics.values())
      .filter(p => p.lastError && p.lastErrorTime)
      .map(p => ({
        provider: p.provider,
        error: p.lastError!,
        timestamp: p.lastErrorTime!
      }))
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 5);

    return {
      summary: {
        totalAnalyses: this.metrics.length,
        successRate: this.metrics.length > 0 ? (successfulAnalyses / this.metrics.length) * 100 : 0,
        averageResponseTime: this.metrics.length > 0 ? totalResponseTime / this.metrics.length : 0,
        cacheHitRate: this.metrics.length > 0 ? (cachedAnalyses / this.metrics.length) * 100 : 0
      },
      providers: this.getProviderMetrics(),
      topKeywords,
      recentErrors
    };
  }
}

// Export singleton instance
let serpMonitoringService: SERPMonitoringService | null = null;

export function getSERPMonitoringService(): SERPMonitoringService {
  if (!serpMonitoringService) {
    serpMonitoringService = new SERPMonitoringService();
  }
  return serpMonitoringService;
}