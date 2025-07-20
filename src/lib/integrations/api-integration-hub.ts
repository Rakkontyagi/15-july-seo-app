/**
 * Advanced API Integration Hub
 * Implements Story 4.2 - Comprehensive third-party API integration system
 * Unified interface for multiple content, SEO, and marketing APIs
 */

import { circuitBreakerMonitor } from '@/lib/api/circuit-breaker';
import { performanceMonitor } from '@/lib/monitoring/performance-monitor';

// Types
export interface APIProvider {
  id: string;
  name: string;
  type: 'content' | 'seo' | 'social' | 'analytics' | 'ai' | 'marketing';
  baseUrl: string;
  authType: 'api_key' | 'oauth' | 'bearer' | 'basic';
  rateLimit: {
    requests: number;
    window: number; // milliseconds
    burst?: number;
  };
  endpoints: APIEndpoint[];
  status: 'active' | 'inactive' | 'deprecated';
  priority: number; // 1-10, higher is better
  reliability: number; // 0-100
  cost: number; // cost per 1000 requests
}

export interface APIEndpoint {
  id: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  description: string;
  parameters: APIParameter[];
  responseSchema: any;
  cacheable: boolean;
  cacheTTL?: number;
  retryable: boolean;
  timeout: number;
}

export interface APIParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  description: string;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    enum?: any[];
  };
}

export interface APICredentials {
  providerId: string;
  authType: string;
  credentials: {
    apiKey?: string;
    clientId?: string;
    clientSecret?: string;
    accessToken?: string;
    refreshToken?: string;
    username?: string;
    password?: string;
  };
  scopes?: string[];
  expiresAt?: string;
  organizationId: string;
  userId: string;
  isActive: boolean;
}

export interface APIRequest {
  id: string;
  providerId: string;
  endpointId: string;
  parameters: Record<string, any>;
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
  priority?: 'low' | 'normal' | 'high' | 'critical';
  metadata?: Record<string, any>;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata: {
    providerId: string;
    endpointId: string;
    requestId: string;
    duration: number;
    cached: boolean;
    retryCount: number;
    timestamp: string;
    rateLimit?: {
      remaining: number;
      reset: number;
    };
  };
}

export interface IntegrationConfig {
  maxConcurrentRequests: number;
  defaultTimeout: number;
  retryAttempts: number;
  retryDelay: number;
  cacheEnabled: boolean;
  cacheTTL: number;
  rateLimitBuffer: number; // percentage buffer for rate limits
  failoverEnabled: boolean;
  loadBalancing: 'round_robin' | 'weighted' | 'least_connections';
  monitoring: {
    enabled: boolean;
    alertThresholds: {
      errorRate: number;
      responseTime: number;
      availability: number;
    };
  };
}

// API Integration Hub
export class APIIntegrationHub {
  private static instance: APIIntegrationHub;
  private providers: Map<string, APIProvider> = new Map();
  private credentials: Map<string, APICredentials> = new Map();
  private requestQueue: APIRequest[] = [];
  private responseCache: Map<string, { data: any; expires: number }> = new Map();
  private rateLimiters: Map<string, { requests: number; resetTime: number }> = new Map();
  private config: IntegrationConfig;

  static getInstance(config?: IntegrationConfig): APIIntegrationHub {
    if (!APIIntegrationHub.instance) {
      APIIntegrationHub.instance = new APIIntegrationHub(config);
    }
    return APIIntegrationHub.instance;
  }

  constructor(config?: IntegrationConfig) {
    this.config = config || this.getDefaultConfig();
    this.initializeProviders();
    this.startRequestProcessor();
  }

  private getDefaultConfig(): IntegrationConfig {
    return {
      maxConcurrentRequests: 50,
      defaultTimeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000,
      cacheEnabled: true,
      cacheTTL: 300000, // 5 minutes
      rateLimitBuffer: 10, // 10% buffer
      failoverEnabled: true,
      loadBalancing: 'weighted',
      monitoring: {
        enabled: true,
        alertThresholds: {
          errorRate: 0.05, // 5%
          responseTime: 5000, // 5 seconds
          availability: 0.99, // 99%
        },
      },
    };
  }

  private initializeProviders(): void {
    // Initialize built-in API providers
    this.registerProvider(this.createOpenAIProvider());
    this.registerProvider(this.createSemrushProvider());
    this.registerProvider(this.createAhrefsProvider());
    this.registerProvider(this.createGoogleAnalyticsProvider());
    this.registerProvider(this.createHubSpotProvider());
    this.registerProvider(this.createMailchimpProvider());
    this.registerProvider(this.createSlackProvider());
    this.registerProvider(this.createZapierProvider());

    console.log(`🔌 Initialized ${this.providers.size} API providers`);
  }

  // Provider Registration
  registerProvider(provider: APIProvider): void {
    this.providers.set(provider.id, provider);
    console.log(`✅ Registered API provider: ${provider.name}`);
  }

  // Credentials Management
  async setCredentials(credentials: APICredentials): Promise<void> {
    // Validate credentials
    await this.validateCredentials(credentials);
    
    this.credentials.set(credentials.providerId, credentials);
    console.log(`🔑 Credentials set for provider: ${credentials.providerId}`);
  }

  private async validateCredentials(credentials: APICredentials): Promise<boolean> {
    const provider = this.providers.get(credentials.providerId);
    if (!provider) {
      throw new Error(`Provider not found: ${credentials.providerId}`);
    }

    // Perform test request to validate credentials
    try {
      const testEndpoint = provider.endpoints.find(e => e.id === 'health' || e.id === 'test');
      if (testEndpoint) {
        await this.makeRequest({
          id: `test-${Date.now()}`,
          providerId: credentials.providerId,
          endpointId: testEndpoint.id,
          parameters: {},
          priority: 'low',
        });
      }
      return true;
    } catch (error) {
      throw new Error(`Credential validation failed: ${error}`);
    }
  }

  // Main Request Method
  async makeRequest<T = any>(request: APIRequest): Promise<APIResponse<T>> {
    const startTime = Date.now();
    const requestId = request.id || `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      // Get provider and endpoint
      const provider = this.providers.get(request.providerId);
      if (!provider) {
        throw new Error(`Provider not found: ${request.providerId}`);
      }

      const endpoint = provider.endpoints.find(e => e.id === request.endpointId);
      if (!endpoint) {
        throw new Error(`Endpoint not found: ${request.endpointId}`);
      }

      // Check cache first
      if (endpoint.cacheable && this.config.cacheEnabled) {
        const cached = this.getCachedResponse(request);
        if (cached) {
          return {
            success: true,
            data: cached,
            metadata: {
              providerId: request.providerId,
              endpointId: request.endpointId,
              requestId,
              duration: Date.now() - startTime,
              cached: true,
              retryCount: 0,
              timestamp: new Date().toISOString(),
            },
          };
        }
      }

      // Check rate limits
      await this.checkRateLimit(provider);

      // Get credentials
      const credentials = this.credentials.get(request.providerId);
      if (!credentials || !credentials.isActive) {
        throw new Error(`No valid credentials for provider: ${request.providerId}`);
      }

      // Validate parameters
      this.validateParameters(endpoint, request.parameters);

      // Make the actual request
      const response = await this.executeRequest(provider, endpoint, request, credentials);

      // Cache response if applicable
      if (endpoint.cacheable && this.config.cacheEnabled && response.success) {
        this.cacheResponse(request, response.data, endpoint.cacheTTL || this.config.cacheTTL);
      }

      // Track performance
      performanceMonitor.trackAPICall({
        endpoint: `${provider.name}:${endpoint.id}`,
        method: endpoint.method,
        duration: Date.now() - startTime,
        status: response.success ? 200 : 500,
        success: response.success,
        timestamp: Date.now(),
      });

      return response;

    } catch (error) {
      console.error(`API request failed: ${requestId}`, error);

      // Track error
      performanceMonitor.trackAPICall({
        endpoint: `${request.providerId}:${request.endpointId}`,
        method: 'POST',
        duration: Date.now() - startTime,
        status: 500,
        success: false,
        timestamp: Date.now(),
      });

      return {
        success: false,
        error: {
          code: 'REQUEST_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
          details: error,
        },
        metadata: {
          providerId: request.providerId,
          endpointId: request.endpointId,
          requestId,
          duration: Date.now() - startTime,
          cached: false,
          retryCount: 0,
          timestamp: new Date().toISOString(),
        },
      };
    }
  }

  private async executeRequest(
    provider: APIProvider,
    endpoint: APIEndpoint,
    request: APIRequest,
    credentials: APICredentials
  ): Promise<APIResponse> {
    const url = `${provider.baseUrl}${endpoint.path}`;
    const headers = this.buildHeaders(provider, credentials, request.headers);
    
    let retryCount = 0;
    const maxRetries = request.retries ?? this.config.retryAttempts;

    while (retryCount <= maxRetries) {
      try {
        const fetchOptions: RequestInit = {
          method: endpoint.method,
          headers,
          signal: AbortSignal.timeout(request.timeout || endpoint.timeout || this.config.defaultTimeout),
        };

        // Add body for POST/PUT/PATCH requests
        if (['POST', 'PUT', 'PATCH'].includes(endpoint.method)) {
          fetchOptions.body = JSON.stringify(request.parameters);
        }

        // Add query parameters for GET requests
        let requestUrl = url;
        if (endpoint.method === 'GET' && Object.keys(request.parameters).length > 0) {
          const params = new URLSearchParams(request.parameters);
          requestUrl = `${url}?${params.toString()}`;
        }

        const response = await fetch(requestUrl, fetchOptions);
        
        // Update rate limit tracking
        this.updateRateLimit(provider, response);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        return {
          success: true,
          data,
          metadata: {
            providerId: request.providerId,
            endpointId: request.endpointId,
            requestId: request.id,
            duration: 0, // Will be set by caller
            cached: false,
            retryCount,
            timestamp: new Date().toISOString(),
            rateLimit: this.extractRateLimit(response),
          },
        };

      } catch (error) {
        retryCount++;
        
        if (retryCount > maxRetries || !endpoint.retryable) {
          throw error;
        }

        // Exponential backoff
        const delay = this.config.retryDelay * Math.pow(2, retryCount - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw new Error('Max retries exceeded');
  }

  // Provider Definitions
  private createOpenAIProvider(): APIProvider {
    return {
      id: 'openai',
      name: 'OpenAI',
      type: 'ai',
      baseUrl: 'https://api.openai.com/v1',
      authType: 'bearer',
      rateLimit: { requests: 3000, window: 60000 },
      endpoints: [
        {
          id: 'chat_completion',
          path: '/chat/completions',
          method: 'POST',
          description: 'Generate chat completions',
          parameters: [
            { name: 'model', type: 'string', required: true, description: 'Model to use' },
            { name: 'messages', type: 'array', required: true, description: 'Chat messages' },
            { name: 'temperature', type: 'number', required: false, description: 'Sampling temperature' },
          ],
          responseSchema: {},
          cacheable: false,
          retryable: true,
          timeout: 30000,
        },
        {
          id: 'embeddings',
          path: '/embeddings',
          method: 'POST',
          description: 'Generate embeddings',
          parameters: [
            { name: 'model', type: 'string', required: true, description: 'Model to use' },
            { name: 'input', type: 'string', required: true, description: 'Input text' },
          ],
          responseSchema: {},
          cacheable: true,
          cacheTTL: 3600000, // 1 hour
          retryable: true,
          timeout: 15000,
        },
      ],
      status: 'active',
      priority: 9,
      reliability: 98,
      cost: 0.02,
    };
  }

  private createSemrushProvider(): APIProvider {
    return {
      id: 'semrush',
      name: 'Semrush',
      type: 'seo',
      baseUrl: 'https://api.semrush.com',
      authType: 'api_key',
      rateLimit: { requests: 1000, window: 60000 },
      endpoints: [
        {
          id: 'keyword_overview',
          path: '/analytics/v1/',
          method: 'GET',
          description: 'Get keyword overview data',
          parameters: [
            { name: 'type', type: 'string', required: true, description: 'Report type' },
            { name: 'phrase', type: 'string', required: true, description: 'Keyword phrase' },
            { name: 'database', type: 'string', required: true, description: 'Database code' },
          ],
          responseSchema: {},
          cacheable: true,
          cacheTTL: 3600000,
          retryable: true,
          timeout: 10000,
        },
      ],
      status: 'active',
      priority: 8,
      reliability: 95,
      cost: 0.05,
    };
  }

  private createAhrefsProvider(): APIProvider {
    return {
      id: 'ahrefs',
      name: 'Ahrefs',
      type: 'seo',
      baseUrl: 'https://apiv2.ahrefs.com',
      authType: 'bearer',
      rateLimit: { requests: 500, window: 60000 },
      endpoints: [
        {
          id: 'keywords_explorer',
          path: '/v3/keywords-explorer/overview',
          method: 'GET',
          description: 'Get keyword data',
          parameters: [
            { name: 'select', type: 'string', required: true, description: 'Fields to select' },
            { name: 'target', type: 'string', required: true, description: 'Target keyword' },
            { name: 'country', type: 'string', required: true, description: 'Country code' },
          ],
          responseSchema: {},
          cacheable: true,
          cacheTTL: 3600000,
          retryable: true,
          timeout: 10000,
        },
      ],
      status: 'active',
      priority: 8,
      reliability: 94,
      cost: 0.08,
    };
  }

  private createGoogleAnalyticsProvider(): APIProvider {
    return {
      id: 'google_analytics',
      name: 'Google Analytics',
      type: 'analytics',
      baseUrl: 'https://analyticsreporting.googleapis.com/v4',
      authType: 'oauth',
      rateLimit: { requests: 100, window: 100000 },
      endpoints: [
        {
          id: 'reports_batch_get',
          path: '/reports:batchGet',
          method: 'POST',
          description: 'Get analytics reports',
          parameters: [
            { name: 'reportRequests', type: 'array', required: true, description: 'Report requests' },
          ],
          responseSchema: {},
          cacheable: true,
          cacheTTL: 1800000, // 30 minutes
          retryable: true,
          timeout: 15000,
        },
      ],
      status: 'active',
      priority: 9,
      reliability: 99,
      cost: 0.0,
    };
  }

  private createHubSpotProvider(): APIProvider {
    return {
      id: 'hubspot',
      name: 'HubSpot',
      type: 'marketing',
      baseUrl: 'https://api.hubapi.com',
      authType: 'bearer',
      rateLimit: { requests: 100, window: 10000 },
      endpoints: [
        {
          id: 'contacts_create',
          path: '/crm/v3/objects/contacts',
          method: 'POST',
          description: 'Create contact',
          parameters: [
            { name: 'properties', type: 'object', required: true, description: 'Contact properties' },
          ],
          responseSchema: {},
          cacheable: false,
          retryable: true,
          timeout: 10000,
        },
      ],
      status: 'active',
      priority: 7,
      reliability: 96,
      cost: 0.0,
    };
  }

  private createMailchimpProvider(): APIProvider {
    return {
      id: 'mailchimp',
      name: 'Mailchimp',
      type: 'marketing',
      baseUrl: 'https://us1.api.mailchimp.com/3.0',
      authType: 'api_key',
      rateLimit: { requests: 10, window: 1000 },
      endpoints: [
        {
          id: 'lists_members_create',
          path: '/lists/{list_id}/members',
          method: 'POST',
          description: 'Add member to list',
          parameters: [
            { name: 'email_address', type: 'string', required: true, description: 'Email address' },
            { name: 'status', type: 'string', required: true, description: 'Subscription status' },
          ],
          responseSchema: {},
          cacheable: false,
          retryable: true,
          timeout: 10000,
        },
      ],
      status: 'active',
      priority: 6,
      reliability: 93,
      cost: 0.0,
    };
  }

  private createSlackProvider(): APIProvider {
    return {
      id: 'slack',
      name: 'Slack',
      type: 'social',
      baseUrl: 'https://slack.com/api',
      authType: 'bearer',
      rateLimit: { requests: 1, window: 1000 },
      endpoints: [
        {
          id: 'chat_post_message',
          path: '/chat.postMessage',
          method: 'POST',
          description: 'Post message to channel',
          parameters: [
            { name: 'channel', type: 'string', required: true, description: 'Channel ID' },
            { name: 'text', type: 'string', required: true, description: 'Message text' },
          ],
          responseSchema: {},
          cacheable: false,
          retryable: true,
          timeout: 5000,
        },
      ],
      status: 'active',
      priority: 5,
      reliability: 97,
      cost: 0.0,
    };
  }

  private createZapierProvider(): APIProvider {
    return {
      id: 'zapier',
      name: 'Zapier',
      type: 'marketing',
      baseUrl: 'https://hooks.zapier.com/hooks/catch',
      authType: 'api_key',
      rateLimit: { requests: 100, window: 60000 },
      endpoints: [
        {
          id: 'webhook_trigger',
          path: '/{hook_id}',
          method: 'POST',
          description: 'Trigger webhook',
          parameters: [
            { name: 'data', type: 'object', required: true, description: 'Webhook data' },
          ],
          responseSchema: {},
          cacheable: false,
          retryable: true,
          timeout: 10000,
        },
      ],
      status: 'active',
      priority: 4,
      reliability: 92,
      cost: 0.0,
    };
  }

  // Utility Methods
  private buildHeaders(
    provider: APIProvider,
    credentials: APICredentials,
    customHeaders?: Record<string, string>
  ): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'ContentGeneration-Platform/1.0',
      ...customHeaders,
    };

    switch (provider.authType) {
      case 'api_key':
        headers['Authorization'] = `Bearer ${credentials.credentials.apiKey}`;
        break;
      case 'bearer':
        headers['Authorization'] = `Bearer ${credentials.credentials.accessToken}`;
        break;
      case 'oauth':
        headers['Authorization'] = `Bearer ${credentials.credentials.accessToken}`;
        break;
      case 'basic':
        const auth = btoa(`${credentials.credentials.username}:${credentials.credentials.password}`);
        headers['Authorization'] = `Basic ${auth}`;
        break;
    }

    return headers;
  }

  private validateParameters(endpoint: APIEndpoint, parameters: Record<string, any>): void {
    for (const param of endpoint.parameters) {
      if (param.required && !(param.name in parameters)) {
        throw new Error(`Required parameter missing: ${param.name}`);
      }

      if (param.name in parameters) {
        const value = parameters[param.name];
        
        // Type validation
        if (param.type === 'string' && typeof value !== 'string') {
          throw new Error(`Parameter ${param.name} must be a string`);
        }
        if (param.type === 'number' && typeof value !== 'number') {
          throw new Error(`Parameter ${param.name} must be a number`);
        }
        if (param.type === 'boolean' && typeof value !== 'boolean') {
          throw new Error(`Parameter ${param.name} must be a boolean`);
        }
        if (param.type === 'array' && !Array.isArray(value)) {
          throw new Error(`Parameter ${param.name} must be an array`);
        }

        // Additional validation
        if (param.validation) {
          if (param.validation.min !== undefined && value < param.validation.min) {
            throw new Error(`Parameter ${param.name} must be >= ${param.validation.min}`);
          }
          if (param.validation.max !== undefined && value > param.validation.max) {
            throw new Error(`Parameter ${param.name} must be <= ${param.validation.max}`);
          }
          if (param.validation.pattern && !new RegExp(param.validation.pattern).test(value)) {
            throw new Error(`Parameter ${param.name} does not match required pattern`);
          }
          if (param.validation.enum && !param.validation.enum.includes(value)) {
            throw new Error(`Parameter ${param.name} must be one of: ${param.validation.enum.join(', ')}`);
          }
        }
      }
    }
  }

  private async checkRateLimit(provider: APIProvider): Promise<void> {
    const rateLimiter = this.rateLimiters.get(provider.id);
    const now = Date.now();

    if (!rateLimiter) {
      this.rateLimiters.set(provider.id, {
        requests: 1,
        resetTime: now + provider.rateLimit.window,
      });
      return;
    }

    if (now > rateLimiter.resetTime) {
      // Reset window
      rateLimiter.requests = 1;
      rateLimiter.resetTime = now + provider.rateLimit.window;
      return;
    }

    const maxRequests = provider.rateLimit.requests * (1 - this.config.rateLimitBuffer / 100);
    if (rateLimiter.requests >= maxRequests) {
      const waitTime = rateLimiter.resetTime - now;
      throw new Error(`Rate limit exceeded. Wait ${waitTime}ms before next request.`);
    }

    rateLimiter.requests++;
  }

  private updateRateLimit(provider: APIProvider, response: Response): void {
    // Extract rate limit info from response headers
    const remaining = response.headers.get('X-RateLimit-Remaining');
    const reset = response.headers.get('X-RateLimit-Reset');

    if (remaining && reset) {
      const rateLimiter = this.rateLimiters.get(provider.id);
      if (rateLimiter) {
        rateLimiter.requests = provider.rateLimit.requests - parseInt(remaining);
        rateLimiter.resetTime = parseInt(reset) * 1000; // Convert to milliseconds
      }
    }
  }

  private extractRateLimit(response: Response): { remaining: number; reset: number } | undefined {
    const remaining = response.headers.get('X-RateLimit-Remaining');
    const reset = response.headers.get('X-RateLimit-Reset');

    if (remaining && reset) {
      return {
        remaining: parseInt(remaining),
        reset: parseInt(reset),
      };
    }

    return undefined;
  }

  private getCachedResponse(request: APIRequest): any | null {
    const cacheKey = this.generateCacheKey(request);
    const cached = this.responseCache.get(cacheKey);

    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }

    if (cached) {
      this.responseCache.delete(cacheKey);
    }

    return null;
  }

  private cacheResponse(request: APIRequest, data: any, ttl: number): void {
    const cacheKey = this.generateCacheKey(request);
    this.responseCache.set(cacheKey, {
      data,
      expires: Date.now() + ttl,
    });
  }

  private generateCacheKey(request: APIRequest): string {
    const params = JSON.stringify(request.parameters);
    return `${request.providerId}:${request.endpointId}:${btoa(params)}`;
  }

  private startRequestProcessor(): void {
    // Process queued requests (for future implementation)
    setInterval(() => {
      this.processRequestQueue();
    }, 1000);
  }

  private processRequestQueue(): void {
    // Implementation for processing queued requests
    // This would handle priority queuing, load balancing, etc.
  }

  // Public API Methods
  getProviders(type?: string): APIProvider[] {
    const providers = Array.from(this.providers.values());
    return type ? providers.filter(p => p.type === type) : providers;
  }

  getProvider(id: string): APIProvider | undefined {
    return this.providers.get(id);
  }

  async testConnection(providerId: string): Promise<boolean> {
    try {
      const provider = this.providers.get(providerId);
      if (!provider) return false;

      const testEndpoint = provider.endpoints.find(e => e.id === 'health' || e.id === 'test');
      if (!testEndpoint) return true; // No test endpoint available

      const response = await this.makeRequest({
        id: `test-${Date.now()}`,
        providerId,
        endpointId: testEndpoint.id,
        parameters: {},
        priority: 'low',
      });

      return response.success;
    } catch (error) {
      return false;
    }
  }

  clearCache(): void {
    this.responseCache.clear();
    console.log('🧹 API integration cache cleared');
  }

  getStats(): any {
    return {
      providers: this.providers.size,
      credentials: this.credentials.size,
      cacheSize: this.responseCache.size,
      queueSize: this.requestQueue.length,
    };
  }
}

// Export singleton instance
export const apiIntegrationHub = APIIntegrationHub.getInstance();
