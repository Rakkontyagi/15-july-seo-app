import { z } from 'zod';

// SERP Analysis Request/Response schemas
export const SERPAnalysisRequestSchema = z.object({
  keyword: z.string().min(1).max(100),
  location: z.string().min(1).max(50),
  numResults: z.number().min(1).max(10).optional().default(5),
  excludeDomains: z.array(z.string()).optional().default([]),
  onlyOrganic: z.boolean().optional().default(true)
});

export const SERPResultSchema = z.object({
  position: z.number(),
  title: z.string(),
  url: z.string().url(),
  domain: z.string(),
  snippet: z.string().optional(),
  isOrganic: z.boolean(),
  contentQuality: z.enum(['high', 'medium', 'low']).optional()
});

export const SERPAnalysisResultSchema = z.object({
  id: z.string().uuid().optional(),
  keyword: z.string(),
  location: z.string(),
  googleDomain: z.string(),
  timestamp: z.string().datetime(),
  topResults: z.array(SERPResultSchema),
  relatedQueries: z.array(z.string()),
  peopleAlsoAsk: z.array(z.object({
    question: z.string(),
    snippet: z.string().optional()
  })),
  totalResults: z.number()
});

export const BatchSERPAnalysisRequestSchema = z.object({
  keywords: z.array(z.string()).min(1).max(10),
  location: z.string().min(1).max(50),
  numResults: z.number().min(1).max(10).optional().default(5)
});

// Database schemas
export const SERPAnalysisRecordSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  keyword: z.string(),
  location: z.string(),
  google_domain: z.string(),
  results: z.any(), // JSONB in database
  top_competitors: z.any(), // JSONB in database
  analysis_date: z.string().datetime(),
  expires_at: z.string().datetime(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime()
});

// Export types
export type SERPAnalysisRequest = z.infer<typeof SERPAnalysisRequestSchema>;
export type SERPResult = z.infer<typeof SERPResultSchema>;
export type SERPAnalysisResult = z.infer<typeof SERPAnalysisResultSchema>;
export type BatchSERPAnalysisRequest = z.infer<typeof BatchSERPAnalysisRequestSchema>;
export type SERPAnalysisRecord = z.infer<typeof SERPAnalysisRecordSchema>;

// Progress tracking types
export interface SERPAnalysisProgress {
  stage: 'initializing' | 'searching' | 'filtering' | 'validating' | 'complete' | 'error';
  progress: number;
  message: string;
  details?: any;
}