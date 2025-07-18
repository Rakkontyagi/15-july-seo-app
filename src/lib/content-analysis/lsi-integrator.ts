
import { SentenceTokenizer, WordTokenizer } from 'natural';
import * as compromise from 'compromise';

export interface LSIKeyword {
  term: string;
  relevance: number;
  semantic_score: number;
  context_strength: number;
}

export interface LSIPattern {
  term: string;
  frequency: number;
  positions: number[];
  context_words: string[];
  semantic_weight: number;
}

export interface SemanticContext {
  sentence: string;
  position: number;
  relevance_score: number;
  integration_opportunities: string[];
}

export interface LSIIntegrationResult {
  originalContent: string;
  optimizedContent: string;
  integratedTerms: number;
  semanticCoverage: number;
  naturalness_score: number;
  context_preservation: number;
}

export interface CompetitorLSIAnalysis {
  terms: LSIKeyword[];
  patterns: LSIPattern[];
  semantic_density: number;
  context_mapping: Map<string, string[]>;
}

export class LSIKeywordIntegrator {
  private readonly sentenceTokenizer = new SentenceTokenizer();
  private readonly wordTokenizer = new WordTokenizer();
  private readonly MIN_SEMANTIC_SCORE = 0.3;
  private readonly MAX_INTEGRATION_PER_SENTENCE = 2;

  /**
   * Integrate semantic terms throughout content based on competitor usage patterns
   */
  integrateSemanticTerms(
    content: string, 
    lsiKeywords: LSIKeyword[], 
    competitorPatterns: LSIPattern[]
  ): LSIIntegrationResult {
    const originalContent = content;
    let optimizedContent = content;
    let integratedCount = 0;

    // Analyze content structure
    const contentAnalysis = this.analyzeContentStructure(content);
    
    // Sort LSI keywords by relevance and semantic score
    const sortedLSIKeywords = lsiKeywords
      .filter(keyword => keyword.semantic_score >= this.MIN_SEMANTIC_SCORE)
      .sort((a, b) => (b.relevance * b.semantic_score) - (a.relevance * a.semantic_score));

    // Integrate each LSI keyword
    for (const lsiKeyword of sortedLSIKeywords) {
      const targetFrequency = this.calculateTargetFrequency(lsiKeyword, competitorPatterns);
      const integrationResult = this.integrateAtOptimalFrequency(
        optimizedContent, 
        lsiKeyword, 
        targetFrequency,
        contentAnalysis
      );
      
      optimizedContent = integrationResult.content;
      integratedCount += integrationResult.integratedCount;
    }

    // Calculate semantic coverage
    const semanticCoverage = this.calculateSemanticCoverage(
      optimizedContent, 
      sortedLSIKeywords
    );

    return {
      originalContent,
      optimizedContent,
      integratedTerms: integratedCount,
      semanticCoverage,
      naturalness_score: this.calculateNaturalnessScore(optimizedContent),
      context_preservation: this.calculateContextPreservation(originalContent, optimizedContent)
    };
  }

  /**
   * Analyze competitor LSI usage patterns
   */
  analyzeCompetitorLSIPatterns(competitorContents: string[]): CompetitorLSIAnalysis {
    const allTerms: Map<string, LSIKeyword> = new Map();
    const allPatterns: Map<string, LSIPattern> = new Map();
    const contextMapping: Map<string, string[]> = new Map();

    for (const content of competitorContents) {
      const extractedTerms = this.extractLSITerms(content);
      const patterns = this.analyzeTermPatterns(content, extractedTerms);

      // Aggregate terms
      extractedTerms.forEach(term => {
        const existing = allTerms.get(term.term);
        if (existing) {
          existing.relevance = Math.max(existing.relevance, term.relevance);
          existing.semantic_score = Math.max(existing.semantic_score, term.semantic_score);
        } else {
          allTerms.set(term.term, { ...term });
        }
      });

      // Aggregate patterns
      patterns.forEach(pattern => {
        const existing = allPatterns.get(pattern.term);
        if (existing) {
          existing.frequency += pattern.frequency;
          existing.positions.push(...pattern.positions);
          existing.context_words.push(...pattern.context_words);
        } else {
          allPatterns.set(pattern.term, { ...pattern });
        }
      });
    }

    // Calculate semantic density
    const totalWords = competitorContents.reduce((sum, content) => 
      sum + this.wordTokenizer.tokenize(content).length, 0
    );
    const totalLSITerms = Array.from(allPatterns.values()).reduce((sum, pattern) => 
      sum + pattern.frequency, 0
    );
    const semanticDensity = (totalLSITerms / totalWords) * 100;

    return {
      terms: Array.from(allTerms.values()),
      patterns: Array.from(allPatterns.values()),
      semantic_density: semanticDensity,
      context_mapping: contextMapping
    };
  }

  /**
   * Extract LSI terms from content using NLP analysis
   */
  private extractLSITerms(content: string): LSIKeyword[] {
    const doc = compromise(content);
    const terms: LSIKeyword[] = [];

    // Extract nouns and adjectives as potential LSI terms
    const nouns = doc.match('#Noun').out('array');
    const adjectives = doc.match('#Adjective').out('array');
    const verbs = doc.match('#Verb').out('array');

    const allTerms = [...nouns, ...adjectives, ...verbs];

    // Calculate relevance and semantic scores
    allTerms.forEach(term => {
      const frequency = this.calculateTermFrequency(content, term);
      const semanticScore = this.calculateSemanticScore(content, term);
      
      if (frequency > 1 && semanticScore >= this.MIN_SEMANTIC_SCORE) {
        terms.push({
          term: term.toLowerCase(),
          relevance: frequency / allTerms.length,
          semantic_score: semanticScore,
          context_strength: this.calculateContextStrength(content, term)
        });
      }
    });

    return terms.sort((a, b) => b.relevance - a.relevance);
  }

  /**
   * Analyze term patterns in content
   */
  private analyzeTermPatterns(content: string, terms: LSIKeyword[]): LSIPattern[] {
    const patterns: LSIPattern[] = [];
    const words = this.wordTokenizer.tokenize(content);

    terms.forEach(term => {
      const positions: number[] = [];
      const contextWords: string[] = [];

      words.forEach((word, index) => {
        if (word.toLowerCase() === term.term.toLowerCase()) {
          positions.push(index);
          
          // Capture context words (2 words before and after)
          const contextStart = Math.max(0, index - 2);
          const contextEnd = Math.min(words.length, index + 3);
          contextWords.push(...words.slice(contextStart, contextEnd));
        }
      });

      if (positions.length > 0) {
        patterns.push({
          term: term.term,
          frequency: positions.length,
          positions,
          context_words: [...new Set(contextWords)],
          semantic_weight: term.semantic_score
        });
      }
    });

    return patterns;
  }

  /**
   * Calculate target frequency based on competitor patterns
   */
  private calculateTargetFrequency(lsiKeyword: LSIKeyword, competitorPatterns: LSIPattern[]): number {
    const competitorPattern = competitorPatterns.find(p => p.term === lsiKeyword.term);
    if (!competitorPattern) {
      return Math.max(1, Math.round(lsiKeyword.relevance * 10));
    }

    // Use competitor average but adjust based on semantic score
    const adjustedFrequency = competitorPattern.frequency * lsiKeyword.semantic_score;
    return Math.max(1, Math.round(adjustedFrequency));
  }

  /**
   * Integrate LSI keyword at optimal frequency
   */
  private integrateAtOptimalFrequency(
    content: string, 
    lsiKeyword: LSIKeyword, 
    targetFrequency: number,
    contentAnalysis: SemanticContext[]
  ): { content: string; integratedCount: number } {
    const currentFrequency = this.calculateTermFrequency(content, lsiKeyword.term);
    
    if (currentFrequency >= targetFrequency) {
      return { content, integratedCount: 0 };
    }

    const neededIntegrations = targetFrequency - currentFrequency;
    let optimizedContent = content;
    let integratedCount = 0;

    // Find suitable integration points
    const integrationPoints = this.findIntegrationPoints(
      content, 
      lsiKeyword, 
      contentAnalysis
    );

    // Integrate at the best points
    for (let i = 0; i < Math.min(neededIntegrations, integrationPoints.length); i++) {
      const point = integrationPoints[i];
      const integratedSentence = this.integrateTermInSentence(
        point.sentence, 
        lsiKeyword.term
      );
      
      optimizedContent = optimizedContent.replace(point.sentence, integratedSentence);
      integratedCount++;
    }

    return { content: optimizedContent, integratedCount };
  }

  /**
   * Find suitable integration points in content
   */
  private findIntegrationPoints(
    content: string, 
    lsiKeyword: LSIKeyword, 
    contentAnalysis: SemanticContext[]
  ): SemanticContext[] {
    const sentences = this.sentenceTokenizer.tokenize(content);
    const integrationPoints: SemanticContext[] = [];

    sentences.forEach((sentence, index) => {
      // Skip sentences that already contain the LSI term
      if (sentence.toLowerCase().includes(lsiKeyword.term.toLowerCase())) {
        return;
      }

      // Skip very short sentences
      if (sentence.split(' ').length < 10) {
        return;
      }

      // Calculate relevance score for this sentence
      const relevanceScore = this.calculateSentenceRelevance(sentence, lsiKeyword);
      
      if (relevanceScore >= this.MIN_SEMANTIC_SCORE) {
        integrationPoints.push({
          sentence,
          position: index,
          relevance_score: relevanceScore,
          integration_opportunities: this.findIntegrationOpportunities(sentence, lsiKeyword)
        });
      }
    });

    // Sort by relevance score
    return integrationPoints.sort((a, b) => b.relevance_score - a.relevance_score);
  }

  /**
   * Integrate term naturally into sentence
   */
  private integrateTermInSentence(sentence: string, term: string): string {
    const doc = compromise(sentence);
    
    // Try to find a natural insertion point
    const insertionPoints = [
      { position: 0.2, connector: ' with ' },
      { position: 0.5, connector: ' including ' },
      { position: 0.7, connector: ' through ' },
      { position: 0.8, connector: ' using ' }
    ];

    for (const point of insertionPoints) {
      const words = sentence.split(' ');
      const insertIndex = Math.floor(words.length * point.position);
      
      // Check if insertion makes sense contextually
      const beforeWords = words.slice(insertIndex - 2, insertIndex);
      const afterWords = words.slice(insertIndex, insertIndex + 2);
      
      if (this.isValidInsertion(beforeWords, term, afterWords)) {
        const before = words.slice(0, insertIndex).join(' ');
        const after = words.slice(insertIndex).join(' ');
        return `${before}${point.connector}${term} ${after}`;
      }
    }

    // Fallback: append to end of sentence
    return sentence.replace(/\.$/, ` with ${term}.`);
  }

  /**
   * Check if insertion is contextually valid
   */
  private isValidInsertion(beforeWords: string[], term: string, afterWords: string[]): boolean {
    // Simple contextual validation
    const beforeText = beforeWords.join(' ').toLowerCase();
    const afterText = afterWords.join(' ').toLowerCase();
    
    // Avoid duplicate concepts
    if (beforeText.includes(term.toLowerCase()) || afterText.includes(term.toLowerCase())) {
      return false;
    }

    // Check for semantic compatibility
    return this.isSemanticCompatible(beforeText, term, afterText);
  }

  /**
   * Check semantic compatibility
   */
  private isSemanticCompatible(before: string, term: string, after: string): boolean {
    // Basic semantic compatibility check
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    const contextWords = [...before.split(' '), ...after.split(' ')]
      .filter(word => !stopWords.includes(word.toLowerCase()));

    // If there are related context words, it's likely compatible
    return contextWords.length > 0;
  }

  /**
   * Calculate semantic coverage
   */
  private calculateSemanticCoverage(content: string, lsiKeywords: LSIKeyword[]): number {
    let coveredTerms = 0;
    
    lsiKeywords.forEach(keyword => {
      if (content.toLowerCase().includes(keyword.term.toLowerCase())) {
        coveredTerms++;
      }
    });

    return (coveredTerms / lsiKeywords.length) * 100;
  }

  /**
   * Calculate naturalness score
   */
  private calculateNaturalnessScore(content: string): number {
    const doc = compromise(content);
    
    // Check sentence variety
    const sentences = this.sentenceTokenizer.tokenize(content);
    const avgSentenceLength = sentences.reduce((sum, s) => sum + s.split(' ').length, 0) / sentences.length;
    
    // Check word variety
    const words = this.wordTokenizer.tokenize(content);
    const uniqueWords = new Set(words.map(w => w.toLowerCase()));
    const lexicalDiversity = uniqueWords.size / words.length;
    
    // Combine factors
    const sentenceVariety = Math.min(1, avgSentenceLength / 20);
    const wordVariety = Math.min(1, lexicalDiversity * 2);
    
    return (sentenceVariety + wordVariety) * 50;
  }

  /**
   * Calculate context preservation
   */
  private calculateContextPreservation(original: string, optimized: string): number {
    const originalWords = this.wordTokenizer.tokenize(original);
    const optimizedWords = this.wordTokenizer.tokenize(optimized);
    
    const originalSet = new Set(originalWords.map(w => w.toLowerCase()));
    const optimizedSet = new Set(optimizedWords.map(w => w.toLowerCase()));
    
    const intersection = new Set([...originalSet].filter(w => optimizedSet.has(w)));
    
    return (intersection.size / originalSet.size) * 100;
  }

  /**
   * Helper methods for LSI analysis
   */
  private analyzeContentStructure(content: string): SemanticContext[] {
    const sentences = this.sentenceTokenizer.tokenize(content);
    return sentences.map((sentence, index) => ({
      sentence,
      position: index,
      relevance_score: this.calculateSentenceRelevance(sentence, { term: '', relevance: 0, semantic_score: 0, context_strength: 0 }),
      integration_opportunities: []
    }));
  }

  private calculateTermFrequency(content: string, term: string): number {
    const words = this.wordTokenizer.tokenize(content);
    return words.filter(word => word.toLowerCase() === term.toLowerCase()).length;
  }

  private calculateSemanticScore(content: string, term: string): number {
    const doc = compromise(content);
    const termDoc = compromise(term);
    
    // Simple semantic scoring based on part of speech and context
    const isNoun = termDoc.has('#Noun');
    const isAdjective = termDoc.has('#Adjective');
    const isVerb = termDoc.has('#Verb');
    
    let score = 0.5; // Base score
    
    if (isNoun) score += 0.3;
    if (isAdjective) score += 0.2;
    if (isVerb) score += 0.1;
    
    return Math.min(1, score);
  }

  private calculateContextStrength(content: string, term: string): number {
    const sentences = this.sentenceTokenizer.tokenize(content);
    let strengthSum = 0;
    let occurrences = 0;

    sentences.forEach(sentence => {
      if (sentence.toLowerCase().includes(term.toLowerCase())) {
        const words = this.wordTokenizer.tokenize(sentence);
        strengthSum += words.length; // Longer sentences = stronger context
        occurrences++;
      }
    });

    return occurrences > 0 ? strengthSum / occurrences : 0;
  }

  private calculateSentenceRelevance(sentence: string, lsiKeyword: LSIKeyword): number {
    const words = this.wordTokenizer.tokenize(sentence);
    const sentenceLength = words.length;
    
    // Base relevance on sentence length and complexity
    const lengthScore = Math.min(1, sentenceLength / 20);
    const complexityScore = this.calculateSentenceComplexity(sentence);
    
    return (lengthScore + complexityScore) / 2;
  }

  private calculateSentenceComplexity(sentence: string): number {
    const doc = compromise(sentence);
    
    const nounCount = doc.match('#Noun').length;
    const verbCount = doc.match('#Verb').length;
    const adjCount = doc.match('#Adjective').length;
    
    const totalWords = this.wordTokenizer.tokenize(sentence).length;
    const complexityRatio = (nounCount + verbCount + adjCount) / totalWords;
    
    return Math.min(1, complexityRatio * 2);
  }

  private findIntegrationOpportunities(sentence: string, lsiKeyword: LSIKeyword): string[] {
    const opportunities: string[] = [];
    const doc = compromise(sentence);
    
    // Look for phrases that could be enhanced with the LSI term
    const phrases = doc.match('#Noun+').out('array');
    
    phrases.forEach(phrase => {
      if (phrase.length > 2 && !phrase.toLowerCase().includes(lsiKeyword.term.toLowerCase())) {
        opportunities.push(phrase);
      }
    });

    return opportunities;
  }
}
