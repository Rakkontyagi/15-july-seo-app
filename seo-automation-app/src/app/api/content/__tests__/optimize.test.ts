/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { POST, GET } from '../optimize/route';

// Mock dependencies before importing
jest.mock('@/lib/ai/nlp-optimizer', () => ({
  NLPOptimizer: jest.fn()
}));

jest.mock('../../../../../src/lib/content-analysis/prohibited-phrase-detector', () => ({
  ProhibitedPhraseDetector: jest.fn()
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
import { NLPOptimizer } from '@/lib/ai/nlp-optimizer';
import { ProhibitedPhraseDetector } from '../../../../../src/lib/content-analysis/prohibited-phrase-detector';
import { authenticateRequest } from '@/lib/auth/middleware';

describe('/api/content/optimize', () => {
  let mockRequest: Partial<NextRequest>;
  let mockNLPOptimizer: jest.Mocked<NLPOptimizer>;
  let mockProhibitedPhraseDetector: jest.Mocked<ProhibitedPhraseDetector>;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com'
  };

  const mockOptimizationResult = {
    optimizedContent: 'The team completed the project successfully with excellent results.',
    metrics: {
      svoComplianceScore: 92,
      prohibitedPhrasesRemoved: 3,
      languagePrecisionScore: 88,
      fillerContentPercentage: 2.5,
      sentenceComplexityScore: 65,
      grammarAccuracyScore: 95,
      contentFlowScore: 87
    },
    changes: [
      {
        type: 'prohibited',
        original: 'meticulous approach',
        optimized: 'careful approach',
        reason: 'Replaced overused SEO term "meticulous" with "careful"',
        position: 0
      },
      {
        type: 'filler',
        original: 'very carefully designed',
        optimized: 'carefully designed',
        reason: 'Removed filler word "very" for better precision',
        position: 1
      }
    ],
    issues: [],
    recommendations: [
      'Content demonstrates excellent SVO compliance',
      'Language precision is well-maintained'
    ]
  };

  beforeEach(() => {
    // Mock authenticated request
    (authenticateRequest as jest.Mock).mockResolvedValue({ user: mockUser });

    // Mock NLP Optimizer
    mockNLPOptimizer = {
      optimize: jest.fn().mockReturnValue(mockOptimizationResult)
    } as any;
    (NLPOptimizer as jest.Mock).mockImplementation(() => mockNLPOptimizer);

    // Mock Prohibited Phrase Detector
    mockProhibitedPhraseDetector = {
      detectProhibitedPhrases: jest.fn().mockReturnValue({
        detectedPhrases: ['custom phrase'],
        suggestions: ['alternative phrase'],
        severity: 3
      })
    } as any;
    (ProhibitedPhraseDetector as jest.Mock).mockImplementation(() => mockProhibitedPhraseDetector);

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

  describe('POST /api/content/optimize', () => {
    const validRequestBody = {
      content: 'This meticulous approach was very carefully designed by our team to leverage cutting-edge technology.',
      optimizationTypes: ['all'],
      strictMode: false,
      preserveStyle: true
    };

    it('should optimize content successfully with valid request', async () => {
      (mockRequest.json as jest.Mock).mockResolvedValue(validRequestBody);

      const response = await POST(mockRequest as NextRequest);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data.originalContent).toBe(validRequestBody.content);
      expect(responseData.data.optimizedContent).toBe(mockOptimizationResult.optimizedContent);
      expect(responseData.data.metrics).toEqual(mockOptimizationResult.metrics);
      expect(responseData.data.changes).toEqual(mockOptimizationResult.changes);
      expect(responseData.metadata.optimizationTypes).toContain('svo-enforcement');
    });

    it('should handle specific optimization types', async () => {
      const specificRequest = {
        ...validRequestBody,
        optimizationTypes: ['svo-enforcement', 'prohibited-phrases']
      };
      (mockRequest.json as jest.Mock).mockResolvedValue(specificRequest);

      const response = await POST(mockRequest as NextRequest);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.metadata.optimizationTypes).toEqual(['svo-enforcement', 'prohibited-phrases']);
      expect(responseData.metadata.optimizationTypes).not.toContain('filler-elimination');
    });

    it('should handle custom prohibited phrases', async () => {
      const customRequest = {
        ...validRequestBody,
        customProhibitedPhrases: ['custom phrase', 'another phrase']
      };
      (mockRequest.json as jest.Mock).mockResolvedValue(customRequest);

      const response = await POST(mockRequest as NextRequest);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.data.additionalProhibitedDetection).toBeDefined();
      expect(responseData.data.additionalProhibitedDetection.detectedPhrases).toContain('custom phrase');
      expect(mockProhibitedPhraseDetector.detectProhibitedPhrases).toHaveBeenCalledWith(
        mockOptimizationResult.optimizedContent,
        ['custom phrase', 'another phrase']
      );
    });

    it('should calculate improvement metrics correctly', async () => {
      (mockRequest.json as jest.Mock).mockResolvedValue(validRequestBody);

      const response = await POST(mockRequest as NextRequest);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.data.improvementMetrics).toBeDefined();
      expect(responseData.data.improvementMetrics.originalWordCount).toBeGreaterThan(0);
      expect(responseData.data.improvementMetrics.optimizedWordCount).toBeGreaterThan(0);
      expect(responseData.data.improvementMetrics.totalChanges).toBe(mockOptimizationResult.changes.length);
    });

    it('should provide quality assessment', async () => {
      (mockRequest.json as jest.Mock).mockResolvedValue(validRequestBody);

      const response = await POST(mockRequest as NextRequest);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.data.qualityAssessment).toBeDefined();
      expect(responseData.data.qualityAssessment.overallImprovement).toBeDefined();
      expect(responseData.data.qualityAssessment.readabilityImprovement).toBeDefined();
      expect(responseData.data.qualityAssessment.precisionImprovement).toBeDefined();
      expect(responseData.data.qualityAssessment.clarityImprovement).toBeDefined();
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
        optimizationTypes: ['invalid-type'] // Invalid optimization type
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
            message: 'Content must be at least 50 characters'
          })
        ])
      );
    });

    it('should handle optimization errors gracefully', async () => {
      (mockRequest.json as jest.Mock).mockResolvedValue(validRequestBody);
      mockNLPOptimizer.optimize.mockImplementation(() => {
        throw new Error('Optimization failed');
      });

      const response = await POST(mockRequest as NextRequest);
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.error).toBe('Internal Server Error');
    });

    it('should handle strict mode correctly', async () => {
      const strictRequest = {
        ...validRequestBody,
        strictMode: true,
        targetComplexityScore: 50
      };
      (mockRequest.json as jest.Mock).mockResolvedValue(strictRequest);

      const response = await POST(mockRequest as NextRequest);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.metadata.strictMode).toBe(true);
    });
  });

  describe('GET /api/content/optimize', () => {
    it('should return optimization capabilities', async () => {
      const response = await GET(mockRequest as NextRequest);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.status).toBe('operational');
      expect(responseData.version).toBe('1.0.0');
      expect(responseData.capabilities).toBeDefined();
      expect(responseData.capabilities.optimizationTypes).toHaveLength(7);
      expect(responseData.capabilities.limits).toBeDefined();
      expect(responseData.capabilities.metrics).toBeDefined();
    });

    it('should include all optimization types in capabilities', async () => {
      const response = await GET(mockRequest as NextRequest);
      const responseData = await response.json();

      const optimizationTypes = responseData.capabilities.optimizationTypes.map((type: any) => type.type);
      expect(optimizationTypes).toContain('svo-enforcement');
      expect(optimizationTypes).toContain('prohibited-phrases');
      expect(optimizationTypes).toContain('language-precision');
      expect(optimizationTypes).toContain('filler-elimination');
      expect(optimizationTypes).toContain('sentence-complexity');
      expect(optimizationTypes).toContain('grammar-validation');
      expect(optimizationTypes).toContain('content-flow');
    });

    it('should include detailed feature descriptions', async () => {
      const response = await GET(mockRequest as NextRequest);
      const responseData = await response.json();

      responseData.capabilities.optimizationTypes.forEach((type: any) => {
        expect(type).toHaveProperty('type');
        expect(type).toHaveProperty('description');
        expect(type).toHaveProperty('features');
        expect(Array.isArray(type.features)).toBe(true);
      });
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
