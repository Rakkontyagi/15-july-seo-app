import { SubscriptionService } from '../subscription.service';
import { createClient } from '@supabase/supabase-js';
import { stripe } from '@/lib/stripe/config';
import { BillingError, SubscriptionError } from '@/lib/errors/billing.errors';

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}));

// Mock Stripe
jest.mock('@/lib/stripe/config', () => ({
  stripe: {
    customers: {
      create: jest.fn(),
      update: jest.fn(),
      retrieve: jest.fn(),
    },
    paymentMethods: {
      attach: jest.fn(),
    },
    subscriptions: {
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

describe('SubscriptionService', () => {
  let subscriptionService: SubscriptionService;
  let mockSupabase: any;

  beforeEach(() => {
    // Create a chainable mock object
    const chainable: any = {};

    chainable.from = jest.fn().mockImplementation((table) => {
      // Return a new object with the upsert method that works correctly
      const result = {
        ...chainable,
        upsert: jest.fn().mockReturnValue(upsertResult)
      };
      return result;
    });
    chainable.select = jest.fn().mockReturnValue(chainable);
    chainable.insert = jest.fn().mockReturnValue(chainable);
    chainable.update = jest.fn().mockReturnValue(chainable);
    chainable.delete = jest.fn().mockReturnValue(chainable);
    chainable.eq = jest.fn().mockReturnValue(chainable);
    chainable.order = jest.fn().mockReturnValue(chainable);

    // Special handling for upsert - create a simple chainable mock
    const upsertResult = {
      eq: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: null, error: null })
      })
    };
    chainable.upsert = jest.fn().mockImplementation((data) => {
      console.log('upsert called with:', data);
      console.log('returning upsertResult:', upsertResult);
      console.log('upsertResult.eq:', typeof upsertResult.eq);
      return upsertResult;
    });

    // Special handling for terminal operations that should return promises
    // This will be overridden by individual tests
    chainable.single = jest.fn().mockResolvedValue({ data: null, error: null });

    chainable.data = [];
    chainable.error = null;

    mockSupabase = chainable;

    (createClient as jest.Mock).mockReturnValue(mockSupabase);
    subscriptionService = new SubscriptionService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getSubscriptionTiers', () => {
    it('should return subscription tiers successfully', async () => {
      const mockTiers = [
        {
          id: '1',
          name: 'basic',
          display_name: 'Basic',
          price_monthly: 9.99,
          price_yearly: 99.99,
          content_limit: 10,
          features: { content_generation: true },
          is_active: true,
        },
      ];

      // Set up the mock to return the expected data
      mockSupabase.data = mockTiers;
      mockSupabase.error = null;

      const result = await subscriptionService.getSubscriptionTiers();

      expect(result).toEqual(mockTiers);
      expect(mockSupabase.from).toHaveBeenCalledWith('subscription_tiers');
      expect(mockSupabase.eq).toHaveBeenCalledWith('is_active', true);
    });

    it('should throw SubscriptionError on database error', async () => {
      // Set up the mock to return an error
      mockSupabase.data = null;
      mockSupabase.error = { message: 'Database error' };

      await expect(subscriptionService.getSubscriptionTiers()).rejects.toThrow(
        SubscriptionError
      );
    });
  });

  describe('getUserSubscription', () => {
    it('should return user subscription successfully', async () => {
      const mockSubscription = {
        id: '1',
        user_id: 'user-123',
        subscription_tier_id: 'tier-1',
        status: 'active',
      };

      mockSupabase.single.mockResolvedValue({
        data: mockSubscription,
        error: null,
      });

      const result = await subscriptionService.getUserSubscription('user-123');

      expect(result).toEqual(mockSubscription);
      expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', 'user-123');
    });

    it('should return null when no subscription found', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' }, // No rows returned
      });

      const result = await subscriptionService.getUserSubscription('user-123');

      expect(result).toBeNull();
    });

    it('should throw SubscriptionError on database error', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: 'Database error', code: 'OTHER' },
      });

      await expect(
        subscriptionService.getUserSubscription('user-123')
      ).rejects.toThrow(SubscriptionError);
    });
  });

  describe('createSubscription', () => {
    const mockInput = {
      tierId: 'tier-1',
      billingCycle: 'monthly' as const,
      paymentMethodId: 'pm_123',
    };

    it('should create subscription successfully', async () => {
      const mockTier = {
        id: 'tier-1',
        stripe_price_id_monthly: 'price_monthly',
        stripe_price_id_yearly: 'price_yearly',
      };

      const mockUserProfile = {
        email: 'user@example.com',
        full_name: 'John Doe',
      };

      const mockStripeCustomer = {
        id: 'cus_123',
      };

      const mockStripeSubscription = {
        id: 'sub_123',
        status: 'active',
        current_period_start: 1640995200,
        current_period_end: 1643673600,
        cancel_at_period_end: false,
      };

      const mockNewSubscription = {
        id: 'subscription-1',
        user_id: 'user-123',
        subscription_tier_id: 'tier-1',
        status: 'active',
      };

      // Mock database calls - set up the sequence of responses
      mockSupabase.single = jest.fn()
        .mockResolvedValueOnce({ data: mockTier, error: null }) // Get tier (first call)
        .mockResolvedValueOnce({ data: null, error: null }) // No existing customer (second call)
        .mockResolvedValueOnce({ data: mockUserProfile, error: null }) // Get user profile
        .mockResolvedValueOnce({ data: mockNewSubscription, error: null }); // Create subscription

      // Mock Stripe calls
      (stripe.customers.create as jest.Mock).mockResolvedValue(mockStripeCustomer);
      (stripe.paymentMethods.attach as jest.Mock).mockResolvedValue({});
      (stripe.customers.update as jest.Mock).mockResolvedValue({});
      (stripe.subscriptions.create as jest.Mock).mockResolvedValue(mockStripeSubscription);

      const result = await subscriptionService.createSubscription('user-123', mockInput);

      expect(result).toEqual(mockNewSubscription);
      expect(stripe.customers.create).toHaveBeenCalledWith({
        email: 'user@example.com',
        name: 'John Doe',
        metadata: { user_id: 'user-123' },
      });
      expect(stripe.subscriptions.create).toHaveBeenCalledWith({
        customer: 'cus_123',
        items: [{ price: 'price_monthly' }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
      });
    });

    it('should throw SubscriptionError for invalid tier', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      });

      await expect(
        subscriptionService.createSubscription('user-123', mockInput)
      ).rejects.toThrow(SubscriptionError);
    });

    it('should throw BillingError on Stripe error', async () => {
      const mockTier = {
        id: 'tier-1',
        stripe_price_id_monthly: 'price_monthly',
      };

      mockSupabase.single.mockResolvedValue({ data: mockTier, error: null });
      (stripe.customers.create as jest.Mock).mockRejectedValue(
        new Error('Stripe error')
      );

      await expect(
        subscriptionService.createSubscription('user-123', mockInput)
      ).rejects.toThrow(BillingError);
    });
  });

  describe('checkUsageLimit', () => {
    it('should return true when under limit', async () => {
      const mockSubscription = {
        subscription_tier_id: 'tier-1',
      };

      const mockUsage = {
        content_generated: 5,
      };

      const mockTier = {
        content_limit: 10,
      };

      mockSupabase.single
        .mockResolvedValueOnce({ data: mockSubscription, error: null })
        .mockResolvedValueOnce({ data: mockUsage, error: null })
        .mockResolvedValueOnce({ data: mockTier, error: null });

      const result = await subscriptionService.checkUsageLimit('user-123');

      expect(result).toBe(true);
    });

    it('should return false when over limit', async () => {
      const mockSubscription = {
        subscription_tier_id: 'tier-1',
      };

      const mockUsage = {
        content_generated: 15,
      };

      const mockTier = {
        content_limit: 10,
      };

      mockSupabase.single
        .mockResolvedValueOnce({ data: mockSubscription, error: null })
        .mockResolvedValueOnce({ data: mockUsage, error: null })
        .mockResolvedValueOnce({ data: mockTier, error: null });

      const result = await subscriptionService.checkUsageLimit('user-123');

      expect(result).toBe(false);
    });

    it('should return false when no subscription', async () => {
      mockSupabase.single.mockResolvedValue({ data: null, error: null });

      const result = await subscriptionService.checkUsageLimit('user-123');

      expect(result).toBe(false);
    });
  });

  describe('incrementUsage', () => {
    it('should increment content usage successfully', async () => {
      // The method should complete without throwing an error
      await expect(subscriptionService.incrementUsage('user-123', 'content')).resolves.not.toThrow();
    });

    it('should increment API usage successfully', async () => {
      // The method should complete without throwing an error
      await expect(subscriptionService.incrementUsage('user-123', 'api')).resolves.not.toThrow();
    });

    it('should throw SubscriptionError on database error', async () => {
      // Override the upsert result to return an error
      const errorUpsertResult = {
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: null, error: { message: 'Database error' } })
        })
      };

      // Override the from method to return an object with error-returning upsert
      mockSupabase.from = jest.fn().mockReturnValue({
        upsert: jest.fn().mockReturnValue(errorUpsertResult)
      });

      await expect(
        subscriptionService.incrementUsage('user-123', 'content')
      ).rejects.toThrow(SubscriptionError);
    });
  });
});