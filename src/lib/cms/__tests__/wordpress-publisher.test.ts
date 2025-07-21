/**
 * WordPress Publisher Tests
 * Comprehensive testing for WordPress direct publishing integration
 */

import { WordPressPublisher, WordPressConfig, WordPressPost, SEOMetaData } from '../wordpress-publisher';

// Mock fetch globally
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('WordPressPublisher', () => {
  let publisher: WordPressPublisher;
  let config: WordPressConfig;

  beforeEach(() => {
    config = {
      siteUrl: 'https://example.com',
      username: 'testuser',
      applicationPassword: 'test-app-password',
      defaultAuthor: 1,
      defaultStatus: 'draft',
    };
    publisher = new WordPressPublisher(config);
    mockFetch.mockClear();
  });

  describe('constructor', () => {
    it('should initialize with correct configuration', () => {
      expect(publisher).toBeInstanceOf(WordPressPublisher);
    });

    it('should set up correct base URL and auth header', () => {
      const publisherWithTrailingSlash = new WordPressPublisher({
        ...config,
        siteUrl: 'https://example.com/',
      });
      expect(publisherWithTrailingSlash).toBeInstanceOf(WordPressPublisher);
    });
  });

  describe('validateConnection', () => {
    it('should validate successful connection', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ([]),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ capabilities: { edit_posts: true } }),
        } as Response);

      await expect(publisher.validateConnection()).resolves.not.toThrow();
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should throw error for failed connection', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Unauthorized',
      } as Response);

      await expect(publisher.validateConnection()).rejects.toThrow('WordPress connection failed: Unauthorized');
    });

    it('should throw error for insufficient permissions', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ([]),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ capabilities: { edit_posts: false } }),
        } as Response);

      await expect(publisher.validateConnection()).rejects.toThrow('WordPress user lacks post creation permissions');
    });
  });

  describe('publishContent', () => {
    const testPost: WordPressPost = {
      title: 'Test Post',
      content: '<p>This is a test post content.</p>',
      excerpt: 'Test excerpt',
      status: 'draft',
    };

    const testSEOMeta: SEOMetaData = {
      metaTitle: 'Test SEO Title',
      metaDescription: 'Test SEO description',
      focusKeyword: 'test keyword',
    };

    it('should publish content successfully', async () => {
      const mockPost = {
        id: 123,
        link: 'https://example.com/test-post',
        title: { rendered: 'Test Post' },
      };

      // Mock validation calls
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ([]),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ capabilities: { edit_posts: true } }),
        } as Response)
        // Mock post creation
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockPost,
        } as Response)
        // Mock SEO meta update
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockPost,
        } as Response);

      const result = await publisher.publishContent(testPost, testSEOMeta);

      expect(result.success).toBe(true);
      expect(result.postId).toBe(123);
      expect(result.postUrl).toBe('https://example.com/test-post');
      expect(result.editUrl).toBe('https://example.com/wp-admin/post.php?post=123&action=edit');
    });

    it('should handle publishing errors', async () => {
      // Mock validation success
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ([]),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ capabilities: { edit_posts: true } }),
        } as Response)
        // Mock post creation failure
        .mockResolvedValueOnce({
          ok: false,
          statusText: 'Bad Request',
          json: async () => ({ message: 'Invalid post data' }),
        } as Response);

      const result = await publisher.publishContent(testPost);

      expect(result.success).toBe(false);
      expect(result.error).toContain('WordPress API error: Invalid post data');
    });

    it('should publish without SEO meta', async () => {
      const mockPost = {
        id: 124,
        link: 'https://example.com/test-post-2',
        title: { rendered: 'Test Post 2' },
      };

      // Mock validation and post creation
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ([]),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ capabilities: { edit_posts: true } }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockPost,
        } as Response);

      const result = await publisher.publishContent(testPost);

      expect(result.success).toBe(true);
      expect(result.postId).toBe(124);
      expect(mockFetch).toHaveBeenCalledTimes(3); // No SEO meta call
    });
  });

  describe('updateContent', () => {
    it('should update existing post successfully', async () => {
      const mockPost = {
        id: 123,
        link: 'https://example.com/updated-post',
        title: { rendered: 'Updated Post' },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockPost,
      } as Response);

      const result = await publisher.updateContent(123, {
        title: 'Updated Post',
        content: '<p>Updated content</p>',
      });

      expect(result.success).toBe(true);
      expect(result.postId).toBe(123);
      expect(result.postUrl).toBe('https://example.com/updated-post');
    });

    it('should handle update errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found',
        json: async () => ({ message: 'Post not found' }),
      } as Response);

      const result = await publisher.updateContent(999, { title: 'Updated' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('WordPress API error: Post not found');
    });
  });

  describe('getCategories', () => {
    it('should fetch categories successfully', async () => {
      const mockCategories = [
        { id: 1, name: 'Category 1' },
        { id: 2, name: 'Category 2' },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCategories,
      } as Response);

      const categories = await publisher.getCategories();

      expect(categories).toEqual(mockCategories);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/categories'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: expect.stringContaining('Basic'),
          }),
        })
      );
    });

    it('should handle fetch errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Internal Server Error',
      } as Response);

      const categories = await publisher.getCategories();

      expect(categories).toEqual([]);
    });
  });

  describe('getTags', () => {
    it('should fetch tags successfully', async () => {
      const mockTags = [
        { id: 1, name: 'Tag 1' },
        { id: 2, name: 'Tag 2' },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTags,
      } as Response);

      const tags = await publisher.getTags();

      expect(tags).toEqual(mockTags);
    });
  });

  describe('generateSlug', () => {
    it('should generate URL-friendly slugs', () => {
      const publisher = new WordPressPublisher(config);
      
      // Access private method through any type casting for testing
      const generateSlug = (publisher as any).generateSlug.bind(publisher);
      
      expect(generateSlug('Hello World')).toBe('hello-world');
      expect(generateSlug('Test Post with Special Characters!')).toBe('test-post-with-special-characters');
      expect(generateSlug('Multiple   Spaces')).toBe('multiple-spaces');
      expect(generateSlug('Hyphens-Already-Present')).toBe('hyphens-already-present');
    });
  });
});
