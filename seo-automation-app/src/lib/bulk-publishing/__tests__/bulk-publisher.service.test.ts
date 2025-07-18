import { BulkPublisherService } from '../bulk-publisher.service';
import { CMSPlatform } from '@/types/cms';

// Mock CMS services
jest.mock('@/lib/cms/wordpress.service', () => ({ WordPressService: jest.fn().mockImplementation(() => ({ publish: jest.fn().mockResolvedValue({ success: true, platform: 'wordpress', contentId: 'wp-1', url: 'https://wp.com/1' }) })) }));
jest.mock('@/lib/cms/shopify.service', () => ({ ShopifyService: jest.fn().mockImplementation(() => ({ publish: jest.fn().mockResolvedValue({ success: true, platform: 'shopify', contentId: 'sh-1', url: 'https://shopify.com/1' }) })) }));
jest.mock('@/lib/cms/hubspot.service', () => ({ HubSpotService: jest.fn().mockImplementation(() => ({ publish: jest.fn().mockResolvedValue({ success: true, platform: 'hubspot', contentId: 'hs-1', url: 'https://hubspot.com/1' }) })) }));

describe('BulkPublisherService', () => {
  let service: BulkPublisherService;

  beforeEach(() => {
    service = new BulkPublisherService();
  });

  it('creates a bulk publish job and tracks progress', async () => {
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
    // Override WordPressService to fail first, then succeed
    const WordPressService = require('@/lib/cms/wordpress.service').WordPressService;
    let callCount = 0;
    WordPressService.mockImplementation(() => ({
      publish: jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) return Promise.resolve({ success: false, platform: 'wordpress', error: 'fail' });
        return Promise.resolve({ success: true, platform: 'wordpress', contentId: 'wp-2', url: 'https://wp.com/2' });
      })
    }));
    service = new BulkPublisherService();
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
    const bulkId = await service.createBulkPublishJob(request);
    await new Promise(res => setTimeout(res, 2500));
    const progress = await service.getBulkProgress(bulkId);
    expect(progress).toBeTruthy();
    expect(progress?.completedPlatforms).toBe(1);
    expect(progress?.platformResults[0].retryCount).toBeGreaterThan(0);
    expect(progress?.platformResults[0].status).toBe('completed');
  });

  it('marks job as failed if all platforms fail', async () => {
    // All platforms fail
    const ShopifyService = require('@/lib/cms/shopify.service').ShopifyService;
    ShopifyService.mockImplementation(() => ({
      publish: jest.fn().mockResolvedValue({ success: false, platform: 'shopify', error: 'fail' })
    }));
    service = new BulkPublisherService();
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