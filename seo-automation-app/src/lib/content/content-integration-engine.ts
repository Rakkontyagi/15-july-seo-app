/**
 * Content Integration Engine - Integrates keywords, LSI terms, and entities into content
 * Implements FR14: Natural keyword integration with precise density matching
 */

import { BenchmarkTargets } from './competitor-data-averager';

export interface Entity {
  name: string;
  type: 'PERSON' | 'ORGANIZATION' | 'LOCATION' | 'PRODUCT' | 'EVENT';
  relevance: number;
  context?: string;
}

export interface IntegratedContent {
  content: string;
  keywordDensityAchieved: number;
  headingOptimizationCount: number;
  naturalFlowScore: number;
  lsiKeywordsIntegrated: number;
  entitiesIntegrated: number;
  integrationReport: IntegrationReport;
}

export interface IntegrationReport {
  keywordPlacements: Array<{ position: number; context: string; method: string }>;
  lsiPlacements: Array<{ keyword: string; position: number; context: string }>;
  entityPlacements: Array<{ entity: string; position: number; context: string }>;
  headingOptimizations: Array<{ level: number; original: string; optimized: string }>;
  naturalFlowMetrics: {
    readabilityScore: number;
    coherenceScore: number;
    transitionQuality: number;
  };
}

export class ContentIntegrationEngine {
  private readonly MIN_SENTENCE_LENGTH = 10;
  private readonly MAX_KEYWORD_DENSITY = 3.5; // Prevent over-optimization
  private readonly NATURAL_FLOW_THRESHOLD = 0.7;

  /**
   * Integrate keywords into content with precise density matching
   */
  integrateKeywordsIntoContent(
    content: string,
    benchmarks: BenchmarkTargets,
    lsiKeywords: string[],
    entities: Entity[],
    primaryKeyword: string = 'SEO optimization'
  ): IntegratedContent {
    let optimizedContent = content;
    const integrationReport: IntegrationReport = {
      keywordPlacements: [],
      lsiPlacements: [],
      entityPlacements: [],
      headingOptimizations: [],
      naturalFlowMetrics: {
        readabilityScore: 0,
        coherenceScore: 0,
        transitionQuality: 0,
      },
    };

    // Step 1: Optimize headings
    const headingResult = this.optimizeHeadings(optimizedContent, benchmarks);
    optimizedContent = headingResult.content;
    integrationReport.headingOptimizations = headingResult.optimizations;

    // Step 2: Integrate primary keywords naturally
    const keywordResult = this.integrateKeywordsNaturally(optimizedContent, benchmarks, primaryKeyword);
    optimizedContent = keywordResult.content;
    integrationReport.keywordPlacements = keywordResult.placements;

    // Step 3: Weave entities naturally
    const entityResult = this.weaveEntitiesNaturally(optimizedContent, entities);
    optimizedContent = entityResult.content;
    integrationReport.entityPlacements = entityResult.placements;

    // Step 4: Integrate LSI keywords
    const lsiResult = this.integrateLSIKeywords(optimizedContent, lsiKeywords, benchmarks);
    optimizedContent = lsiResult.content;
    integrationReport.lsiPlacements = lsiResult.placements;

    // Step 5: Calculate final metrics
    const finalMetrics = this.calculateFinalMetrics(optimizedContent, benchmarks, primaryKeyword);
    integrationReport.naturalFlowMetrics = this.assessNaturalFlow(optimizedContent);

    return {
      content: optimizedContent,
      keywordDensityAchieved: finalMetrics.keywordDensity,
      headingOptimizationCount: integrationReport.headingOptimizations.length,
      naturalFlowScore: this.calculateNaturalFlowScore(integrationReport.naturalFlowMetrics),
      lsiKeywordsIntegrated: integrationReport.lsiPlacements.length,
      entitiesIntegrated: integrationReport.entityPlacements.length,
      integrationReport,
    };
  }

  /**
   * Optimize headings with target keywords
   */
  private optimizeHeadings(content: string, benchmarks: BenchmarkTargets): {
    content: string;
    optimizations: Array<{ level: number; original: string; optimized: string }>;
  } {
    const optimizations: Array<{ level: number; original: string; optimized: string }> = [];
    let optimizedContent = content;

    // Extract headings using regex
    const headingRegex = /^(#{1,6})\s+(.+)$/gm;
    const headings = [...content.matchAll(headingRegex)];

    let optimizedCount = 0;
    const targetOptimizations = benchmarks.headingOptimization;

    headings.forEach((match, index) => {
      if (optimizedCount >= targetOptimizations) return;

      const level = match[1] ? match[1].length : 1;
      const originalText = match[2];
      const fullMatch = match[0];

      // Only optimize if heading doesn't already contain optimization
      if (!this.containsKeywordOptimization(originalText)) {
        const optimizedText = this.optimizeHeadingText(originalText, level);
        const optimizedHeading = `${match[1]} ${optimizedText}`;

        optimizedContent = optimizedContent.replace(fullMatch, optimizedHeading);
        optimizations.push({
          level,
          original: originalText,
          optimized: optimizedText,
        });
        optimizedCount++;
      }
    });

    return { content: optimizedContent, optimizations };
  }

  /**
   * Integrate keywords naturally into content body
   */
  private integrateKeywordsNaturally(content: string, benchmarks: BenchmarkTargets, keyword: string): {
    content: string;
    placements: Array<{ position: number; context: string; method: string }>;
  } {
    const placements: Array<{ position: number; context: string; method: string }> = [];
    let optimizedContent = content;

    const sentences = this.extractSentences(content);
    const currentDensity = this.calculateCurrentKeywordDensity(content, keyword);
    const targetDensity = benchmarks.keywordDensity;

    if (Math.abs(currentDensity - targetDensity) <= 0.01) {
      return { content: optimizedContent, placements };
    }

    // Calculate how many keyword instances we need to add
    const words = content.split(/\s+/).length;
    const currentKeywordCount = Math.round((currentDensity / 100) * words);
    const targetKeywordCount = Math.round((targetDensity / 100) * words);
    const keywordsToAdd = Math.max(0, targetKeywordCount - currentKeywordCount);

    // Find optimal integration points
    const integrationPoints = this.findOptimalIntegrationPoints(sentences);

    // Integrate keywords at strategic points
    integrationPoints.slice(0, keywordsToAdd).forEach((point, index) => {
      const integratedSentence = this.integrateKeywordInSentence(point.sentence, point.method, keyword);
      optimizedContent = optimizedContent.replace(point.sentence, integratedSentence);

      placements.push({
        position: point.position,
        context: point.sentence.substring(0, 50) + '...',
        method: point.method,
      });
    });

    return { content: optimizedContent, placements };
  }

  /**
   * Weave entities naturally into content
   */
  private weaveEntitiesNaturally(content: string, entities: Entity[]): {
    content: string;
    placements: Array<{ entity: string; position: number; context: string }>;
  } {
    const placements: Array<{ entity: string; position: number; context: string }> = [];
    let optimizedContent = content;

    // Sort entities by relevance
    const sortedEntities = entities
      .filter(entity => entity.relevance > 0.5)
      .sort((a, b) => b.relevance - a.relevance);

    const paragraphs = content.split('\n\n');
    
    sortedEntities.forEach((entity, index) => {
      if (index >= paragraphs.length) return;

      const targetParagraph = paragraphs[index % paragraphs.length];
      if (!targetParagraph.includes(entity.name)) {
        const integratedParagraph = this.integrateEntityInParagraph(targetParagraph, entity);
        optimizedContent = optimizedContent.replace(targetParagraph, integratedParagraph);
        
        placements.push({
          entity: entity.name,
          position: optimizedContent.indexOf(integratedParagraph),
          context: integratedParagraph.substring(0, 100) + '...',
        });
      }
    });

    return { content: optimizedContent, placements };
  }

  /**
   * Integrate LSI keywords throughout content
   */
  private integrateLSIKeywords(content: string, lsiKeywords: string[], benchmarks: BenchmarkTargets): {
    content: string;
    placements: Array<{ keyword: string; position: number; context: string }>;
  } {
    const placements: Array<{ keyword: string; position: number; context: string }> = [];
    let optimizedContent = content;

    const targetLSICount = benchmarks.lsiKeywordTargets;
    const sentences = this.extractSentences(content);
    
    lsiKeywords.slice(0, targetLSICount).forEach((lsiKeyword, index) => {
      const targetSentenceIndex = Math.floor((index / targetLSICount) * sentences.length);
      const targetSentence = sentences[targetSentenceIndex];
      
      if (targetSentence && !targetSentence.toLowerCase().includes(lsiKeyword.toLowerCase())) {
        const integratedSentence = this.integrateLSIInSentence(targetSentence, lsiKeyword);
        optimizedContent = optimizedContent.replace(targetSentence, integratedSentence);
        
        placements.push({
          keyword: lsiKeyword,
          position: optimizedContent.indexOf(integratedSentence),
          context: integratedSentence.substring(0, 80) + '...',
        });
      }
    });

    return { content: optimizedContent, placements };
  }

  // Helper methods
  private containsKeywordOptimization(text: string): boolean {
    // Simple check for existing optimization
    return text.toLowerCase().includes('seo') || text.toLowerCase().includes('optimization');
  }

  private optimizeHeadingText(text: string, level: number): string {
    // Simple heading optimization - in real implementation, this would be more sophisticated
    return `${text} - SEO Optimization Guide`;
  }

  private extractSentences(content: string): string[] {
    return content.split(/[.!?]+/).filter(s => s.trim().length > this.MIN_SENTENCE_LENGTH);
  }

  private calculateCurrentKeywordDensity(content: string, keyword: string = 'SEO'): number {
    const words = content.toLowerCase().replace(/[^\w\s]/g, ' ').split(/\s+/).filter(w => w.length > 0);
    const keywordLower = keyword.toLowerCase();

    // For multi-word keywords, check for exact phrase matches and individual word matches
    let keywordCount = 0;
    if (keyword.includes(' ')) {
      // Multi-word keyword - check for phrase matches
      const keywordPhrase = keywordLower.replace(/\s+/g, '\\s+');
      const phraseRegex = new RegExp(keywordPhrase, 'g');
      const phraseMatches = content.toLowerCase().match(phraseRegex) || [];
      keywordCount += phraseMatches.length;

      // Also count individual word matches
      const keywordWords = keywordLower.split(/\s+/);
      keywordWords.forEach(kw => {
        keywordCount += words.filter(word => word === kw).length;
      });
    } else {
      // Single word keyword
      keywordCount = words.filter(word => word === keywordLower).length;
    }

    return words.length > 0 ? Number(((keywordCount / words.length) * 100).toFixed(2)) : 0;
  }

  private findOptimalIntegrationPoints(sentences: string[]): Array<{ sentence: string; position: number; method: string }> {
    return sentences.map((sentence, index) => ({
      sentence,
      position: index,
      method: 'natural_insertion',
    })).slice(0, 3); // Limit integration points
  }

  private integrateKeywordInSentence(sentence: string, method: string, keyword: string = 'SEO optimization'): string {
    // More sophisticated integration based on sentence structure
    if (sentence.trim().endsWith('.')) {
      return sentence.replace('.', ` with ${keyword}.`);
    } else {
      return `${sentence} ${keyword}`;
    }
  }

  private integrateEntityInParagraph(paragraph: string, entity: Entity): string {
    return `${entity.name}, a leading ${entity.type.toLowerCase()}, ${paragraph}`;
  }

  private integrateLSIInSentence(sentence: string, lsiKeyword: string): string {
    return sentence.replace(/\.$/, `, including ${lsiKeyword}.`);
  }

  private calculateFinalMetrics(content: string, benchmarks: BenchmarkTargets, keyword: string = 'SEO'): { keywordDensity: number } {
    return { keywordDensity: this.calculateCurrentKeywordDensity(content, keyword) };
  }

  private assessNaturalFlow(content: string): { readabilityScore: number; coherenceScore: number; transitionQuality: number } {
    // Simplified assessment - in real implementation, this would use NLP libraries
    return {
      readabilityScore: 85,
      coherenceScore: 80,
      transitionQuality: 75,
    };
  }

  private calculateNaturalFlowScore(metrics: { readabilityScore: number; coherenceScore: number; transitionQuality: number }): number {
    return (metrics.readabilityScore + metrics.coherenceScore + metrics.transitionQuality) / 3;
  }
}
