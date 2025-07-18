import { GET, POST, PUT, DELETE } from '../route';
import { SubscriptionService } from '@/services/subscription/subscription.service';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { mockRequest } from '@/test/mocks/next-api';

// Mock the subscription service
jest.mock('@/services/subscription/subscription.service');

// Mock Supabase auth
jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createRouteHandlerClient: jest.fn(),
}));

// Mock Next.js cookies
jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

describe('/api/subscription', () => {
  let mockSubscriptionService: jest.Mocked<SubscriptionService>;
  let mockSupabase: any;

  beforeEach(() => {
    mockSupabase = {
      auth: {
        getSession: jest.fn(),
      },
    };

    (createRouteHandlerClient as jest.Mock).mockReturnValue(mockSupabase);
    
    mockSubscriptionService = {
      getUserSubscription: jest.fn(),
      createSubscription: jest.fn(),
      updateSubscription: jest.fn(),
      cancelSubscription: jest.fn(),
    } as any;

    (SubscriptionService as jest.Mock).mockImplementation(() => mockSubscriptionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/subscription', () => {
    it('should return user subscription successfully', async () => {
      const mockSession = {
        user: { id: 'user-123' },
      };

      const mockSubscription = {
        id: 'sub-123',
        user_id: 'user-123',
        status: 'active',
      };

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
      });

      mockSubscriptionService.getUserSubscription.mockResolvedValue(mockSubscription);

      const req = mockRequest({ method: 'GET' });
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        data: mockSubscription,
      });
      expect(mockSubscriptionService.getUserSubscription).toHaveBeenCalledWith('user-123');
    });

    it('should return 401 for unauthenticated request', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
      });

      const req = mockRequest({ method: 'GET' });
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.code).toBe('AUTHENTICATION_ERROR');
    });
  });

  describe('POST /api/subscription', () => {
    it('should create subscription successfully', async () => {
      const mockSession = {
        user: { id: 'user-123' },
      };

      const mockInput = {
        tierId: 'tier-123',
        billingCycle: 'monthly',
        paymentMethodId: 'pm_123',
      };

      const mockSubscription = {
        id: 'sub-123',
        user_id: 'user-123',
        subscription_tier_id: 'tier-123',
        status: 'active',
      };

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
      });

      mockSubscriptionService.createSubscription.mockResolvedValue(mockSubscription);

      const req = mockRequest({
        method: 'POST',
        body: mockInput,
      });
      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toEqual({
        success: true,
        data: mockSubscription,
      });
      expect(mockSubscriptionService.createSubscription).toHaveBeenCalledWith(
        'user-123',
        mockInput
      );
    });

    it('should return 400 for invalid input', async () => {
      const mockSession = {
        user: { id: 'user-123' },
      };

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
      });

      const req = mockRequest({
        method: 'POST',
        body: {
          tierId: 'invalid-id', // Invalid UUID
          billingCycle: 'invalid-cycle',
        },
      });
      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Validation failed');
    });

    it('should return 401 for unauthenticated request', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
      });

      const req = mockRequest({
        method: 'POST',
        body: {},
      });
      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.code).toBe('AUTHENTICATION_ERROR');
    });
  });

  describe('PUT /api/subscription', () => {
    it('should update subscription successfully', async () => {
      const mockSession = {
        user: { id: 'user-123' },
      };

      const mockInput = {
        tierId: 'tier-456',
        billingCycle: 'yearly',
      };

      const mockUpdatedSubscription = {
        id: 'sub-123',
        user_id: 'user-123',
        subscription_tier_id: 'tier-456',
        status: 'active',
      };

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
      });

      mockSubscriptionService.updateSubscription.mockResolvedValue(mockUpdatedSubscription);

      const req = mockRequest({
        method: 'PUT',
        body: mockInput,
      });
      const response = await PUT(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        data: mockUpdatedSubscription,
      });
      expect(mockSubscriptionService.updateSubscription).toHaveBeenCalledWith(
        'user-123',
        mockInput
      );
    });
  });

  describe('DELETE /api/subscription', () => {
    it('should cancel subscription successfully', async () => {
      const mockSession = {
        user: { id: 'user-123' },
      };

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
      });

      mockSubscriptionService.cancelSubscription.mockResolvedValue(undefined);

      const req = mockRequest({ method: 'DELETE' });
      const response = await DELETE(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        message: 'Subscription cancelled successfully',
      });
      expect(mockSubscriptionService.cancelSubscription).toHaveBeenCalledWith('user-123');
    });
  });
});