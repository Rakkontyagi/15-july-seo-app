import { z } from 'zod';
import {
  ContentSync,
  ContentSyncSchema,
  CMSPlatform,
  BaseContent,
  IContentSyncService,
} from '../../types/cms';

// Input schemas for content synchronization operations
const SyncContentInputSchema = z.object({
  contentId: z.string().min(1, 'Content ID is required'),
  platform: z.enum(['wordpress', 'shopify', 'hubspot', 'custom']),
  direction: z.enum(['bidirectional', 'local_to_remote', 'remote_to_local']).default('bidirectional'),
  forceSync: z.boolean().default(false),
});

const ConflictResolutionSchema = z.object({
  syncId: z.string().min(1, 'Sync ID is required'),
  resolution: z.enum(['local', 'remote', 'merge']),
  customMergeData: z.record(z.any()).optional(),
});

const SyncFiltersSchema = z.object({
  platform: z.enum(['wordpress', 'shopify', 'hubspot', 'custom']).optional(),
  syncStatus: z.enum(['synced', 'out_of_sync', 'conflict', 'error']).optional(),
  contentId: z.string().optional(),
  lastSyncFrom: z.date().optional(),
  lastSyncTo: z.date().optional(),
  hasConflicts: z.boolean().optional(),
}).optional();

export type SyncContentInput = z.infer<typeof SyncContentInputSchema>;
export type ConflictResolution = z.infer<typeof ConflictResolutionSchema>;
export type SyncFilters = z.infer<typeof SyncFiltersSchema>;

export class ContentSyncService implements IContentSyncService {
  private syncs: Map<string, ContentSync> = new Map();
  private contentSyncIndex: Map<string, Set<string>> = new Map(); // contentId -> syncIds
  private autoSyncEnabled: Set<string> = new Set(); // syncIds with auto-sync enabled
  private syncInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startAutoSyncMonitoring();
  }

  /**
   * Synchronizes content between local platform and external CMS.
   */
  async syncContent(
    contentId: string,
    platform: CMSPlatform,
    direction: 'bidirectional' | 'local_to_remote' | 'remote_to_local' = 'bidirectional'
  ): Promise<ContentSync> {
    const input = { contentId, platform, direction };
    SyncContentInputSchema.parse(input);

    // Check if sync record already exists
    let existingSync = await this.findExistingSync(contentId, platform);
    
    if (!existingSync) {
      existingSync = await this.createSyncRecord(contentId, platform, direction);
    }

    try {
      // Perform the actual synchronization
      const syncResult = await this.performSync(existingSync, direction);
      return syncResult;
    } catch (error) {
      // Update sync record with error status
      existingSync.syncStatus = 'error';
      const now = new Date();
      existingSync.updatedAt = now.getTime() === existingSync.updatedAt.getTime()
        ? new Date(now.getTime() + 1)
        : now;
      existingSync.metadata = {
        ...existingSync.metadata,
        lastError: error instanceof Error ? error.message : 'Unknown sync error',
      };
      
      this.syncs.set(existingSync.id, existingSync);
      throw error;
    }
  }

  /**
   * Detects conflicts between local and remote content versions.
   */
  async detectConflicts(contentId: string, platform: CMSPlatform): Promise<ContentSync> {
    const existingSync = await this.findExistingSync(contentId, platform);
    
    if (!existingSync) {
      throw new Error(`No sync record found for content ${contentId} on platform ${platform}`);
    }

    // Simulate conflict detection by comparing hashes
    const localContent = await this.getLocalContent(contentId);
    const remoteContent = await this.getRemoteContent(contentId, platform);
    
    const localHash = this.generateContentHash(localContent);
    const remoteHash = this.generateContentHash(remoteContent);

    existingSync.localHash = localHash;
    existingSync.remoteHash = remoteHash;

    if (localHash !== remoteHash) {
      existingSync.syncStatus = 'conflict';
      existingSync.conflictData = {
        localVersion: localContent,
        remoteVersion: remoteContent,
        conflictFields: this.identifyConflictFields(localContent, remoteContent),
      };
    } else {
      existingSync.syncStatus = 'synced';
      existingSync.conflictData = undefined;
    }

    // Ensure updatedAt is always different from the existing timestamp
    const now = new Date();
    const currentTime = existingSync.updatedAt.getTime();
    const newTime = now.getTime();

    if (newTime <= currentTime) {
      existingSync.updatedAt = new Date(currentTime + 1);
    } else {
      existingSync.updatedAt = now;
    }
    this.syncs.set(existingSync.id, existingSync);

    return { ...existingSync };
  }

  /**
   * Resolves conflicts between local and remote content versions.
   */
  async resolveConflict(
    syncId: string, 
    resolution: 'local' | 'remote' | 'merge'
  ): Promise<ContentSync> {
    const input = { syncId, resolution };
    ConflictResolutionSchema.parse(input);

    const sync = this.syncs.get(syncId);
    if (!sync) {
      throw new Error(`Sync record ${syncId} not found`);
    }

    if (sync.syncStatus !== 'conflict') {
      throw new Error(`Sync record ${syncId} is not in conflict status`);
    }

    if (!sync.conflictData) {
      throw new Error(`No conflict data found for sync record ${syncId}`);
    }

    let resolvedContent: any;

    switch (resolution) {
      case 'local':
        resolvedContent = sync.conflictData.localVersion;
        await this.updateRemoteContent(sync.contentId, sync.platform, resolvedContent);
        break;

      case 'remote':
        resolvedContent = sync.conflictData.remoteVersion;
        await this.updateLocalContent(sync.contentId, resolvedContent);
        break;

      case 'merge':
        resolvedContent = await this.mergeConflictedContent(sync.conflictData);
        await this.updateLocalContent(sync.contentId, resolvedContent);
        await this.updateRemoteContent(sync.contentId, sync.platform, resolvedContent);
        break;

      default:
        throw new Error(`Invalid resolution type: ${resolution}`);
    }

    // Update sync record
    sync.syncStatus = 'synced';
    sync.conflictData = undefined;
    sync.localHash = this.generateContentHash(resolvedContent);
    sync.remoteHash = sync.localHash;
    sync.lastSyncAt = new Date();
    sync.updatedAt = new Date();
    sync.metadata = {
      ...sync.metadata,
      lastResolution: resolution,
      resolvedAt: new Date().toISOString(),
    };

    this.syncs.set(syncId, sync);
    return { ...sync };
  }

  /**
   * Gets synchronization status for a specific content item.
   */
  async getSyncStatus(contentId: string): Promise<ContentSync[]> {
    const syncIds = this.contentSyncIndex.get(contentId) || new Set();
    const syncs = Array.from(syncIds)
      .map(id => this.syncs.get(id))
      .filter((sync): sync is ContentSync => sync !== undefined);

    return syncs.sort((a, b) => b.lastSyncAt.getTime() - a.lastSyncAt.getTime());
  }

  /**
   * Enables automatic synchronization for content on a specific platform.
   */
  async enableAutoSync(contentId: string, platform: CMSPlatform): Promise<void> {
    let sync = await this.findExistingSync(contentId, platform);
    
    if (!sync) {
      sync = await this.createSyncRecord(contentId, platform, 'bidirectional');
    }

    sync.autoResolve = true;
    sync.updatedAt = new Date();
    this.syncs.set(sync.id, sync);
    this.autoSyncEnabled.add(sync.id);
  }

  /**
   * Disables automatic synchronization for a sync record.
   */
  async disableAutoSync(syncId: string): Promise<void> {
    const sync = this.syncs.get(syncId);
    if (!sync) {
      throw new Error(`Sync record ${syncId} not found`);
    }

    sync.autoResolve = false;
    sync.updatedAt = new Date();
    this.syncs.set(syncId, sync);
    this.autoSyncEnabled.delete(syncId);
  }

  /**
   * Gets comprehensive synchronization analytics and metrics.
   */
  async getSyncAnalytics(): Promise<{
    totalSyncs: number;
    byStatus: Record<string, number>;
    byPlatform: Record<CMSPlatform, number>;
    conflictResolutionStats: {
      totalConflicts: number;
      autoResolved: number;
      manualResolved: number;
      unresolved: number;
    };
    performanceMetrics: {
      avgSyncDuration: number;
      syncFrequency: number;
      successRate: number;
    };
  }> {
    const allSyncs = Array.from(this.syncs.values());

    // Status distribution
    const byStatus = {
      synced: allSyncs.filter(s => s.syncStatus === 'synced').length,
      out_of_sync: allSyncs.filter(s => s.syncStatus === 'out_of_sync').length,
      conflict: allSyncs.filter(s => s.syncStatus === 'conflict').length,
      error: allSyncs.filter(s => s.syncStatus === 'error').length,
    };

    // Platform distribution
    const platforms: CMSPlatform[] = ['wordpress', 'shopify', 'hubspot', 'custom'];
    const byPlatform: Record<CMSPlatform, number> = {} as any;
    platforms.forEach(platform => {
      byPlatform[platform] = allSyncs.filter(s => s.platform === platform).length;
    });

    // Conflict resolution stats
    const conflictSyncs = allSyncs.filter(s => s.metadata?.lastResolution);
    const conflictResolutionStats = {
      totalConflicts: allSyncs.filter(s => s.syncStatus === 'conflict').length,
      autoResolved: conflictSyncs.filter(s => s.autoResolve).length,
      manualResolved: conflictSyncs.filter(s => !s.autoResolve).length,
      unresolved: allSyncs.filter(s => s.syncStatus === 'conflict').length,
    };

    // Performance metrics
    const syncedCount = byStatus.synced;
    const totalAttempts = allSyncs.length;
    const successRate = totalAttempts > 0 ? (syncedCount / totalAttempts) * 100 : 0;

    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const recentSyncs = allSyncs.filter(s => s.lastSyncAt >= oneHourAgo);
    const syncFrequency = recentSyncs.length;

    return {
      totalSyncs: allSyncs.length,
      byStatus,
      byPlatform,
      conflictResolutionStats,
      performanceMetrics: {
        avgSyncDuration: 2500, // Simulated average duration in ms
        syncFrequency,
        successRate: Math.round(successRate * 100) / 100,
      },
    };
  }

  /**
   * Lists sync records with optional filtering.
   */
  async listSyncs(filters?: SyncFilters): Promise<ContentSync[]> {
    SyncFiltersSchema.parse(filters);

    let syncs = Array.from(this.syncs.values());

    if (filters) {
      if (filters.platform) {
        syncs = syncs.filter(sync => sync.platform === filters.platform);
      }
      if (filters.syncStatus) {
        syncs = syncs.filter(sync => sync.syncStatus === filters.syncStatus);
      }
      if (filters.contentId) {
        syncs = syncs.filter(sync => sync.contentId === filters.contentId);
      }
      if (filters.lastSyncFrom) {
        syncs = syncs.filter(sync => sync.lastSyncAt >= filters.lastSyncFrom!);
      }
      if (filters.lastSyncTo) {
        syncs = syncs.filter(sync => sync.lastSyncAt <= filters.lastSyncTo!);
      }
      if (filters.hasConflicts !== undefined) {
        syncs = syncs.filter(sync => 
          filters.hasConflicts ? !!sync.conflictData : !sync.conflictData
        );
      }
    }

    return syncs.sort((a, b) => b.lastSyncAt.getTime() - a.lastSyncAt.getTime());
  }

  /**
   * Finds existing sync record for content and platform.
   */
  private async findExistingSync(contentId: string, platform: CMSPlatform): Promise<ContentSync | null> {
    const syncIds = this.contentSyncIndex.get(contentId) || new Set();
    
    for (const syncId of syncIds) {
      const sync = this.syncs.get(syncId);
      if (sync && sync.platform === platform) {
        return sync;
      }
    }
    
    return null;
  }

  /**
   * Creates a new sync record.
   */
  private async createSyncRecord(
    contentId: string, 
    platform: CMSPlatform, 
    direction: 'bidirectional' | 'local_to_remote' | 'remote_to_local'
  ): Promise<ContentSync> {
    const syncId = this.generateSyncId();
    const now = new Date();
    
    const sync: ContentSync = {
      id: syncId,
      contentId,
      platform,
      externalId: `ext_${Math.random().toString(36).substr(2, 9)}`,
      lastSyncAt: now,
      syncStatus: 'out_of_sync',
      localHash: '',
      remoteHash: '',
      syncDirection: direction,
      autoResolve: false,
      createdAt: now,
      updatedAt: now,
    };

    this.syncs.set(syncId, sync);
    this.indexSync(syncId, contentId);

    return sync;
  }

  /**
   * Performs the actual synchronization process.
   */
  private async performSync(
    sync: ContentSync, 
    direction: 'bidirectional' | 'local_to_remote' | 'remote_to_local'
  ): Promise<ContentSync> {
    const localContent = await this.getLocalContent(sync.contentId);
    const remoteContent = await this.getRemoteContent(sync.contentId, sync.platform);

    const localHash = this.generateContentHash(localContent);
    const remoteHash = this.generateContentHash(remoteContent);

    sync.localHash = localHash;
    sync.remoteHash = remoteHash;

    if (localHash === remoteHash) {
      sync.syncStatus = 'synced';
    } else {
      // Handle different sync directions
      switch (direction) {
        case 'local_to_remote':
          await this.updateRemoteContent(sync.contentId, sync.platform, localContent);
          sync.remoteHash = localHash;
          sync.syncStatus = 'synced';
          break;

        case 'remote_to_local':
          await this.updateLocalContent(sync.contentId, remoteContent);
          sync.localHash = remoteHash;
          sync.syncStatus = 'synced';
          break;

        case 'bidirectional':
          // Check which version is newer or if there's a conflict
          if (await this.isLocalNewer(sync.contentId, sync.platform)) {
            await this.updateRemoteContent(sync.contentId, sync.platform, localContent);
            sync.remoteHash = localHash;
            sync.syncStatus = 'synced';
          } else if (await this.isRemoteNewer(sync.contentId, sync.platform)) {
            await this.updateLocalContent(sync.contentId, remoteContent);
            sync.localHash = remoteHash;
            sync.syncStatus = 'synced';
          } else {
            // Potential conflict - requires manual resolution
            sync.syncStatus = 'conflict';
            sync.conflictData = {
              localVersion: localContent,
              remoteVersion: remoteContent,
              conflictFields: this.identifyConflictFields(localContent, remoteContent),
            };
          }
          break;
      }
    }

    sync.lastSyncAt = new Date();
    sync.updatedAt = new Date();
    this.syncs.set(sync.id, sync);

    return { ...sync };
  }

  /**
   * Monitors and performs automatic synchronization for enabled content.
   */
  private startAutoSyncMonitoring(): void {
    this.syncInterval = setInterval(async () => {
      for (const syncId of this.autoSyncEnabled) {
        const sync = this.syncs.get(syncId);
        if (sync && sync.autoResolve) {
          try {
            await this.performSync(sync, sync.syncDirection);
          } catch (error) {
            console.error(`Auto-sync failed for ${syncId}:`, error);
          }
        }
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Simulated methods for content operations (in real implementation, these would integrate with actual CMSs)
   */
  private async getLocalContent(contentId: string): Promise<BaseContent> {
    // Simulate fetching local content
    return {
      id: contentId,
      title: `Local Content ${contentId}`,
      content: `Local content body for ${contentId}`,
      author: 'local-author',
      status: 'published',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  private async getRemoteContent(contentId: string, platform: CMSPlatform): Promise<BaseContent> {
    // Simulate fetching remote content
    return {
      id: contentId,
      title: `Remote Content ${contentId} from ${platform}`,
      content: `Remote content body for ${contentId} on ${platform}`,
      author: 'remote-author',
      status: 'published',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  private async updateLocalContent(contentId: string, content: BaseContent): Promise<void> {
    // Simulate updating local content
    console.log(`Updating local content ${contentId}`);
  }

  private async updateRemoteContent(contentId: string, platform: CMSPlatform, content: BaseContent): Promise<void> {
    // Simulate updating remote content
    console.log(`Updating remote content ${contentId} on ${platform}`);
  }

  private async isLocalNewer(contentId: string, platform: CMSPlatform): Promise<boolean> {
    // Simulate timestamp comparison
    return Math.random() > 0.5;
  }

  private async isRemoteNewer(contentId: string, platform: CMSPlatform): Promise<boolean> {
    // Simulate timestamp comparison
    return Math.random() > 0.5;
  }

  private generateContentHash(content: BaseContent): string {
    // Simple hash generation based on content
    const contentString = JSON.stringify(content);
    return Buffer.from(contentString).toString('base64').slice(0, 16);
  }

  private identifyConflictFields(local: BaseContent, remote: BaseContent): string[] {
    const conflicts: string[] = [];
    
    if (local.title !== remote.title) conflicts.push('title');
    if (local.content !== remote.content) conflicts.push('content');
    if (local.author !== remote.author) conflicts.push('author');
    
    return conflicts;
  }

  private async mergeConflictedContent(conflictData: any): Promise<BaseContent> {
    // Simple merge strategy - prefer local for most fields, combine arrays
    const local = conflictData.localVersion;
    const remote = conflictData.remoteVersion;
    
    return {
      ...local,
      tags: Array.from(new Set([...(local.tags || []), ...(remote.tags || [])])),
      categories: Array.from(new Set([...(local.categories || []), ...(remote.categories || [])])),
      updatedAt: new Date(),
    };
  }

  private indexSync(syncId: string, contentId: string): void {
    if (!this.contentSyncIndex.has(contentId)) {
      this.contentSyncIndex.set(contentId, new Set());
    }
    this.contentSyncIndex.get(contentId)!.add(syncId);
  }

  private generateSyncId(): string {
    return `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Cleanup method to stop auto-sync monitoring.
   */
  destroy(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }
}