import { NextRequest } from 'next/server';
import { POST, GET } from '../route';

// Mock the content analysis modules
jest.mock('@/lib/content-analysis/quality-pipeline');
jest.mock('@/lib/content-analysis/approval-system');
jest.mock('@/lib/content-analysis/refinement-engine');
jest.mock('@/lib/content-analysis/error-detection-correction');
jest.mock('@/lib/content-analysis/final-validation-report');

describe('/api/content-analysis/quality-pipeline', () => {
  describe('GET', () => {
    it('should return pipeline status and configuration', async () => {
      const request = new NextRequest('http://localhost:3000/api/content-analysis/quality-pipeline');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('operational');
      expect(data.version).toBe('1.0.0');
      expect(data.stages).toHaveLength(6);
      expect(data.thresholds).toBeDefined();
      expect(data.features).toHaveLength(5);
    });
  });

  describe('POST', () => {
    const validRequest = {
      content: 'This is test content for quality analysis.',
      requirements: {
        targetAudience: 'developers',
        tone: 'professional',
        keywords: ['test', 'quality']
      }
    };

    it('should process content through quality pipeline', async () => {
      const request = new NextRequest('http://localhost:3000/api/content-analysis/quality-pipeline', {
        method: 'POST',
        body: JSON.stringify(validRequest)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.validation).toBeDefined();
      expect(data.approval).toBeDefined();
      expect(data.content).toBeDefined();
      expect(data.content.original).toBe(validRequest.content);
      expect(data.processingTimeMs).toBeGreaterThan(0);
    });

    it('should return error for missing content', async () => {
      const invalidRequest = {
        requirements: validRequest.requirements
      };

      const request = new NextRequest('http://localhost:3000/api/content-analysis/quality-pipeline', {
        method: 'POST',
        body: JSON.stringify(invalidRequest)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Content is required');
    });

    it('should return error for missing requirements', async () => {
      const invalidRequest = {
        content: validRequest.content
      };

      const request = new NextRequest('http://localhost:3000/api/content-analysis/quality-pipeline', {
        method: 'POST',
        body: JSON.stringify(invalidRequest)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Requirements must include');
    });

    it('should handle processing options', async () => {
      const requestWithOptions = {
        ...validRequest,
        options: {
          forceRefinement: true,
          maxRefinementIterations: 5,
          approvalCriteria: {
            minimumOverallScore: 95.0
          }
        }
      };

      const request = new NextRequest('http://localhost:3000/api/content-analysis/quality-pipeline', {
        method: 'POST',
        body: JSON.stringify(requestWithOptions)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.metadata.options).toEqual(requestWithOptions.options);
    });

    it('should handle malformed JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/content-analysis/quality-pipeline', {
        method: 'POST',
        body: 'invalid json'
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('Internal server error');
    });
  });
});