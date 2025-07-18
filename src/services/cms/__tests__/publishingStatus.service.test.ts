import { PublishingStatusService } from '../publishingStatus.service';

describe('PublishingStatusService', () => {
  let service: PublishingStatusService;

  beforeEach(() => {
    service = new PublishingStatusService();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should track publication status successfully', async () => {
    const contentId = 'content123';
    const platform = 'wordpress';
    const jobId = 'job456';

    const status = await service.trackPublication(contentId, platform, jobId);

    expect(status.id).toBeDefined();
    expect(status.contentId).toBe(contentId);
    expect(status.platform).toBe(platform);
    expect(status.jobId).toBe(jobId);
    expect(status.status).toBe('draft');
    expect(status.attempts).toBe(0);
    expect(status.maxAttempts).toBe(3);
    expect(status.createdAt).toBeDefined();
    expect(status.updatedAt).toBeDefined();
  });

  it('should track publication without job ID', async () => {
    const contentId = 'content123';
    const platform = 'shopify';

    const status = await service.trackPublication(contentId, platform);

    expect(status.contentId).toBe(contentId);
    expect(status.platform).toBe(platform);
    expect(status.jobId).toBeUndefined();
  });

  it('should update publication status successfully', async () => {
    const status = await service.trackPublication('content123', 'wordpress');
    
    const updatedStatus = await service.updateStatus(status.id, {
      status: 'published',
      externalId: 'wp123',
      externalUrl: 'https://example.com/post/123',
    });

    expect(updatedStatus.status).toBe('published');
    expect(updatedStatus.externalId).toBe('wp123');
    expect(updatedStatus.externalUrl).toBe('https://example.com/post/123');
    expect(updatedStatus.publishedAt).toBeDefined();
    expect(updatedStatus.updatedAt).not.toEqual(status.updatedAt);
  });

  it('should increment attempts when status changes to failed', async () => {
    const status = await service.trackPublication('content123', 'wordpress');
    
    const failedStatus = await service.updateStatus(status.id, {
      status: 'failed',
      error: 'API error',
    });

    expect(failedStatus.status).toBe('failed');
    expect(failedStatus.attempts).toBe(1);
    expect(failedStatus.error).toBe('API error');
    expect(failedStatus.lastAttemptAt).toBeDefined();
  });

  it('should get all statuses for a content item', async () => {
    const contentId = 'content123';
    
    const status1 = await service.trackPublication(contentId, 'wordpress');
    const status2 = await service.trackPublication(contentId, 'shopify');

    const contentStatuses = await service.getContentStatus(contentId);

    expect(contentStatuses).toHaveLength(2);
    expect(contentStatuses.map(s => s.id)).toContain(status1.id);
    expect(contentStatuses.map(s => s.id)).toContain(status2.id);
    expect(contentStatuses.map(s => s.platform)).toContain('wordpress');
    expect(contentStatuses.map(s => s.platform)).toContain('shopify');
  });

  it('should get all statuses for a job', async () => {
    const jobId = 'job123';
    
    const status1 = await service.trackPublication('content1', 'wordpress', jobId);
    const status2 = await service.trackPublication('content2', 'shopify', jobId);

    const jobStatuses = await service.getJobStatuses(jobId);

    expect(jobStatuses).toHaveLength(2);
    expect(jobStatuses.map(s => s.id)).toContain(status1.id);
    expect(jobStatuses.map(s => s.id)).toContain(status2.id);
    expect(jobStatuses.every(s => s.jobId === jobId)).toBe(true);
  });

  it('should retry failed publication successfully', async () => {
    const status = await service.trackPublication('content123', 'wordpress');
    
    // Mark as failed
    await service.updateStatus(status.id, {
      status: 'failed',
      error: 'Network timeout',
    });

    // Retry the publication
    await service.retryFailedPublication(status.id);

    const updatedStatus = await service.getContentStatus('content123');
    expect(updatedStatus[0].status).toBe('scheduled');
    expect(updatedStatus[0].error).toBeUndefined();
    expect(updatedStatus[0].scheduledAt).toBeDefined();
  });

  it('should not retry publication that is not failed', async () => {
    const status = await service.trackPublication('content123', 'wordpress');

    await expect(service.retryFailedPublication(status.id))
      .rejects.toThrow('is not in failed status');
  });

  it('should not retry publication that exceeded max attempts', async () => {
    const status = await service.trackPublication('content123', 'wordpress');
    
    // Simulate multiple failures
    await service.updateStatus(status.id, { status: 'failed', error: 'Error 1' });
    await service.updateStatus(status.id, { status: 'failed', error: 'Error 2' });
    await service.updateStatus(status.id, { status: 'failed', error: 'Error 3' });

    const failedStatus = await service.getContentStatus('content123');
    expect(failedStatus[0].attempts).toBe(3);

    await expect(service.retryFailedPublication(status.id))
      .rejects.toThrow('exceeded maximum retry attempts');
  });

  it('should get status summary without filters', async () => {
    await service.trackPublication('content1', 'wordpress');
    const status2 = await service.trackPublication('content2', 'shopify');
    const status3 = await service.trackPublication('content3', 'hubspot');

    await service.updateStatus(status2.id, { status: 'published' });
    await service.updateStatus(status3.id, { status: 'failed' });

    const summary = await service.getStatusSummary();

    expect(summary.total).toBe(3);
    expect(summary.pending).toBe(1); // draft status
    expect(summary.published).toBe(1);
    expect(summary.failed).toBe(1);
    expect(summary.scheduled).toBe(0);
    expect(summary.syncing).toBe(0);
  });

  it('should get status summary with platform filter', async () => {
    await service.trackPublication('content1', 'wordpress');
    await service.trackPublication('content2', 'shopify');

    const wordpressSummary = await service.getStatusSummary({ platform: 'wordpress' });
    const shopifySummary = await service.getStatusSummary({ platform: 'shopify' });

    expect(wordpressSummary.total).toBe(1);
    expect(shopifySummary.total).toBe(1);
  });

  it('should get status summary with status filter', async () => {
    const status1 = await service.trackPublication('content1', 'wordpress');
    const status2 = await service.trackPublication('content2', 'shopify');

    await service.updateStatus(status1.id, { status: 'published' });
    await service.updateStatus(status2.id, { status: 'failed' });

    const publishedSummary = await service.getStatusSummary({ status: 'published' });
    const failedSummary = await service.getStatusSummary({ status: 'failed' });

    expect(publishedSummary.total).toBe(1);
    expect(publishedSummary.published).toBe(1);
    expect(failedSummary.total).toBe(1);
    expect(failedSummary.failed).toBe(1);
  });

  it('should get status summary with error filter', async () => {
    const status1 = await service.trackPublication('content1', 'wordpress');
    const status2 = await service.trackPublication('content2', 'shopify');

    await service.updateStatus(status1.id, { status: 'failed', error: 'Network error' });
    await service.updateStatus(status2.id, { status: 'published' });

    const withErrorsSummary = await service.getStatusSummary({ hasErrors: true });
    const withoutErrorsSummary = await service.getStatusSummary({ hasErrors: false });

    expect(withErrorsSummary.total).toBe(1);
    expect(withoutErrorsSummary.total).toBe(1);
  });

  it('should get publication analytics', async () => {
    // Create test data
    const status1 = await service.trackPublication('content1', 'wordpress');
    const status2 = await service.trackPublication('content2', 'wordpress');
    const status3 = await service.trackPublication('content3', 'shopify');

    await service.updateStatus(status1.id, { status: 'published' });
    await service.updateStatus(status2.id, { status: 'failed', error: 'Network timeout' });
    await service.updateStatus(status3.id, { status: 'failed', error: 'API error' });

    const analytics = await service.getPublicationAnalytics();

    expect(analytics.platformStats.wordpress.total).toBe(2);
    expect(analytics.platformStats.wordpress.published).toBe(1);
    expect(analytics.platformStats.wordpress.failed).toBe(1);
    expect(analytics.platformStats.wordpress.successRate).toBe(50);

    expect(analytics.platformStats.shopify.total).toBe(1);
    expect(analytics.platformStats.shopify.failed).toBe(1);

    expect(analytics.recentActivity).toHaveLength(7); // Last 7 days
    expect(analytics.failureReasons).toHaveLength(2);
    expect(analytics.failureReasons[0].error).toBeDefined();
    expect(analytics.failureReasons[0].count).toBeGreaterThan(0);
  });

  it('should monitor stuck publications', async () => {
    const now = new Date('2023-01-01T12:00:00Z');
    jest.setSystemTime(now);

    const status1 = await service.trackPublication('content1', 'wordpress');
    const status2 = await service.trackPublication('content2', 'shopify');

    // Set one as stuck (scheduled for over an hour)
    await service.updateStatus(status1.id, { status: 'scheduled' });
    await service.updateStatus(status2.id, { status: 'syncing' });

    // Advance time by 2 hours
    jest.advanceTimersByTime(2 * 60 * 60 * 1000);

    const stuckPublications = await service.monitorStuckPublications();

    expect(stuckPublications).toHaveLength(2);
    expect(stuckPublications.map(s => s.id)).toContain(status1.id);
    expect(stuckPublications.map(s => s.id)).toContain(status2.id);
  });

  it('should validate input and throw error for empty content ID', async () => {
    await expect(service.trackPublication('', 'wordpress'))
      .rejects.toThrow('Content ID is required');
  });

  it('should validate input and throw error for invalid platform', async () => {
    await expect(service.trackPublication('content123', 'invalid' as any))
      .rejects.toThrow();
  });

  it('should throw error when updating non-existent status', async () => {
    await expect(service.updateStatus('non-existent', { status: 'published' }))
      .rejects.toThrow('Publishing status non-existent not found');
  });

  it('should throw error when retrying non-existent status', async () => {
    await expect(service.retryFailedPublication('non-existent'))
      .rejects.toThrow('Publishing status non-existent not found');
  });

  it('should sort content statuses by update time (newest first)', async () => {
    const contentId = 'content123';
    
    const status1 = await service.trackPublication(contentId, 'wordpress');
    
    // Advance time to make sure timestamps are different
    jest.advanceTimersByTime(1000);
    
    const status2 = await service.trackPublication(contentId, 'shopify');

    const contentStatuses = await service.getContentStatus(contentId);

    expect(contentStatuses[0].id).toBe(status2.id); // Newer first
    expect(contentStatuses[1].id).toBe(status1.id);
  });

  it('should handle concurrent status updates correctly', async () => {
    const status = await service.trackPublication('content123', 'wordpress');

    const updatePromises = [
      service.updateStatus(status.id, { status: 'scheduled' }),
      service.updateStatus(status.id, { externalId: 'external123' }),
      service.updateStatus(status.id, { metadata: { test: 'value' } }),
    ];

    const results = await Promise.all(updatePromises);

    // All updates should succeed
    results.forEach(result => {
      expect(result.id).toBe(status.id);
      expect(result.updatedAt).toBeDefined();
    });

    const finalStatus = await service.getContentStatus('content123');
    expect(finalStatus[0].updatedAt).toBeDefined();
  });

  it('should handle date filters in status summary', async () => {
    const now = new Date('2023-01-15T12:00:00Z');
    jest.setSystemTime(now);

    await service.trackPublication('content1', 'wordpress');
    
    // Advance time by 5 days
    jest.advanceTimersByTime(5 * 24 * 60 * 60 * 1000);
    
    await service.trackPublication('content2', 'shopify');

    const dateFrom = new Date('2023-01-18T00:00:00Z');
    const summary = await service.getStatusSummary({ dateFrom });

    expect(summary.total).toBe(1); // Only the second status should be included
  });
});