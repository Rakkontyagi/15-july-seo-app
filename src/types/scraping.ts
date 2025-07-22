import { z } from 'zod';

// Base scraping schemas
export const ScrapingRequestSchema = z.object({
  url: z.string().url(),
  includeImages: z.boolean().optional().default(true),
  includeLinks: z.boolean().optional().default(true),
  screenshot: z.boolean().optional().default(false),
  waitFor: z.number().min(0).max(10000).optional().default(2000),
  timeout: z.number().min(5000).max(60000).optional().default(30000)
});

export const BatchScrapingRequestSchema = z.object({
  urls: z.array(z.string().url()).min(1).max(50),
  includeImages: z.boolean().optional().default(true),
  includeLinks: z.boolean().optional().default(true),
  screenshot: z.boolean().optional().default(false),
  waitFor: z.number().min(0).max(10000).optional().default(2000),
  timeout: z.number().min(5000).max(60000).optional().default(30000)
});

// Heading structure interface (defined via Zod schema below)

// Heading structure schema
export const HeadingStructureSchema: z.ZodSchema<HeadingStructure> = z.object({
  level: z.number().min(1).max(6),
  text: z.string(),
  id: z.string().optional(),
  position: z.number(),
  children: z.array(z.lazy(() => HeadingStructureSchema)).optional()
});

// Link information
export const LinkInfoSchema = z.object({
  url: z.string().url(),
  text: z.string(),
  title: z.string().optional(),
  isInternal: z.boolean(),
  isExternal: z.boolean(),
  anchor: z.string().optional(),
  rel: z.string().optional(),
  position: z.number()
});

// Image information
export const ImageInfoSchema = z.object({
  src: z.string().url(),
  alt: z.string().optional(),
  title: z.string().optional(),
  caption: z.string().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  isRelevant: z.boolean(),
  position: z.number()
});

// Content quality assessment
export const ContentQualitySchema = z.object({
  score: z.number().min(0).max(100),
  factors: z.object({
    length: z.number().min(0).max(100),
    readability: z.number().min(0).max(100),
    structure: z.number().min(0).max(100),
    uniqueness: z.number().min(0).max(100)
  })
});

// Metadata schema
export const ContentMetadataSchema = z.object({
  extractedAt: z.date(),
  contentType: z.string(),
  language: z.string().optional(),
  author: z.string().optional(),
  publishedDate: z.string().optional(),
  modifiedDate: z.string().optional()
});

// Processed content schema
export const ProcessedContentSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  cleanedMarkdown: z.string(),
  cleanedHtml: z.string(),
  headings: z.array(HeadingStructureSchema),
  links: z.array(LinkInfoSchema),
  images: z.array(ImageInfoSchema),
  textContent: z.string(),
  wordCount: z.number().min(0),
  readingTime: z.number().min(0),
  keywordDensity: z.record(z.string(), z.number()),
  contentQuality: ContentQualitySchema,
  metadata: ContentMetadataSchema
});

// Scraping result schema
export const ScrapingResultSchema = z.object({
  url: z.string().url(),
  success: z.boolean(),
  content: ProcessedContentSchema.optional(),
  error: z.string().optional(),
  scrapedAt: z.date(),
  processingTime: z.number().min(0)
});

// Batch scraping result schema
export const BatchScrapingResultSchema = z.object({
  results: z.array(ScrapingResultSchema),
  totalUrls: z.number().min(0),
  successCount: z.number().min(0),
  failureCount: z.number().min(0),
  totalProcessingTime: z.number().min(0)
});

// Database schemas
export const CompetitorAnalysisSchema = z.object({
  id: z.string().uuid(),
  serp_analysis_id: z.string().uuid(),
  url: z.string().url(),
  title: z.string().optional(),
  headings: z.any(), // JSONB in database
  content: z.string(),
  word_count: z.number().min(0),
  keyword_density: z.number().min(0).max(100),
  lsi_keywords: z.any(), // JSONB in database
  entities: z.any(), // JSONB in database
  scraped_at: z.date(),
  created_at: z.date(),
  updated_at: z.date()
});

export const ScrapingJobSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  urls: z.array(z.string().url()),
  status: z.enum(['pending', 'processing', 'completed', 'failed']),
  progress: z.number().min(0).max(100),
  results: z.any().optional(), // JSONB in database
  started_at: z.date().optional(),
  completed_at: z.date().optional(),
  created_at: z.date(),
  updated_at: z.date()
});

// Export types
export type ScrapingRequest = z.infer<typeof ScrapingRequestSchema>;
export type BatchScrapingRequest = z.infer<typeof BatchScrapingRequestSchema>;
export type HeadingStructure = z.infer<typeof HeadingStructureSchema>;
export type LinkInfo = z.infer<typeof LinkInfoSchema>;
export type ImageInfo = z.infer<typeof ImageInfoSchema>;
export type ContentQuality = z.infer<typeof ContentQualitySchema>;
export type ContentMetadata = z.infer<typeof ContentMetadataSchema>;
export type ProcessedContent = z.infer<typeof ProcessedContentSchema>;
export type ScrapingResult = z.infer<typeof ScrapingResultSchema>;
export type BatchScrapingResult = z.infer<typeof BatchScrapingResultSchema>;
export type CompetitorAnalysis = z.infer<typeof CompetitorAnalysisSchema>;
export type ScrapingJob = z.infer<typeof ScrapingJobSchema>;

// Progress tracking types
export interface ScrapingProgress {
  stage: 'initializing' | 'scraping' | 'processing' | 'analyzing' | 'complete' | 'error';
  progress: number;
  message: string;
  url?: string;
  details?: any;
}

// Content analysis types
export interface ContentAnalysisResult {
  url: string;
  contentType: 'article' | 'product' | 'homepage' | 'other';
  seoScore: number;
  readabilityScore: number;
  technicalScore: number;
  insights: {
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
  };
  competitorComparison?: {
    keyword: string;
    ranking: number;
    contentLength: number;
    topicCoverage: number;
    headingStructure: number;
  };
}

// Export utility types
export interface ScrapingOptions {
  includeImages?: boolean;
  includeLinks?: boolean;
  screenshot?: boolean;
  waitFor?: number;
  timeout?: number;
  maxRetries?: number;
}

export interface ValidationResult {
  valid: boolean;
  accessible: boolean;
  error?: string;
}

export interface ContentStructureAnalysis {
  hasValidStructure: boolean;
  issues: string[];
  recommendations: string[];
  seoScore: number;
}