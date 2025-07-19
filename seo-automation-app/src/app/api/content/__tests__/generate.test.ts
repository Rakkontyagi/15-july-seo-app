/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { POST, GET } from '../generate/route';

// Mock dependencies before importing
jest.mock('@/lib/ai/content-generator', () => ({
  AIContentGenerator: jest.fn()
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
import { AIContentGenerator } from '@/lib/ai/content-generator';
import { authenticateRequest } from '@/lib/auth/middleware';

describe('/api/content/generate', () => {
  let mockRequest: Partial<NextRequest>;
  let mockAIContentGenerator: jest.Mocked<AIContentGenerator>;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com'
  };

  const mockGeneratedContent = {
    content: 'Generated expert-level content with 20+ years of experience...',
    wordCount: 1500,
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
    },
    nlpOptimizationIssues: [],
    contentBalanceIssues: [],
    uniquenessVerification: {
      uniquenessScore: 95,
      similarityIssues: [],
      recommendations: ['Content is highly unique']
    },
    topicalClusterCompletion: {
      completionScore: 88,
      missingTopics: [],
      recommendations: ['Good topical coverage']
    },
    factVerificationResults: {
      verificationScore: 92,
      verifiedFacts: 15,
      unverifiedFacts: 2,
      recommendations: ['Most facts are well-supported']
    },
    sourceValidationResults: {
      validationScore: 90,
      validSources: 8,
      invalidSources: 1,
      recommendations: ['Sources are generally credible']
    },
    contentAccuracyAnalysis: {
      accuracyScore: 91,
      factualErrors: 0,
      recommendations: ['Content is factually accurate']
    },
    hallucinationDetection: {
      hallucinationScore: 95,
      detectedHallucinations: 0,
      recommendations: ['No hallucinations detected']
    },
    expertReviewTrigger: {
      reviewRequired: false,
      confidenceScore: 88,
      recommendations: ['Content meets quality standards']
    },
    contentVersion: {
      id: 'version-1',
      version: 1,
      content: 'Generated content...',
      author: 'AI Generator',
      timestamp: new Date().toISOString()
    },
    timestamp: new Date().toISOString()
  };

  beforeEach(() => {
    // Mock authenticated request
    (authenticateRequest as jest.Mock).mockResolvedValue({ user: mockUser });

    // Mock AI Content Generator
    mockAIContentGenerator = {
      generate: jest.fn().mockResolvedValue(mockGeneratedContent)
    } as any;
    (AIContentGenerator as jest.Mock).mockImplementation(() => mockAIContentGenerator);

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

  describe('POST /api/content/generate', () => {
    const validRequestBody = {
      keyword: 'SEO best practices',
      industry: 'Digital Marketing',
      targetAudience: 'professionals',
      tone: 'authoritative',
      wordCount: 1500
    };

    it('should generate content successfully with valid request', async () => {
      (mockRequest.json as jest.Mock).mockResolvedValue(validRequestBody);

      const response = await POST(mockRequest as NextRequest);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data.content).toBe(mockGeneratedContent.content);
      expect(responseData.data.wordCount).toBe(mockGeneratedContent.wordCount);
      expect(responseData.data.qualityAnalysis.overallScore).toBe(85);
      expect(responseData.metadata.model).toBe('gpt-4o');
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
        keyword: '', // Invalid: empty keyword
        industry: 'Digital Marketing',
        targetAudience: 'professionals',
        tone: 'authoritative',
        wordCount: 100 // Invalid: below minimum
      };

      (mockRequest.json as jest.Mock).mockResolvedValue(invalidRequestBody);

      const response = await POST(mockRequest as NextRequest);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toBe('Validation Error');
      expect(responseData.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'keyword',
            message: 'Keyword is required'
          }),
          expect.objectContaining({
            field: 'wordCount',
            message: 'Word count must be at least 300'
          })
        ])
      );
    });

    it('should handle OpenAI configuration errors', async () => {
      (mockRequest.json as jest.Mock).mockResolvedValue(validRequestBody);
      mockAIContentGenerator.generate.mockRejectedValue(new Error('OPENAI_API_KEY environment variable is not set.'));

      const response = await POST(mockRequest as NextRequest);
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.error).toBe('Configuration Error');
      expect(responseData.message).toBe('AI service is not properly configured');
    });

    it('should handle content quality threshold errors', async () => {
      (mockRequest.json as jest.Mock).mockResolvedValue(validRequestBody);
      mockAIContentGenerator.generate.mockRejectedValue(new Error('Content quality below threshold'));

      const response = await POST(mockRequest as NextRequest);
      const responseData = await response.json();

      expect(response.status).toBe(422);
      expect(responseData.error).toBe('Quality Error');
      expect(responseData.message).toBe('Generated content did not meet quality standards. Please try again.');
    });

    it('should handle general errors', async () => {
      (mockRequest.json as jest.Mock).mockResolvedValue(validRequestBody);
      mockAIContentGenerator.generate.mockRejectedValue(new Error('Unexpected error'));

      const response = await POST(mockRequest as NextRequest);
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.error).toBe('Internal Server Error');
      expect(responseData.message).toBe('An unexpected error occurred during content generation');
    });

    it('should handle advanced options correctly', async () => {
      const advancedRequestBody = {
        ...validRequestBody,
        targetKeywordDensity: 2.5,
        lsiKeywords: ['search engine optimization', 'digital marketing'],
        entities: [
          { name: 'Google', type: 'Organization' },
          { name: 'SEO', type: 'Concept' }
        ],
        targetOptimizedHeadingsCount: 5
      };

      (mockRequest.json as jest.Mock).mockResolvedValue(advancedRequestBody);

      const response = await POST(mockRequest as NextRequest);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(mockAIContentGenerator.generate).toHaveBeenCalledWith(
        expect.objectContaining({
          targetKeywordDensity: 2.5,
          lsiKeywords: ['search engine optimization', 'digital marketing'],
          entities: [
            { name: 'Google', type: 'Organization' },
            { name: 'SEO', type: 'Concept' }
          ],
          targetOptimizedHeadingsCount: 5
        })
      );
    });
  });

  describe('GET /api/content/generate', () => {
    it('should return service status and capabilities', async () => {
      const response = await GET(mockRequest as NextRequest);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.status).toBe('operational');
      expect(responseData.version).toBe('1.0.0');
      expect(responseData.capabilities).toBeDefined();
      expect(responseData.capabilities.maxWordCount).toBe(5000);
      expect(responseData.capabilities.minWordCount).toBe(300);
      expect(responseData.capabilities.supportedTones).toContain('authoritative');
      expect(responseData.capabilities.supportedAnalysis).toContain('quality-analysis');
    });

    it('should return 401 for unauthenticated requests', async () => {
      (authenticateRequest as jest.Mock).mockResolvedValue({ user: null });

      const response = await GET(mockRequest as NextRequest);
      const responseData = await response.json();

      expect(response.status).toBe(401);
      expect(responseData.error).toBe('Unauthorized');
    });
  });
});
