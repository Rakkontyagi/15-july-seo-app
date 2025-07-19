import { ContentSyncService } from '../contentSync.service';
import 'jest-extended';

describe('ContentSyncService', () => {
  let service: ContentSyncService;

  beforeEach(() => {
    service = new ContentSyncService();
    // Mock console.log to avoid cluttering test output
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    service.destroy(); // Clean up intervals
    jest.restoreAllMocks();
  });

  it('should create sync record and sync content successfully', async () => {
    const contentId = 'content123';
    const platform = 'wordpress';

    const syncResult = await service.syncContent(contentId, platform);

    expect(syncResult.id).toBeDefined();
    expect(syncResult.contentId).toBe(contentId);
    expect(syncResult.platform).toBe(platform);
    expect(syncResult.syncDirection).toBe('bidirectional');
    expect(['synced', 'conflict', 'out_of_sync']).toContain(syncResult.syncStatus);
    expect(syncResult.localHash).toBeDefined();
    expect(syncResult.remoteHash).toBeDefined();
    expect(syncResult.lastSyncAt).toBeDefined();
  });

  it('should sync content with local_to_remote direction', async () => {
    const contentId = 'content123';
    const platform = 'shopify';

    const syncResult = await service.syncContent(contentId, platform, 'local_to_remote');

    expect(syncResult.syncDirection).toBe('local_to_remote');
    expect(syncResult.contentId).toBe(contentId);
    expect(syncResult.platform).toBe(platform);
  });

  it('should sync content with remote_to_local direction', async () => {
    const contentId = 'content123';
    const platform = 'hubspot';

    const syncResult = await service.syncContent(contentId, platform, 'remote_to_local');

    expect(syncResult.syncDirection).toBe('remote_to_local');
    expect(syncResult.contentId).toBe(contentId);
    expect(syncResult.platform).toBe(platform);
  });

  it('should reuse existing sync record for same content and platform', async () => {
    const contentId = 'content123';
    const platform = 'wordpress';

    const firstSync = await service.syncContent(contentId, platform);

    // Add a small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 2));

    const secondSync = await service.syncContent(contentId, platform);

    expect(firstSync.id).toBe(secondSync.id);
    expect(secondSync.updatedAt.getTime()).toBeGreaterThan(firstSync.updatedAt.getTime());
  });

  it('should detect conflicts between local and remote content', async () => {
    const contentId = 'content123';
    const platform = 'wordpress';

    // First create a sync record
    await service.syncContent(contentId, platform);

    const conflictResult = await service.detectConflicts(contentId, platform);

    expect(conflictResult.localHash).toBeDefined();
    expect(conflictResult.remoteHash).toBeDefined();
    expect(['synced', 'conflict']).toContain(conflictResult.syncStatus);
  });

  it('should throw error when detecting conflicts for non-existent sync', async () => {
    const contentId = 'nonexistent';
    const platform = 'wordpress';

    await expect(service.detectConflicts(contentId, platform))
      .rejects.toThrow('No sync record found');
  });

  it('should resolve conflict with local resolution', async () => {
    const contentId = 'content123';
    const platform = 'wordpress';

    // Create sync and force conflict
    const sync = await service.syncContent(contentId, platform);
    
    // Manually set conflict status for testing
    const syncs = (service as any).syncs as Map<string, any>;
    const syncRecord = syncs.get(sync.id);
    syncRecord.syncStatus = 'conflict';
    syncRecord.conflictData = {
      localVersion: { title: 'Local Title', content: 'Local Content' },
      remoteVersion: { title: 'Remote Title', content: 'Remote Content' },
      conflictFields: ['title', 'content'],
    };
    syncs.set(sync.id, syncRecord);

    const resolvedSync = await service.resolveConflict(sync.id, 'local');

    expect(resolvedSync.syncStatus).toBe('synced');
    expect(resolvedSync.conflictData).toBeUndefined();
    expect(resolvedSync.metadata?.lastResolution).toBe('local');
  });

  it('should resolve conflict with remote resolution', async () => {
    const contentId = 'content123';
    const platform = 'wordpress';

    const sync = await service.syncContent(contentId, platform);
    
    // Manually set conflict status
    const syncs = (service as any).syncs as Map<string, any>;
    const syncRecord = syncs.get(sync.id);
    syncRecord.syncStatus = 'conflict';
    syncRecord.conflictData = {
      localVersion: { title: 'Local Title' },
      remoteVersion: { title: 'Remote Title' },
      conflictFields: ['title'],
    };
    syncs.set(sync.id, syncRecord);

    const resolvedSync = await service.resolveConflict(sync.id, 'remote');

    expect(resolvedSync.syncStatus).toBe('synced');
    expect(resolvedSync.metadata?.lastResolution).toBe('remote');
  });

  it('should resolve conflict with merge resolution', async () => {
    const contentId = 'content123';
    const platform = 'wordpress';

    const sync = await service.syncContent(contentId, platform);
    
    // Manually set conflict status
    const syncs = (service as any).syncs as Map<string, any>;
    const syncRecord = syncs.get(sync.id);
    syncRecord.syncStatus = 'conflict';
    syncRecord.conflictData = {
      localVersion: { title: 'Local Title', tags: ['local'] },
      remoteVersion: { title: 'Remote Title', tags: ['remote'] },
      conflictFields: ['title'],
    };
    syncs.set(sync.id, syncRecord);

    const resolvedSync = await service.resolveConflict(sync.id, 'merge');

    expect(resolvedSync.syncStatus).toBe('synced');
    expect(resolvedSync.metadata?.lastResolution).toBe('merge');
  });

  it('should not resolve conflict for non-conflict sync', async () => {
    const contentId = 'content123';
    const platform = 'wordpress';

    const sync = await service.syncContent(contentId, platform);

    await expect(service.resolveConflict(sync.id, 'local'))
      .rejects.toThrow('is not in conflict status');
  });

  it('should get sync status for content', async () => {
    const contentId = 'content123';

    const sync1 = await service.syncContent(contentId, 'wordpress');
    const sync2 = await service.syncContent(contentId, 'shopify');

    const syncStatuses = await service.getSyncStatus(contentId);

    expect(syncStatuses).toHaveLength(2);
    expect(syncStatuses.map(s => s.id)).toContain(sync1.id);
    expect(syncStatuses.map(s => s.id)).toContain(sync2.id);
    expect(syncStatuses.map(s => s.platform)).toContain('wordpress');
    expect(syncStatuses.map(s => s.platform)).toContain('shopify');
  });

  it('should enable auto sync for content', async () => {
    const contentId = 'content123';
    const platform = 'wordpress';

    await service.enableAutoSync(contentId, platform);

    const syncStatuses = await service.getSyncStatus(contentId);
    expect(syncStatuses).toHaveLength(1);
    expect(syncStatuses[0].autoResolve).toBe(true);
    expect(syncStatuses[0].contentId).toBe(contentId);
    expect(syncStatuses[0].platform).toBe(platform);
  });

  it('should disable auto sync for existing sync', async () => {
    const contentId = 'content123';
    const platform = 'wordpress';

    await service.enableAutoSync(contentId, platform);
    const syncStatuses = await service.getSyncStatus(contentId);
    const syncId = syncStatuses[0].id;

    await service.disableAutoSync(syncId);

    const updatedSyncStatuses = await service.getSyncStatus(contentId);
    expect(updatedSyncStatuses[0].autoResolve).toBe(false);
  });

  it('should throw error when disabling auto sync for non-existent sync', async () => {
    await expect(service.disableAutoSync('non-existent'))
      .rejects.toThrow('Sync record non-existent not found');
  });

  it('should get comprehensive sync analytics', async () => {
    // Create test data
    await service.syncContent('content1', 'wordpress');
    await service.syncContent('content2', 'shopify');
    await service.syncContent('content3', 'hubspot');

    const analytics = await service.getSyncAnalytics();

    expect(analytics.totalSyncs).toBe(3);
    expect(analytics.byStatus).toBeDefined();
    expect(analytics.byPlatform).toBeDefined();
    expect(analytics.conflictResolutionStats).toBeDefined();
    expect(analytics.performanceMetrics).toBeDefined();

    expect(analytics.byPlatform.wordpress).toBe(1);
    expect(analytics.byPlatform.shopify).toBe(1);
    expect(analytics.byPlatform.hubspot).toBe(1);
    expect(analytics.performanceMetrics.successRate).toBeGreaterThanOrEqual(0);
    expect(analytics.performanceMetrics.successRate).toBeLessThanOrEqual(100);
  });

  it('should list syncs without filters', async () => {
    await service.syncContent('content1', 'wordpress');
    await service.syncContent('content2', 'shopify');

    const syncs = await service.listSyncs();

    expect(syncs).toHaveLength(2);
    expect(syncs[0].lastSyncAt.getTime()).toBeGreaterThanOrEqual(syncs[1].lastSyncAt.getTime());
  });

  it('should list syncs with platform filter', async () => {
    await service.syncContent('content1', 'wordpress');
    await service.syncContent('content2', 'shopify');

    const wordpressSyncs = await service.listSyncs({ platform: 'wordpress' });
    const shopifySyncs = await service.listSyncs({ platform: 'shopify' });

    expect(wordpressSyncs).toHaveLength(1);
    expect(wordpressSyncs[0].platform).toBe('wordpress');
    expect(shopifySyncs).toHaveLength(1);
    expect(shopifySyncs[0].platform).toBe('shopify');
  });

  it('should list syncs with status filter', async () => {
    const sync1 = await service.syncContent('content1', 'wordpress');
    await service.syncContent('content2', 'shopify');

    // Manually set one sync to error status
    const syncs = (service as any).syncs as Map<string, any>;
    const syncRecord = syncs.get(sync1.id);
    syncRecord.syncStatus = 'error';
    syncs.set(sync1.id, syncRecord);

    const errorSyncs = await service.listSyncs({ syncStatus: 'error' });
    const syncedSyncs = await service.listSyncs({ syncStatus: 'synced' });

    expect(errorSyncs).toHaveLength(1);
    expect(errorSyncs[0].syncStatus).toBe('error');
    expect(syncedSyncs.length).toBeGreaterThanOrEqual(0);
  });

  it('should list syncs with content ID filter', async () => {
    await service.syncContent('content1', 'wordpress');
    await service.syncContent('content2', 'shopify');

    const content1Syncs = await service.listSyncs({ contentId: 'content1' });

    expect(content1Syncs).toHaveLength(1);
    expect(content1Syncs[0].contentId).toBe('content1');
  });

  it('should list syncs with conflict filter', async () => {
    const sync = await service.syncContent('content1', 'wordpress');

    // Manually set conflict
    const syncs = (service as any).syncs as Map<string, any>;
    const syncRecord = syncs.get(sync.id);
    syncRecord.conflictData = { test: 'conflict' };
    syncs.set(sync.id, syncRecord);

    const conflictSyncs = await service.listSyncs({ hasConflicts: true });
    const noConflictSyncs = await service.listSyncs({ hasConflicts: false });

    expect(conflictSyncs).toHaveLength(1);
    expect(conflictSyncs[0].conflictData).toBeDefined();
    expect(noConflictSyncs.length).toBeGreaterThanOrEqual(0);
  });

  it('should validate input and throw error for empty content ID', async () => {
    await expect(service.syncContent('', 'wordpress'))
      .rejects.toThrow('Content ID is required');
  });

  it('should validate input and throw error for invalid platform', async () => {
    await expect(service.syncContent('content123', 'invalid' as any))
      .rejects.toThrow();
  });

  it('should validate input and throw error for invalid sync direction', async () => {
    await expect(service.syncContent('content123', 'wordpress', 'invalid' as any))
      .rejects.toThrow();
  });

  it('should validate input and throw error for invalid resolution type', async () => {
    const sync = await service.syncContent('content123', 'wordpress');
    
    // Set conflict status
    const syncs = (service as any).syncs as Map<string, any>;
    const syncRecord = syncs.get(sync.id);
    syncRecord.syncStatus = 'conflict';
    syncRecord.conflictData = { test: 'data' };
    syncs.set(sync.id, syncRecord);

    await expect(service.resolveConflict(sync.id, 'invalid' as any))
      .rejects.toThrow();
  });

  it('should handle sync errors gracefully', async () => {
    const contentId = 'content123';
    const platform = 'wordpress';

    // Mock a method to throw an error
    const originalMethod = (service as any).getLocalContent;
    (service as any).getLocalContent = jest.fn().mockRejectedValue(new Error('Sync failed'));

    await expect(service.syncContent(contentId, platform)).rejects.toThrow('Sync failed');

    // Check that sync record was created with error status
    const syncStatuses = await service.getSyncStatus(contentId);
    expect(syncStatuses).toHaveLength(1);
    expect(syncStatuses[0].syncStatus).toBe('error');
    expect(syncStatuses[0].metadata?.lastError).toBe('Sync failed');

    // Restore original method
    (service as any).getLocalContent = originalMethod;
  });

  it('should sort sync statuses by last sync time (newest first)', async () => {
    const contentId = 'content123';

    const sync1 = await service.syncContent(contentId, 'wordpress');
    
    // Wait a bit to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const sync2 = await service.syncContent(contentId, 'shopify');

    const syncStatuses = await service.getSyncStatus(contentId);

    expect(syncStatuses[0].id).toBe(sync2.id); // Newer first
    expect(syncStatuses[1].id).toBe(sync1.id);
  });

  it('should handle concurrent sync operations correctly', async () => {
    const contentId = 'content123';

    const syncPromises = [
      service.syncContent(contentId, 'wordpress'),
      service.syncContent(contentId, 'shopify'),
      service.syncContent(contentId, 'hubspot'),
    ];

    const results = await Promise.all(syncPromises);

    expect(results).toHaveLength(3);
    results.forEach((result, index) => {
      expect(result.contentId).toBe(contentId);
      expect(result.id).toBeDefined();
    });

    const syncStatuses = await service.getSyncStatus(contentId);
    expect(syncStatuses).toHaveLength(3);
  });

  it('should properly clean up resources on destroy', () => {
    const service2 = new ContentSyncService();
    const intervalSpy = jest.spyOn(global, 'clearInterval');

    service2.destroy();

    expect(intervalSpy).toHaveBeenCalled();
    intervalSpy.mockRestore();
  });
});