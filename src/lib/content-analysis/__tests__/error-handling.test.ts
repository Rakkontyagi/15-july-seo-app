import { ErrorHandler, ErrorContext } from '../error-handling';

describe('ErrorHandler', () => {
  let errorHandler: ErrorHandler;

  beforeEach(() => {
    errorHandler = new ErrorHandler({
      retryConfig: {
        maxRetries: 2,
        baseDelayMs: 100,
        maxDelayMs: 1000,
        backoffMultiplier: 2,
        retryableErrors: ['TIMEOUT', 'NETWORK_ERROR']
      }
    });
  });

  it('should handle retryable errors', (done) => {
    const error = new Error('Connection timeout');
    
    errorHandler.on('retry', (context: ErrorContext) => {
      expect(context.contentId).toBe('test-content');
      expect(context.operation).toBe('analysis');
      done();
    });

    errorHandler.reportError('test-content', 'analysis', error, 'medium');
  });

  it('should handle non-retryable errors', (done) => {
    const error = new Error('Invalid input');
    
    errorHandler.on('permanentFailure', (context: ErrorContext) => {
      expect(context.contentId).toBe('test-content');
      expect(context.operation).toBe('validation');
      done();
    });

    errorHandler.reportError('test-content', 'validation', error, 'high');
  });

  it('should track error statistics', () => {
    const error1 = new Error('Timeout error');
    const error2 = new Error('Network error');
    
    errorHandler.reportError('content-1', 'analysis', error1, 'medium');
    errorHandler.reportError('content-2', 'analysis', error2, 'high');

    const stats = errorHandler.getErrorStats();
    expect(stats.totalErrors).toBe(2);
    expect(stats.errorsByOperation.analysis).toBe(2);
    expect(stats.errorsBySeverity.medium).toBe(1);
    expect(stats.errorsBySeverity.high).toBe(1);
  });

  it('should clear retry attempts', () => {
    const error = new Error('Timeout');
    errorHandler.reportError('test-content', 'analysis', error, 'medium');
    
    errorHandler.clearRetryAttempts('test-content', 'analysis');
    
    // Should not have any active retries
    const stats = errorHandler.getErrorStats();
    expect(stats.activeRetries).toBe(0);
  });
});