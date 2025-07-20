/**
 * Shopify Publisher Tests
 * Comprehensive testing for Shopify direct publishing integration
 */

import { ShopifyPublisher, ShopifyConfig, ShopifyProduct, ShopifyPage } from '../shopify-publisher';

// Mock fetch globally
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('ShopifyPublisher', () => {
  let publisher: ShopifyPublisher;
  let config: ShopifyConfig;

  beforeEach(() => {
    config = {
      shopDomain: 'test-store.myshopify.com',
      accessToken: 'test-access-token',
      apiVersion: '2024-01',
    };
    publisher = new ShopifyPublisher(config);
    mockFetch.mockClear();
  });

  describe('constructor', () => {
    it('should initialize with correct configuration', () => {
      expect(publisher).toBeInstanceOf(ShopifyPublisher);
    });

    it('should use default API version if not provided', () => {
      const configWithoutVersion = {
        shopDomain: 'test-store.myshopify.com',
        accessToken: 'test-access-token',
      };
      const publisherWithDefaults = new ShopifyPublisher(configWithoutVersion);
      expect(publisherWithDefaults).toBeInstanceOf(ShopifyPublisher);
    });
  });

  describe('validateConnection', () => {
    it('should validate successful connection', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ shop: { name: 'Test Store' } }),
      } as Response);

      await expect(publisher.validateConnection()).resolves.not.toThrow();
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/shop.json'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Shopify-Access-Token': 'test-access-token',
          }),
        })
      );
    });

    it('should throw error for failed connection', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Unauthorized',
      } as Response);

      await expect(publisher.validateConnection()).rejects.toThrow('Shopify connection failed: Unauthorized');
    });

    it('should throw error for invalid response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      } as Response);

      await expect(publisher.validateConnection()).rejects.toThrow('Invalid Shopify response');
    });
  });

  describe('publishProduct', () => {
    const testProduct: ShopifyProduct = {
      title: 'Test Product',
      body_html: '<p>This is a test product description.</p>',
      vendor: 'Test Vendor',
      product_type: 'Test Type',
      tags: 'test, product',
      status: 'draft',
      variants: [{
        title: 'Default',
        price: '29.99',
        inventory_quantity: 10,
      }],
      seo: {
        title: 'Test Product SEO Title',
        description: 'Test product SEO description',
      },
    };

    it('should publish product successfully', async () => {
      const mockProduct = {
        id: 123456789,
        handle: 'test-product',
        title: 'Test Product',
      };

      // Mock validation
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ shop: { name: 'Test Store' } }),
        } as Response)
        // Mock product creation
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ product: mockProduct }),
        } as Response);

      const result = await publisher.publishProduct(testProduct);

      expect(result.success).toBe(true);
      expect(result.productId).toBe(123456789);
      expect(result.productUrl).toBe('https://test-store.myshopify.com/products/test-product');
      expect(result.adminUrl).toBe('https://test-store.myshopify.com/admin/products/123456789');
      expect(result.handle).toBe('test-product');
    });

    it('should handle publishing errors', async () => {
      // Mock validation success
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ shop: { name: 'Test Store' } }),
        } as Response)
        // Mock product creation failure
        .mockResolvedValueOnce({
          ok: false,
          statusText: 'Bad Request',
          json: async () => ({ errors: 'Invalid product data' }),
        } as Response);

      const result = await publisher.publishProduct(testProduct);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Shopify API error: Invalid product data');
    });

    it('should publish product with metafields', async () => {
      const productWithMetafields: ShopifyProduct = {
        ...testProduct,
        metafields: [{
          namespace: 'custom',
          key: 'description',
          value: 'Custom description',
          type: 'single_line_text_field',
        }],
      };

      const mockProduct = {
        id: 123456789,
        handle: 'test-product',
        title: 'Test Product',
      };

      // Mock validation, product creation, and metafield creation
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ shop: { name: 'Test Store' } }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ product: mockProduct }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ metafield: { id: 1 } }),
        } as Response);

      const result = await publisher.publishProduct(productWithMetafields);

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(3); // validation + product + metafield
    });
  });

  describe('updateProduct', () => {
    it('should update existing product successfully', async () => {
      const mockProduct = {
        id: 123456789,
        handle: 'updated-product',
        title: 'Updated Product',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ product: mockProduct }),
      } as Response);

      const result = await publisher.updateProduct(123456789, {
        title: 'Updated Product',
        body_html: '<p>Updated description</p>',
      });

      expect(result.success).toBe(true);
      expect(result.productId).toBe(123456789);
      expect(result.productUrl).toBe('https://test-store.myshopify.com/products/updated-product');
    });

    it('should handle update errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found',
        json: async () => ({ errors: 'Product not found' }),
      } as Response);

      const result = await publisher.updateProduct(999999999, { title: 'Updated' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Shopify API error: Product not found');
    });
  });

  describe('publishPage', () => {
    const testPage: ShopifyPage = {
      title: 'Test Page',
      body_html: '<p>This is a test page content.</p>',
      handle: 'test-page',
      published: true,
      seo: {
        title: 'Test Page SEO Title',
        description: 'Test page SEO description',
      },
    };

    it('should publish page successfully', async () => {
      const mockPage = {
        id: 987654321,
        handle: 'test-page',
        title: 'Test Page',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ page: mockPage }),
      } as Response);

      const result = await publisher.publishPage(testPage);

      expect(result.success).toBe(true);
      expect(result.productId).toBe(987654321);
      expect(result.productUrl).toBe('https://test-store.myshopify.com/pages/test-page');
      expect(result.adminUrl).toBe('https://test-store.myshopify.com/admin/pages/987654321');
    });
  });

  describe('getShopInfo', () => {
    it('should fetch shop information successfully', async () => {
      const mockShop = {
        name: 'Test Store',
        currency: 'USD',
        timezone: 'America/New_York',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ shop: mockShop }),
      } as Response);

      const shopInfo = await publisher.getShopInfo();

      expect(shopInfo).toEqual(mockShop);
    });

    it('should handle fetch errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Internal Server Error',
      } as Response);

      const shopInfo = await publisher.getShopInfo();

      expect(shopInfo).toBeNull();
    });
  });

  describe('generateHandle', () => {
    it('should generate URL-friendly handles', () => {
      const publisher = new ShopifyPublisher(config);
      
      // Access private method through any type casting for testing
      const generateHandle = (publisher as any).generateHandle.bind(publisher);
      
      expect(generateHandle('Hello World')).toBe('hello-world');
      expect(generateHandle('Test Product with Special Characters!')).toBe('test-product-with-special-characters');
      expect(generateHandle('Multiple   Spaces')).toBe('multiple-spaces');
      expect(generateHandle('Hyphens-Already-Present')).toBe('hyphens-already-present');
    });
  });

  describe('prepareProductData', () => {
    it('should prepare product data with defaults', () => {
      const publisher = new ShopifyPublisher(config);
      const prepareProductData = (publisher as any).prepareProductData.bind(publisher);

      const product: ShopifyProduct = {
        title: 'Test Product',
        body_html: '<p>Test description</p>',
      };

      const prepared = prepareProductData(product);

      expect(prepared.title).toBe('Test Product');
      expect(prepared.body_html).toBe('<p>Test description</p>');
      expect(prepared.status).toBe('draft');
      expect(prepared.published_scope).toBe('web');
      expect(prepared.handle).toBe('test-product');
      expect(prepared.variants).toHaveLength(1);
      expect(prepared.variants[0].title).toBe('Default Title');
    });

    it('should preserve provided variants', () => {
      const publisher = new ShopifyPublisher(config);
      const prepareProductData = (publisher as any).prepareProductData.bind(publisher);

      const product: ShopifyProduct = {
        title: 'Test Product',
        body_html: '<p>Test description</p>',
        variants: [{
          title: 'Custom Variant',
          price: '19.99',
          sku: 'TEST-SKU',
        }],
      };

      const prepared = prepareProductData(product);

      expect(prepared.variants).toHaveLength(1);
      expect(prepared.variants[0].title).toBe('Custom Variant');
      expect(prepared.variants[0].price).toBe('19.99');
      expect(prepared.variants[0].sku).toBe('TEST-SKU');
    });
  });
});
