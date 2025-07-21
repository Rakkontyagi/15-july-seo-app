// WordPress Service Unit Tests

import { WordPressService } from '../wordpress.service';
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

describe('WordPressService', () => {
  let wpService: WordPressService;
  let mockCredentials: CMSCredentials;
  let mockAxiosInstance: any;

  beforeEach(() => {
    // Setup mock axios instance
    mockAxiosInstance = {
      get: jest.fn(),
      post: jest.fn(),
      patch: jest.fn(),
      delete: jest.fn(),
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() }
      }
    };

    mockedAxios.create.mockReturnValue(mockAxiosInstance);

    // Setup test credentials
    mockCredentials = {
      platform: 'wordpress',
      endpoint: 'https://example.com/wp-json/wp/v2',
      username: 'testuser',
      password: 'testpass'
    };

    wpService = new WordPressService(mockCredentials);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateCredentials', () => {
    it('should return true for valid credentials', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({
        status: 200,
        data: { id: 1, name: 'Test User' }
      });

      const result = await wpService.validateCredentials();

      expect(result).toBe(true);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/users/me');
    });

    it('should return false for invalid credentials', async () => {
      mockAxiosInstance.get.mockRejectedValueOnce(new Error('Unauthorized'));

      const result = await wpService.validateCredentials();

      expect(result).toBe(false);
    });
  });

  describe('publish', () => {
    const mockContent: CMSContent = {
      title: 'Test Post',
      content: '<p>This is test content</p>',
      excerpt: 'Test excerpt',
      status: 'published',
      categories: ['Technology'],
      tags: ['test', 'wordpress']
    };

    it('should successfully publish content', async () => {
      // Mock duplicate check first (no duplicates)
      mockAxiosInstance.get
        .mockResolvedValueOnce({ data: [] }) // No duplicates
        .mockResolvedValueOnce({ data: [{ id: 5, name: 'Technology' }] }) // Category lookup
        .mockResolvedValueOnce({ data: [{ id: 10, name: 'test' }] }) // Tag lookup 1
        .mockResolvedValueOnce({ data: [{ id: 11, name: 'wordpress' }] }); // Tag lookup 2

      // Mock post creation
      mockAxiosInstance.post.mockResolvedValueOnce({
        data: {
          id: 123,
          link: 'https://example.com/test-post',
          date: '2025-01-17T10:00:00',
          title: { rendered: 'Test Post' },
          content: { rendered: '<p>This is test content</p>' },
          status: 'publish'
        }
      });

      const result = await wpService.publish(mockContent);

      expect(result).toEqual({
        success: true,
        platform: 'wordpress',
        contentId: '123',
        url: 'https://example.com/test-post',
        publishedAt: new Date('2025-01-17T10:00:00')
      });

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/posts', expect.objectContaining({
        title: { rendered: 'Test Post' },
        content: { rendered: '<p>This is test content</p>' },
        excerpt: { rendered: 'Test excerpt' },
        status: 'publish',
        categories: [5],
        tags: [10, 11]
      }));
    });

    it('should handle duplicate content when updateIfExists is false', async () => {
      // Mock the listContent method to return existing content
      jest.spyOn(wpService, 'listContent').mockResolvedValueOnce([
        { 
          id: '100', 
          title: 'Test Post',
          content: 'Existing content',
          status: 'published'
        } as CMSContent
      ]);

      const result = await wpService.publish(mockContent, { updateIfExists: false });

      expect(result).toEqual({
        success: false,
        platform: 'wordpress',
        error: 'Content with this title already exists',
        details: { existingId: '100' }
      });
    });

    it('should update existing content when updateIfExists is true', async () => {
      // Mock the listContent method to return existing content
      jest.spyOn(wpService, 'listContent').mockResolvedValueOnce([
        { 
          id: '100', 
          title: 'Test Post',
          content: 'Existing content',
          status: 'published'
        } as CMSContent
      ]);

      // Mock category and tag lookups for update
      mockAxiosInstance.get
        .mockResolvedValueOnce({ data: [{ id: 5, name: 'Technology' }] })
        .mockResolvedValueOnce({ data: [{ id: 10, name: 'test' }] })
        .mockResolvedValueOnce({ data: [{ id: 11, name: 'wordpress' }] });

      // Mock update
      mockAxiosInstance.patch.mockResolvedValueOnce({
        data: {
          id: 100,
          link: 'https://example.com/test-post-updated',
          modified: '2025-01-17T11:00:00'
        }
      });

      const result = await wpService.publish(mockContent, { updateIfExists: true });

      expect(result).toEqual({
        success: true,
        platform: 'wordpress',
        contentId: '100',
        url: 'https://example.com/test-post-updated',
        publishedAt: new Date('2025-01-17T11:00:00')
      });
    });

    it('should handle publish errors gracefully', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({ data: [] }); // No duplicates
      mockAxiosInstance.post.mockRejectedValueOnce(new Error('Network error'));

      const result = await wpService.publish(mockContent);

      expect(result).toEqual({
        success: false,
        platform: 'wordpress',
        error: 'Network error',
        details: expect.any(Error)
      });
    });
  });

  describe('update', () => {
    const mockContent: CMSContent = {
      title: 'Updated Post',
      content: '<p>Updated content</p>',
      status: 'published'
    };

    it('should successfully update content', async () => {
      mockAxiosInstance.patch.mockResolvedValueOnce({
        data: {
          id: 123,
          link: 'https://example.com/updated-post',
          modified: '2025-01-17T12:00:00'
        }
      });

      const result = await wpService.update('123', mockContent);

      expect(result).toEqual({
        success: true,
        platform: 'wordpress',
        contentId: '123',
        url: 'https://example.com/updated-post',
        publishedAt: new Date('2025-01-17T12:00:00')
      });

      expect(mockAxiosInstance.patch).toHaveBeenCalledWith('/posts/123', expect.any(Object));
    });
  });

  describe('delete', () => {
    it('should successfully delete content', async () => {
      mockAxiosInstance.delete.mockResolvedValueOnce({ data: {} });

      const result = await wpService.delete('123');

      expect(result).toBe(true);
      expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/posts/123', {
        params: { force: true }
      });
    });

    it('should return false on delete error', async () => {
      mockAxiosInstance.delete.mockRejectedValueOnce(new Error('Not found'));

      const result = await wpService.delete('123');

      expect(result).toBe(false);
    });
  });

  describe('getContent', () => {
    it('should retrieve and transform content', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: {
          id: 123,
          title: { rendered: 'Test Post' },
          content: { rendered: '<p>Test content</p>' },
          excerpt: { rendered: 'Test excerpt' },
          slug: 'test-post',
          status: 'publish',
          date: '2025-01-17T10:00:00',
          link: 'https://example.com/test-post'
        }
      });

      const result = await wpService.getContent('123');

      expect(result).toEqual({
        id: '123',
        title: 'Test Post',
        content: '<p>Test content</p>',
        excerpt: 'Test excerpt',
        slug: 'test-post',
        status: 'published',
        publishDate: new Date('2025-01-17T10:00:00'),
        categories: [],
        tags: [],
        canonicalUrl: 'https://example.com/test-post',
        customFields: expect.any(Object)
      });
    });

    it('should return null for non-existent content', async () => {
      mockAxiosInstance.get.mockRejectedValueOnce(new Error('Not found'));

      const result = await wpService.getContent('999');

      expect(result).toBeNull();
    });
  });

  describe('listContent', () => {
    it('should list content with filters', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: [
          {
            id: 1,
            title: { rendered: 'Post 1' },
            content: { rendered: '<p>Content 1</p>' },
            status: 'publish'
          },
          {
            id: 2,
            title: { rendered: 'Post 2' },
            content: { rendered: '<p>Content 2</p>' },
            status: 'draft'
          }
        ]
      });

      const result = await wpService.listContent({
        limit: 10,
        page: 1,
        status: 'publish,draft'
      });

      expect(result).toHaveLength(2);
      expect(result[0].title).toBe('Post 1');
      expect(result[1].title).toBe('Post 2');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/posts', {
        params: expect.objectContaining({
          per_page: 10,
          page: 1,
          status: 'publish,draft'
        })
      });
    });
  });

  describe('getSyncStatus', () => {
    it('should detect when local is ahead', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: {
          id: 123,
          modified: '2025-01-17T10:00:00',
          title: { rendered: 'Test Post' },
          content: { rendered: '<p>Test content</p>' },
          status: 'publish'
        }
      });

      const localVersion = '2025-01-17T11:00:00'; // Newer than remote
      const result = await wpService.getSyncStatus('123', localVersion);

      expect(result.syncStatus).toBe('local_ahead');
      expect(result.differences).toContain('Version mismatch');
    });

    it('should detect when remote is ahead', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: {
          id: 123,
          modified: '2025-01-17T12:00:00',
          title: { rendered: 'Test Post' },
          content: { rendered: '<p>Test content</p>' },
          status: 'publish'
        }
      });

      const localVersion = '2025-01-17T10:00:00'; // Older than remote
      const result = await wpService.getSyncStatus('123', localVersion);

      expect(result.syncStatus).toBe('remote_ahead');
      expect(result.differences).toContain('Version mismatch');
    });

    it('should detect when synced', async () => {
      const syncTime = '2025-01-17T10:00:00.000Z';
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: {
          id: 123,
          modified: syncTime,
          title: { rendered: 'Test Post' },
          content: { rendered: '<p>Test content</p>' },
          status: 'publish'
        }
      });

      // Use the same format that the service uses - ISO string from modified date
      const result = await wpService.getSyncStatus('123', syncTime);

      expect(result.syncStatus).toBe('synced');
      expect(result.differences).toBeUndefined();
    });
  });
});