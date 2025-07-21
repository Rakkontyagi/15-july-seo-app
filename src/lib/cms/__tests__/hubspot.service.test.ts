// HubSpot Service Unit Tests

import { HubSpotService } from '../hubspot.service';
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

describe('HubSpotService', () => {
  let hubspotService: HubSpotService;
  let mockCredentials: CMSCredentials;
  let mockAxiosInstance: any;

  beforeEach(() => {
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

    mockCredentials = {
      platform: 'hubspot',
      endpoint: 'https://api.hubapi.com',
      apiKey: 'test-access-token',
      hubId: 'test-hub'
    };

    hubspotService = new HubSpotService(mockCredentials);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateCredentials', () => {
    it('should return true for valid credentials', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({
        status: 200,
        data: { usage: {} }
      });

      const result = await hubspotService.validateCredentials();

      expect(result).toBe(true);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/account-info/v3/api-usage/daily');
    });

    it('should return false for invalid credentials', async () => {
      mockAxiosInstance.get.mockRejectedValueOnce(new Error('Unauthorized'));

      const result = await hubspotService.validateCredentials();

      expect(result).toBe(false);
    });
  });

  describe('publish', () => {
    const mockContent: CMSContent = {
      title: 'Test Blog Post',
      content: '<p>This is test blog content</p>',
      status: 'published',
      author: 'Test Author'
    };

    it('should successfully publish blog post', async () => {
      jest.spyOn(hubspotService, 'listContent').mockResolvedValueOnce([]);

      mockAxiosInstance.post.mockResolvedValueOnce({
        data: {
          id: '123456789',
          name: 'Test Blog Post',
          created: 1705564800000,
          publishedAt: 1705564800000
        }
      });

      mockAxiosInstance.get.mockResolvedValueOnce({
        data: {
          url: 'https://blog.hubspot.com/test-blog-post'
        }
      });

      const result = await hubspotService.publish(mockContent);

      expect(result).toEqual({
        success: true,
        platform: 'hubspot',
        contentId: '123456789',
        url: 'https://blog.hubspot.com/test-blog-post',
        publishedAt: new Date(1705564800000)
      });
    });

    it('should handle duplicate content', async () => {
      jest.spyOn(hubspotService, 'listContent').mockResolvedValueOnce([
        { 
          id: '100', 
          title: 'Test Blog Post',
          content: 'Existing content',
          status: 'published'
        } as CMSContent
      ]);

      const result = await hubspotService.publish(mockContent, { updateIfExists: false });

      expect(result).toEqual({
        success: false,
        platform: 'hubspot',
        error: 'Blog post with this title already exists',
        details: { existingId: '100' }
      });
    });
  });

  describe('getContent', () => {
    it('should retrieve and transform blog post', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: {
          id: '123',
          name: 'Test Blog Post',
          content: '<p>Blog content</p>',
          state: 'PUBLISHED',
          authorName: 'Test Author',
          created: 1705564800000
        }
      });

      const result = await hubspotService.getContent('123');

      expect(result).toEqual({
        id: '123',
        title: 'Test Blog Post',
        content: '<p>Blog content</p>',
        excerpt: 'Blog content',
        slug: 'test-blog-post',
        status: 'published',
        categories: [],
        tags: [],
        author: 'Test Author',
        customFields: expect.any(Object)
      });
    });
  });
});