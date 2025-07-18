// CMS Integration Types

export type CMSPlatform = 'wordpress' | 'shopify' | 'hubspot' | 'custom';

export interface CMSCredentials {
  platform: CMSPlatform;
  endpoint: string;
  apiKey?: string;
  apiSecret?: string;
  accessToken?: string;
  username?: string;
  password?: string;
  storeId?: string;
  hubId?: string;
  customHeaders?: Record<string, string>;
}

export interface CMSContent {
  id?: string;
  title: string;
  content: string;
  excerpt?: string;
  slug?: string;
  status: 'draft' | 'published' | 'scheduled' | 'private';
  publishDate?: Date;
  categories?: string[];
  tags?: string[];
  featuredImage?: string;
  author?: string;
  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  focusKeyword?: string;
  customFields?: Record<string, any>;
  schemaMarkup?: string;
}

export interface CMSPublishResult {
  success: boolean;
  platform: CMSPlatform;
  contentId?: string;
  url?: string;
  error?: string;
  details?: any;
  publishedAt?: Date;
}

export interface CMSBulkPublishRequest {
  credentials: CMSCredentials[];
  content: CMSContent;
  schedule?: Date;
  options?: CMSPublishOptions;
}

export interface CMSPublishOptions {
  updateIfExists?: boolean;
  skipDuplicateCheck?: boolean;
  autoGenerateSlug?: boolean;
  preserveFormatting?: boolean;
  injectSchema?: boolean;
  customTransformations?: Record<string, any>;
}

export interface CMSSyncStatus {
  platform: CMSPlatform;
  contentId: string;
  localVersion: string;
  remoteVersion: string;
  lastSyncedAt: Date;
  syncStatus: 'synced' | 'local_ahead' | 'remote_ahead' | 'conflict';
  differences?: string[];
}

export interface WordPressPost {
  id?: number;
  date?: string;
  date_gmt?: string;
  guid?: { rendered: string };
  modified?: string;
  modified_gmt?: string;
  slug: string;
  status: 'publish' | 'future' | 'draft' | 'pending' | 'private';
  type?: string;
  link?: string;
  title: { rendered: string };
  content: { rendered: string; protected?: boolean };
  excerpt: { rendered: string; protected?: boolean };
  author?: number;
  featured_media?: number;
  comment_status?: 'open' | 'closed';
  ping_status?: 'open' | 'closed';
  sticky?: boolean;
  template?: string;
  format?: string;
  meta?: Record<string, any>;
  categories?: number[];
  tags?: number[];
  yoast_head_json?: any;
}

export interface ShopifyProduct {
  id?: number;
  title: string;
  body_html: string;
  vendor?: string;
  product_type?: string;
  created_at?: string;
  handle?: string;
  updated_at?: string;
  published_at?: string;
  template_suffix?: string;
  status?: 'active' | 'archived' | 'draft';
  published_scope?: string;
  tags?: string;
  admin_graphql_api_id?: string;
  variants?: any[];
  options?: any[];
  images?: any[];
  image?: any;
  metafields?: any[];
}

export interface HubSpotContent {
  id?: string;
  name: string;
  content: string;
  state?: 'DRAFT' | 'PUBLISHED' | 'SCHEDULED';
  publishDate?: number;
  created?: number;
  updated?: number;
  publishedAt?: number;
  authorName?: string;
  categoryId?: number;
  campaignId?: string;
  tagIds?: number[];
  metaDescription?: string;
  headHtml?: string;
  footerHtml?: string;
  archivedAt?: number;
  url?: string;
  domain?: string;
}

export interface CMSIntegrationError extends Error {
  platform: CMSPlatform;
  code: string;
  statusCode?: number;
  details?: any;
}

export interface PublishingStatus {
  id: string;
  platform: CMSPlatform;
  contentId: string;
  status: 'pending' | 'publishing' | 'published' | 'failed' | 'scheduled';
  progress?: number;
  startedAt: Date;
  completedAt?: Date;
  error?: string;
  retryCount?: number;
  maxRetries?: number;
}

export interface CMSWebhookEvent {
  platform: CMSPlatform;
  event: 'content.created' | 'content.updated' | 'content.deleted' | 'content.published';
  contentId: string;
  timestamp: Date;
  data?: any;
}