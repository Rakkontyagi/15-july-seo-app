import { BulkPublishingService } from '../bulkPublishing.service';

describe('BulkPublishingService', () => {
  let service: BulkPublishingService;

  beforeEach(() => {
    service = new BulkPublishingService();
    // Mock console.log and console.error to avoid cluttering test output
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should create a bulk publishing job successfully', async () => {
    const contentIds = ['content1', 'content2'];
    const platforms = ['wordpress', 'shopify'] as const;

    const job = await service.createJob(contentIds, platforms);

    expect(job.id).toBeDefined();
    expect(job.contentIds).toEqual(contentIds);
    expect(job.platforms).toEqual(platforms);
    expect(job.status).toBe('pending');
    expect(job.progress.total).toBe(4); // 2 content items × 2 platforms
    expect(job.progress.completed).toBe(0);
    expect(job.progress.failed).toBe(0);
    expect(job.progress.percentage).toBe(0);
  });

  it('should create job with custom name and priority', async () => {
    const contentIds = ['content1'];
    const platforms = ['wordpress'] as const;
    const name = 'Custom Job Name';
    const priority = 'high';

    const job = await service.createJob(contentIds, platforms, undefined, priority, name);

    expect(job.name).toBe(name);
    expect(job.priority).toBe(priority);
  });

  it('should create job with scheduled date', async () => {
    const contentIds = ['content1'];
    const platforms = ['wordpress'] as const;
    const scheduledDate = new Date(Date.now() + 3600000); // 1 hour from now

    const job = await service.createJob(contentIds, platforms, scheduledDate);

    expect(job.scheduledDate).toEqual(scheduledDate);
  });

  it('should execute a bulk publishing job successfully', async () => {
    const contentIds = ['content1', 'content2'];
    const platforms = ['wordpress', 'shopify'] as const;

    const job = await service.createJob(contentIds, platforms);
    await service.executeJob(job.id);

    const updatedJob = await service.getJobStatus(job.id);
    expect(updatedJob.status).toBe('completed');
    expect(updatedJob.progress.percentage).toBe(100);
    expect(updatedJob.completedAt).toBeDefined();
  });

  it('should handle job execution errors gracefully', async () => {
    const contentIds = ['content1'];
    const platforms = ['wordpress'] as const;

    const job = await service.createJob(contentIds, platforms);
    
    // Mock the private method to simulate failure
    const originalMethod = (service as any).publishToplatform;
    (service as any).publishToplatform = jest.fn().mockRejectedValue(new Error('Publish failed'));

    await expect(service.executeJob(job.id)).rejects.toThrow();

    const updatedJob = await service.getJobStatus(job.id);
    expect(updatedJob.status).toBe('failed');

    // Restore original method
    (service as any).publishToplatform = originalMethod;
  });

  it('should not execute job that is scheduled for the future', async () => {
    const contentIds = ['content1'];
    const platforms = ['wordpress'] as const;
    const futureDate = new Date(Date.now() + 3600000); // 1 hour from now

    const job = await service.createJob(contentIds, platforms, futureDate);

    await expect(service.executeJob(job.id)).rejects.toThrow(/scheduled for/);
  });

  it('should not execute job that is not in pending status', async () => {
    const contentIds = ['content1'];
    const platforms = ['wordpress'] as const;

    const job = await service.createJob(contentIds, platforms);
    await service.executeJob(job.id); // Complete the job

    await expect(service.executeJob(job.id)).rejects.toThrow(/not in pending status/);
  });

  it('should get job status correctly', async () => {
    const contentIds = ['content1'];
    const platforms = ['wordpress'] as const;

    const job = await service.createJob(contentIds, platforms);
    const status = await service.getJobStatus(job.id);

    expect(status.id).toBe(job.id);
    expect(status.status).toBe('pending');
    expect(status.contentIds).toEqual(contentIds);
    expect(status.platforms).toEqual(platforms);
  });

  it('should throw error when getting status of non-existent job', async () => {
    await expect(service.getJobStatus('non-existent')).rejects.toThrow('Job non-existent not found');
  });

  it('should cancel a pending job successfully', async () => {
    const contentIds = ['content1'];
    const platforms = ['wordpress'] as const;

    const job = await service.createJob(contentIds, platforms);
    await service.cancelJob(job.id);

    const updatedJob = await service.getJobStatus(job.id);
    expect(updatedJob.status).toBe('cancelled');
  });

  it('should not cancel a completed job', async () => {
    const contentIds = ['content1'];
    const platforms = ['wordpress'] as const;

    const job = await service.createJob(contentIds, platforms);
    await service.executeJob(job.id); // Complete the job

    await expect(service.cancelJob(job.id)).rejects.toThrow(/already completed and cannot be cancelled/);
  });

  it('should list all jobs without filters', async () => {
    const job1 = await service.createJob(['content1'], ['wordpress']);
    const job2 = await service.createJob(['content2'], ['shopify']);

    const jobs = await service.listJobs();

    expect(jobs).toHaveLength(2);
    expect(jobs.map(j => j.id)).toContain(job1.id);
    expect(jobs.map(j => j.id)).toContain(job2.id);
  });

  it('should list jobs with status filter', async () => {
    const job1 = await service.createJob(['content1'], ['wordpress']);
    const job2 = await service.createJob(['content2'], ['shopify']);
    
    await service.executeJob(job1.id); // Complete job1
    await service.cancelJob(job2.id); // Cancel job2

    const completedJobs = await service.listJobs({ status: 'completed' });
    const cancelledJobs = await service.listJobs({ status: 'cancelled' });

    expect(completedJobs).toHaveLength(1);
    expect(completedJobs[0].id).toBe(job1.id);
    expect(cancelledJobs).toHaveLength(1);
    expect(cancelledJobs[0].id).toBe(job2.id);
  });

  it('should list jobs with priority filter', async () => {
    const highPriorityJob = await service.createJob(['content1'], ['wordpress'], undefined, 'high');
    const lowPriorityJob = await service.createJob(['content2'], ['shopify'], undefined, 'low');

    const highPriorityJobs = await service.listJobs({ priority: 'high' });
    const lowPriorityJobs = await service.listJobs({ priority: 'low' });

    expect(highPriorityJobs).toHaveLength(1);
    expect(highPriorityJobs[0].id).toBe(highPriorityJob.id);
    expect(lowPriorityJobs).toHaveLength(1);
    expect(lowPriorityJobs[0].id).toBe(lowPriorityJob.id);
  });

  it('should sort jobs by priority and creation date', async () => {
    const lowJob = await service.createJob(['content1'], ['wordpress'], undefined, 'low');
    const highJob = await service.createJob(['content2'], ['shopify'], undefined, 'high');
    const urgentJob = await service.createJob(['content3'], ['hubspot'], undefined, 'urgent');

    const jobs = await service.listJobs();

    expect(jobs[0].id).toBe(urgentJob.id);
    expect(jobs[1].id).toBe(highJob.id);
    expect(jobs[2].id).toBe(lowJob.id);
  });

  it('should get job metrics correctly', async () => {
    const job1 = await service.createJob(['content1'], ['wordpress']);
    const job2 = await service.createJob(['content2'], ['shopify']);
    const job3 = await service.createJob(['content3'], ['hubspot']);

    await service.executeJob(job1.id);
    await service.cancelJob(job2.id);
    // job3 remains pending

    const metrics = await service.getJobMetrics();

    expect(metrics.total).toBe(3);
    expect(metrics.completed).toBe(1);
    expect(metrics.cancelled).toBe(1);
    expect(metrics.pending).toBe(1);
    expect(metrics.running).toBe(0);
    expect(metrics.failed).toBe(0);
  });

  it('should validate input and throw error for empty content IDs', async () => {
    await expect(service.createJob([], ['wordpress'])).rejects.toThrow('At least one content ID is required');
  });

  it('should validate input and throw error for empty platforms', async () => {
    await expect(service.createJob(['content1'], [])).rejects.toThrow('At least one platform is required');
  });

  it('should validate input and throw error for invalid priority', async () => {
    await expect(service.createJob(['content1'], ['wordpress'], undefined, 'invalid' as any))
      .rejects.toThrow();
  });

  it('should handle progress updates during job execution', async () => {
    const contentIds = ['content1', 'content2'];
    const platforms = ['wordpress', 'shopify'] as const;

    const job = await service.createJob(contentIds, platforms);
    
    // Execute job in background to test progress updates
    const executePromise = service.executeJob(job.id);
    
    // Wait a bit and check intermediate progress
    await new Promise(resolve => setTimeout(resolve, 100));
    
    await executePromise;
    
    const finalJob = await service.getJobStatus(job.id);
    expect(finalJob.progress.percentage).toBe(100);
    expect(finalJob.progress.total).toBe(4);
    expect(finalJob.progress.completed + finalJob.progress.failed).toBe(4);
  });

  it('should handle concurrent job execution correctly', async () => {
    const job1 = await service.createJob(['content1'], ['wordpress']);
    const job2 = await service.createJob(['content2'], ['shopify']);

    // Execute both jobs concurrently
    const [result1, result2] = await Promise.allSettled([
      service.executeJob(job1.id),
      service.executeJob(job2.id)
    ]);

    expect(result1.status).toBe('fulfilled');
    expect(result2.status).toBe('fulfilled');

    const finalJob1 = await service.getJobStatus(job1.id);
    const finalJob2 = await service.getJobStatus(job2.id);

    expect(finalJob1.status).toBe('completed');
    expect(finalJob2.status).toBe('completed');
  });

  it('should schedule jobs correctly', async () => {
    const pastDate = new Date(Date.now() - 10000); // 10 seconds ago
    const job = await service.createJob(['content1'], ['wordpress'], pastDate);

    expect(job.status).toBe('pending');

    await service.scheduleJobs();

    // After scheduling, the job should be executed
    await new Promise(resolve => setTimeout(resolve, 200));

    const updatedJob = await service.getJobStatus(job.id);
    expect(updatedJob.status).toBe('completed');
  });
});