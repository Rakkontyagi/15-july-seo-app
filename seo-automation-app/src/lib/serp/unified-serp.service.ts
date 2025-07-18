import { SerperClient, getSerperClient } from './serper-client';
import { SerpApiClient, getSerpApiClient } from './serpapi-client';
import { SERPAnalysisService } from './serp-analysis.service';
import { serperRateLimiter, serperCircuitBreaker } from './rate-limiter';
import { logger } from '@/lib/logging/logger';

export type SearchProvider = 'serper' | 'serpapi';

interface ProviderHealth {
  provider: SearchProvider;
  available: boolean;
  lastCheck: Date;
  failureCount: number;
  quota?: {
    used: number;
    limit: number;
  };
}

export class UnifiedSERPService {
  private serperClient: SerperClient | null = null;
  private serpApiClient: SerpApiClient | null = null;
  private serpAnalysisService: SERPAnalysisService | null = null;
  private providerHealth: Map<SearchProvider, ProviderHealth> = new Map();
  
  constructor() {
    this.initializeProviders();
  }

  private initializeProviders() {
    // Initialize Serper (primary)
    try {
      this.serperClient = getSerperClient();
      this.providerHealth.set('serper', {
        provider: 'serper',
        available: true,
        lastCheck: new Date(),
        failureCount: 0
      });
      logger.info('Serper.dev client initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Serper client:', error);
      this.providerHealth.set('serper', {
        provider: 'serper',
        available: false,
        lastCheck: new Date(),
        failureCount: 1
      });
    }

    // Initialize SerpApi (backup)
    try {
      const serpApiClient = getSerpApiClient();
      if (serpApiClient) {
        this.serpApiClient = serpApiClient;
        this.providerHealth.set('serpapi', {
          provider: 'serpapi',
          available: true,
          lastCheck: new Date(),
          failureCount: 0
        });
        logger.info('SerpApi client initialized successfully');
      }
    } catch (error) {
      logger.warn('SerpApi client not configured or failed to initialize:', error);
    }

    // Initialize SERP Analysis Service with primary provider
    if (this.serperClient) {
      this.serpAnalysisService = new SERPAnalysisService(this.serperClient);
    }
  }

  async analyzeKeyword(options: any) {
    // Try primary provider first
    if (this.isProviderAvailable('serper')) {
      try {
        return await this.analyzeWithSerper(options);
      } catch (error) {
        logger.error('Serper analysis failed:', error);
        this.recordProviderFailure('serper');
        
        // Try backup provider
        if (this.isProviderAvailable('serpapi')) {
          return await this.analyzeWithSerpApi(options);
        }
      }
    } else if (this.isProviderAvailable('serpapi')) {
      return await this.analyzeWithSerpApi(options);
    }

    throw new Error('No search providers available');
  }

  private async analyzeWithSerper(options: any) {
    if (!this.serpAnalysisService) {
      throw new Error('SERP analysis service not initialized');
    }

    return await serperCircuitBreaker.execute(async () => {
      return await serperRateLimiter.executeWithRetry(
        async () => {
          const result = await this.serpAnalysisService!.analyzeKeyword(options);
          this.recordProviderSuccess('serper');
          return result;
        },
        (error) => {
          // Retry on rate limit or temporary errors
          return error.message.includes('rate limit') || 
                 error.message.includes('timeout');
        }
      );
    });
  }

  private async analyzeWithSerpApi(options: any) {
    if (!this.serpApiClient) {
      throw new Error('SerpApi client not available');
    }

    logger.info('Falling back to SerpApi');

    const searchOptions = {
      keyword: options.keyword,
      location: options.location,
      num: options.numResults || 5
    };

    const serpApiResponse = await this.serpApiClient.search(searchOptions);
    const convertedResponse = this.serpApiClient.convertToSerperFormat(serpApiResponse);

    // Use temporary SERP analysis service with converted data
    const tempAnalysisService = new SERPAnalysisService({
      search: async () => convertedResponse
    } as any);

    const result = await tempAnalysisService.analyzeKeyword(options);
    this.recordProviderSuccess('serpapi');
    return result;
  }

  private isProviderAvailable(provider: SearchProvider): boolean {
    const health = this.providerHealth.get(provider);
    if (!health) return false;

    // Check if provider has been failing too much
    if (health.failureCount >= 5) {
      // Check if cooldown period has passed (5 minutes)
      const cooldownPeriod = 5 * 60 * 1000;
      if (Date.now() - health.lastCheck.getTime() > cooldownPeriod) {
        // Reset failure count and try again
        health.failureCount = 0;
        health.available = true;
      } else {
        return false;
      }
    }

    return health.available;
  }

  private recordProviderFailure(provider: SearchProvider) {
    const health = this.providerHealth.get(provider);
    if (health) {
      health.failureCount++;
      health.lastCheck = new Date();
      if (health.failureCount >= 5) {
        health.available = false;
        logger.warn(`Provider ${provider} marked as unavailable after ${health.failureCount} failures`);
      }
    }
  }

  private recordProviderSuccess(provider: SearchProvider) {
    const health = this.providerHealth.get(provider);
    if (health) {
      health.failureCount = 0;
      health.available = true;
      health.lastCheck = new Date();
    }
  }

  async checkProviderHealth(): Promise<ProviderHealth[]> {
    const healthChecks: ProviderHealth[] = [];

    // Check Serper
    if (this.serperClient) {
      try {
        const quota = await this.serperClient.checkQuota();
        const health = this.providerHealth.get('serper')!;
        health.quota = quota;
        healthChecks.push({ ...health });
      } catch (error) {
        logger.error('Failed to check Serper health:', error);
      }
    }

    // Check SerpApi
    if (this.serpApiClient) {
      try {
        const account = await this.serpApiClient.checkAccount();
        const health = this.providerHealth.get('serpapi')!;
        health.quota = {
          used: account.searches_left > 0 ? 0 : 1,
          limit: account.searches_left
        };
        healthChecks.push({ ...health });
      } catch (error) {
        logger.error('Failed to check SerpApi health:', error);
      }
    }

    return healthChecks;
  }

  async compareRegionalResults(keyword: string, locations: string[]) {
    if (!this.serpAnalysisService) {
      throw new Error('SERP analysis service not initialized');
    }

    return await this.serpAnalysisService.compareRegionalResults(keyword, locations);
  }

  getAvailableProviders(): SearchProvider[] {
    const available: SearchProvider[] = [];
    
    this.providerHealth.forEach((health, provider) => {
      if (health.available) {
        available.push(provider);
      }
    });

    return available;
  }
}

// Export singleton instance
let unifiedSERPService: UnifiedSERPService | null = null;

export function getUnifiedSERPService(): UnifiedSERPService {
  if (!unifiedSERPService) {
    unifiedSERPService = new UnifiedSERPService();
  }
  return unifiedSERPService;
}