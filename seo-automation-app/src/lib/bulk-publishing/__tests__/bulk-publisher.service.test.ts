import { BulkPublisherService } from '../bulk-publisher.service';
import { CMSPlatform } from '@/types/cms';

// Create comprehensive mocks using manual mocking approach
const mockCMSServices = {
  wordpress: {
    publish: jest.fn().mockImplementation(async (content, options) => {
      console.log('WordPress publish mock called with:', content, options);
      const result = {
        success: true,
        platform: 'wordpress',
        contentId: 'wp-1',
        url: 'https://wp.com/1'
      };
      console.log('WordPress publish mock returning:', result);
      return result;
    }),
    validateCredentials: jest.fn().mockResolvedValue(true),
    update: jest.fn(),
    delete: jest.fn(),
    getContent: jest.fn(),
    listContent: jest.fn(),
    getSyncStatus: jest.fn()
  },
  shopify: {
    publish: jest.fn().mockImplementation(async (content, options) => {
      console.log('Shopify publish mock called with:', content, options);
      const result = {
        success: true,
        platform: 'shopify',
        contentId: 'sh-1',
        url: 'https://shopify.com/1'
      };
      console.log('Shopify publish mock returning:', result);
      return result;
    }),
    validateCredentials: jest.fn().mockResolvedValue(true),
    update: jest.fn(),
    delete: jest.fn(),
    getContent: jest.fn(),
    listContent: jest.fn(),
    getSyncStatus: jest.fn()
  },
  hubspot: {
    publish: jest.fn().mockImplementation(async (content, options) => {
      console.log('HubSpot publish mock called with:', content, options);
      const result = {
        success: true,
        platform: 'hubspot',
        contentId: 'hs-1',
        url: 'https://hubspot.com/1'
      };
      console.log('HubSpot publish mock returning:', result);
      return result;
    }),
    validateCredentials: jest.fn().mockResolvedValue(true),
    update: jest.fn(),
    delete: jest.fn(),
    getContent: jest.fn(),
    listContent: jest.fn(),
    getSyncStatus: jest.fn()
  }
};

// Mock the service classes with factory functions
jest.mock('@/lib/cms/wordpress.service', () => ({
  WordPressService: jest.fn().mockImplementation(() => mockCMSServices.wordpress)
}));

jest.mock('@/lib/cms/shopify.service', () => ({
  ShopifyService: jest.fn().mockImplementation(() => mockCMSServices.shopify)
}));

jest.mock('@/lib/cms/hubspot.service', () => ({
  HubSpotService: jest.fn().mockImplementation(() => mockCMSServices.hubspot)
}));

describe('BulkPublisherService', () => {
  let service: BulkPublisherService;

  beforeEach(() => {
    // Clear all mock calls before each test
    jest.clearAllMocks();

    // Create service with mock factory
    const mockServiceFactory = (platform: CMSPlatform, credentials: any) => {
      switch (platform) {
        case 'wordpress':
          return mockCMSServices.wordpress as any;
        case 'shopify':
          return mockCMSServices.shopify as any;
        case 'hubspot':
          return mockCMSServices.hubspot as any;
        default:
          throw new Error(`Unsupported platform: ${platform}`);
      }
    };

    service = new BulkPublisherService(mockServiceFactory);
  });

  afterEach(() => {
    // Clean up any timers or async operations
    jest.clearAllTimers();
  });

  it('creates a bulk publish job and tracks progress', async () => {
    // Set up successful mocks for all platforms
    mockCMSServices.wordpress.publish.mockResolvedValue({
      success: true,
      platform: 'wordpress',
      contentId: 'wp-1',
      url: 'https://wp.com/1'
    });

    mockCMSServices.shopify.publish.mockResolvedValue({
      success: true,
      platform: 'shopify',
      contentId: 'sh-1',
      url: 'https://shopify.com/1'
    });

    mockCMSServices.hubspot.publish.mockResolvedValue({
      success: true,
      platform: 'hubspot',
      contentId: 'hs-1',
      url: 'https://hubspot.com/1'
    });

    const request = {
      id: 'bulk-1',
      userId: 'user-1',
      title: 'Test Bulk',
      content: { title: 'Test', content: 'Body' },
      platforms: [
        { platform: 'wordpress' as CMSPlatform, credentials: { platform: 'wordpress', endpoint: 'https://wp.com', apiKey: 'key' }, priority: 5 },
        { platform: 'shopify' as CMSPlatform, credentials: { platform: 'shopify', endpoint: 'https://shopify.com', apiKey: 'key' }, priority: 5 },
        { platform: 'hubspot' as CMSPlatform, credentials: { platform: 'hubspot', endpoint: 'https://hubspot.com', apiKey: 'key' }, priority: 5 },
      ],
      createdAt: new Date(),
      status: 'pending',
    };
    const bulkId = await service.createBulkPublishJob(request);
    expect(bulkId).toBe('bulk-1');
    // Wait for queue to process
    await new Promise(res => setTimeout(res, 1500));
    const progress = await service.getBulkProgress(bulkId);
    expect(progress).toBeTruthy();
    expect(progress?.completedPlatforms).toBe(3);
    expect(progress?.status).toBe('completed');
    expect(progress?.platformResults.every(r => r.status === 'completed')).toBe(true);
  });

  it('handles platform publish errors and retries', async () => {
    // Create mock service factory for this test
    const testMockServiceFactory = (platform: CMSPlatform, credentials: any) => {
      switch (platform) {
        case 'wordpress':
          return mockCMSServices.wordpress as any;
        case 'shopify':
          return mockCMSServices.shopify as any;
        case 'hubspot':
          return mockCMSServices.hubspot as any;
        default:
          throw new Error(`Unsupported platform: ${platform}`);
      }
    };

    // Create a service with shorter retry delay for testing
    const testService = new BulkPublisherService(testMockServiceFactory);
    // Override the retry delay to be shorter for testing
    (testService as any).retryDelayMs = 100; // 100ms instead of 5000ms

    // Set up WordPress mock to throw retryable error first, then succeed
    let callCount = 0;
    mockCMSServices.wordpress.publish.mockImplementation(async () => {
      callCount++;
      if (callCount === 1) {
        throw new Error('NETWORK_ERROR: Connection failed');
      }
      return { success: true, platform: 'wordpress', contentId: 'wp-2', url: 'https://wp.com/2' };
    });

    const request = {
      id: 'bulk-2',
      userId: 'user-2',
      title: 'Test Bulk Error',
      content: { title: 'Test', content: 'Body' },
      platforms: [
        { platform: 'wordpress' as CMSPlatform, credentials: { platform: 'wordpress', endpoint: 'https://wp.com', apiKey: 'key' }, priority: 5 },
      ],
      options: { maxRetries: 2 },
      createdAt: new Date(),
      status: 'pending',
    };
    const bulkId = await testService.createBulkPublishJob(request);
    // Wait for retry logic (queue processor runs every 1000ms + retry delay)
    await new Promise(res => setTimeout(res, 2500));
    const progress = await testService.getBulkProgress(bulkId);
    expect(progress).toBeTruthy();
    expect(progress?.completedPlatforms).toBe(1);
    expect(progress?.platformResults[0].retryCount).toBeGreaterThan(0);
    expect(progress?.platformResults[0].status).toBe('completed');
  });

  it('marks job as failed if all platforms fail', async () => {
    // Set up Shopify mock to always fail
    mockCMSServices.shopify.publish.mockResolvedValue({
      success: false,
      platform: 'shopify',
      error: 'Simulated failure'
    });

    const request = {
      id: 'bulk-3',
      userId: 'user-3',
      title: 'Test Bulk All Fail',
      content: { title: 'Test', content: 'Body' },
      platforms: [
        { platform: 'shopify' as CMSPlatform, credentials: { platform: 'shopify', endpoint: 'https://shopify.com', apiKey: 'key' }, priority: 5 },
      ],
      options: { maxRetries: 1 },
      createdAt: new Date(),
      status: 'pending',
    };
    const bulkId = await service.createBulkPublishJob(request);
    await new Promise(res => setTimeout(res, 2500));
    const progress = await service.getBulkProgress(bulkId);
    expect(progress).toBeTruthy();
    expect(progress?.failedPlatforms).toBe(1);
    expect(progress?.status).toBe('failed');
    expect(progress?.platformResults[0].status).toBe('failed');
  });
}); 