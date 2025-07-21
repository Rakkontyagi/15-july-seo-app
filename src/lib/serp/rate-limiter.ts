interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  maxRetries?: number;
  backoffMs?: number;
}

interface RateLimitState {
  requests: number;
  windowStart: number;
  lastRequest: number;
}

export class SerperRateLimiter {
  private state: RateLimitState;
  private config: Required<RateLimitConfig>;

  constructor(config: RateLimitConfig) {
    this.config = {
      maxRequests: config.maxRequests,
      windowMs: config.windowMs,
      maxRetries: config.maxRetries || 3,
      backoffMs: config.backoffMs || 1000
    };

    this.state = {
      requests: 0,
      windowStart: Date.now(),
      lastRequest: 0
    };
  }

  async acquire(): Promise<void> {
    const now = Date.now();

    // Reset window if expired
    if (now - this.state.windowStart >= this.config.windowMs) {
      this.state = {
        requests: 0,
        windowStart: now,
        lastRequest: 0
      };
    }

    // Check if we've exceeded the rate limit
    if (this.state.requests >= this.config.maxRequests) {
      const waitTime = this.config.windowMs - (now - this.state.windowStart);
      if (waitTime > 0) {
        await this.sleep(waitTime);
        // Recursively try again after waiting
        return this.acquire();
      }
    }

    // Update state
    this.state.requests++;
    this.state.lastRequest = now;
  }

  async executeWithRetry<T>(
    fn: () => Promise<T>,
    retryOn: (error: any) => boolean = () => true
  ): Promise<T> {
    let lastError: any;
    
    for (let i = 0; i < this.config.maxRetries; i++) {
      try {
        await this.acquire();
        return await fn();
      } catch (error) {
        lastError = error;
        
        if (!retryOn(error) || i === this.config.maxRetries - 1) {
          throw error;
        }

        // Exponential backoff
        const backoffTime = this.config.backoffMs * Math.pow(2, i);
        await this.sleep(backoffTime);
      }
    }

    throw lastError;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getState(): Readonly<RateLimitState> {
    return { ...this.state };
  }

  reset(): void {
    this.state = {
      requests: 0,
      windowStart: Date.now(),
      lastRequest: 0
    };
  }
}

// Circuit breaker for handling provider failures
export class CircuitBreaker {
  private failures: number = 0;
  private lastFailureTime: number = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  
  constructor(
    private readonly threshold: number = 5,
    private readonly cooldownMs: number = 60000 // 1 minute
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime >= this.cooldownMs) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open - service temporarily unavailable');
      }
    }

    try {
      const result = await fn();
      
      if (this.state === 'half-open') {
        this.state = 'closed';
        this.failures = 0;
      }
      
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  private recordFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.threshold) {
      this.state = 'open';
    }
  }

  getState(): string {
    return this.state;
  }

  reset(): void {
    this.failures = 0;
    this.lastFailureTime = 0;
    this.state = 'closed';
  }
}

// Create default rate limiter for Serper API
export const serperRateLimiter = new SerperRateLimiter({
  maxRequests: 100, // Adjust based on your Serper plan
  windowMs: 60 * 1000, // 1 minute
  maxRetries: 3,
  backoffMs: 1000
});

export const serperCircuitBreaker = new CircuitBreaker(5, 60000);