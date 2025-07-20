# ADR-008: Error Handling and Recovery Strategy

## Status
Accepted

## Context
The SEO automation application needs comprehensive error handling for:
- External API failures (Serper.dev, Firecrawl, OpenAI)
- Database connection issues
- Content generation failures
- User interface errors
- Network connectivity problems
- Authentication and authorization errors

We need a systematic approach to error handling that provides graceful degradation, user-friendly messages, and automatic recovery where possible.

## Decision
We will implement a **layered error handling strategy** with error boundaries, service-level error handling, and comprehensive fallback mechanisms.

### Error Boundary Hierarchy
```typescript
// App Level Error Boundary
<RootErrorBoundary>
  <AuthProvider>
    <RouteErrorBoundary>
      <PageErrorBoundary>
        <ComponentErrorBoundary>
          <AsyncErrorBoundary>
            {/* Application Components */}
          </AsyncErrorBoundary>
        </ComponentErrorBoundary>
      </PageErrorBoundary>
    </RouteErrorBoundary>
  </AuthProvider>
</RootErrorBoundary>
```

### Service-Level Error Handling
- **API Services**: Retry logic with exponential backoff
- **External APIs**: Circuit breaker pattern with fallbacks
- **Database**: Connection pooling and retry mechanisms
- **Content Generation**: Graceful degradation and partial results

## Implementation Details

### Error Boundary Components
```typescript
// Root Error Boundary - Catches all unhandled errors
export class RootErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to monitoring service
    sentryManager.captureError(error, {
      errorInfo,
      level: 'error',
      tags: { boundary: 'root' },
    });
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Root Error Boundary caught an error:', error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          error={this.state.error}
          resetError={() => this.setState({ hasError: false, error: null })}
          level="application"
        />
      );
    }

    return this.props.children;
  }
}

// Async Error Boundary - Handles async operations
export function AsyncErrorBoundary({ children }: { children: ReactNode }) {
  const [error, setError] = useState<Error | null>(null);
  
  const resetError = useCallback(() => setError(null), []);
  
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      setError(new Error(event.reason));
      event.preventDefault();
    };
    
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);
  
  if (error) {
    return (
      <ErrorFallback
        error={error}
        resetError={resetError}
        level="async"
      />
    );
  }
  
  return <>{children}</>;
}
```

### Error Classification System
```typescript
// Error Types and Classifications
export enum ErrorType {
  NETWORK = 'NETWORK',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  VALIDATION = 'VALIDATION',
  EXTERNAL_API = 'EXTERNAL_API',
  DATABASE = 'DATABASE',
  CONTENT_GENERATION = 'CONTENT_GENERATION',
  UNKNOWN = 'UNKNOWN',
}

export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export interface AppError {
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  userMessage: string;
  code: string;
  details?: Record<string, any>;
  timestamp: string;
  retryable: boolean;
  fallbackAvailable: boolean;
}

// Error Factory
export class ErrorFactory {
  static createNetworkError(originalError: Error): AppError {
    return {
      type: ErrorType.NETWORK,
      severity: ErrorSeverity.MEDIUM,
      message: originalError.message,
      userMessage: 'Network connection issue. Please check your internet connection.',
      code: 'NETWORK_ERROR',
      timestamp: new Date().toISOString(),
      retryable: true,
      fallbackAvailable: false,
    };
  }
  
  static createExternalAPIError(service: string, originalError: Error): AppError {
    return {
      type: ErrorType.EXTERNAL_API,
      severity: ErrorSeverity.HIGH,
      message: `${service} API error: ${originalError.message}`,
      userMessage: 'External service temporarily unavailable. Trying alternative approach.',
      code: 'EXTERNAL_API_ERROR',
      details: { service },
      timestamp: new Date().toISOString(),
      retryable: true,
      fallbackAvailable: true,
    };
  }
  
  static createContentGenerationError(stage: string, originalError: Error): AppError {
    return {
      type: ErrorType.CONTENT_GENERATION,
      severity: ErrorSeverity.HIGH,
      message: `Content generation failed at ${stage}: ${originalError.message}`,
      userMessage: 'Content generation encountered an issue. Retrying with alternative approach.',
      code: 'CONTENT_GENERATION_ERROR',
      details: { stage },
      timestamp: new Date().toISOString(),
      retryable: true,
      fallbackAvailable: true,
    };
  }
}
```

### Service-Level Error Handling
```typescript
// API Service with Error Handling
export class APIService {
  private baseURL: string;
  private retryConfig: RetryConfig;
  
  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.retryConfig = {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      backoffFactor: 2,
    };
  }
  
  async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const { retries = 0 } = options;
    
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });
      
      if (!response.ok) {
        throw new APIError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          endpoint
        );
      }
      
      return await response.json();
    } catch (error) {
      // Log error
      logger.error('API request failed', {
        endpoint,
        error: error.message,
        retries,
      });
      
      // Determine if we should retry
      if (this.shouldRetry(error, retries)) {
        const delay = this.calculateDelay(retries);
        await this.sleep(delay);
        
        return this.request<T>(endpoint, {
          ...options,
          retries: retries + 1,
        });
      }
      
      // Transform error for application use
      throw this.transformError(error, endpoint);
    }
  }
  
  private shouldRetry(error: Error, retries: number): boolean {
    if (retries >= this.retryConfig.maxRetries) return false;
    
    // Retry on network errors and 5xx status codes
    if (error instanceof APIError) {
      return error.status >= 500 || error.status === 429;
    }
    
    // Retry on network errors
    return error.name === 'TypeError' || error.message.includes('fetch');
  }
  
  private calculateDelay(retries: number): number {
    const delay = this.retryConfig.baseDelay * 
      Math.pow(this.retryConfig.backoffFactor, retries);
    return Math.min(delay, this.retryConfig.maxDelay);
  }
  
  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  private transformError(error: Error, endpoint: string): AppError {
    if (error instanceof APIError) {
      if (error.status >= 500) {
        return ErrorFactory.createNetworkError(error);
      } else if (error.status === 401) {
        return ErrorFactory.createAuthenticationError(error);
      } else if (error.status === 403) {
        return ErrorFactory.createAuthorizationError(error);
      }
    }
    
    return ErrorFactory.createNetworkError(error);
  }
}
```

### Circuit Breaker Pattern for External APIs
```typescript
// Circuit Breaker Implementation
export class CircuitBreaker {
  private failureCount: number = 0;
  private lastFailureTime: number = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  
  constructor(
    private threshold: number = 5,
    private timeout: number = 60000, // 1 minute
    private monitoringPeriod: number = 10000 // 10 seconds
  ) {}
  
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }
    
    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  private onSuccess(): void {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }
  
  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.threshold) {
      this.state = 'OPEN';
    }
  }
  
  getState(): string {
    return this.state;
  }
}

// External API Service with Circuit Breaker
export class ExternalAPIService {
  private circuitBreaker: CircuitBreaker;
  private fallbackService: FallbackService;
  
  constructor(
    private apiService: APIService,
    private fallbackService: FallbackService
  ) {
    this.circuitBreaker = new CircuitBreaker();
  }
  
  async fetchData<T>(endpoint: string): Promise<T> {
    try {
      return await this.circuitBreaker.execute(() =>
        this.apiService.request<T>(endpoint)
      );
    } catch (error) {
      logger.warn('Primary API failed, trying fallback', {
        endpoint,
        error: error.message,
        circuitBreakerState: this.circuitBreaker.getState(),
      });
      
      // Try fallback service
      return await this.fallbackService.fetchData<T>(endpoint);
    }
  }
}
```

### Error Recovery Strategies
```typescript
// Content Generation Error Recovery
export class ContentGenerationService {
  async generateContent(request: ContentGenerationRequest): Promise<ContentResult> {
    const strategies = [
      () => this.primaryGeneration(request),
      () => this.fallbackGeneration(request),
      () => this.templateBasedGeneration(request),
    ];
    
    let lastError: Error | null = null;
    
    for (const strategy of strategies) {
      try {
        const result = await strategy();
        if (result.quality >= 0.7) { // Quality threshold
          return result;
        }
      } catch (error) {
        lastError = error;
        logger.warn('Content generation strategy failed', {
          strategy: strategy.name,
          error: error.message,
        });
      }
    }
    
    // All strategies failed
    throw ErrorFactory.createContentGenerationError(
      'all_strategies',
      lastError || new Error('All generation strategies failed')
    );
  }
  
  private async primaryGeneration(request: ContentGenerationRequest): Promise<ContentResult> {
    // Primary generation using all external APIs
    const serpData = await this.serpService.analyze(request.keyword);
    const competitorData = await this.firecrawlService.scrapeCompetitors(serpData.urls);
    const content = await this.openaiService.generateContent(request, competitorData);
    
    return {
      content,
      quality: await this.qualityService.assess(content),
      method: 'primary',
    };
  }
  
  private async fallbackGeneration(request: ContentGenerationRequest): Promise<ContentResult> {
    // Fallback generation with cached data and alternative APIs
    const cachedData = await this.cacheService.getCompetitorData(request.keyword);
    const content = await this.alternativeAIService.generateContent(request, cachedData);
    
    return {
      content,
      quality: await this.qualityService.assess(content),
      method: 'fallback',
    };
  }
  
  private async templateBasedGeneration(request: ContentGenerationRequest): Promise<ContentResult> {
    // Template-based generation as last resort
    const template = await this.templateService.getTemplate(request.contentType);
    const content = await this.templateService.populateTemplate(template, request);
    
    return {
      content,
      quality: 0.6, // Lower quality but guaranteed to work
      method: 'template',
    };
  }
}
```

## Consequences

### Positive
- **Resilience**: Application continues to function even when components fail
- **User Experience**: Graceful degradation instead of crashes
- **Debugging**: Comprehensive error logging and monitoring
- **Recovery**: Automatic retry and fallback mechanisms
- **Monitoring**: Clear visibility into error patterns and system health

### Negative
- **Complexity**: More code to maintain and test
- **Performance**: Additional overhead for error handling
- **Development Time**: More time needed to implement comprehensive error handling

## Implementation Plan

1. **Phase 1**: Implement error boundary hierarchy
2. **Phase 2**: Add service-level error handling and retry logic
3. **Phase 3**: Implement circuit breaker pattern for external APIs
4. **Phase 4**: Add comprehensive error recovery strategies
5. **Phase 5**: Integrate with monitoring and alerting systems

## Monitoring and Success Criteria

- **Error Rate**: <1% unhandled errors in production
- **Recovery Rate**: >90% of errors automatically recovered
- **User Experience**: <5% of users experience error states
- **Mean Time to Recovery**: <30 seconds for automatic recovery

## References
- [React Error Boundaries](https://reactjs.org/docs/error-boundaries.html)
- [Circuit Breaker Pattern](https://martinfowler.com/bliki/CircuitBreaker.html)
- [Error Handling Best Practices](https://blog.logrocket.com/error-handling-react-error-boundary/)
