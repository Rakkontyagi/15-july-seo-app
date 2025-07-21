import { HeadingAnalysis, Heading } from './heading-analyzer';
import { Entity, EntityRelationship } from './entity-analyzer';
import { MetaTags } from './meta-tag-analyzer';
import { ContentStructureAnalysisResult } from './content-structure-analyzer';
import { WordAnalysis } from './word-count';
import { LsiKeyword } from './lsi-keyword-extractor';
import { PrecisionMetrics } from './keyword-analyzer';
import { HeadingMetrics } from './heading-optimization-counter';
import { ContentTopicDistribution } from './topic-distribution-mapper';
import { ContentQualityMetrics } from './content-quality-scorer';
import { BenchmarkReport } from './benchmark-reporter';
import { AnalysisValidationResult } from './analysis-validator';

export interface CompetitorComparison {
  averageWordCount: number;
  wordCountDifference: number; // Your word count vs average
  averageKeywordDensity: number;
  keywordDensityDifference: number;
  // Add more comparison metrics as needed
}

export type AnalysisStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

export interface SeoAnalysisResult {
  wordAnalysis: WordAnalysis;
  keywordDensity: number;
  keywordVariations: string[];
  keywordDistribution: number[];
  keywordProminence: number;
  precisionKeywordAnalysis: PrecisionMetrics;
  headingAnalysis: HeadingAnalysis;
  headingOptimizationMetrics: HeadingMetrics;
  lsiKeywords: LsiKeyword[];
  entities: Entity[];
  entityRelationships: EntityRelationship[];
  metaTags: MetaTags;
  contentStructure: ContentStructureAnalysisResult;
  topicDistribution: ContentTopicDistribution;
  contentQuality: ContentQualityMetrics;
  seoScore: number;
  recommendations: string[];
  competitorComparison?: CompetitorComparison; // Optional, only present if comparison is done
  benchmarkReport?: BenchmarkReport;
  validationResult?: AnalysisValidationResult;
}

export interface SeoMetrics {
  id?: string; // UUID from database
  competitorAnalysisId: string; // Foreign key to competitor_analysis table
  keyword: string;
  location: string;
  analysisDate: string; // ISO string
  metrics: SeoAnalysisResult; // Store the full analysis result
  status: AnalysisStatus; // Current status of the analysis
  errorMessage?: string; // If status is 'failed'
}

export { Heading, Entity, MetaTags, HeadingAnalysis, ContentStructureAnalysisResult, WordAnalysis, LsiKeyword, PrecisionMetrics, HeadingMetrics, EntityRelationship, ContentTopicDistribution, ContentQualityMetrics, BenchmarkReport, AnalysisValidationResult };