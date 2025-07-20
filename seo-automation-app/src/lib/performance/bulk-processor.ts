/**
 * Bulk Processing System
 * Implements NFR13: 50 pages simultaneously processing
 * Provides parallel processing with queue management and optimization
 */

import { logger } from '../logging/logger';
import { ContentGenerationRequest, ContentGenerationResult } from '../types/content-generation';
import { generateSEOContent } from '../ai/content-generator';

export interface BulkProcessingConfig {
  maxConcurrency: number; // Maximum concurrent operations
  batchSize: number; // Number of items to process in each batch
  retryAttempts: number; // Number of retry attempts for failed items
  retryDelay: number; // Delay between retries in milliseconds
  timeoutMs: number; // Timeout for individual operations
  enableProgressTracking: boolean; // Enable real-time progress tracking
}

export interface BulkProcessingRequest {
  items: ContentGenerationRequest[];
  config?: Partial<BulkProcessingConfig>;
  userId?: string;
  projectId?: string;
}

export interface BulkProcessingResult {
  totalItems: number;
  successCount: number;
  failureCount: number;
  processingTimeMs: number;
  results: ContentGenerationResult[];
  errors: BulkProcessingError[];
  performance: BulkPerformanceMetrics;
}

export interface BulkProcessingError {
  itemIndex: number;
  request: ContentGenerationRequest;
  error: string;
  retryCount: number;
  timestamp: Date;
}

export interface BulkPerformanceMetrics {
  averageProcessingTimeMs: number;
  throughputPerSecond: number;
  memoryUsageMB: number;
  cpuUsagePercent: number;
  concurrencyUtilization: number;
  queueWaitTimeMs: number;
}

export interface ProgressUpdate {
  totalItems: number;
  completedItems: number;
  failedItems: number;
  currentBatch: number;
  totalBatches: number;
  estimatedTimeRemainingMs: number;
  throughputPerSecond: number;
}

export type ProgressCallback = (progress: ProgressUpdate) => void;

export class BulkProcessor {
  private defaultConfig: BulkProcessingConfig = {
    maxConcurrency: 50, // Support 50+ concurrent operations
    batchSize: 10, // Process 10 items per batch
    retryAttempts: 3,
    retryDelay: 1000,
    timeoutMs: 300000, // 5 minutes per operation
    enableProgressTracking: true,
  };

  private activeOperations = new Set<Promise<any>>();
  private processingQueue: Array<() => Promise<any>> = [];
  private progressCallback?: ProgressCallback;

  constructor(private config: BulkProcessingConfig = {}) {
    this.config = { ...this.defaultConfig, ...config };
  }

  /**
   * Process multiple content generation requests in parallel
   */
  async processBulk(
    request: BulkProcessingRequest,
    progressCallback?: ProgressCallback
  ): Promise<BulkProcessingResult> {
    const startTime = Date.now();
    this.progressCallback = progressCallback;

    const config = { ...this.defaultConfig, ...request.config };
    const { items } = request;

    logger.info('Starting bulk processing', {
      totalItems: items.length,
      maxConcurrency: config.maxConcurrency,
      batchSize: config.batchSize,
      userId: request.userId,
      projectId: request.projectId,
    });

    // Initialize result tracking
    const results: ContentGenerationResult[] = new Array(items.length);
    const errors: BulkProcessingError[] = [];
    let successCount = 0;
    let failureCount = 0;

    // Create batches
    const batches = this.createBatches(items, config.batchSize);
    const totalBatches = batches.length;

    // Process batches with concurrency control
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      
      logger.info(`Processing batch ${batchIndex + 1}/${totalBatches}`, {
        batchSize: batch.length,
        totalItems: items.length,
      });

      // Process batch items concurrently
      const batchPromises = batch.map(async (item, itemIndex) => {
        const globalIndex = batchIndex * config.batchSize + itemIndex;
        
        try {
          const result = await this.processWithRetry(
            item.request,
            config,
            globalIndex
          );
          
          results[globalIndex] = result;
          successCount++;
          
          // Update progress
          if (config.enableProgressTracking && this.progressCallback) {
            this.updateProgress(
              items.length,
              successCount + failureCount,
              failureCount,
              batchIndex + 1,
              totalBatches,
              startTime
            );
          }
          
        } catch (error) {
          const bulkError: BulkProcessingError = {
            itemIndex: globalIndex,
            request: item.request,
            error: error instanceof Error ? error.message : 'Unknown error',
            retryCount: config.retryAttempts,
            timestamp: new Date(),
          };
          
          errors.push(bulkError);
          failureCount++;
          
          logger.error('Bulk processing item failed', {
            itemIndex: globalIndex,
            error: bulkError.error,
          });
        }
      });

      // Wait for batch completion with concurrency control
      await this.processConcurrently(batchPromises, config.maxConcurrency);
    }

    const endTime = Date.now();
    const processingTimeMs = endTime - startTime;

    // Calculate performance metrics
    const performance = this.calculatePerformanceMetrics(
      items.length,
      processingTimeMs,
      config.maxConcurrency
    );

    const result: BulkProcessingResult = {
      totalItems: items.length,
      successCount,
      failureCount,
      processingTimeMs,
      results: results.filter(Boolean), // Remove undefined entries
      errors,
      performance,
    };

    logger.info('Bulk processing completed', {
      totalItems: items.length,
      successCount,
      failureCount,
      processingTimeMs,
      throughputPerSecond: performance.throughputPerSecond,
    });

    return result;
  }

  /**
   * Process single item with retry logic
   */
  private async processWithRetry(
    request: ContentGenerationRequest,
    config: BulkProcessingConfig,
    itemIndex: number
  ): Promise<ContentGenerationResult> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= config.retryAttempts; attempt++) {
      try {
        // Add timeout wrapper
        const result = await Promise.race([
          generateSEOContent(request),
          this.createTimeoutPromise(config.timeoutMs),
        ]);
        
        logger.debug('Bulk processing item succeeded', {
          itemIndex,
          attempt,
          keyword: request.keyword,
        });
        
        return result;
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (attempt < config.retryAttempts) {
          logger.warn('Bulk processing item failed, retrying', {
            itemIndex,
            attempt,
            error: lastError.message,
            nextRetryIn: config.retryDelay,
          });
          
          await this.delay(config.retryDelay);
        }
      }
    }
    
    throw lastError || new Error('Max retry attempts exceeded');
  }

  /**
   * Process promises with concurrency control
   */
  private async processConcurrently<T>(
    promises: Promise<T>[],
    maxConcurrency: number
  ): Promise<T[]> {
    const results: T[] = [];
    const executing: Promise<any>[] = [];

    for (const promise of promises) {
      const wrappedPromise = promise.then(result => {
        executing.splice(executing.indexOf(wrappedPromise), 1);
        return result;
      });

      results.push(wrappedPromise as any);
      executing.push(wrappedPromise);

      if (executing.length >= maxConcurrency) {
        await Promise.race(executing);
      }
    }

    return Promise.all(results);
  }

  /**
   * Create batches from items array
   */
  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    
    return batches;
  }

  /**
   * Update progress tracking
   */
  private updateProgress(
    totalItems: number,
    completedItems: number,
    failedItems: number,
    currentBatch: number,
    totalBatches: number,
    startTime: number
  ): void {
    const elapsedMs = Date.now() - startTime;
    const throughputPerSecond = completedItems / (elapsedMs / 1000);
    const remainingItems = totalItems - completedItems;
    const estimatedTimeRemainingMs = remainingItems / throughputPerSecond * 1000;

    const progress: ProgressUpdate = {
      totalItems,
      completedItems,
      failedItems,
      currentBatch,
      totalBatches,
      estimatedTimeRemainingMs: isFinite(estimatedTimeRemainingMs) ? estimatedTimeRemainingMs : 0,
      throughputPerSecond,
    };

    this.progressCallback?.(progress);
  }

  /**
   * Calculate performance metrics
   */
  private calculatePerformanceMetrics(
    totalItems: number,
    processingTimeMs: number,
    maxConcurrency: number
  ): BulkPerformanceMetrics {
    const averageProcessingTimeMs = processingTimeMs / totalItems;
    const throughputPerSecond = totalItems / (processingTimeMs / 1000);
    
    // Get memory usage (Node.js specific)
    const memoryUsage = process.memoryUsage();
    const memoryUsageMB = memoryUsage.heapUsed / 1024 / 1024;

    return {
      averageProcessingTimeMs,
      throughputPerSecond,
      memoryUsageMB,
      cpuUsagePercent: 0, // Would need additional monitoring for accurate CPU usage
      concurrencyUtilization: Math.min(totalItems / maxConcurrency, 1) * 100,
      queueWaitTimeMs: 0, // Would need queue timing for accurate measurement
    };
  }

  /**
   * Create timeout promise
   */
  private createTimeoutPromise(timeoutMs: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    });
  }

  /**
   * Delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get current processing statistics
   */
  getProcessingStats(): {
    activeOperations: number;
    queueLength: number;
    memoryUsageMB: number;
  } {
    const memoryUsage = process.memoryUsage();
    
    return {
      activeOperations: this.activeOperations.size,
      queueLength: this.processingQueue.length,
      memoryUsageMB: memoryUsage.heapUsed / 1024 / 1024,
    };
  }
}

// Export singleton instance
export const bulkProcessor = new BulkProcessor();
