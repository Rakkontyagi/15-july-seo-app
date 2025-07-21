import {
  userQueries,
  projectQueries,
  contentQueries,
  serpQueries,
  competitorQueries,
  analyticsQueries,
  maintenanceQueries,
  supabase,
} from '../queries'
import { mockSupabaseClient } from '@/__tests__/mocks/external-services'
import { testFixtures } from '@/__tests__/fixtures/test-data'

// Mock the Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: () => mockSupabaseClient,
}))

// Mock console.error to avoid noise in tests
const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

describe('Database Queries', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    consoleSpy.mockClear()
  })

  afterAll(() => {
    consoleSpy.mockRestore()
  })

  describe('userQueries', () => {
    describe('getUserProfile', () => {
      it('should get user profile successfully', async () => {
        const mockUser = testFixtures.users.basicUser
        mockSupabaseClient.from().select().eq().single.mockResolvedValue({
          data: mockUser,
          error: null,
        })

        const result = await userQueries.getUserProfile('test-user-id')

        expect(mockSupabaseClient.from).toHaveBeenCalledWith('users')
        expect(result).toEqual(mockUser)
      })

      it('should return null when user not found', async () => {
        mockSupabaseClient.from().select().eq().single.mockResolvedValue({
          data: null,
          error: { message: 'User not found' },
        })

        const result = await userQueries.getUserProfile('nonexistent-user')

        expect(result).toBeNull()
        expect(consoleSpy).toHaveBeenCalledWith('Error fetching user profile:', { message: 'User not found' })
      })

      it('should handle database errors', async () => {
        mockSupabaseClient.from().select().eq().single.mockRejectedValue(new Error('Database error'))

        const result = await userQueries.getUserProfile('test-user-id')

        expect(result).toBeNull()
      })
    })

    describe('updateUserProfile', () => {
      it('should update user profile successfully', async () => {
        const updatedUser = { ...testFixtures.users.basicUser, email: 'updated@example.com' }
        mockSupabaseClient.from().update().eq().select().single.mockResolvedValue({
          data: updatedUser,
          error: null,
        })

        const result = await userQueries.updateUserProfile('test-user-id', { email: 'updated@example.com' })

        expect(mockSupabaseClient.from).toHaveBeenCalledWith('users')
        expect(result).toEqual(updatedUser)
      })

      it('should return null when update fails', async () => {
        mockSupabaseClient.from().update().eq().select().single.mockResolvedValue({
          data: null,
          error: { message: 'Update failed' },
        })

        const result = await userQueries.updateUserProfile('test-user-id', { email: 'updated@example.com' })

        expect(result).toBeNull()
        expect(consoleSpy).toHaveBeenCalledWith('Error updating user profile:', { message: 'Update failed' })
      })
    })

    describe('incrementUsageCount', () => {
      it('should increment usage count successfully', async () => {
        mockSupabaseClient.from().update().eq.mockResolvedValue({
          data: null,
          error: null,
        })

        const result = await userQueries.incrementUsageCount('test-user-id')

        expect(mockSupabaseClient.from).toHaveBeenCalledWith('users')
        expect(result).toBe(true)
      })

      it('should return false when increment fails', async () => {
        mockSupabaseClient.from().update().eq.mockResolvedValue({
          data: null,
          error: { message: 'Increment failed' },
        })

        const result = await userQueries.incrementUsageCount('test-user-id')

        expect(result).toBe(false)
        expect(consoleSpy).toHaveBeenCalledWith('Error incrementing usage count:', { message: 'Increment failed' })
      })
    })

    describe('checkUsageQuota', () => {
      it('should check usage quota successfully', async () => {
        const mockUser = { 
          ...testFixtures.users.basicUser, 
          usage_count: 5, 
          usage_limit: 10 
        }
        
        const getUserProfileSpy = jest.spyOn(userQueries, 'getUserProfile')
          .mockResolvedValue(mockUser)

        const result = await userQueries.checkUsageQuota('test-user-id')

        expect(getUserProfileSpy).toHaveBeenCalledWith('test-user-id')
        expect(result).toEqual({
          canUse: true,
          remaining: 5,
        })

        getUserProfileSpy.mockRestore()
      })

      it('should return false when user not found', async () => {
        const getUserProfileSpy = jest.spyOn(userQueries, 'getUserProfile')
          .mockResolvedValue(null)

        const result = await userQueries.checkUsageQuota('nonexistent-user')

        expect(result).toEqual({
          canUse: false,
          remaining: 0,
        })

        getUserProfileSpy.mockRestore()
      })

      it('should handle quota exceeded', async () => {
        const mockUser = { 
          ...testFixtures.users.basicUser, 
          usage_count: 10, 
          usage_limit: 10 
        }
        
        const getUserProfileSpy = jest.spyOn(userQueries, 'getUserProfile')
          .mockResolvedValue(mockUser)

        const result = await userQueries.checkUsageQuota('test-user-id')

        expect(result).toEqual({
          canUse: false,
          remaining: 0,
        })

        getUserProfileSpy.mockRestore()
      })
    })
  })

  describe('projectQueries', () => {
    describe('getUserProjects', () => {
      it('should get user projects successfully', async () => {
        const mockProjects = [
          { id: 'project-1', name: 'Project 1', user_id: 'test-user-id' },
          { id: 'project-2', name: 'Project 2', user_id: 'test-user-id' },
        ]
        
        mockSupabaseClient.from().select().eq().eq().order.mockResolvedValue({
          data: mockProjects,
          error: null,
        })

        const result = await projectQueries.getUserProjects('test-user-id')

        expect(mockSupabaseClient.from).toHaveBeenCalledWith('projects')
        expect(result).toEqual(mockProjects)
      })

      it('should return empty array when no projects found', async () => {
        mockSupabaseClient.from().select().eq().eq().order.mockResolvedValue({
          data: null,
          error: null,
        })

        const result = await projectQueries.getUserProjects('test-user-id')

        expect(result).toEqual([])
      })

      it('should handle database errors', async () => {
        mockSupabaseClient.from().select().eq().eq().order.mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        })

        const result = await projectQueries.getUserProjects('test-user-id')

        expect(result).toEqual([])
        expect(consoleSpy).toHaveBeenCalledWith('Error fetching user projects:', { message: 'Database error' })
      })
    })

    describe('createProject', () => {
      it('should create project successfully', async () => {
        const newProject = {
          name: 'New Project',
          user_id: 'test-user-id',
          description: 'Test project',
          is_active: true,
        }
        
        const createdProject = {
          id: 'project-123',
          created_at: '2023-01-01T00:00:00.000Z',
          updated_at: '2023-01-01T00:00:00.000Z',
          ...newProject,
        }

        mockSupabaseClient.from().insert().select().single.mockResolvedValue({
          data: createdProject,
          error: null,
        })

        const result = await projectQueries.createProject(newProject)

        expect(mockSupabaseClient.from).toHaveBeenCalledWith('projects')
        expect(result).toEqual(createdProject)
      })

      it('should return null when create fails', async () => {
        mockSupabaseClient.from().insert().select().single.mockResolvedValue({
          data: null,
          error: { message: 'Create failed' },
        })

        const result = await projectQueries.createProject({
          name: 'New Project',
          user_id: 'test-user-id',
          description: 'Test project',
          is_active: true,
        })

        expect(result).toBeNull()
        expect(consoleSpy).toHaveBeenCalledWith('Error creating project:', { message: 'Create failed' })
      })
    })

    describe('updateProject', () => {
      it('should update project successfully', async () => {
        const updatedProject = {
          id: 'project-123',
          name: 'Updated Project',
          user_id: 'test-user-id',
          description: 'Updated description',
          is_active: true,
        }

        mockSupabaseClient.from().update().eq().select().single.mockResolvedValue({
          data: updatedProject,
          error: null,
        })

        const result = await projectQueries.updateProject('project-123', { name: 'Updated Project' })

        expect(mockSupabaseClient.from).toHaveBeenCalledWith('projects')
        expect(result).toEqual(updatedProject)
      })

      it('should return null when update fails', async () => {
        mockSupabaseClient.from().update().eq().select().single.mockResolvedValue({
          data: null,
          error: { message: 'Update failed' },
        })

        const result = await projectQueries.updateProject('project-123', { name: 'Updated Project' })

        expect(result).toBeNull()
        expect(consoleSpy).toHaveBeenCalledWith('Error updating project:', { message: 'Update failed' })
      })
    })

    describe('deleteProject', () => {
      it('should delete project successfully (soft delete)', async () => {
        mockSupabaseClient.from().update().eq.mockResolvedValue({
          data: null,
          error: null,
        })

        const result = await projectQueries.deleteProject('project-123')

        expect(mockSupabaseClient.from).toHaveBeenCalledWith('projects')
        expect(result).toBe(true)
      })

      it('should return false when delete fails', async () => {
        mockSupabaseClient.from().update().eq.mockResolvedValue({
          data: null,
          error: { message: 'Delete failed' },
        })

        const result = await projectQueries.deleteProject('project-123')

        expect(result).toBe(false)
        expect(consoleSpy).toHaveBeenCalledWith('Error deleting project:', { message: 'Delete failed' })
      })
    })
  })

  describe('contentQueries', () => {
    describe('getProjectContent', () => {
      it('should get project content successfully', async () => {
        const mockContent = [testFixtures.content.generatedContent]
        
        mockSupabaseClient.from().select().eq().order.mockResolvedValue({
          data: mockContent,
          error: null,
        })

        const result = await contentQueries.getProjectContent('project-123')

        expect(mockSupabaseClient.from).toHaveBeenCalledWith('generated_content')
        expect(result).toEqual(mockContent)
      })

      it('should return empty array when no content found', async () => {
        mockSupabaseClient.from().select().eq().order.mockResolvedValue({
          data: null,
          error: null,
        })

        const result = await contentQueries.getProjectContent('project-123')

        expect(result).toEqual([])
      })

      it('should handle database errors', async () => {
        mockSupabaseClient.from().select().eq().order.mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        })

        const result = await contentQueries.getProjectContent('project-123')

        expect(result).toEqual([])
        expect(consoleSpy).toHaveBeenCalledWith('Error fetching project content:', { message: 'Database error' })
      })
    })

    describe('createContent', () => {
      it('should create content successfully', async () => {
        const newContent = {
          title: 'New Content',
          content: 'Test content',
          user_id: 'test-user-id',
          project_id: 'project-123',
          keyword: 'test keyword',
          word_count: 100,
          status: 'published',
        }
        
        const createdContent = {
          id: 'content-123',
          created_at: '2023-01-01T00:00:00.000Z',
          updated_at: '2023-01-01T00:00:00.000Z',
          ...newContent,
        }

        mockSupabaseClient.from().insert().select().single.mockResolvedValue({
          data: createdContent,
          error: null,
        })

        const result = await contentQueries.createContent(newContent)

        expect(mockSupabaseClient.from).toHaveBeenCalledWith('generated_content')
        expect(result).toEqual(createdContent)
      })

      it('should return null when create fails', async () => {
        mockSupabaseClient.from().insert().select().single.mockResolvedValue({
          data: null,
          error: { message: 'Create failed' },
        })

        const result = await contentQueries.createContent({
          title: 'New Content',
          content: 'Test content',
          user_id: 'test-user-id',
          project_id: 'project-123',
          keyword: 'test keyword',
          word_count: 100,
          status: 'published',
        })

        expect(result).toBeNull()
        expect(consoleSpy).toHaveBeenCalledWith('Error creating content:', { message: 'Create failed' })
      })
    })

    describe('updateContent', () => {
      it('should update content successfully', async () => {
        const updatedContent = {
          ...testFixtures.content.generatedContent,
          title: 'Updated Content',
        }

        mockSupabaseClient.from().update().eq().select().single.mockResolvedValue({
          data: updatedContent,
          error: null,
        })

        const result = await contentQueries.updateContent('content-123', { title: 'Updated Content' })

        expect(mockSupabaseClient.from).toHaveBeenCalledWith('generated_content')
        expect(result).toEqual(updatedContent)
      })

      it('should return null when update fails', async () => {
        mockSupabaseClient.from().update().eq().select().single.mockResolvedValue({
          data: null,
          error: { message: 'Update failed' },
        })

        const result = await contentQueries.updateContent('content-123', { title: 'Updated Content' })

        expect(result).toBeNull()
        expect(consoleSpy).toHaveBeenCalledWith('Error updating content:', { message: 'Update failed' })
      })
    })

    describe('getUserContent', () => {
      it('should get user content successfully', async () => {
        const mockContent = [testFixtures.content.generatedContent]
        
        mockSupabaseClient.from().select().eq().order.mockResolvedValue({
          data: mockContent,
          error: null,
        })

        const result = await contentQueries.getUserContent('test-user-id')

        expect(mockSupabaseClient.from).toHaveBeenCalledWith('generated_content')
        expect(result).toEqual(mockContent)
      })

      it('should return empty array when no content found', async () => {
        mockSupabaseClient.from().select().eq().order.mockResolvedValue({
          data: null,
          error: null,
        })

        const result = await contentQueries.getUserContent('test-user-id')

        expect(result).toEqual([])
      })
    })
  })

  describe('serpQueries', () => {
    describe('getCachedSerpAnalysis', () => {
      it('should get cached SERP analysis successfully', async () => {
        const mockAnalysis = {
          id: 'analysis-123',
          keyword: 'test keyword',
          country: 'US',
          language: 'en',
          results: { organic: [] },
          expires_at: new Date(Date.now() + 3600000).toISOString(),
        }

        mockSupabaseClient.from().select().eq().eq().eq().gt().single.mockResolvedValue({
          data: mockAnalysis,
          error: null,
        })

        const result = await serpQueries.getCachedSerpAnalysis('test keyword', 'US', 'en')

        expect(mockSupabaseClient.from).toHaveBeenCalledWith('serp_analysis')
        expect(result).toEqual(mockAnalysis)
      })

      it('should return null when no cached analysis found', async () => {
        mockSupabaseClient.from().select().eq().eq().eq().gt().single.mockResolvedValue({
          data: null,
          error: { message: 'No cached analysis found' },
        })

        const result = await serpQueries.getCachedSerpAnalysis('test keyword', 'US', 'en')

        expect(result).toBeNull()
      })

      it('should use default language when not provided', async () => {
        mockSupabaseClient.from().select().eq().eq().eq().gt().single.mockResolvedValue({
          data: null,
          error: { message: 'Not found' },
        })

        await serpQueries.getCachedSerpAnalysis('test keyword', 'US')

        expect(mockSupabaseClient.from).toHaveBeenCalledWith('serp_analysis')
      })
    })

    describe('cacheSerpAnalysis', () => {
      it('should cache SERP analysis successfully', async () => {
        const analysisData = {
          keyword: 'test keyword',
          country: 'US',
          language: 'en',
          search_engine: 'google',
          results: { organic: [] },
          expires_at: new Date(Date.now() + 3600000).toISOString(),
        }

        const cachedAnalysis = {
          id: 'analysis-123',
          created_at: '2023-01-01T00:00:00.000Z',
          ...analysisData,
        }

        mockSupabaseClient.from().upsert().select().single.mockResolvedValue({
          data: cachedAnalysis,
          error: null,
        })

        const result = await serpQueries.cacheSerpAnalysis(analysisData)

        expect(mockSupabaseClient.from).toHaveBeenCalledWith('serp_analysis')
        expect(result).toEqual(cachedAnalysis)
      })

      it('should return null when caching fails', async () => {
        mockSupabaseClient.from().upsert().select().single.mockResolvedValue({
          data: null,
          error: { message: 'Cache failed' },
        })

        const result = await serpQueries.cacheSerpAnalysis({
          keyword: 'test keyword',
          country: 'US',
          language: 'en',
          search_engine: 'google',
          results: { organic: [] },
          expires_at: new Date(Date.now() + 3600000).toISOString(),
        })

        expect(result).toBeNull()
        expect(consoleSpy).toHaveBeenCalledWith('Error caching SERP analysis:', { message: 'Cache failed' })
      })
    })

    describe('cleanExpiredSerpAnalysis', () => {
      it('should clean expired SERP analysis successfully', async () => {
        mockSupabaseClient.from().delete().lt.mockResolvedValue({
          data: null,
          error: null,
        })

        const result = await serpQueries.cleanExpiredSerpAnalysis()

        expect(mockSupabaseClient.from).toHaveBeenCalledWith('serp_analysis')
        expect(result).toBe(true)
      })

      it('should return false when cleanup fails', async () => {
        mockSupabaseClient.from().delete().lt.mockResolvedValue({
          data: null,
          error: { message: 'Cleanup failed' },
        })

        const result = await serpQueries.cleanExpiredSerpAnalysis()

        expect(result).toBe(false)
        expect(consoleSpy).toHaveBeenCalledWith('Error cleaning expired SERP analysis:', { message: 'Cleanup failed' })
      })
    })
  })

  describe('competitorQueries', () => {
    describe('getCachedCompetitorAnalysis', () => {
      it('should get cached competitor analysis successfully', async () => {
        const mockAnalysis = {
          id: 'comp-analysis-123',
          url: 'https://example.com',
          keyword: 'test keyword',
          content_data: { title: 'Test', content: 'Test content' },
          expires_at: new Date(Date.now() + 3600000).toISOString(),
        }

        mockSupabaseClient.from().select().eq().eq().gt().single.mockResolvedValue({
          data: mockAnalysis,
          error: null,
        })

        const result = await competitorQueries.getCachedCompetitorAnalysis('https://example.com', 'test keyword')

        expect(mockSupabaseClient.from).toHaveBeenCalledWith('competitor_analysis')
        expect(result).toEqual(mockAnalysis)
      })

      it('should return null when no cached analysis found', async () => {
        mockSupabaseClient.from().select().eq().eq().gt().single.mockResolvedValue({
          data: null,
          error: { message: 'No cached analysis found' },
        })

        const result = await competitorQueries.getCachedCompetitorAnalysis('https://example.com', 'test keyword')

        expect(result).toBeNull()
      })
    })

    describe('cacheCompetitorAnalysis', () => {
      it('should cache competitor analysis successfully', async () => {
        const analysisData = {
          url: 'https://example.com',
          keyword: 'test keyword',
          content_data: { title: 'Test', content: 'Test content' },
          expires_at: new Date(Date.now() + 3600000).toISOString(),
        }

        const cachedAnalysis = {
          id: 'comp-analysis-123',
          created_at: '2023-01-01T00:00:00.000Z',
          ...analysisData,
        }

        mockSupabaseClient.from().upsert().select().single.mockResolvedValue({
          data: cachedAnalysis,
          error: null,
        })

        const result = await competitorQueries.cacheCompetitorAnalysis(analysisData)

        expect(mockSupabaseClient.from).toHaveBeenCalledWith('competitor_analysis')
        expect(result).toEqual(cachedAnalysis)
      })

      it('should return null when caching fails', async () => {
        mockSupabaseClient.from().upsert().select().single.mockResolvedValue({
          data: null,
          error: { message: 'Cache failed' },
        })

        const result = await competitorQueries.cacheCompetitorAnalysis({
          url: 'https://example.com',
          keyword: 'test keyword',
          content_data: { title: 'Test', content: 'Test content' },
          expires_at: new Date(Date.now() + 3600000).toISOString(),
        })

        expect(result).toBeNull()
        expect(consoleSpy).toHaveBeenCalledWith('Error caching competitor analysis:', { message: 'Cache failed' })
      })
    })

    describe('getCompetitorAnalysisByKeyword', () => {
      it('should get competitor analysis by keyword successfully', async () => {
        const mockAnalyses = [
          {
            id: 'comp-analysis-1',
            url: 'https://example1.com',
            keyword: 'test keyword',
            content_data: { title: 'Test 1' },
            expires_at: new Date(Date.now() + 3600000).toISOString(),
          },
          {
            id: 'comp-analysis-2',
            url: 'https://example2.com',
            keyword: 'test keyword',
            content_data: { title: 'Test 2' },
            expires_at: new Date(Date.now() + 3600000).toISOString(),
          },
        ]

        mockSupabaseClient.from().select().eq().gt().order.mockResolvedValue({
          data: mockAnalyses,
          error: null,
        })

        const result = await competitorQueries.getCompetitorAnalysisByKeyword('test keyword')

        expect(mockSupabaseClient.from).toHaveBeenCalledWith('competitor_analysis')
        expect(result).toEqual(mockAnalyses)
      })

      it('should return empty array when no analyses found', async () => {
        mockSupabaseClient.from().select().eq().gt().order.mockResolvedValue({
          data: null,
          error: null,
        })

        const result = await competitorQueries.getCompetitorAnalysisByKeyword('test keyword')

        expect(result).toEqual([])
      })

      it('should handle database errors', async () => {
        mockSupabaseClient.from().select().eq().gt().order.mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        })

        const result = await competitorQueries.getCompetitorAnalysisByKeyword('test keyword')

        expect(result).toEqual([])
        expect(consoleSpy).toHaveBeenCalledWith('Error fetching competitor analysis:', { message: 'Database error' })
      })
    })

    describe('cleanExpiredCompetitorAnalysis', () => {
      it('should clean expired competitor analysis successfully', async () => {
        mockSupabaseClient.from().delete().lt.mockResolvedValue({
          data: null,
          error: null,
        })

        const result = await competitorQueries.cleanExpiredCompetitorAnalysis()

        expect(mockSupabaseClient.from).toHaveBeenCalledWith('competitor_analysis')
        expect(result).toBe(true)
      })

      it('should return false when cleanup fails', async () => {
        mockSupabaseClient.from().delete().lt.mockResolvedValue({
          data: null,
          error: { message: 'Cleanup failed' },
        })

        const result = await competitorQueries.cleanExpiredCompetitorAnalysis()

        expect(result).toBe(false)
        expect(consoleSpy).toHaveBeenCalledWith('Error cleaning expired competitor analysis:', { message: 'Cleanup failed' })
      })
    })
  })

  describe('analyticsQueries', () => {
    describe('logUserAction', () => {
      it('should log user action successfully', async () => {
        const actionData = {
          user_id: 'test-user-id',
          action_type: 'content_generation',
          tokens_used: 100,
          processing_time_ms: 1500,
          success: true,
          metadata: { keyword: 'test' },
        }

        const loggedAction = {
          id: 'action-123',
          created_at: '2023-01-01T00:00:00.000Z',
          ...actionData,
        }

        mockSupabaseClient.from().insert().select().single.mockResolvedValue({
          data: loggedAction,
          error: null,
        })

        const result = await analyticsQueries.logUserAction(actionData)

        expect(mockSupabaseClient.from).toHaveBeenCalledWith('usage_analytics')
        expect(result).toEqual(loggedAction)
      })

      it('should return null when logging fails', async () => {
        mockSupabaseClient.from().insert().select().single.mockResolvedValue({
          data: null,
          error: { message: 'Logging failed' },
        })

        const result = await analyticsQueries.logUserAction({
          user_id: 'test-user-id',
          action_type: 'content_generation',
          tokens_used: 100,
          processing_time_ms: 1500,
          success: true,
          metadata: {},
        })

        expect(result).toBeNull()
        expect(consoleSpy).toHaveBeenCalledWith('Error logging user action:', { message: 'Logging failed' })
      })
    })

    describe('getUserAnalytics', () => {
      it('should get user analytics successfully', async () => {
        const mockAnalytics = [
          {
            id: 'analytics-1',
            user_id: 'test-user-id',
            action_type: 'content_generation',
            tokens_used: 100,
            processing_time_ms: 1500,
            success: true,
            created_at: '2023-01-01T00:00:00.000Z',
          },
          {
            id: 'analytics-2',
            user_id: 'test-user-id',
            action_type: 'serp_analysis',
            tokens_used: 50,
            processing_time_ms: 800,
            success: true,
            created_at: '2023-01-01T00:01:00.000Z',
          },
        ]

        mockSupabaseClient.from().select().eq().order().limit.mockResolvedValue({
          data: mockAnalytics,
          error: null,
        })

        const result = await analyticsQueries.getUserAnalytics('test-user-id')

        expect(mockSupabaseClient.from).toHaveBeenCalledWith('usage_analytics')
        expect(result).toEqual(mockAnalytics)
      })

      it('should return empty array when no analytics found', async () => {
        mockSupabaseClient.from().select().eq().order().limit.mockResolvedValue({
          data: null,
          error: null,
        })

        const result = await analyticsQueries.getUserAnalytics('test-user-id')

        expect(result).toEqual([])
      })

      it('should use custom limit', async () => {
        mockSupabaseClient.from().select().eq().order().limit.mockResolvedValue({
          data: [],
          error: null,
        })

        await analyticsQueries.getUserAnalytics('test-user-id', 50)

        expect(mockSupabaseClient.from).toHaveBeenCalledWith('usage_analytics')
      })
    })

    describe('getUserUsageStats', () => {
      it('should calculate user usage statistics', async () => {
        const mockAnalytics = [
          {
            id: 'analytics-1',
            user_id: 'test-user-id',
            action_type: 'content_generation',
            tokens_used: 100,
            processing_time_ms: 1500,
            success: true,
            created_at: '2023-01-01T00:00:00.000Z',
          },
          {
            id: 'analytics-2',
            user_id: 'test-user-id',
            action_type: 'serp_analysis',
            tokens_used: 50,
            processing_time_ms: 800,
            success: true,
            created_at: '2023-01-01T00:01:00.000Z',
          },
          {
            id: 'analytics-3',
            user_id: 'test-user-id',
            action_type: 'content_generation',
            tokens_used: 75,
            processing_time_ms: null,
            success: false,
            created_at: '2023-01-01T00:02:00.000Z',
          },
        ]

        const getUserAnalyticsSpy = jest.spyOn(analyticsQueries, 'getUserAnalytics')
          .mockResolvedValue(mockAnalytics)

        const result = await analyticsQueries.getUserUsageStats('test-user-id')

        expect(getUserAnalyticsSpy).toHaveBeenCalledWith('test-user-id', 1000)
        expect(result).toEqual({
          totalActions: 3,
          totalTokens: 225,
          actionsByType: {
            'content_generation': 2,
            'serp_analysis': 1,
          },
          avgProcessingTime: 1150, // (1500 + 800) / 2
          successRate: 2/3, // 2 successful out of 3 total
        })

        getUserAnalyticsSpy.mockRestore()
      })

      it('should handle empty analytics', async () => {
        const getUserAnalyticsSpy = jest.spyOn(analyticsQueries, 'getUserAnalytics')
          .mockResolvedValue([])

        const result = await analyticsQueries.getUserUsageStats('test-user-id')

        expect(result).toEqual({
          totalActions: 0,
          totalTokens: 0,
          actionsByType: {},
          avgProcessingTime: 0,
          successRate: 0,
        })

        getUserAnalyticsSpy.mockRestore()
      })
    })
  })

  describe('maintenanceQueries', () => {
    describe('healthCheck', () => {
      it('should return healthy status', async () => {
        mockSupabaseClient.from().select().limit.mockResolvedValue({
          data: [],
          error: null,
        })

        const result = await maintenanceQueries.healthCheck()

        expect(mockSupabaseClient.from).toHaveBeenCalledWith('users')
        expect(result).toEqual({ isHealthy: true })
      })

      it('should return unhealthy status on database error', async () => {
        mockSupabaseClient.from().select().limit.mockResolvedValue({
          data: null,
          error: { message: 'Database connection failed' },
        })

        const result = await maintenanceQueries.healthCheck()

        expect(result).toEqual({ 
          isHealthy: false, 
          error: 'Database connection failed' 
        })
      })

      it('should handle exceptions', async () => {
        mockSupabaseClient.from().select().limit.mockRejectedValue(new Error('Unexpected error'))

        const result = await maintenanceQueries.healthCheck()

        expect(result).toEqual({ 
          isHealthy: false, 
          error: 'Unexpected error' 
        })
      })

      it('should handle non-Error exceptions', async () => {
        mockSupabaseClient.from().select().limit.mockRejectedValue('String error')

        const result = await maintenanceQueries.healthCheck()

        expect(result).toEqual({ 
          isHealthy: false, 
          error: 'Unknown error' 
        })
      })
    })

    describe('cleanExpiredData', () => {
      it('should clean expired data successfully', async () => {
        const cleanExpiredSerpSpy = jest.spyOn(serpQueries, 'cleanExpiredSerpAnalysis')
          .mockResolvedValue(true)
        const cleanExpiredCompetitorSpy = jest.spyOn(competitorQueries, 'cleanExpiredCompetitorAnalysis')
          .mockResolvedValue(true)

        const result = await maintenanceQueries.cleanExpiredData()

        expect(cleanExpiredSerpSpy).toHaveBeenCalled()
        expect(cleanExpiredCompetitorSpy).toHaveBeenCalled()
        expect(result).toBe(true)

        cleanExpiredSerpSpy.mockRestore()
        cleanExpiredCompetitorSpy.mockRestore()
      })

      it('should return false when cleanup fails', async () => {
        const cleanExpiredSerpSpy = jest.spyOn(serpQueries, 'cleanExpiredSerpAnalysis')
          .mockResolvedValue(false)
        const cleanExpiredCompetitorSpy = jest.spyOn(competitorQueries, 'cleanExpiredCompetitorAnalysis')
          .mockResolvedValue(true)

        const result = await maintenanceQueries.cleanExpiredData()

        expect(result).toBe(false)

        cleanExpiredSerpSpy.mockRestore()
        cleanExpiredCompetitorSpy.mockRestore()
      })

      it('should handle cleanup exceptions', async () => {
        const cleanExpiredSerpSpy = jest.spyOn(serpQueries, 'cleanExpiredSerpAnalysis')
          .mockRejectedValue(new Error('Cleanup failed'))

        const result = await maintenanceQueries.cleanExpiredData()

        expect(result).toBe(false)
        expect(consoleSpy).toHaveBeenCalledWith('Error cleaning expired data:', expect.any(Error))

        cleanExpiredSerpSpy.mockRestore()
      })
    })
  })

  describe('Database Connection', () => {
    it('should have proper Supabase client configuration', () => {
      expect(supabase).toBeDefined()
      expect(typeof supabase.from).toBe('function')
    })
  })

  describe('Query Performance', () => {
    it('should handle concurrent queries', async () => {
      const mockUser = testFixtures.users.basicUser
      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: mockUser,
        error: null,
      })

      const promises = [
        userQueries.getUserProfile('user-1'),
        userQueries.getUserProfile('user-2'),
        userQueries.getUserProfile('user-3'),
      ]

      const results = await Promise.all(promises)

      expect(results).toHaveLength(3)
      expect(results.every(result => result === mockUser)).toBe(true)
    })

    it('should handle query timeouts gracefully', async () => {
      jest.useFakeTimers()
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Query timeout')), 5000)
      })

      mockSupabaseClient.from().select().eq().single.mockReturnValue(timeoutPromise)

      const resultPromise = userQueries.getUserProfile('test-user-id')

      jest.advanceTimersByTime(5000)

      await expect(resultPromise).rejects.toThrow('Query timeout')

      jest.useRealTimers()
    })
  })
})