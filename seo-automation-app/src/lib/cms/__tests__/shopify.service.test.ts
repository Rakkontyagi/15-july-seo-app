// Shopify Service Unit Tests

import { ShopifyService } from '../shopify.service';
import { CMSCredentials, CMSContent } from '@/types/cms';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock logger
jest.mock('@/lib/logging/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
  createServiceLogger: () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  })
}));

describe('ShopifyService', () => {
  let shopifyService: ShopifyService;
  let mockCredentials: CMSCredentials;
  let mockAxiosInstance: any;

  beforeEach(() => {
    // Setup mock axios instance
    mockAxiosInstance = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() }
      }
    };

    mockedAxios.create.mockReturnValue(mockAxiosInstance);

    // Setup test credentials
    mockCredentials = {
      platform: 'shopify',
      endpoint: 'https://test-store.myshopify.com/admin/api/2024-01',
      apiKey: 'test-access-token',
      storeId: 'test-store'
    };

    shopifyService = new ShopifyService(mockCredentials);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should extract store ID from endpoint', () => {
      const credentials = {
        platform: 'shopify' as const,
        endpoint: 'https://my-store.myshopify.com',
        apiKey: 'test-token'
      };

      expect(() => new ShopifyService(credentials)).not.toThrow();
    });

    it('should throw error for invalid endpoint format', () => {
      const credentials = {
        platform: 'shopify' as const,
        endpoint: 'https://invalid-endpoint.com',
        apiKey: 'test-token'
      };

      expect(() => new ShopifyService(credentials)).toThrow('Invalid Shopify endpoint format');
    });
  });

  describe('validateCredentials', () => {
    it('should return true for valid credentials', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({
        status: 200,
        data: { shop: { name: 'Test Store' } }
      });

      const result = await shopifyService.validateCredentials();

      expect(result).toBe(true);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/shop.json');
    });

    it('should return false for invalid credentials', async () => {
      mockAxiosInstance.get.mockRejectedValueOnce(new Error('Unauthorized'));

      const result = await shopifyService.validateCredentials();

      expect(result).toBe(false);
    });
  });

  describe('publish', () => {
    const mockContent: CMSContent = {
      title: 'Test Product',
      content: '<p>This is test product description</p>',
      excerpt: 'Test excerpt',
      status: 'published',
      tags: ['electronics', 'gadgets'],
      author: 'SEO Generator'
    };

    it('should successfully publish product', async () => {
      // Mock duplicate check (no duplicates)
      jest.spyOn(shopifyService, 'listContent').mockResolvedValueOnce([]);

      // Mock product creation
      mockAxiosInstance.post.mockResolvedValueOnce({
        data: {
          product: {
            id: 123456789,
            title: 'Test Product',
            handle: 'test-product',
            created_at: '2025-01-17T10:00:00-05:00',
            body_html: '<p>This is test product description</p>',
            status: 'active'
          }
        }
      });

      // Mock metafields creation (SEO data)
      mockAxiosInstance.post.mockResolvedValueOnce({ data: {} });

      const result = await shopifyService.publish(mockContent);

      expect(result).toEqual({
        success: true,
        platform: 'shopify',
        contentId: '123456789',
        url: 'https://test-store.myshopify.com/products/test-product',
        publishedAt: new Date('2025-01-17T10:00:00-05:00')
      });

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/products.json', {
        product: expect.objectContaining({
          title: 'Test Product',
          body_html: '<p>This is test product description</p>',
          status: 'active',
          tags: 'electronics, gadgets'
        })
      });
    });

    it('should handle duplicate product when updateIfExists is false', async () => {
      // Mock the listContent method to return existing product
      jest.spyOn(shopifyService, 'listContent').mockResolvedValueOnce([
        { 
          id: '100', 
          title: 'Test Product',
          content: 'Existing content',
          status: 'published'
        } as CMSContent
      ]);

      const result = await shopifyService.publish(mockContent, { updateIfExists: false });

      expect(result).toEqual({
        success: false,
        platform: 'shopify',
        error: 'Product with this title already exists',
        details: { existingId: '100' }
      });
    });

    it('should update existing product when updateIfExists is true', async () => {
      // Mock the listContent method to return existing product
      jest.spyOn(shopifyService, 'listContent').mockResolvedValueOnce([
        { 
          id: '100', 
          title: 'Test Product',
          content: 'Existing content',
          status: 'published'
        } as CMSContent
      ]);

      // Mock update
      mockAxiosInstance.put.mockResolvedValueOnce({
        data: {
          product: {
            id: 100,
            handle: 'test-product-updated',
            updated_at: '2025-01-17T11:00:00-05:00'
          }
        }
      });

      // Mock metafields update
      mockAxiosInstance.post.mockResolvedValueOnce({ data: {} });

      const result = await shopifyService.publish(mockContent, { updateIfExists: true });

      expect(result).toEqual({
        success: true,
        platform: 'shopify',
        contentId: '100',
        url: 'https://test-store.myshopify.com/products/test-product-updated',
        publishedAt: new Date('2025-01-17T11:00:00-05:00')
      });
    });

    it('should handle publish errors gracefully', async () => {
      jest.spyOn(shopifyService, 'listContent').mockResolvedValueOnce([]); // No duplicates
      mockAxiosInstance.post.mockRejectedValueOnce(new Error('API Error'));

      const result = await shopifyService.publish(mockContent);

      expect(result).toEqual({
        success: false,
        platform: 'shopify',
        error: 'API Error',
        details: expect.any(Error)
      });
    });
  });

  describe('update', () => {
    const mockContent: CMSContent = {
      title: 'Updated Product',
      content: '<p>Updated description</p>',
      status: 'published'
    };

    it('should successfully update product', async () => {
      mockAxiosInstance.put.mockResolvedValueOnce({
        data: {
          product: {
            id: 123,
            handle: 'updated-product',
            updated_at: '2025-01-17T12:00:00-05:00'
          }
        }
      });

      // Mock metafields update
      mockAxiosInstance.post.mockResolvedValueOnce({ data: {} });

      const result = await shopifyService.update('123', mockContent);

      expect(result).toEqual({
        success: true,
        platform: 'shopify',
        contentId: '123',
        url: 'https://test-store.myshopify.com/products/updated-product',
        publishedAt: new Date('2025-01-17T12:00:00-05:00')
      });

      expect(mockAxiosInstance.put).toHaveBeenCalledWith('/products/123.json', {
        product: expect.any(Object)
      });
    });
  });

  describe('delete', () => {
    it('should successfully delete product', async () => {
      mockAxiosInstance.delete.mockResolvedValueOnce({ data: {} });

      const result = await shopifyService.delete('123');

      expect(result).toBe(true);
      expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/products/123.json');
    });

    it('should return false on delete error', async () => {
      mockAxiosInstance.delete.mockRejectedValueOnce(new Error('Not found'));

      const result = await shopifyService.delete('123');

      expect(result).toBe(false);
    });
  });

  describe('getContent', () => {
    it('should retrieve and transform product', async () => {
      // Mock product fetch
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: {
          product: {
            id: 123,
            title: 'Test Product',
            body_html: '<p>Product description</p>',
            handle: 'test-product',
            status: 'active',
            created_at: '2025-01-17T10:00:00-05:00',
            tags: 'electronics, gadgets',
            vendor: 'Test Vendor'
          }
        }
      });

      // Mock SEO metafields fetch
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: {
          metafields: [
            { key: 'title', value: 'SEO Title' },
            { key: 'description', value: 'SEO Description' }
          ]
        }
      });

      const result = await shopifyService.getContent('123');

      expect(result).toEqual({
        id: '123',
        title: 'Test Product',
        content: '<p>Product description</p>',
        excerpt: 'Product description',
        slug: 'test-product',
        status: 'published',
        categories: ['Uncategorized'],
        tags: ['electronics', 'gadgets'],
        author: 'Test Vendor',
        metaTitle: 'SEO Title',
        metaDescription: 'SEO Description',
        customFields: expect.any(Object)
      });
    });

    it('should return null for non-existent product', async () => {
      mockAxiosInstance.get.mockRejectedValueOnce(new Error('Not found'));

      const result = await shopifyService.getContent('999');

      expect(result).toBeNull();
    });
  });

  describe('listContent', () => {
    it('should list products with filters', async () => {
      // Mock products fetch
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: {
          products: [
            {
              id: 1,
              title: 'Product 1',
              body_html: '<p>Description 1</p>',
              status: 'active',
              handle: 'product-1'
            },
            {
              id: 2,
              title: 'Product 2',
              body_html: '<p>Description 2</p>',
              status: 'draft',
              handle: 'product-2'
            }
          ]
        }
      });

      // Mock SEO metafields for each product
      mockAxiosInstance.get
        .mockResolvedValueOnce({ data: { metafields: [] } })
        .mockResolvedValueOnce({ data: { metafields: [] } });

      const result = await shopifyService.listContent({
        limit: 10,
        page: 1,
        status: 'any'
      });

      expect(result).toHaveLength(2);
      expect(result[0].title).toBe('Product 1');
      expect(result[1].title).toBe('Product 2');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/products.json', {
        params: expect.objectContaining({
          limit: 10,
          page: 1,
          status: 'any'
        })
      });
    });
  });

  describe('getSyncStatus', () => {
    it('should detect when local is ahead', async () => {
      // Mock product fetch
      mockAxiosInstance.get
        .mockResolvedValueOnce({
          data: {
            product: {
              id: 123,
              updated_at: '2025-01-17T10:00:00-05:00',
              title: 'Test Product',
              body_html: '<p>Content</p>',
              status: 'active'
            }
          }
        })
        .mockResolvedValueOnce({ data: { metafields: [] } });

      const localVersion = '2025-01-17T11:00:00-05:00'; // Newer than remote
      const result = await shopifyService.getSyncStatus('123', localVersion);

      expect(result.syncStatus).toBe('local_ahead');
      expect(result.differences).toContain('Version mismatch');
    });

    it('should detect when remote is ahead', async () => {
      // Mock product fetch
      mockAxiosInstance.get
        .mockResolvedValueOnce({
          data: {
            product: {
              id: 123,
              updated_at: '2025-01-17T12:00:00-05:00',
              title: 'Test Product',
              body_html: '<p>Content</p>',
              status: 'active'
            }
          }
        })
        .mockResolvedValueOnce({ data: { metafields: [] } });

      const localVersion = '2025-01-17T10:00:00-05:00'; // Older than remote
      const result = await shopifyService.getSyncStatus('123', localVersion);

      expect(result.syncStatus).toBe('remote_ahead');
      expect(result.differences).toContain('Version mismatch');
    });

    it('should detect when synced', async () => {
      const syncTime = '2025-01-17T10:00:00.000Z';
      
      // Mock product fetch
      mockAxiosInstance.get
        .mockResolvedValueOnce({
          data: {
            product: {
              id: 123,
              updated_at: syncTime,
              title: 'Test Product',
              body_html: '<p>Content</p>',
              status: 'active'
            }
          }
        })
        .mockResolvedValueOnce({ data: { metafields: [] } });

      const result = await shopifyService.getSyncStatus('123', syncTime);

      expect(result.syncStatus).toBe('synced');
      expect(result.differences).toBeUndefined();
    });
  });
});