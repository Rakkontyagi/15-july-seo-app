export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export class BillingError extends APIError {
  constructor(message: string, details?: any) {
    super(message, 402, 'BILLING_ERROR', details);
  }
}

export class SubscriptionError extends APIError {
  constructor(message: string, details?: any) {
    super(message, 400, 'SUBSCRIPTION_ERROR', details);
  }
}

export class ValidationError extends APIError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

export class AuthenticationError extends APIError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

export class RateLimitError extends APIError {
  constructor(retryAfter: number) {
    super('Rate limit exceeded', 429, 'RATE_LIMIT_ERROR', { retryAfter });
  }
}