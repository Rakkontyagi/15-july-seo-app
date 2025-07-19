/**
 * Story 5.4: CMS Integration - Comprehensive Tests
 * Tests CMSIntegrationManager and various CMS adapters
 */

import { CMSIntegrationManager, WordPressAdapter, DrupalAdapter, type CMSConfig, type ContentPublishRequest } from '../cms-integration-manager';

// Mock fetch globally for all tests
global.fetch = jest.fn();

describe('Story 5.4: CMS Integration', () => {
  let cmsManager: CMSIntegrationManager;

  const mockWordPressConfig: CMSConfig = {
    type: 'WORDPRESS',
    apiEndpoint: 'https://example.com',
    apiKey: 'test-api-key',
    username: 'testuser',
    version: '5.8',
  };

  const mockDrupalConfig: CMSConfig = {
    type: 'DRUPAL',
    apiEndpoint: 'https://drupal-example.com',
    apiKey: 'drupal-api-key',
  };

  const testContent: ContentPublishRequest = {
    title: 'Test SEO Article',
    content: `
      # Advanced SEO Strategies

      This is a comprehensive guide to SEO optimization in 2025.

      ## Key Strategies

      - Keyword optimization
      - Content quality
      - Technical SEO
      - User experience

      ## Conclusion

      Implementing these strategies will improve your search rankings.
    `,
    excerpt: 'A comprehensive guide to SEO optimization',
    tags: ['SEO', 'Digital Marketing', 'Content Strategy'],
    categories: ['Marketing', 'SEO'],
    metaTitle: 'Advanced SEO Strategies for 2025',
    metaDescription: 'Learn the latest SEO strategies to improve your search rankings in 2025',
    slug: 'advanced-seo-strategies-2025',
    status: 'published',
  };

  beforeEach(() => {
    cmsManager = new CMSIntegrationManager();

    // Set up default fetch mocks
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/wp-json/wp/v2/users/me')) {
        // WordPress authentication
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ id: 1, name: 'Test User' }),
        });
      }
      if (url.includes('/wp-json/wp/v2/posts')) {
        // WordPress publish
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            id: 123,
            link: 'https://example.com/test-post',
            status: 'publish',
          }),
        });
      }
      // Default successful response
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('CMSIntegrationManager', () => {
    it('should register a CMS successfully', async () => {
      await expect(cmsManager.registerCMS('wordpress-test', mockWordPressConfig)).resolves.not.toThrow();
      
      const registeredCMS = cmsManager.getRegisteredCMS();
      expect(registeredCMS).toHaveLength(1);
      expect(registeredCMS[0].id).toBe('wordpress-test');
      expect(registeredCMS[0].type).toBe('WORDPRESS');
    });

    it('should register multiple CMS platforms', async () => {
      await cmsManager.registerCMS('wordpress-test', mockWordPressConfig);
      await cmsManager.registerCMS('drupal-test', mockDrupalConfig);

      const registeredCMS = cmsManager.getRegisteredCMS();
      expect(registeredCMS).toHaveLength(2);
      
      const cmsTypes = registeredCMS.map(cms => cms.type);
      expect(cmsTypes).toContain('WORDPRESS');
      expect(cmsTypes).toContain('DRUPAL');
    });

    it('should publish content to a registered CMS', async () => {
      await cmsManager.registerCMS('wordpress-test', mockWordPressConfig);
      
      const result = await cmsManager.publishContent('wordpress-test', testContent);
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('WordPress');
      expect(result.postId).toBeDefined();
    });

    it('should fail to publish to unregistered CMS', async () => {
      const result = await cmsManager.publishContent('nonexistent-cms', testContent);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('not found');
      expect(result.errors).toContain('CMS not registered');
    });

    it('should publish to multiple CMS platforms', async () => {
      await cmsManager.registerCMS('wordpress-test', mockWordPressConfig);
      await cmsManager.registerCMS('drupal-test', mockDrupalConfig);

      const results = await cmsManager.publishToMultipleCMS(
        ['wordpress-test', 'drupal-test'],
        testContent
      );

      expect(Object.keys(results)).toHaveLength(2);
      expect(results['wordpress-test'].success).toBe(true);
      expect(results['drupal-test'].success).toBe(true);
    });

    it('should get CMS capabilities', async () => {
      await cmsManager.registerCMS('wordpress-test', mockWordPressConfig);
      
      const capabilities = cmsManager.getCMSCapabilities('wordpress-test');
      
      expect(capabilities).toBeDefined();
      expect(capabilities?.supportsScheduling).toBe(true);
      expect(capabilities?.supportsCategories).toBe(true);
      expect(capabilities?.supportsTags).toBe(true);
      expect(capabilities?.supportsMetaData).toBe(true);
    });

    it('should test CMS connection', async () => {
      await cmsManager.registerCMS('wordpress-test', mockWordPressConfig);
      
      const connectionTest = await cmsManager.testConnection('wordpress-test');
      
      expect(connectionTest.connected).toBeDefined();
      expect(connectionTest.message).toBeDefined();
    });

    it('should validate content before publishing', async () => {
      await cmsManager.registerCMS('wordpress-test', mockWordPressConfig);
      
      const invalidContent: ContentPublishRequest = {
        title: '', // Invalid: empty title
        content: '', // Invalid: empty content
        status: 'published',
      };

      const result = await cmsManager.publishContent('wordpress-test', invalidContent);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('validation failed');
      expect(result.errors).toContain('Title is required');
      expect(result.errors).toContain('Content is required');
    });
  });

  describe('WordPressAdapter', () => {
    let adapter: WordPressAdapter;

    beforeEach(() => {
      adapter = new WordPressAdapter(mockWordPressConfig);
    });

    it('should have correct capabilities', () => {
      const capabilities = adapter.getCapabilities();
      
      expect(capabilities.supportsScheduling).toBe(true);
      expect(capabilities.supportsCategories).toBe(true);
      expect(capabilities.supportsTags).toBe(true);
      expect(capabilities.supportsCustomFields).toBe(true);
      expect(capabilities.supportsFeaturedImages).toBe(true);
      expect(capabilities.supportsMetaData).toBe(true);
      expect(capabilities.supportsRevisions).toBe(true);
      expect(capabilities.maxContentLength).toBe(65535);
    });

    it('should return correct type', () => {
      expect(adapter.getType()).toBe('WORDPRESS');
    });

    it('should transform content for WordPress format', async () => {
      const contentWithMarkdown = {
        ...testContent,
        content: '# Heading 1\n## Heading 2\n### Heading 3\nRegular content',
      };

      const transformed = await adapter.transformContent(contentWithMarkdown);
      
      expect(transformed.content).toContain('wp:heading');
      expect(transformed.content).toContain('<h1>Heading 1</h1>');
      expect(transformed.content).toContain('<h2>Heading 2</h2>');
      expect(transformed.content).toContain('<h3>Heading 3</h3>');
    });

    it('should handle authentication', async () => {
      // Mock fetch for authentication
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: 1, name: 'Test User' }),
      });

      await expect(adapter.authenticate()).resolves.not.toThrow();
      expect(adapter.isConnected()).toBe(true);
    });

    it('should handle authentication failure', async () => {
      // Mock fetch for failed authentication
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 401,
      });

      await expect(adapter.authenticate()).rejects.toThrow('WordPress authentication failed');
      expect(adapter.isConnected()).toBe(false);
    });

    it('should publish content successfully', async () => {
      // Mock successful authentication
      adapter['authenticated'] = true;

      // Mock successful publish
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          id: 123,
          link: 'https://example.com/test-post',
          status: 'publish',
        }),
      });

      const result = await adapter.publishContent(testContent);
      
      expect(result.success).toBe(true);
      expect(result.postId).toBe(123);
      expect(result.url).toBe('https://example.com/test-post');
      expect(result.message).toContain('successfully');
    });

    it('should handle publish failure', async () => {
      adapter['authenticated'] = true;

      // Mock failed publish
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        json: async () => ({
          message: 'Insufficient permissions',
        }),
      });

      const result = await adapter.publishContent(testContent);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('failed');
      expect(result.errors).toContain('Insufficient permissions');
    });

    it('should test connection', async () => {
      // Mock successful connection test
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
      });

      const isConnected = await adapter.testConnection();
      expect(isConnected).toBe(true);
    });
  });

  describe('DrupalAdapter', () => {
    let adapter: DrupalAdapter;

    beforeEach(() => {
      adapter = new DrupalAdapter(mockDrupalConfig);
    });

    it('should have correct capabilities', () => {
      const capabilities = adapter.getCapabilities();
      
      expect(capabilities.supportsScheduling).toBe(true);
      expect(capabilities.supportsCategories).toBe(true);
      expect(capabilities.supportsTags).toBe(true);
      expect(capabilities.supportsCustomFields).toBe(true);
      expect(capabilities.supportsFeaturedImages).toBe(true);
      expect(capabilities.supportsMetaData).toBe(true);
      expect(capabilities.supportsRevisions).toBe(true);
    });

    it('should return correct type', () => {
      expect(adapter.getType()).toBe('DRUPAL');
    });

    it('should authenticate successfully', async () => {
      await expect(adapter.authenticate()).resolves.not.toThrow();
      expect(adapter.isConnected()).toBe(true);
    });

    it('should publish content', async () => {
      const result = await adapter.publishContent(testContent);
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('Drupal');
      expect(result.postId).toBeDefined();
    });

    it('should test connection', async () => {
      const isConnected = await adapter.testConnection();
      expect(isConnected).toBe(true);
    });
  });

  describe('Content Validation', () => {
    beforeEach(async () => {
      await cmsManager.registerCMS('wordpress-test', mockWordPressConfig);
    });

    it('should validate required fields', async () => {
      const invalidContent: ContentPublishRequest = {
        title: '',
        content: '',
        status: 'published',
      };

      const result = await cmsManager.publishContent('wordpress-test', invalidContent);
      
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Title is required');
      expect(result.errors).toContain('Content is required');
    });

    it('should warn about unsupported features', async () => {
      // Register a CMS with limited capabilities
      const limitedConfig: CMSConfig = {
        type: 'JOOMLA', // Joomla doesn't support tags
        apiEndpoint: 'https://joomla-example.com',
        apiKey: 'joomla-key',
      };

      await cmsManager.registerCMS('joomla-test', limitedConfig);

      const contentWithTags: ContentPublishRequest = {
        ...testContent,
        tags: ['SEO', 'Marketing'], // Joomla doesn't support tags
      };

      const result = await cmsManager.publishContent('joomla-test', contentWithTags);
      
      // Should still succeed but with warnings
      expect(result.success).toBe(true);
      expect(result.warnings).toContain('Tags not supported by this CMS - will be ignored');
    });

    it('should validate content length limits', async () => {
      // Mock a CMS with content length limit
      const limitedConfig: CMSConfig = {
        type: 'CUSTOM',
        apiEndpoint: 'https://limited-cms.com',
        apiKey: 'limited-key',
      };

      await cmsManager.registerCMS('limited-test', limitedConfig);

      // Override capabilities to set a low limit
      const adapter = cmsManager['cmsAdapters'].get('limited-test');
      if (adapter) {
        adapter.getCapabilities = () => ({
          supportsScheduling: true,
          supportsCategories: true,
          supportsTags: true,
          supportsCustomFields: true,
          supportsFeaturedImages: true,
          supportsMetaData: true,
          supportsRevisions: true,
          maxContentLength: 100, // Very low limit
        });
      }

      const longContent: ContentPublishRequest = {
        ...testContent,
        content: 'A'.repeat(200), // Exceeds limit
      };

      const result = await cmsManager.publishContent('limited-test', longContent);
      
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Content exceeds maximum length of 100 characters');
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      await cmsManager.registerCMS('wordpress-test', mockWordPressConfig);

      // Mock network error
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      const result = await cmsManager.publishContent('wordpress-test', testContent);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('error');
    });

    it('should handle invalid CMS configuration', async () => {
      const invalidConfig: CMSConfig = {
        type: 'WORDPRESS',
        apiEndpoint: 'invalid-url', // Invalid URL
        apiKey: '',
      };

      await expect(cmsManager.registerCMS('invalid-test', invalidConfig)).rejects.toThrow();
    });
  });

  describe('Integration Workflow', () => {
    it('should complete full CMS integration workflow', async () => {
      // Step 1: Register multiple CMS platforms
      await cmsManager.registerCMS('wordpress-main', mockWordPressConfig);
      await cmsManager.registerCMS('drupal-backup', mockDrupalConfig);

      // Step 2: Test connections
      const wpConnection = await cmsManager.testConnection('wordpress-main');
      const drupalConnection = await cmsManager.testConnection('drupal-backup');
      
      expect(wpConnection.connected).toBeDefined();
      expect(drupalConnection.connected).toBeDefined();

      // Step 3: Get capabilities
      const wpCapabilities = cmsManager.getCMSCapabilities('wordpress-main');
      const drupalCapabilities = cmsManager.getCMSCapabilities('drupal-backup');
      
      expect(wpCapabilities).toBeDefined();
      expect(drupalCapabilities).toBeDefined();

      // Step 4: Publish to multiple platforms
      const results = await cmsManager.publishToMultipleCMS(
        ['wordpress-main', 'drupal-backup'],
        testContent
      );

      expect(Object.keys(results)).toHaveLength(2);
      expect(results['wordpress-main'].success).toBe(true);
      expect(results['drupal-backup'].success).toBe(true);

      // Step 5: Verify registration status
      const registeredCMS = cmsManager.getRegisteredCMS();
      expect(registeredCMS).toHaveLength(2);
      expect(registeredCMS.every(cms => cms.status === 'connected')).toBe(true);
    });
  });

  describe('Performance', () => {
    it('should handle concurrent publishing', async () => {
      await cmsManager.registerCMS('wordpress-1', mockWordPressConfig);
      await cmsManager.registerCMS('wordpress-2', { ...mockWordPressConfig, apiEndpoint: 'https://example2.com' });
      await cmsManager.registerCMS('wordpress-3', { ...mockWordPressConfig, apiEndpoint: 'https://example3.com' });

      const startTime = Date.now();
      
      const results = await cmsManager.publishToMultipleCMS(
        ['wordpress-1', 'wordpress-2', 'wordpress-3'],
        testContent
      );

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time (concurrent execution)
      expect(duration).toBeLessThan(5000); // 5 seconds
      expect(Object.keys(results)).toHaveLength(3);
      expect(Object.values(results).every(r => r.success)).toBe(true);
    });
  });
});
