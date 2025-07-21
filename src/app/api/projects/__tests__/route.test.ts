/**
 * Projects API Route Tests
 * Integration tests for project management API endpoints
 */

import { NextRequest } from 'next/server';
import { GET, POST, PUT, DELETE } from '../route';

// Mock services
jest.mock('@/lib/services/project-management.service');
jest.mock('@/lib/auth/middleware');
jest.mock('@/lib/logging/logger', () => ({
  createServiceLogger: () => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  }),
}));

import { ProjectManagementService } from '@/lib/services/project-management.service';
import { authenticateRequest } from '@/lib/auth/middleware';

const mockProjectService = ProjectManagementService as jest.MockedClass<typeof ProjectManagementService>;
const mockAuthenticateRequest = authenticateRequest as jest.MockedFunction<typeof authenticateRequest>;

describe('/api/projects', () => {
  const mockUser = { id: 'user-123', email: 'test@example.com' };
  
  beforeEach(() => {
    mockAuthenticateRequest.mockResolvedValue({
      success: true,
      user: mockUser,
    });

    mockProjectService.prototype.getProjectsByClientCampaign = jest.fn();
    mockProjectService.prototype.getProjectsByCategory = jest.fn();
    mockProjectService.prototype.createProject = jest.fn();
    mockProjectService.prototype.updateProject = jest.fn();
    mockProjectService.prototype.deleteProject = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/projects', () => {
    it('should fetch projects organized by client-campaign', async () => {
      const mockProjects = {
        'Client A': {
          'Campaign 1': [
            {
              id: 'project-1',
              name: 'Project 1',
              client_name: 'Client A',
              campaign_name: 'Campaign 1',
            },
          ],
        },
      };

      mockProjectService.prototype.getProjectsByClientCampaign.mockResolvedValue(mockProjects);

      const request = new NextRequest('http://localhost:3000/api/projects?organization=client-campaign');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockProjects);
      expect(data.organization).toBe('client-campaign');
      expect(mockProjectService.prototype.getProjectsByClientCampaign).toHaveBeenCalledWith(mockUser.id);
    });

    it('should fetch projects organized by category', async () => {
      const mockProjects = {
        'Marketing': [
          {
            id: 'project-1',
            name: 'Project 1',
            category: 'Marketing',
          },
        ],
      };

      mockProjectService.prototype.getProjectsByCategory.mockResolvedValue(mockProjects);

      const request = new NextRequest('http://localhost:3000/api/projects?organization=category');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockProjects);
      expect(data.organization).toBe('category');
      expect(mockProjectService.prototype.getProjectsByCategory).toHaveBeenCalledWith(mockUser.id);
    });

    it('should return 401 when not authenticated', async () => {
      mockAuthenticateRequest.mockResolvedValue({
        success: false,
        error: 'Invalid token',
      });

      const request = new NextRequest('http://localhost:3000/api/projects');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
      expect(data.message).toBe('Invalid token');
    });

    it('should handle service errors', async () => {
      mockProjectService.prototype.getProjectsByClientCampaign.mockRejectedValue(
        new Error('Database connection failed')
      );

      const request = new NextRequest('http://localhost:3000/api/projects');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal Server Error');
      expect(data.message).toBe('Failed to fetch projects');
    });
  });

  describe('POST /api/projects', () => {
    const validProjectData = {
      name: 'New Project',
      description: 'Project description',
      client_name: 'Client A',
      campaign_name: 'Campaign 1',
      category: 'Marketing',
      target_keywords: ['seo', 'marketing'],
      target_country: 'US',
      target_language: 'en',
    };

    it('should create project successfully', async () => {
      const createdProject = {
        id: 'project-123',
        user_id: mockUser.id,
        ...validProjectData,
        status: 'active',
        completion_percentage: 0,
        created_at: '2025-07-18T00:00:00Z',
      };

      mockProjectService.prototype.createProject.mockResolvedValue(createdProject);

      const request = new NextRequest('http://localhost:3000/api/projects', {
        method: 'POST',
        body: JSON.stringify(validProjectData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(createdProject);
      expect(data.message).toBe('Project created successfully');
      expect(mockProjectService.prototype.createProject).toHaveBeenCalledWith(
        mockUser.id,
        validProjectData
      );
    });

    it('should validate required fields', async () => {
      const invalidData = {
        name: '', // Invalid: empty name
        client_name: 'Client A',
      };

      const request = new NextRequest('http://localhost:3000/api/projects', {
        method: 'POST',
        body: JSON.stringify(invalidData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation Error');
      expect(data.details).toBeDefined();
    });

    it('should handle creation errors', async () => {
      mockProjectService.prototype.createProject.mockRejectedValue(
        new Error('Database constraint violation')
      );

      const request = new NextRequest('http://localhost:3000/api/projects', {
        method: 'POST',
        body: JSON.stringify(validProjectData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal Server Error');
      expect(data.message).toBe('Failed to create project');
    });
  });

  describe('PUT /api/projects', () => {
    const bulkUpdateData = {
      project_ids: ['project-1', 'project-2'],
      updates: {
        status: 'completed' as const,
        completion_percentage: 100,
      },
    };

    it('should bulk update projects successfully', async () => {
      const updatedProject1 = { id: 'project-1', status: 'completed', completion_percentage: 100 };
      const updatedProject2 = { id: 'project-2', status: 'completed', completion_percentage: 100 };

      mockProjectService.prototype.updateProject
        .mockResolvedValueOnce(updatedProject1)
        .mockResolvedValueOnce(updatedProject2);

      const request = new NextRequest('http://localhost:3000/api/projects', {
        method: 'PUT',
        body: JSON.stringify(bulkUpdateData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(2);
      expect(data.message).toBe('Updated 2 of 2 projects');
      expect(mockProjectService.prototype.updateProject).toHaveBeenCalledTimes(2);
    });

    it('should handle partial failures in bulk update', async () => {
      mockProjectService.prototype.updateProject
        .mockResolvedValueOnce({ id: 'project-1', status: 'completed' })
        .mockRejectedValueOnce(new Error('Project not found'));

      const request = new NextRequest('http://localhost:3000/api/projects', {
        method: 'PUT',
        body: JSON.stringify(bulkUpdateData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(1);
      expect(data.message).toBe('Updated 1 of 2 projects');
    });

    it('should validate bulk update data', async () => {
      const invalidData = {
        project_ids: [], // Invalid: empty array
        updates: {},
      };

      const request = new NextRequest('http://localhost:3000/api/projects', {
        method: 'PUT',
        body: JSON.stringify(invalidData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation Error');
    });
  });

  describe('DELETE /api/projects', () => {
    const bulkDeleteData = {
      project_ids: ['project-1', 'project-2'],
    };

    it('should bulk delete projects successfully', async () => {
      mockProjectService.prototype.deleteProject
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined);

      const request = new NextRequest('http://localhost:3000/api/projects', {
        method: 'DELETE',
        body: JSON.stringify(bulkDeleteData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.deleted_count).toBe(2);
      expect(data.message).toBe('Deleted 2 of 2 projects');
      expect(mockProjectService.prototype.deleteProject).toHaveBeenCalledTimes(2);
    });

    it('should handle partial failures in bulk delete', async () => {
      mockProjectService.prototype.deleteProject
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('Project not found'));

      const request = new NextRequest('http://localhost:3000/api/projects', {
        method: 'DELETE',
        body: JSON.stringify(bulkDeleteData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.deleted_count).toBe(1);
      expect(data.message).toBe('Deleted 1 of 2 projects');
    });
  });
});
