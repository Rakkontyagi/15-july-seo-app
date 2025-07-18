// Export all SERP-related services and types
export { SerperClient, getSerperClient } from './serper-client';
export type { SerperSearchOptions, SerperOrganicResult, SerperSearchResponse } from './serper-client';

export { SerpApiClient, getSerpApiClient } from './serpapi-client';
export type { SerpApiSearchOptions, SerpApiOrganicResult, SerpApiSearchResponse } from './serpapi-client';

export { SERPAnalysisService, GOOGLE_DOMAINS, COUNTRY_CODES } from './serp-analysis.service';
export type { SERPResult, SERPAnalysisResult, SERPAnalysisOptions } from './serp-analysis.service';

export { UnifiedSERPService, getUnifiedSERPService } from './unified-serp.service';
export type { SearchProvider } from './unified-serp.service';

export { SerperRateLimiter, CircuitBreaker, serperRateLimiter, serperCircuitBreaker } from './rate-limiter';

// Re-export types from the types file
export type {
  SERPAnalysisRequest,
  BatchSERPAnalysisRequest,
  SERPAnalysisRecord,
  SERPAnalysisProgress
} from '@/types/serp';