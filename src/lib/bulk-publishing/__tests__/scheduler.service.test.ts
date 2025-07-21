import { BulkSchedulerService } from '../scheduler.service';
import { BulkPublishRequest } from '@/types/bulk-publishing';
import { BulkPublisherService } from '../bulk-publisher.service';

// Mock BulkPublisherService
const createBulkPublishJob = jest.fn().mockImplementation((request: BulkPublishRequest) =>
  Promise.resolve(request.id)
);
class MockBulkPublisherService {
  createBulkPublishJob = createBulkPublishJob;
  cancelBulkJob = jest.fn().mockResolvedValue(true);
}

describe('BulkSchedulerService', () => {
  let scheduler: BulkSchedulerService;
  let bulkPublisher: MockBulkPublisherService;

  beforeEach(() => {
    jest.useFakeTimers();

    // Reset the mock implementation
    createBulkPublishJob.mockImplementation((request: BulkPublishRequest) =>
      Promise.resolve(request.id)
    );

    bulkPublisher = new MockBulkPublisherService();
    scheduler = new BulkSchedulerService(bulkPublisher as unknown as BulkPublisherService);
    createBulkPublishJob.mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('schedules an immediate job if publishAt is not set', async () => {
    const req: Partial<BulkPublishRequest> = {
      id: 'bulk-imm',
      platforms: [{ platform: 'wordpress', credentials: { platform: 'wordpress', endpoint: 'https://wp.com', apiKey: 'key' }, priority: 5 }],
      content: { title: 'T', content: 'B', status: 'published' },
      userId: 'user-1',
      title: 'Test',
      createdAt: new Date(),
      status: 'pending'
    };
    const result = await scheduler.schedulePublish(req as BulkPublishRequest);
    expect(result).toBe('bulk-imm');
    expect(createBulkPublishJob).toHaveBeenCalledWith(expect.objectContaining({ id: 'bulk-imm' }));
  });

  it('schedules a delayed job if publishAt is in the future', async () => {
    const future = new Date(Date.now() + 60 * 1000);
    const req: Partial<BulkPublishRequest> = {
      id: 'bulk-delay',
      platforms: [{ platform: 'wordpress', credentials: { platform: 'wordpress', endpoint: 'https://wp.com', apiKey: 'key' }, priority: 5 }],
      content: { title: 'T', content: 'B', status: 'published' },
      schedule: { publishAt: future },
    };
    const result = await scheduler.schedulePublish(req as BulkPublishRequest);
    expect(result).toBe('bulk-delay');
    // Should not call createBulkPublishJob immediately
    expect(createBulkPublishJob).toHaveBeenCalledTimes(1); // Called once for scheduled status
    jest.advanceTimersByTime(60 * 1000);
  });

  it('executes scheduled job after delay', async () => {
    const future = new Date(Date.now() + 1000);
    const req: Partial<BulkPublishRequest> = {
      id: 'bulk-delay2',
      platforms: [{ platform: 'wordpress', credentials: { platform: 'wordpress', endpoint: 'https://wp.com', apiKey: 'key' }, priority: 5 }],
      content: { title: 'T', content: 'B', status: 'published' },
      schedule: { publishAt: future },
    };
    await scheduler.schedulePublish(req as BulkPublishRequest);
    jest.advanceTimersByTime(1000);
    // Wait for async
    await Promise.resolve();
    expect(createBulkPublishJob).toHaveBeenCalled();
  });

  it('cancels a scheduled job', async () => {
    const future = new Date(Date.now() + 10000);
    const req: Partial<BulkPublishRequest> = {
      id: 'bulk-cancel',
      platforms: [{ platform: 'wordpress', credentials: { platform: 'wordpress', endpoint: 'https://wp.com', apiKey: 'key' }, priority: 5 }],
      content: { title: 'T', content: 'B', status: 'published' },
      schedule: { publishAt: future },
    };
    await scheduler.schedulePublish(req as BulkPublishRequest);
    const result = await scheduler.cancelScheduledPublish('bulk-cancel', 'user-1');
    expect(result).toBe(true);
    expect(bulkPublisher.cancelBulkJob).toHaveBeenCalledWith('bulk-cancel', 'user-1');
  });

  it('sets up and processes recurring jobs', async () => {
    const now = new Date();
    const req: Partial<BulkPublishRequest> = {
      id: 'bulk-recur',
      platforms: [{ platform: 'wordpress', credentials: { platform: 'wordpress', endpoint: 'https://wp.com', apiKey: 'key' }, priority: 5 }],
      content: { title: 'T', content: 'B', status: 'published' },
      schedule: {
        publishAt: now,
        recurringSchedule: { frequency: 'daily', interval: 1, maxOccurrences: 2 }
      }
    };
    await scheduler.schedulePublish(req as BulkPublishRequest);
    // Simulate recurring job processor
    jest.advanceTimersByTime(60 * 1000); // 1 minute
    await Promise.resolve();
    expect(createBulkPublishJob).toHaveBeenCalled();
  });
}); 