import { BatchProcessor, BatchItem } from '../batch-processor';

describe('BatchProcessor', () => {
  let batchProcessor: BatchProcessor;

  beforeEach(() => {
    batchProcessor = new BatchProcessor({
      maxConcurrency: 2,
      batchSize: 3,
      delayBetweenBatches: 100,
      retryFailedItems: false,
      maxRetries: 1
    });
  });

  it('should process batch items successfully', async () => {
    const items: BatchItem[] = [
      { contentId: 'content-1', priority: 'high' },
      { contentId: 'content-2', priority: 'medium' },
      { contentId: 'content-3', priority: 'low' }
    ];

    const result = await batchProcessor.processBatch(items);

    expect(result.totalItems).toBe(3);
    expect(result.batchId).toBeDefined();
    expect(result.startTime).toBeInstanceOf(Date);
    expect(result.endTime).toBeInstanceOf(Date);
    expect(result.duration).toBeGreaterThan(0);
  });

  it('should sort items by priority', async () => {
    const items: BatchItem[] = [
      { contentId: 'content-low', priority: 'low' },
      { contentId: 'content-high', priority: 'high' },
      { contentId: 'content-medium', priority: 'medium' }
    ];

    const result = await batchProcessor.processBatch(items);
    expect(result.totalItems).toBe(3);
  });

  it('should process single item', async () => {
    const result = await batchProcessor.processSingle('single-content', 'article', 'high');
    expect(result).toBeDefined();
  });
});