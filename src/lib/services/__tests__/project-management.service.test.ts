/**
 * Project Management Service Tests
 * Comprehensive unit tests for project management functionality
 */

import { ProjectManagementService } from '../project-management.service';
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

describe('ProjectManagementService', () => {
  let service: ProjectManagementService;
  let mockQuery: any;

  beforeEach(() => {
    service = new ProjectManagementService();
    mockQuery = {
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
    };
    mockSupabase.from.mockReturnValue(mockQuery);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createProject', () => {
    const userId = 'user-123';
    const projectData = {
      name: 'Test Project',
      description: 'Test Description',
      client_name: 'Test Client',
      campaign_name: 'Test Campaign',
      category: 'Marketing',
      target_keywords: ['seo', 'marketing'],
      target_country: 'US',
      target_language: 'en',
      settings: {},
    };

    it('should create a project successfully', async () => {
      const expectedProject = {
        id: 'project-123',
        user_id: userId,
        ...projectData,
        status: 'active',
        completion_percentage: 0,
        is_active: true,
        created_at: '2025-07-18T00:00:00Z',
        updated_at: '2025-07-18T00:00:00Z',
      };

      mockQuery.single.mockResolvedValue({
        data: expectedProject,
        error: null,
      });

      const result = await service.createProject(userId, projectData);

      expect(mockSupabase.from).toHaveBeenCalledWith('projects');
      expect(mockQuery.insert).toHaveBeenCalledWith({
        user_id: userId,
        ...projectData,
        status: 'active',
        completion_percentage: 0,
        is_active: true,
      });
      expect(mockQuery.select).toHaveBeenCalled();
      expect(mockQuery.single).toHaveBeenCalled();
      expect(result).toEqual(expectedProject);
    });

    it('should throw error when project creation fails', async () => {
      mockQuery.single.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      await expect(service.createProject(userId, projectData))
        .rejects.toThrow('Failed to create project: Database error');
    });

    it('should validate project data', async () => {
      const invalidData = {
        name: '', // Invalid: empty name
        client_name: 'Test Client',
        campaign_name: 'Test Campaign',
        category: 'Marketing',
        target_keywords: [],
      };

      await expect(service.createProject(userId, invalidData as any))
        .rejects.toThrow();
    });
  });

  describe('getProjectsByClientCampaign', () => {
    const userId = 'user-123';

    it('should organize projects by client and campaign', async () => {
      const mockProjects = [
        {
          id: 'project-1',
          name: 'Project 1',
          client_name: 'Client A',
          campaign_name: 'Campaign 1',
          user_id: userId,
        },
        {
          id: 'project-2',
          name: 'Project 2',
          client_name: 'Client A',
          campaign_name: 'Campaign 2',
          user_id: userId,
        },
        {
          id: 'project-3',
          name: 'Project 3',
          client_name: 'Client B',
          campaign_name: 'Campaign 1',
          user_id: userId,
        },
      ];

      // Mock the getAccessibleProjectIds call
      const mockAccessibleIds = mockQuery;
      mockSupabase.from.mockReturnValueOnce(mockAccessibleIds);
      mockAccessibleIds.select.mockReturnValue(mockAccessibleIds);
      mockAccessibleIds.eq.mockReturnValue(mockAccessibleIds);
      mockAccessibleIds.mockResolvedValue({ data: [], error: null });

      // Mock the main query
      mockQuery.order.mockResolvedValue({
        data: mockProjects,
        error: null,
      });

      const result = await service.getProjectsByClientCampaign(userId);

      expect(result).toEqual({
        'Client A': {
          'Campaign 1': [mockProjects[0]],
          'Campaign 2': [mockProjects[1]],
        },
        'Client B': {
          'Campaign 1': [mockProjects[2]],
        },
      });
    });

    it('should handle projects without client/campaign names', async () => {
      const mockProjects = [
        {
          id: 'project-1',
          name: 'Project 1',
          client_name: null,
          campaign_name: null,
          user_id: userId,
        },
      ];

      // Mock the getAccessibleProjectIds call
      const mockAccessibleIds = mockQuery;
      mockSupabase.from.mockReturnValueOnce(mockAccessibleIds);
      mockAccessibleIds.select.mockReturnValue(mockAccessibleIds);
      mockAccessibleIds.eq.mockReturnValue(mockAccessibleIds);
      mockAccessibleIds.mockResolvedValue({ data: [], error: null });

      mockQuery.order.mockResolvedValue({
        data: mockProjects,
        error: null,
      });

      const result = await service.getProjectsByClientCampaign(userId);

      expect(result).toEqual({
        'Uncategorized': {
          'Default': [mockProjects[0]],
        },
      });
    });
  });

  describe('updateProject', () => {
    const projectId = 'project-123';
    const userId = 'user-123';
    const updates = {
      name: 'Updated Project Name',
      status: 'completed' as const,
      completion_percentage: 100,
    };

    it('should update project successfully', async () => {
      const expectedProject = {
        id: projectId,
        user_id: userId,
        ...updates,
        updated_at: expect.any(String),
      };

      mockQuery.single.mockResolvedValue({
        data: expectedProject,
        error: null,
      });

      const result = await service.updateProject(projectId, userId, updates);

      expect(mockSupabase.from).toHaveBeenCalledWith('projects');
      expect(mockQuery.update).toHaveBeenCalledWith({
        ...updates,
        updated_at: expect.any(String),
      });
      expect(mockQuery.eq).toHaveBeenCalledWith('id', projectId);
      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', userId);
      expect(result).toEqual(expectedProject);
    });

    it('should throw error when update fails', async () => {
      mockQuery.single.mockResolvedValue({
        data: null,
        error: { message: 'Project not found' },
      });

      await expect(service.updateProject(projectId, userId, updates))
        .rejects.toThrow('Failed to update project: Project not found');
    });
  });

  describe('addProjectTag', () => {
    const tagData = {
      project_id: 'project-123',
      tag_name: 'urgent',
      tag_color: '#FF0000',
    };

    it('should add project tag successfully', async () => {
      const expectedTag = {
        id: 'tag-123',
        ...tagData,
        created_at: '2025-07-18T00:00:00Z',
      };

      mockQuery.single.mockResolvedValue({
        data: expectedTag,
        error: null,
      });

      const result = await service.addProjectTag(tagData);

      expect(mockSupabase.from).toHaveBeenCalledWith('project_tags');
      expect(mockQuery.insert).toHaveBeenCalledWith(tagData);
      expect(result).toEqual(expectedTag);
    });

    it('should handle duplicate tag error', async () => {
      mockQuery.single.mockResolvedValue({
        data: null,
        error: { message: 'duplicate key value violates unique constraint' },
      });

      await expect(service.addProjectTag(tagData))
        .rejects.toThrow('Failed to add project tag');
    });
  });

  describe('getProjectTags', () => {
    const projectId = 'project-123';

    it('should fetch project tags successfully', async () => {
      const mockTags = [
        {
          id: 'tag-1',
          project_id: projectId,
          tag_name: 'urgent',
          tag_color: '#FF0000',
          created_at: '2025-07-18T00:00:00Z',
        },
        {
          id: 'tag-2',
          project_id: projectId,
          tag_name: 'marketing',
          tag_color: '#00FF00',
          created_at: '2025-07-18T00:00:00Z',
        },
      ];

      mockQuery.order.mockResolvedValue({
        data: mockTags,
        error: null,
      });

      const result = await service.getProjectTags(projectId);

      expect(mockSupabase.from).toHaveBeenCalledWith('project_tags');
      expect(mockQuery.select).toHaveBeenCalledWith('*');
      expect(mockQuery.eq).toHaveBeenCalledWith('project_id', projectId);
      expect(mockQuery.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(result).toEqual(mockTags);
    });

    it('should return empty array when no tags found', async () => {
      mockQuery.order.mockResolvedValue({
        data: null,
        error: null,
      });

      const result = await service.getProjectTags(projectId);

      expect(result).toEqual([]);
    });
  });

  describe('addProjectAccess', () => {
    const accessData = {
      project_id: 'project-123',
      email: 'client@example.com',
      role: 'viewer' as const,
      permissions: {},
    };
    const invitedBy = 'user-123';

    it('should add project access successfully', async () => {
      const expectedAccess = {
        id: 'access-123',
        ...accessData,
        invited_by: invitedBy,
        is_active: true,
        created_at: '2025-07-18T00:00:00Z',
      };

      mockQuery.single.mockResolvedValue({
        data: expectedAccess,
        error: null,
      });

      const result = await service.addProjectAccess(accessData, invitedBy);

      expect(mockSupabase.from).toHaveBeenCalledWith('project_access_control');
      expect(mockQuery.insert).toHaveBeenCalledWith({
        ...accessData,
        invited_by: invitedBy,
        is_active: true,
      });
      expect(result).toEqual(expectedAccess);
    });
  });

  describe('deleteProject', () => {
    const projectId = 'project-123';
    const userId = 'user-123';

    it('should soft delete project successfully', async () => {
      mockQuery.eq.mockResolvedValue({
        data: null,
        error: null,
      });

      await service.deleteProject(projectId, userId);

      expect(mockSupabase.from).toHaveBeenCalledWith('projects');
      expect(mockQuery.update).toHaveBeenCalledWith({
        is_active: false,
        updated_at: expect.any(String),
      });
      expect(mockQuery.eq).toHaveBeenCalledWith('id', projectId);
      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', userId);
    });

    it('should throw error when deletion fails', async () => {
      mockQuery.eq.mockResolvedValue({
        data: null,
        error: { message: 'Project not found' },
      });

      await expect(service.deleteProject(projectId, userId))
        .rejects.toThrow('Failed to delete project: Project not found');
    });
  });
});
