
import { WorkflowOrchestrator, WorkflowConfig } from './workflow-orchestrator';

export interface BatchProcessorConfig {
  maxConcurrency: number;
  batchSize: number;
  delayBetweenBatches: number;
  retryFailedItems: boolean;
  maxRetries: number;
}

export interface BatchItem {
  contentId: string;
  contentType?: string;
  priority: 'low' | 'medium' | 'high';
  metadata?: Record<string, any>;
}

export interface BatchResult {
  batchId: string;
  totalItems: number;
  successCount: number;
  failureCount: number;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  failedItems: string[];
  results: Map<string, any>;
}

export class BatchProcessor {
  private workflowOrchestrator: WorkflowOrchestrator;
  private config: BatchProcessorConfig;
  private activeBatches: Map<string, BatchResult>;
  private processingQueue: BatchItem[];

  constructor(
    config: BatchProcessorConfig = {
      maxConcurrency: 5,
      batchSize: 10,
      delayBetweenBatches: 1000,
      retryFailedItems: true,
      maxRetries: 3
    },
    workflowConfig?: WorkflowConfig
  ) {
    this.config = config;
    this.workflowOrchestrator = new WorkflowOrchestrator(workflowConfig);
    this.activeBatches = new Map();
    this.processingQueue = [];
  }

  public async processBatch(items: BatchItem[]): Promise<BatchResult> {
    const batchId = this.generateBatchId();
    const batchResult: BatchResult = {
      batchId,
      totalItems: items.length,
      successCount: 0,
      failureCount: 0,
      startTime: new Date(),
      failedItems: [],
      results: new Map()
    };

    this.activeBatches.set(batchId, batchResult);
    console.log(`Batch processing started for ${items.length} items (Batch ID: ${batchId})`);

    try {
      // Sort items by priority (high -> medium -> low)
      const sortedItems = this.sortItemsByPriority(items);
      
      // Process items in chunks with concurrency control
      const chunks = this.chunkArray(sortedItems, this.config.batchSize);
      
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        console.log(`Processing chunk ${i + 1}/${chunks.length} with ${chunk.length} items`);
        
        await this.processChunk(chunk, batchResult);
        
        // Add delay between chunks to prevent overwhelming the system
        if (i < chunks.length - 1) {
          await this.delay(this.config.delayBetweenBatches);
        }
      }

      // Retry failed items if configured
      if (this.config.retryFailedItems && batchResult.failedItems.length > 0) {
        await this.retryFailedItems(batchResult);
      }

    } catch (error) {
      console.error(`Batch processing failed for batch ${batchId}:`, error);
    } finally {
      batchResult.endTime = new Date();
      batchResult.duration = batchResult.endTime.getTime() - batchResult.startTime.getTime();
      console.log(`Batch processing completed for ${batchId}. Success: ${batchResult.successCount}, Failed: ${batchResult.failureCount}, Duration: ${batchResult.duration}ms`);
    }

    return batchResult;
  }

  private async processChunk(items: BatchItem[], batchResult: BatchResult): Promise<void> {
    const promises = items.map(item => this.processItem(item, batchResult));
    
    // Use Promise.allSettled to handle individual failures without stopping the batch
    const results = await Promise.allSettled(promises);
    
    results.forEach((result, index) => {
      const item = items[index];
      if (result.status === 'fulfilled') {
        batchResult.successCount++;
        batchResult.results.set(item.contentId, result.value);
      } else {
        batchResult.failureCount++;
        batchResult.failedItems.push(item.contentId);
        console.error(`Failed to process item ${item.contentId}:`, result.reason);
      }
    });
  }

  private async processItem(item: BatchItem, batchResult: BatchResult): Promise<any> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Processing timeout for item ${item.contentId}`));
      }, 60000); // 60 second timeout per item

      try {
        // Start the workflow for this item
        this.workflowOrchestrator.startWorkflow(item.contentId, item.contentType);
        
        // In a real implementation, you would wait for workflow completion
        // For now, simulate processing
        setTimeout(() => {
          clearTimeout(timeout);
          resolve({ contentId: item.contentId, status: 'completed' });
        }, Math.random() * 2000 + 500); // Random delay between 500-2500ms
        
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });
  }

  private async retryFailedItems(batchResult: BatchResult): Promise<void> {
    console.log(`Retrying ${batchResult.failedItems.length} failed items`);
    
    const retryItems: BatchItem[] = batchResult.failedItems.map(contentId => ({
      contentId,
      priority: 'high' // Give failed items high priority on retry
    }));

    // Reset failed items for retry
    const originalFailedCount = batchResult.failedItems.length;
    batchResult.failedItems = [];

    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      if (retryItems.length === 0) break;

      console.log(`Retry attempt ${attempt}/${this.config.maxRetries} for ${retryItems.length} items`);
      
      const retryResults = await Promise.allSettled(
        retryItems.map(item => this.processItem(item, batchResult))
      );

      // Remove successfully processed items from retry list
      const stillFailedItems: BatchItem[] = [];
      retryResults.forEach((result, index) => {
        const item = retryItems[index];
        if (result.status === 'fulfilled') {
          batchResult.successCount++;
          batchResult.failureCount--;
          batchResult.results.set(item.contentId, result.value);
        } else {
          stillFailedItems.push(item);
          if (attempt === this.config.maxRetries) {
            batchResult.failedItems.push(item.contentId);
          }
        }
      });

      retryItems.splice(0, retryItems.length, ...stillFailedItems);
      
      if (attempt < this.config.maxRetries && retryItems.length > 0) {
        await this.delay(this.config.delayBetweenBatches * attempt); // Exponential backoff
      }
    }

    console.log(`Retry completed. Originally failed: ${originalFailedCount}, Still failed: ${batchResult.failedItems.length}`);
  }

  private sortItemsByPriority(items: BatchItem[]): BatchItem[] {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return [...items].sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
  }

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  private generateBatchId(): string {
    return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  public getBatchStatus(batchId: string): BatchResult | undefined {
    return this.activeBatches.get(batchId);
  }

  public getActiveBatches(): string[] {
    return Array.from(this.activeBatches.keys());
  }

  public async processSingle(contentId: string, contentType?: string, priority: 'low' | 'medium' | 'high' = 'medium'): Promise<any> {
    const items: BatchItem[] = [{ contentId, contentType, priority }];
    const result = await this.processBatch(items);
    return result.results.get(contentId);
  }
}
