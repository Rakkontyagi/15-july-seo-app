/**
 * Types for AI Content Generation System
 */

export interface ContentGenerationRequest {
  keyword: string;
  location: string;
  wordCount: number;
  tone: 'professional' | 'casual' | 'technical' | 'academic';
  targetAudience?: string;
  includeImages?: boolean;
  additionalInstructions?: string;
  userId: string;
  projectId?: string;
}

export interface SerpAnalysisResult {
  keyword: string;
  location: string;
  topResults: CompetitorResult[];
  relatedQueries: string[];
  peopleAlsoAsk: string[];
  timestamp: string;
}

export interface CompetitorResult {
  position: number;
  title: string;
  url: string;
  snippet: string;
  domain: string;
  wordCount?: number;
  readabilityScore?: number;
  keywordDensity?: number;
  content?: string;
  headings?: string[];
  images?: string[];
}

export interface GeneratedContent {
  id: string;
  title: string;
  content: string;
  metaDescription: string;
  keywords: string[];
  wordCount: number;
  readabilityScore: number;
  seoScore: number;
  qualityScore: number;
  tone: string;
  targetAudience?: string;
  generatedAt: string;
  userId: string;
  projectId?: string;
  competitorAnalysis: CompetitorAnalysis;
  contentStructure: ContentStructure;
}

export interface CompetitorAnalysis {
  topCompetitors: CompetitorResult[];
  averageWordCount: number;
  commonKeywords: string[];
  contentGaps: string[];
  strengthsToMatch: string[];
  opportunitiesToExploit: string[];
}

export interface ContentStructure {
  headings: {
    level: number;
    text: string;
    keywords: string[];
  }[];
  paragraphs: {
    text: string;
    keywordDensity: number;
    readabilityScore: number;
  }[];
  internalLinks: string[];
  externalLinks: string[];
  imagesSuggested: string[];
}

export interface GenerationProgress {
  stage: 'serp_analysis' | 'competitor_scraping' | 'content_planning' | 'content_generation' | 'optimization' | 'quality_check' | 'completed';
  progress: number;
  message: string;
  timestamp: string;
}

export interface ContentGenerationOptions {
  skipCache?: boolean;
  generateImages?: boolean;
  includeInternalLinks?: boolean;
  includeExternalLinks?: boolean;
  maxCompetitors?: number;
  enableRealTimeUpdates?: boolean;
}

export interface AIPromptContext {
  keyword: string;
  location: string;
  competitorAnalysis: CompetitorAnalysis;
  userRequirements: {
    wordCount: number;
    tone: string;
    targetAudience?: string;
    additionalInstructions?: string;
  };
  seoRequirements: {
    primaryKeywords: string[];
    semanticKeywords: string[];
    targetReadability: number;
    targetKeywordDensity: number;
  };
}

export interface ContentQualityMetrics {
  readabilityScore: number;
  keywordDensity: number;
  semanticKeywordUsage: number;
  contentStructureScore: number;
  originalityScore: number;
  expertiseScore: number;
  authoritativenessScore: number;
  trustworthinessScore: number;
  overallQualityScore: number;
}

export interface ContentGenerationError {
  stage: string;
  message: string;
  details?: any;
  timestamp: string;
  recoverable: boolean;
}

export interface LLMResponse {
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  finishReason: string;
}

export interface ContentOptimizationResult {
  optimizedContent: string;
  improvements: string[];
  keywordOptimizations: string[];
  readabilityImprovements: string[];
  structureImprovements: string[];
  seoScore: number;
  qualityScore: number;
}