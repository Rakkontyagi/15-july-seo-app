
export class CircuitBreaker {
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private failureCount = 0;
  private lastFailureTime = 0;
  private successCount = 0;

  constructor(
    private failureThreshold: number = 5,
    private resetTimeout: number = 60000, // 1 minute
    private halfOpenAttempts: number = 1
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.state = 'HALF_OPEN';
        this.successCount = 0; // Reset success count for HALF_OPEN
      } else {
        throw new Error('Circuit breaker is OPEN. Operation blocked.');
      }
    }

    if (this.state === 'HALF_OPEN') {
      if (this.successCount < this.halfOpenAttempts) {
        try {
          const result = await operation();
          this.onSuccess();
          return result;
        } catch (error) {
          this.onFailure();
          throw error;
        }
      } else {
        // If enough successful attempts in HALF_OPEN, close the circuit
        this.state = 'CLOSED';
        this.reset();
        return await operation(); // Re-execute after closing
      }
    }

    // State is CLOSED
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
    if (this.state === 'HALF_OPEN') {
      this.successCount++;
      if (this.successCount >= this.halfOpenAttempts) {
        this.state = 'CLOSED';
        this.reset();
      }
    } else {
      this.reset();
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
      console.warn('Circuit breaker OPEN: Too many failures.');
    }
  }

  private reset(): void {
    this.failureCount = 0;
    this.lastFailureTime = 0;
    this.successCount = 0;
  }

  getState(): 'CLOSED' | 'OPEN' | 'HALF_OPEN' {
    return this.state;
  }
}
