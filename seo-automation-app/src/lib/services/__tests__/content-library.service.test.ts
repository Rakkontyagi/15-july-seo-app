/**
 * Content Library Service Tests
 * Comprehensive unit tests for content search and library functionality
 */

import { ContentLibraryService } from '../content-library.service';
import { createClient } from '@supabase/supabase-js';

// Mock Supabase client
jest.mock('@supabase/supabase-js');
const mockSupabase = {
  from: jest.fn(),
};

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;
mockCreateClient.mockReturnValue(mockSupabase as any);

// Mock logger
jest.mock('../../logging/logger', () => ({
  createServiceLogger: () => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  }),
}));

describe('ContentLibraryService', () => {
  let service: ContentLibraryService;
  let mockQuery: any;

  beforeEach(() => {
    service = new ContentLibraryService();
    mockQuery = {
      select: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
    };
    mockSupabase.from.mockReturnValue(mockQuery);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('searchContent', () => {
    const userId = 'user-123';

    beforeEach(() => {
      // Mock the getAccessibleProjectIds call
      const mockAccessibleIds = { ...mockQuery };
      mockSupabase.from.mockReturnValueOnce(mockAccessibleIds);
      mockAccessibleIds.select.mockReturnValue(mockAccessibleIds);
      mockAccessibleIds.eq.mockReturnValue(mockAccessibleIds);
      mockAccessibleIds.mockResolvedValue({ data: [], error: null });
    });

    it('should search content with basic query', async () => {
      const searchParams = {
        query: 'SEO tips',
        limit: 10,
        offset: 0,
      };

      const mockContent = [
        {
          id: 'content-1',
          title: 'SEO Tips for Beginners',
          content: 'Learn basic SEO techniques...',
          projects: {
            id: 'project-1',
            name: 'SEO Project',
            client_name: 'Client A',
            campaign_name: 'Campaign 1',
          },
        },
      ];

      mockQuery.range.mockResolvedValue({
        data: mockContent,
        error: null,
        count: 1,
      });

      const result = await service.searchContent(userId, searchParams);

      expect(mockSupabase.from).toHaveBeenCalledWith('generated_content');
      expect(mockQuery.select).toHaveBeenCalledWith(
        expect.stringContaining('projects!inner'),
        { count: 'exact' }
      );
      expect(mockQuery.or).toHaveBeenCalledWith(
        expect.stringContaining('title.ilike.%SEO tips%')
      );
      expect(mockQuery.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(mockQuery.range).toHaveBeenCalledWith(0, 9);

      expect(result).toEqual({
        content: mockContent,
        total_count: 1,
        has_more: false,
        filters_applied: ['text: "SEO tips"'],
      });
    });

    it('should apply multiple filters', async () => {
      const searchParams = {
        query: 'marketing',
        client_name: 'Client A',
        status: 'published' as const,
        min_word_count: 500,
        max_seo_score: 90,
        limit: 20,
        offset: 0,
      };

      mockQuery.range.mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });

      const result = await service.searchContent(userId, searchParams);

      expect(mockQuery.or).toHaveBeenCalledWith(
        expect.stringContaining('title.ilike.%marketing%')
      );
      expect(mockQuery.eq).toHaveBeenCalledWith('projects.client_name', 'Client A');
      expect(mockQuery.eq).toHaveBeenCalledWith('status', 'published');
      expect(mockQuery.gte).toHaveBeenCalledWith('word_count', 500);
      expect(mockQuery.lte).toHaveBeenCalledWith('seo_score', 90);

      expect(result.filters_applied).toContain('text: "marketing"');
      expect(result.filters_applied).toContain('client: Client A');
      expect(result.filters_applied).toContain('status: published');
      expect(result.filters_applied).toContain('min words: 500');
      expect(result.filters_applied).toContain('max SEO: 90');
    });

    it('should handle tag filtering', async () => {
      const searchParams = {
        tags: ['urgent', 'marketing'],
        limit: 10,
        offset: 0,
      };

      // Mock getContentIdsByTags
      const mockTagQuery = { ...mockQuery };
      mockSupabase.from.mockReturnValueOnce(mockTagQuery);
      mockTagQuery.select.mockReturnValue(mockTagQuery);
      mockTagQuery.in.mockReturnValue(mockTagQuery);
      mockTagQuery.mockResolvedValue({
        data: [{ content_id: 'content-1' }, { content_id: 'content-2' }],
        error: null,
      });

      mockQuery.range.mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });

      const result = await service.searchContent(userId, searchParams);

      expect(mockQuery.in).toHaveBeenCalledWith('id', ['content-1', 'content-2']);
      expect(result.filters_applied).toContain('tags: urgent, marketing');
    });

    it('should return empty result when no content matches tags', async () => {
      const searchParams = {
        tags: ['nonexistent'],
        limit: 10,
        offset: 0,
      };

      // Mock getContentIdsByTags returning empty array
      const mockTagQuery = { ...mockQuery };
      mockSupabase.from.mockReturnValueOnce(mockTagQuery);
      mockTagQuery.select.mockReturnValue(mockTagQuery);
      mockTagQuery.in.mockReturnValue(mockTagQuery);
      mockTagQuery.mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await service.searchContent(userId, searchParams);

      expect(result).toEqual({
        content: [],
        total_count: 0,
        has_more: false,
        filters_applied: ['tags: nonexistent'],
      });
    });

    it('should handle pagination correctly', async () => {
      const searchParams = {
        limit: 5,
        offset: 10,
      };

      mockQuery.range.mockResolvedValue({
        data: new Array(5).fill({}),
        error: null,
        count: 20,
      });

      const result = await service.searchContent(userId, searchParams);

      expect(mockQuery.range).toHaveBeenCalledWith(10, 14);
      expect(result.has_more).toBe(true);
      expect(result.total_count).toBe(20);
    });
  });

  describe('getLibraryStats', () => {
    const userId = 'user-123';

    beforeEach(() => {
      // Mock the getAccessibleProjectIds call
      const mockAccessibleIds = { ...mockQuery };
      mockSupabase.from.mockReturnValueOnce(mockAccessibleIds);
      mockAccessibleIds.select.mockReturnValue(mockAccessibleIds);
      mockAccessibleIds.eq.mockReturnValue(mockAccessibleIds);
      mockAccessibleIds.mockResolvedValue({ data: [], error: null });
    });

    it('should calculate library statistics correctly', async () => {
      const mockContentStats = [
        {
          status: 'published',
          content_type: 'article',
          seo_score: 85,
          word_count: 1200,
          projects: { client_name: 'Client A', campaign_name: 'Campaign 1' },
        },
        {
          status: 'draft',
          content_type: 'blog',
          seo_score: 70,
          word_count: 800,
          projects: { client_name: 'Client A', campaign_name: 'Campaign 2' },
        },
        {
          status: 'published',
          content_type: 'article',
          seo_score: 90,
          word_count: 1500,
          projects: { client_name: 'Client B', campaign_name: 'Campaign 1' },
        },
      ];

      const mockRecentContent = [
        {
          id: 'content-1',
          title: 'Recent Article',
          projects: { name: 'Project 1', client_name: 'Client A' },
        },
      ];

      // Mock content stats query
      mockSupabase.from.mockReturnValueOnce(mockQuery);
      mockQuery.or.mockResolvedValue({
        data: mockContentStats,
        error: null,
      });

      // Mock recent content query
      mockSupabase.from.mockReturnValueOnce(mockQuery);
      mockQuery.limit.mockResolvedValue({
        data: mockRecentContent,
        error: null,
      });

      const result = await service.getLibraryStats(userId);

      expect(result).toEqual({
        total_content: 3,
        published_content: 2,
        draft_content: 1,
        archived_content: 0,
        average_seo_score: 81.67,
        average_word_count: 1166.67,
        content_by_type: {
          article: 2,
          blog: 1,
        },
        content_by_client: {
          'Client A': 2,
          'Client B': 1,
        },
        content_by_campaign: {
          'Campaign 1': 2,
          'Campaign 2': 1,
        },
        recent_activity: mockRecentContent,
      });
    });

    it('should handle empty library', async () => {
      // Mock empty content stats
      mockSupabase.from.mockReturnValueOnce(mockQuery);
      mockQuery.or.mockResolvedValue({
        data: [],
        error: null,
      });

      // Mock empty recent content
      mockSupabase.from.mockReturnValueOnce(mockQuery);
      mockQuery.limit.mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await service.getLibraryStats(userId);

      expect(result).toEqual({
        total_content: 0,
        published_content: 0,
        draft_content: 0,
        archived_content: 0,
        average_seo_score: 0,
        average_word_count: 0,
        content_by_type: {},
        content_by_client: {},
        content_by_campaign: {},
        recent_activity: [],
      });
    });
  });

  describe('addContentTag', () => {
    const tagData = {
      content_id: 'content-123',
      tag_name: 'important',
      tag_color: '#FF0000',
    };

    it('should add content tag successfully', async () => {
      const expectedTag = {
        id: 'tag-123',
        ...tagData,
        created_at: '2025-07-18T00:00:00Z',
      };

      mockQuery.single.mockResolvedValue({
        data: expectedTag,
        error: null,
      });

      const result = await service.addContentTag(tagData);

      expect(mockSupabase.from).toHaveBeenCalledWith('content_tags');
      expect(mockQuery.insert).toHaveBeenCalledWith(tagData);
      expect(result).toEqual(expectedTag);
    });

    it('should handle tag creation error', async () => {
      mockQuery.single.mockResolvedValue({
        data: null,
        error: { message: 'Constraint violation' },
      });

      await expect(service.addContentTag(tagData))
        .rejects.toThrow('Failed to add content tag: Constraint violation');
    });
  });

  describe('getAllContentTags', () => {
    const userId = 'user-123';

    it('should get all content tags with counts', async () => {
      const mockTagData = [
        {
          tag_name: 'urgent',
          tag_color: '#FF0000',
          generated_content: { projects: { user_id: userId } },
        },
        {
          tag_name: 'urgent',
          tag_color: '#FF0000',
          generated_content: { projects: { user_id: userId } },
        },
        {
          tag_name: 'marketing',
          tag_color: '#00FF00',
          generated_content: { projects: { user_id: userId } },
        },
      ];

      mockQuery.eq.mockResolvedValue({
        data: mockTagData,
        error: null,
      });

      const result = await service.getAllContentTags(userId);

      expect(result).toEqual([
        { tag_name: 'urgent', count: 2, tag_color: '#FF0000' },
        { tag_name: 'marketing', count: 1, tag_color: '#00FF00' },
      ]);
    });
  });
});
