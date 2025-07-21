/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { POST, GET } from '../analyze/route';

// Mock dependencies before importing
jest.mock('@/lib/ai/quality-checker', () => ({
  ContentQualityChecker: jest.fn()
}));

jest.mock('@/lib/ai/human-writing-patterns', () => ({
  HumanWritingPatternAnalyzer: jest.fn()
}));

jest.mock('@/lib/ai/eeat-optimizer', () => ({
  EeatOptimizer: jest.fn()
}));

jest.mock('@/lib/ai/user-value-optimizer', () => ({
  UserValueOptimizer: jest.fn()
}));

jest.mock('@/lib/ai/authority-signal-integrator', () => ({
  AuthoritySignalIntegrator: jest.fn()
}));

jest.mock('@/lib/auth/middleware', () => ({
  authenticateRequest: jest.fn()
}));

jest.mock('@/lib/logging/logger', () => ({
  createServiceLogger: () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  })
}));

// Import after mocking
import { ContentQualityChecker } from '@/lib/ai/quality-checker';
import { HumanWritingPatternAnalyzer } from '@/lib/ai/human-writing-patterns';
import { EeatOptimizer } from '@/lib/ai/eeat-optimizer';
import { UserValueOptimizer } from '@/lib/ai/user-value-optimizer';
import { AuthoritySignalIntegrator } from '@/lib/ai/authority-signal-integrator';
import { authenticateRequest } from '@/lib/auth/middleware';

describe('/api/content/analyze', () => {
  let mockRequest: Partial<NextRequest>;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com'
  };

  const mockAnalysisResults = {
    qualityAnalysis: {
      overallScore: 85,
      grammarScore: 90,
      syntaxScore: 88,
      readabilityScore: 82,
      coherenceScore: 87,
      styleScore: 85,
      issues: [],
      recommendations: ['Consider adding more subheadings']
    },
    humanWritingAnalysis: {
      overallScore: 92,
      naturalFlowScore: 90,
      sentenceVarietyScore: 94,
      aiDetectionScore: 88,
      humanLikenessScore: 95,
      patterns: {
        averageSentenceLength: 18,
        sentenceLengthVariation: 0.35,
        vocabularyDiversity: 0.78
      },
      recommendations: ['Excellent human-like writing patterns detected']
    },
    eeatOptimization: {
      overallScore: 88,
      experienceScore: 90,
      expertiseScore: 92,
      authoritativenessScore: 85,
      trustworthinessScore: 86,
      eeatIssues: [],
      eeatRecommendations: ['Strong E-E-A-T signals detected']
    },
    userValueAnalysis: {
      overallScore: 87,
      intentSatisfactionScore: 90,
      actionableInsightsScore: 85,
      comprehensivenessScore: 86,
      recommendations: ['Content provides excellent user value']
    },
    authoritySignalAnalysis: {
      overallScore: 89,
      expertOpinionsScore: 88,
      caseStudiesScore: 90,
      dataInsightsScore: 87,
      bestPracticesScore: 91,
      recommendations: ['Strong authority signals present']
    }
  };

  beforeEach(() => {
    // Mock authenticated request
    (authenticateRequest as jest.Mock).mockResolvedValue({ user: mockUser });

    // Mock analyzers
    (ContentQualityChecker as jest.Mock).mockImplementation(() => ({
      analyze: jest.fn().mockResolvedValue(mockAnalysisResults.qualityAnalysis)
    }));

    (HumanWritingPatternAnalyzer as jest.Mock).mockImplementation(() => ({
      analyze: jest.fn().mockReturnValue(mockAnalysisResults.humanWritingAnalysis)
    }));

    (EeatOptimizer as jest.Mock).mockImplementation(() => ({
      optimize: jest.fn().mockReturnValue(mockAnalysisResults.eeatOptimization)
    }));

    (UserValueOptimizer as jest.Mock).mockImplementation(() => ({
      optimize: jest.fn().mockReturnValue(mockAnalysisResults.userValueAnalysis)
    }));

    (AuthoritySignalIntegrator as jest.Mock).mockImplementation(() => ({
      integrate: jest.fn().mockReturnValue(mockAnalysisResults.authoritySignalAnalysis)
    }));

    // Mock request
    mockRequest = {
      json: jest.fn(),
      nextUrl: {
        searchParams: new URLSearchParams()
      }
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/content/analyze', () => {
    const validRequestBody = {
      content: 'This is a comprehensive article about SEO best practices with expert insights and practical advice. In my experience working with hundreds of websites over the past two decades, I have witnessed the evolution of search engine optimization.',
      keyword: 'SEO best practices',
      industry: 'Digital Marketing',
      targetAudience: 'professionals'
    };

    it('should analyze content successfully with all analysis types', async () => {
      (mockRequest.json as jest.Mock).mockResolvedValue({
        ...validRequestBody,
        analysisTypes: ['all']
      });

      const response = await POST(mockRequest as NextRequest);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data.qualityAnalysis).toEqual(mockAnalysisResults.qualityAnalysis);
      expect(responseData.data.humanWritingAnalysis).toEqual(mockAnalysisResults.humanWritingAnalysis);
      expect(responseData.data.eeatOptimization).toEqual(mockAnalysisResults.eeatOptimization);
      expect(responseData.data.userValueAnalysis).toEqual(mockAnalysisResults.userValueAnalysis);
      expect(responseData.data.authoritySignalAnalysis).toEqual(mockAnalysisResults.authoritySignalAnalysis);
      expect(responseData.data.compositeScore).toBeCloseTo(88.2, 1);
    });

    it('should analyze content with specific analysis types', async () => {
      (mockRequest.json as jest.Mock).mockResolvedValue({
        ...validRequestBody,
        analysisTypes: ['quality', 'human-writing']
      });

      const response = await POST(mockRequest as NextRequest);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.data.qualityAnalysis).toEqual(mockAnalysisResults.qualityAnalysis);
      expect(responseData.data.humanWritingAnalysis).toEqual(mockAnalysisResults.humanWritingAnalysis);
      expect(responseData.data.eeatOptimization).toBeUndefined();
      expect(responseData.data.userValueAnalysis).toBeUndefined();
      expect(responseData.data.authoritySignalAnalysis).toBeUndefined();
    });

    it('should return content metrics', async () => {
      (mockRequest.json as jest.Mock).mockResolvedValue(validRequestBody);

      const response = await POST(mockRequest as NextRequest);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.data.contentMetrics).toBeDefined();
      expect(responseData.data.contentMetrics.wordCount).toBeGreaterThan(0);
      expect(responseData.data.contentMetrics.characterCount).toBe(validRequestBody.content.length);
      expect(responseData.data.contentMetrics.paragraphCount).toBeGreaterThan(0);
      expect(responseData.data.contentMetrics.sentenceCount).toBeGreaterThan(0);
    });

    it('should return 401 for unauthenticated requests', async () => {
      (authenticateRequest as jest.Mock).mockResolvedValue({ user: null });
      (mockRequest.json as jest.Mock).mockResolvedValue(validRequestBody);

      const response = await POST(mockRequest as NextRequest);
      const responseData = await response.json();

      expect(response.status).toBe(401);
      expect(responseData.error).toBe('Unauthorized');
    });

    it('should validate request body and return 400 for invalid data', async () => {
      const invalidRequestBody = {
        content: 'Too short', // Invalid: below minimum length
        keyword: '', // Invalid: empty keyword
        industry: 'Digital Marketing',
        targetAudience: 'professionals'
      };

      (mockRequest.json as jest.Mock).mockResolvedValue(invalidRequestBody);

      const response = await POST(mockRequest as NextRequest);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toBe('Validation Error');
      expect(responseData.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'content',
            message: 'Content must be at least 100 characters'
          }),
          expect.objectContaining({
            field: 'keyword',
            message: 'Keyword is required'
          })
        ])
      );
    });

    it('should handle analysis errors gracefully', async () => {
      (mockRequest.json as jest.Mock).mockResolvedValue(validRequestBody);
      
      // Mock analyzer to throw error
      (ContentQualityChecker as jest.Mock).mockImplementation(() => ({
        analyze: jest.fn().mockRejectedValue(new Error('Analysis failed'))
      }));

      const response = await POST(mockRequest as NextRequest);
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.error).toBe('Internal Server Error');
    });

    it('should use default analysis types when not specified', async () => {
      (mockRequest.json as jest.Mock).mockResolvedValue(validRequestBody);

      const response = await POST(mockRequest as NextRequest);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.data.qualityAnalysis).toBeDefined();
      expect(responseData.data.humanWritingAnalysis).toBeDefined();
      expect(responseData.data.eeatOptimization).toBeDefined();
      expect(responseData.data.userValueAnalysis).toBeDefined();
      expect(responseData.data.authoritySignalAnalysis).toBeDefined();
    });

    it('should calculate composite score correctly', async () => {
      (mockRequest.json as jest.Mock).mockResolvedValue({
        ...validRequestBody,
        analysisTypes: ['quality', 'eeat']
      });

      const response = await POST(mockRequest as NextRequest);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      // Composite score should be average of quality (85) and eeat (88) = 86.5
      expect(responseData.data.compositeScore).toBeCloseTo(86.5, 1);
    });
  });

  describe('GET /api/content/analyze', () => {
    it('should return analysis capabilities', async () => {
      const response = await GET(mockRequest as NextRequest);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.status).toBe('operational');
      expect(responseData.version).toBe('1.0.0');
      expect(responseData.capabilities).toBeDefined();
      expect(responseData.capabilities.analysisTypes).toHaveLength(5);
      expect(responseData.capabilities.limits.minContentLength).toBe(100);
      expect(responseData.capabilities.limits.maxContentLength).toBe(50000);
    });

    it('should return 401 for unauthenticated requests', async () => {
      (authenticateRequest as jest.Mock).mockResolvedValue({ user: null });

      const response = await GET(mockRequest as NextRequest);
      const responseData = await response.json();

      expect(response.status).toBe(401);
      expect(responseData.error).toBe('Unauthorized');
    });

    it('should include all analysis type descriptions', async () => {
      const response = await GET(mockRequest as NextRequest);
      const responseData = await response.json();

      const analysisTypes = responseData.capabilities.analysisTypes;
      const typeNames = analysisTypes.map((type: any) => type.type);

      expect(typeNames).toContain('quality');
      expect(typeNames).toContain('human-writing');
      expect(typeNames).toContain('eeat');
      expect(typeNames).toContain('user-value');
      expect(typeNames).toContain('authority-signals');

      // Check that each type has description and metrics
      analysisTypes.forEach((type: any) => {
        expect(type.description).toBeDefined();
        expect(type.metrics).toBeDefined();
        expect(Array.isArray(type.metrics)).toBe(true);
      });
    });
  });
});
