import { analyzeWords, WordAnalysis } from './word-count';
import { calculateKeywordDensity, findKeywordVariations, getKeywordDistribution, calculateKeywordProminence, PrecisionKeywordAnalyzer, PrecisionMetrics } from './keyword-analyzer';
import { analyzeHeadings, Heading, HeadingAnalysis } from './heading-analyzer';
import { HeadingOptimizationCounter, HeadingMetrics } from './heading-optimization-counter';
import { extractLsiKeywords, LsiKeyword } from './lsi-keyword-extractor';
import { analyzeEntities, Entity, EntityRelationship } from './entity-analyzer';
import { analyzeMetaTags, MetaTags } from './meta-tag-analyzer';
import { ContentStructureAnalyzer, ContentStructureAnalysisResult } from './content-structure-analyzer';
import { mapContentTopicDistribution, ContentTopicDistribution } from './topic-distribution-mapper';
import { scoreContentQuality, ContentQualityMetrics } from './content-quality-scorer';
import { BenchmarkReporter, BenchmarkReport } from './benchmark-reporter';
import { AnalysisValidator, AnalysisValidationResult } from './analysis-validator';

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

export async function analyzeSeo(text: string, html: string, keyword: string, headings: Heading[], competitors?: SeoAnalysisResult[]): Promise<SeoAnalysisResult> {
  const wordAnalysis = analyzeWords(text);
  const keywordDensity = calculateKeywordDensity(text, keyword);
  const keywordVariations = findKeywordVariations(text, keyword);
  const keywordDistribution = getKeywordDistribution(text, keyword);
  const headingTexts = headings.map(h => h.text);
  const keywordProminence = calculateKeywordProminence(text, keyword, headingTexts);
  const headingAnalysis = analyzeHeadings(headings, keyword);
  
  const firstParagraph = text.split('\n')[0];
  const lsiKeywords = extractLsiKeywords(text, { mainKeyword: keyword, headings: headingTexts, firstParagraph });
  
  const { entities, relationships: entityRelationships } = await analyzeEntities(text);
  const metaTags = analyzeMetaTags(html);

  const contentStructureAnalyzer = new ContentStructureAnalyzer({ primaryKeyword: keyword });
  const contentStructure = contentStructureAnalyzer.analyzeStructure(text, headings.map((h, index) => ({ ...h, position: index })));

  const precisionKeywordAnalyzer = new PrecisionKeywordAnalyzer();
  const precisionKeywordAnalysis = precisionKeywordAnalyzer.calculateExactDensity(text, keyword, headingTexts);

  const headingOptimizationCounter = new HeadingOptimizationCounter();
  const headingOptimizationMetrics = headingOptimizationCounter.countOptimizedHeadings(headings, keyword, lsiKeywords.map(lsi => lsi.term));

  const topicDistribution = mapContentTopicDistribution(text, headingTexts);

  const contentQuality = scoreContentQuality(
    wordAnalysis,
    headingAnalysis,
    contentStructure,
    keywordDensity,
    lsiKeywords.length,
    entities.length
  );

  // Calculate overall SEO score
  let seoScore = 0;

  // Word Analysis Score (out of 10)
  // Aim for a good word count (e.g., 1000-2500 words for articles)
  if (wordAnalysis.wordCount >= 1000 && wordAnalysis.wordCount <= 2500) seoScore += 3;
  else if (wordAnalysis.wordCount > 500) seoScore += 2;
  else seoScore += 1;
  // Readability and complexity
  if (wordAnalysis.readabilityScore >= 60) seoScore += 2; // Good readability
  if (wordAnalysis.complexityScore >= 50) seoScore += 1; // Moderate complexity

  // Keyword Density Score (out of 10)
  // Ideal density is often 1-3%
  if (keywordDensity >= 1 && keywordDensity <= 3) seoScore += 5;
  else if (keywordDensity > 0.5 && keywordDensity < 5) seoScore += 3;
  else seoScore += 1;
  if (keywordProminence > 0) seoScore += 2;
  if (keywordVariations.length > 0) seoScore += 3;

  // Heading Analysis Score (out of 10)
  if (headingAnalysis.totalHeadings > 0 && headingAnalysis.optimizationScore >= 50) seoScore += 5;
  if (headingAnalysis.headingStructureScore >= 80) seoScore += 3;
  if (headingAnalysis.headingLengths.every(len => len > 0)) seoScore += 2;

  // LSI Keywords Score (out of 10)
  if (lsiKeywords.length >= 5) seoScore += 5;
  else if (lsiKeywords.length >= 2) seoScore += 3;
  if (lsiKeywords.some(lsi => lsi.relevance > 0.7)) seoScore += 2;

  // Entity Analysis Score (out of 10)
  if (entities.length >= 5) seoScore += 5;
  else if (entities.length >= 2) seoScore += 3;
  if (entities.some(entity => entity.salience > 0.1)) seoScore += 2;

  // Meta Tags Score (out of 10)
  if (metaTags.title && metaTags.title.length > 0) seoScore += 3;
  if (metaTags.description && metaTags.description.length > 0) seoScore += 3;
  if (metaTags.schemaMarkupDetected) seoScore += 4;

  // Content Structure Score (out of 10)
  seoScore += contentStructure.overview.structureScore * 0.1; // Scale 0-100 to 0-10
  seoScore += contentStructure.overview.seoOptimization * 0.1; // Scale 0-100 to 0-10

  // Topic Distribution Score (out of 10)
  seoScore += topicDistribution.topicDepthScore * 0.05; // Scale 0-100 to 0-5
  seoScore += topicDistribution.topicCoherenceScore * 0.05; // Scale 0-100 to 0-5

  // Content Quality Score (out of 10)
  seoScore += contentQuality.readabilityScore * 0.05; // Scale 0-100 to 0-5
  seoScore += contentQuality.optimizationEffectiveness * 0.05; // Scale 0-100 to 0-5

  // Cap score at 100
  seoScore = Math.min(100, seoScore);

  const result: SeoAnalysisResult = {
    wordAnalysis,
    keywordDensity,
    keywordVariations,
    keywordDistribution,
    keywordProminence,
    precisionKeywordAnalysis,
    headingAnalysis,
    headingOptimizationMetrics,
    lsiKeywords,
    entities,
    entityRelationships,
    metaTags,
    contentStructure,
    topicDistribution,
    contentQuality,
    seoScore,
    recommendations: contentStructure.recommendations,
  };

  // Perform competitor comparison if data is provided
  if (competitors && competitors.length > 0) {
    const totalCompetitorWordCount = competitors.reduce((sum, comp) => sum + comp.wordAnalysis.wordCount, 0);
    const averageWordCount = totalCompetitorWordCount / competitors.length;
    const wordCountDifference = result.wordAnalysis.wordCount - averageWordCount;

    const totalCompetitorKeywordDensity = competitors.reduce((sum, comp) => sum + comp.keywordDensity, 0);
    const averageKeywordDensity = totalCompetitorKeywordDensity / competitors.length;
    const keywordDensityDifference = result.keywordDensity - averageKeywordDensity;

    (result as any).competitorComparison = {
      averageWordCount,
      wordCountDifference,
      averageKeywordDensity,
      keywordDensityDifference,
    };

    const benchmarkReporter = new BenchmarkReporter();
    result.benchmarkReport = benchmarkReporter.generateBenchmarks(competitors);
  }

  // Perform analysis validation
  const analysisValidator = new AnalysisValidator();
  result.validationResult = analysisValidator.validate(result, competitors);

  return result;
}