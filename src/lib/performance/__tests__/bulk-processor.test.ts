/**
 * Bulk Processor Tests
 * Comprehensive testing for parallel content generation processing
 */

import { BulkProcessor, BulkProcessingRequest, ProgressUpdate } from '../bulk-processor';
import { ContentGenerationRequest, ContentGenerationResult } from '../../types/content-generation';

// Mock the content generator
jest.mock('../../ai/content-generator', () => ({
  generateSEOContent: jest.fn(),
}));

import { generateSEOContent } from '../../ai/content-generator';
const mockGenerateSEOContent = generateSEOContent as jest.MockedFunction<typeof generateSEOContent>;

describe('BulkProcessor', () => {
  let processor: BulkProcessor;

  beforeEach(() => {
    processor = new BulkProcessor({
      maxConcurrency: 5,
      batchSize: 3,
      retryAttempts: 2,
      retryDelay: 100,
      timeoutMs: 5000,
      enableProgressTracking: true,
    });
    mockGenerateSEOContent.mockClear();
  });

  describe('constructor', () => {
    it('should initialize with default configuration', () => {
      const defaultProcessor = new BulkProcessor();
      expect(defaultProcessor).toBeInstanceOf(BulkProcessor);
    });

    it('should merge custom configuration with defaults', () => {
      const customProcessor = new BulkProcessor({
        maxConcurrency: 10,
        batchSize: 5,
      });
      expect(customProcessor).toBeInstanceOf(BulkProcessor);
    });
  });

  describe('processBulk', () => {
    const createMockRequest = (keyword: string): ContentGenerationRequest => ({
      keyword,
      location: 'New York',
      language: 'en',
      contentType: 'blog',
      targetAudience: 'general',
      tone: 'professional',
      wordCount: 1000,
      includeImages: false,
      includeFAQ: true,
    });

    const createMockResult = (keyword: string): ContentGenerationResult => ({
      success: true,
      content: {
        title: `Test Title for ${keyword}`,
        content: `Test content for ${keyword}`,
        metaDescription: `Meta description for ${keyword}`,
        keywords: [keyword],
        headings: [`H1: ${keyword}`],
        wordCount: 1000,
        readabilityScore: 85,
        seoScore: 90,
      },
      competitorAnalysis: {
        averageWordCount: 1200,
        averageKeywordDensity: 2.5,
        commonHeadings: [`H1: ${keyword}`],
        topKeywords: [keyword],
        contentGaps: [],
        recommendations: [],
      },
      processingTime: 2000,
      timestamp: new Date(),
    });

    it('should process multiple items successfully', async () => {
      const requests = [
        createMockRequest('test keyword 1'),
        createMockRequest('test keyword 2'),
        createMockRequest('test keyword 3'),
      ];

      // Mock successful responses
      mockGenerateSEOContent
        .mockResolvedValueOnce(createMockResult('test keyword 1'))
        .mockResolvedValueOnce(createMockResult('test keyword 2'))
        .mockResolvedValueOnce(createMockResult('test keyword 3'));

      const bulkRequest: BulkProcessingRequest = {
        items: requests,
        userId: 'test-user',
        projectId: 'test-project',
      };

      const result = await processor.processBulk(bulkRequest);

      expect(result.totalItems).toBe(3);
      expect(result.successCount).toBe(3);
      expect(result.failureCount).toBe(0);
      expect(result.results).toHaveLength(3);
      expect(result.errors).toHaveLength(0);
      expect(result.processingTimeMs).toBeGreaterThan(0);
      expect(result.performance.throughputPerSecond).toBeGreaterThan(0);
    });

    it('should handle processing errors with retries', async () => {
      const requests = [
        createMockRequest('success keyword'),
        createMockRequest('failure keyword'),
      ];

      // Mock one success and one failure (after retries)
      mockGenerateSEOContent
        .mockResolvedValueOnce(createMockResult('success keyword'))
        .mockRejectedValueOnce(new Error('First failure'))
        .mockRejectedValueOnce(new Error('Second failure'))
        .mockRejectedValueOnce(new Error('Final failure'));

      const bulkRequest: BulkProcessingRequest = {
        items: requests,
      };

      const result = await processor.processBulk(bulkRequest);

      expect(result.totalItems).toBe(2);
      expect(result.successCount).toBe(1);
      expect(result.failureCount).toBe(1);
      expect(result.results).toHaveLength(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].error).toContain('Final failure');
      expect(result.errors[0].retryCount).toBe(2);
    });

    it('should respect concurrency limits', async () => {
      const requests = Array.from({ length: 10 }, (_, i) => 
        createMockRequest(`keyword ${i + 1}`)
      );

      let concurrentCalls = 0;
      let maxConcurrentCalls = 0;

      mockGenerateSEOContent.mockImplementation(async (request) => {
        concurrentCalls++;
        maxConcurrentCalls = Math.max(maxConcurrentCalls, concurrentCalls);
        
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 100));
        
        concurrentCalls--;
        return createMockResult(request.keyword);
      });

      const bulkRequest: BulkProcessingRequest = {
        items: requests,
        config: {
          maxConcurrency: 3,
          batchSize: 5,
        },
      };

      await processor.processBulk(bulkRequest);

      // Should not exceed maxConcurrency
      expect(maxConcurrentCalls).toBeLessThanOrEqual(3);
    });

    it('should provide progress updates', async () => {
      const requests = Array.from({ length: 5 }, (_, i) => 
        createMockRequest(`keyword ${i + 1}`)
      );

      mockGenerateSEOContent.mockImplementation(async (request) => {
        await new Promise(resolve => setTimeout(resolve, 50));
        return createMockResult(request.keyword);
      });

      const progressUpdates: ProgressUpdate[] = [];
      const progressCallback = (progress: ProgressUpdate) => {
        progressUpdates.push(progress);
      };

      const bulkRequest: BulkProcessingRequest = {
        items: requests,
        config: {
          enableProgressTracking: true,
        },
      };

      await processor.processBulk(bulkRequest, progressCallback);

      expect(progressUpdates.length).toBeGreaterThan(0);
      expect(progressUpdates[progressUpdates.length - 1].completedItems).toBe(5);
    });

    it('should handle timeout errors', async () => {
      const requests = [createMockRequest('timeout keyword')];

      // Mock a long-running operation that will timeout
      mockGenerateSEOContent.mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 10000)); // 10 seconds
        return createMockResult('timeout keyword');
      });

      const bulkRequest: BulkProcessingRequest = {
        items: requests,
        config: {
          timeoutMs: 1000, // 1 second timeout
          retryAttempts: 0, // No retries for faster test
        },
      };

      const result = await processor.processBulk(bulkRequest);

      expect(result.successCount).toBe(0);
      expect(result.failureCount).toBe(1);
      expect(result.errors[0].error).toContain('timed out');
    });

    it('should process batches correctly', async () => {
      const requests = Array.from({ length: 7 }, (_, i) => 
        createMockRequest(`keyword ${i + 1}`)
      );

      const batchSizes: number[] = [];
      let currentBatch: string[] = [];

      mockGenerateSEOContent.mockImplementation(async (request) => {
        currentBatch.push(request.keyword);
        
        // Simulate batch completion detection
        await new Promise(resolve => setTimeout(resolve, 10));
        
        if (currentBatch.length === 3 || currentBatch.length === 7) {
          batchSizes.push(currentBatch.length);
          currentBatch = [];
        }
        
        return createMockResult(request.keyword);
      });

      const bulkRequest: BulkProcessingRequest = {
        items: requests,
        config: {
          batchSize: 3,
          maxConcurrency: 10, // High concurrency to ensure batching is the limiting factor
        },
      };

      await processor.processBulk(bulkRequest);

      // Should have processed in batches of 3, 3, and 1
      expect(batchSizes).toContain(3);
    });
  });

  describe('getProcessingStats', () => {
    it('should return current processing statistics', () => {
      const stats = processor.getProcessingStats();

      expect(stats).toHaveProperty('activeOperations');
      expect(stats).toHaveProperty('queueLength');
      expect(stats).toHaveProperty('memoryUsageMB');
      expect(typeof stats.activeOperations).toBe('number');
      expect(typeof stats.queueLength).toBe('number');
      expect(typeof stats.memoryUsageMB).toBe('number');
    });
  });

  describe('performance metrics', () => {
    it('should calculate accurate performance metrics', async () => {
      const requests = Array.from({ length: 5 }, (_, i) => 
        createMockRequest(`keyword ${i + 1}`)
      );

      mockGenerateSEOContent.mockImplementation(async (request) => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return createMockResult(request.keyword);
      });

      const bulkRequest: BulkProcessingRequest = {
        items: requests,
      };

      const result = await processor.processBulk(bulkRequest);

      expect(result.performance.averageProcessingTimeMs).toBeGreaterThan(0);
      expect(result.performance.throughputPerSecond).toBeGreaterThan(0);
      expect(result.performance.memoryUsageMB).toBeGreaterThan(0);
      expect(result.performance.concurrencyUtilization).toBeGreaterThanOrEqual(0);
      expect(result.performance.concurrencyUtilization).toBeLessThanOrEqual(100);
    });
  });

  describe('error handling', () => {
    it('should handle various error types', async () => {
      const requests = [
        createMockRequest('network error'),
        createMockRequest('validation error'),
        createMockRequest('timeout error'),
      ];

      mockGenerateSEOContent
        .mockRejectedValueOnce(new Error('Network connection failed'))
        .mockRejectedValueOnce(new Error('Invalid input data'))
        .mockRejectedValueOnce(new Error('Request timeout'));

      const bulkRequest: BulkProcessingRequest = {
        items: requests,
        config: {
          retryAttempts: 0, // No retries for faster test
        },
      };

      const result = await processor.processBulk(bulkRequest);

      expect(result.failureCount).toBe(3);
      expect(result.errors).toHaveLength(3);
      expect(result.errors[0].error).toBe('Network connection failed');
      expect(result.errors[1].error).toBe('Invalid input data');
      expect(result.errors[2].error).toBe('Request timeout');
    });
  });
});
