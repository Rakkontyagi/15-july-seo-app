/**
 * Stripe API Error Handling and Webhook Validation for SEO Automation App
 * Provides comprehensive error handling for Stripe operations and webhook processing
 */

import Stripe from 'stripe';
import { ApplicationError, ErrorType, ErrorSeverity, ServiceError } from '@/lib/errors/types';
import { errorHandler } from '@/lib/errors/handler';
import { logger } from '@/lib/logging/logger';
import { NextRequest } from 'next/server';

export interface StripeRetryConfig {
  maxRetries: number;
  baseDelay: number;
  retryableErrors: string[];
}

const DEFAULT_STRIPE_RETRY_CONFIG: StripeRetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  retryableErrors: [
    'rate_limit',
    'api_connection_error',
    'api_error',
    'temporary_unavailable'
  ]
};

export class StripeErrorHandler {
  private static instance: StripeErrorHandler;
  private retryConfig: StripeRetryConfig;
  private stripe: Stripe;

  private constructor(config: Partial<StripeRetryConfig> = {}) {
    this.retryConfig = { ...DEFAULT_STRIPE_RETRY_CONFIG, ...config };
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2023-10-16',
      typescript: true
    });
  }

  public static getInstance(config?: Partial<StripeRetryConfig>): StripeErrorHandler {
    if (!StripeErrorHandler.instance) {
      StripeErrorHandler.instance = new StripeErrorHandler(config);
    }
    return StripeErrorHandler.instance;
  }

  /**
   * Execute Stripe operation with retry logic
   */
  public async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
    context?: Record<string, any>
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 1; attempt <= this.retryConfig.maxRetries + 1; attempt++) {
      try {
        const result = await operation();
        
        if (attempt > 1) {
          logger.info('Stripe operation succeeded after retry', {
            operation: operationName,
            attempt,
            context
          });
        }

        return result;

      } catch (error) {
        lastError = error;
        
        if (error instanceof Stripe.errors.StripeError) {
          // Check if error is retryable
          if (attempt <= this.retryConfig.maxRetries && this.isRetryableError(error)) {
            const delay = this.calculateDelay(attempt);
            
            logger.warn('Stripe operation failed, retrying', {
              operation: operationName,
              attempt,
              error: error.message,
              type: error.type,
              code: error.code,
              delay,
              context
            });

            await this.sleep(delay);
            continue;
          }

          // Not retryable or max retries reached
          throw this.createStripeError(error, operationName, context);
        }

        // Non-Stripe error
        if (attempt <= this.retryConfig.maxRetries) {
          const delay = this.calculateDelay(attempt);
          
          logger.warn('Stripe operation exception, retrying', {
            operation: operationName,
            attempt,
            error: (error as Error).message,
            delay,
            context
          });

          await this.sleep(delay);
          continue;
        }
      }
    }

    // All retries failed
    throw this.createStripeError(lastError, operationName, context);
  }

  /**
   * Check if Stripe error is retryable
   */
  private isRetryableError(error: Stripe.errors.StripeError): boolean {
    // Rate limit errors are always retryable
    if (error.type === 'rate_limit_error') {
      return true;
    }

    // API connection errors are retryable
    if (error.type === 'api_connection_error') {
      return true;
    }

    // Some API errors are retryable
    if (error.type === 'api_error' && error.code) {
      return this.retryableErrors.includes(error.code);
    }

    return false;
  }

  private get retryableErrors(): string[] {
    return this.retryConfig.retryableErrors;
  }

  /**
   * Create appropriate error for Stripe failures
   */
  private createStripeError(error: any, operationName: string, context?: Record<string, any>): ApplicationError {
    if (error instanceof Stripe.errors.StripeError) {
      let errorType: ErrorType;
      let severity: ErrorSeverity;

      switch (error.type) {
        case 'card_error':
          errorType = ErrorType.USER_ERROR;
          severity = ErrorSeverity.LOW;
          break;
        case 'invalid_request_error':
          errorType = ErrorType.VALIDATION_ERROR;
          severity = ErrorSeverity.MEDIUM;
          break;
        case 'authentication_error':
          errorType = ErrorType.SECURITY_ERROR;
          severity = ErrorSeverity.CRITICAL;
          break;
        case 'rate_limit_error':
          errorType = ErrorType.SERVICE_ERROR;
          severity = ErrorSeverity.MEDIUM;
          break;
        case 'api_connection_error':
        case 'api_error':
          errorType = ErrorType.SERVICE_ERROR;
          severity = ErrorSeverity.HIGH;
          break;
        default:
          errorType = ErrorType.SERVICE_ERROR;
          severity = ErrorSeverity.HIGH;
      }

      return new ServiceError(
        `Stripe ${operationName} failed: ${error.message}`,
        'stripe',
        {
          operation: operationName,
          stripeErrorType: error.type,
          stripeErrorCode: error.code,
          stripeRequestId: error.requestId,
          ...context
        },
        error
      );
    }

    // Non-Stripe error
    return new ServiceError(
      `Stripe ${operationName} failed: ${error?.message || 'Unknown error'}`,
      'stripe',
      {
        operation: operationName,
        ...context
      },
      error
    );
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  private calculateDelay(attempt: number): number {
    const exponentialDelay = this.retryConfig.baseDelay * Math.pow(2, attempt - 1);
    const jitter = Math.random() * 0.1 * exponentialDelay;
    return Math.min(exponentialDelay + jitter, 30000); // Max 30 seconds
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Validate Stripe webhook signature
   */
  public validateWebhook(
    payload: string | Buffer,
    signature: string,
    endpointSecret: string
  ): Stripe.Event {
    try {
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        endpointSecret
      );

      logger.info('Stripe webhook validated', {
        eventType: event.type,
        eventId: event.id,
        livemode: event.livemode
      });

      return event;

    } catch (error) {
      logger.error('Stripe webhook validation failed', {
        error: (error as Error).message,
        signature: signature.substring(0, 20) + '...'
      });

      throw new ApplicationError(
        'Stripe webhook validation failed',
        {
          type: ErrorType.SECURITY_ERROR,
          severity: ErrorSeverity.HIGH,
          code: 'STRIPE_WEBHOOK_VALIDATION_FAILED',
          context: {
            error: (error as Error).message
          },
          originalError: error as Error
        }
      );
    }
  }

  /**
   * Process Stripe webhook with error handling
   */
  public async processWebhook(
    request: NextRequest,
    endpointSecret: string,
    handler: (event: Stripe.Event) => Promise<void>
  ): Promise<void> {
    try {
      const body = await request.text();
      const signature = request.headers.get('stripe-signature');

      if (!signature) {
        throw new ApplicationError(
          'Missing Stripe signature',
          {
            type: ErrorType.SECURITY_ERROR,
            severity: ErrorSeverity.HIGH,
            code: 'STRIPE_SIGNATURE_MISSING'
          }
        );
      }

      const event = this.validateWebhook(body, signature, endpointSecret);
      
      await this.executeWithRetry(
        () => handler(event),
        `webhook_${event.type}`,
        {
          eventId: event.id,
          eventType: event.type
        }
      );

      logger.info('Stripe webhook processed successfully', {
        eventType: event.type,
        eventId: event.id
      });

    } catch (error) {
      await errorHandler.handleError(error as Error, {
        operation: 'stripe_webhook_processing',
        url: request.url
      });
      throw error;
    }
  }
}

// Convenience functions and wrappers
export const stripeErrorHandler = StripeErrorHandler.getInstance();

export const withStripeRetry = <T>(
  operation: () => Promise<T>,
  operationName: string,
  context?: Record<string, any>
): Promise<T> => {
  return stripeErrorHandler.executeWithRetry(operation, operationName, context);
};

// Stripe operation wrappers
export class StripeOperations {
  private stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2023-10-16',
      typescript: true
    });
  }

  /**
   * Create customer with error handling
   */
  async createCustomer(
    params: Stripe.CustomerCreateParams,
    context?: Record<string, any>
  ): Promise<Stripe.Customer> {
    return withStripeRetry(
      () => this.stripe.customers.create(params),
      'create_customer',
      { ...context, email: params.email }
    );
  }

  /**
   * Create subscription with error handling
   */
  async createSubscription(
    params: Stripe.SubscriptionCreateParams,
    context?: Record<string, any>
  ): Promise<Stripe.Subscription> {
    return withStripeRetry(
      () => this.stripe.subscriptions.create(params),
      'create_subscription',
      { ...context, customer: params.customer }
    );
  }

  /**
   * Create payment intent with error handling
   */
  async createPaymentIntent(
    params: Stripe.PaymentIntentCreateParams,
    context?: Record<string, any>
  ): Promise<Stripe.PaymentIntent> {
    return withStripeRetry(
      () => this.stripe.paymentIntents.create(params),
      'create_payment_intent',
      { ...context, amount: params.amount, currency: params.currency }
    );
  }

  /**
   * Retrieve customer with error handling
   */
  async retrieveCustomer(
    customerId: string,
    context?: Record<string, any>
  ): Promise<Stripe.Customer> {
    return withStripeRetry(
      () => this.stripe.customers.retrieve(customerId),
      'retrieve_customer',
      { ...context, customerId }
    );
  }

  /**
   * Update subscription with error handling
   */
  async updateSubscription(
    subscriptionId: string,
    params: Stripe.SubscriptionUpdateParams,
    context?: Record<string, any>
  ): Promise<Stripe.Subscription> {
    return withStripeRetry(
      () => this.stripe.subscriptions.update(subscriptionId, params),
      'update_subscription',
      { ...context, subscriptionId }
    );
  }

  /**
   * Cancel subscription with error handling
   */
  async cancelSubscription(
    subscriptionId: string,
    context?: Record<string, any>
  ): Promise<Stripe.Subscription> {
    return withStripeRetry(
      () => this.stripe.subscriptions.cancel(subscriptionId),
      'cancel_subscription',
      { ...context, subscriptionId }
    );
  }

  /**
   * List invoices with error handling
   */
  async listInvoices(
    params: Stripe.InvoiceListParams,
    context?: Record<string, any>
  ): Promise<Stripe.ApiList<Stripe.Invoice>> {
    return withStripeRetry(
      () => this.stripe.invoices.list(params),
      'list_invoices',
      { ...context, customer: params.customer }
    );
  }

  /**
   * Create portal session with error handling
   */
  async createPortalSession(
    params: Stripe.BillingPortal.SessionCreateParams,
    context?: Record<string, any>
  ): Promise<Stripe.BillingPortal.Session> {
    return withStripeRetry(
      () => this.stripe.billingPortal.sessions.create(params),
      'create_portal_session',
      { ...context, customer: params.customer }
    );
  }
}

// Export configured instance
export const stripeOperations = new StripeOperations();

// Webhook processing helper
export const processStripeWebhook = (
  request: NextRequest,
  endpointSecret: string,
  handler: (event: Stripe.Event) => Promise<void>
): Promise<void> => {
  return stripeErrorHandler.processWebhook(request, endpointSecret, handler);
};
