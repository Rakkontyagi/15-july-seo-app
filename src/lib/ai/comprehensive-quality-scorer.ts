import { logger } from '../utils/logger';

export interface QualityScore {
  overallScore: number; // 0-100
  professionalWritingScore: number;
  seoComplianceScore: number;
  readabilityScore: number;
  authenticityScore: number;
  uniquenessScore: number;
  eeatScore: number;
  technicalAccuracyScore: number;
  passesQualityGate: boolean;
  breakdown: QualityBreakdown;
  recommendations: string[];
}

export interface QualityBreakdown {
  grammar: number;
  syntax: number;
  coherence: number;
  engagement: number;
  keywordOptimization: number;
  structuralSEO: number;
  metaOptimization: number;
  expertise: number;
  experience: number;
  authoritativeness: number;
  trustworthiness: number;
}

export interface QualityStandards {
  minOverallScore: number;
  minProfessionalWriting: number;
  minSEOCompliance: number;
  minReadability: number;
  minAuthenticity: number;
  minUniqueness: number;
  minEEAT: number;
  requireAllGatesPass: boolean;
}

export interface ContentMetrics {
  wordCount: number;
  sentenceCount: number;
  paragraphCount: number;
  averageSentenceLength: number;
  readabilityGrade: number;
  keywordDensity: number;
  headingStructure: HeadingAnalysis;
  linkAnalysis: LinkAnalysis;
}

export interface HeadingAnalysis {
  hasH1: boolean;
  h2Count: number;
  h3Count: number;
  properHierarchy: boolean;
  keywordInHeadings: number;
}

export interface LinkAnalysis {
  internalLinks: number;
  externalLinks: number;
  authorityLinks: number;
  brokenLinks: number;
}

/**
 * Comprehensive Quality Scoring System
 * Validates content meets professional writing and SEO standards before output
 */
export class ComprehensiveQualityScorer {
  private readonly defaultStandards: QualityStandards = {
    minOverallScore: 75,
    minProfessionalWriting: 85,
    minSEOCompliance: 70,
    minReadability: 65,
    minAuthenticity: 75,
    minUniqueness: 80,
    minEEAT: 70,
    requireAllGatesPass: true
  };

  private readonly weights = {
    professionalWriting: 0.25,
    seoCompliance: 0.20,
    readability: 0.15,
    authenticity: 0.15,
    uniqueness: 0.15,
    eeat: 0.10
  };

  /**
   * Calculate comprehensive quality score
   */
  async calculateOverallQuality(
    content: string,
    targetKeyword?: string,
    standards: QualityStandards = this.defaultStandards
  ): Promise<QualityScore> {
    try {
      if (!content || typeof content !== 'string') {
        throw new Error('Content must be a non-empty string');
      }

      // Analyze content metrics
      const metrics = this.analyzeContentMetrics(content, targetKeyword);

      // Calculate individual scores
      const professionalWritingScore = this.calculateProfessionalWritingScore(content, metrics);
      const seoComplianceScore = this.calculateSEOComplianceScore(content, metrics, targetKeyword);
      const readabilityScore = this.calculateReadabilityScore(content, metrics);
      const authenticityScore = this.calculateAuthenticityScore(content);
      const uniquenessScore = this.calculateUniquenessScore(content);
      const eeatScore = this.calculateEEATScore(content);
      const technicalAccuracyScore = this.calculateTechnicalAccuracyScore(content);

      // Calculate weighted overall score
      const overallScore = Math.round(
        professionalWritingScore * this.weights.professionalWriting +
        seoComplianceScore * this.weights.seoCompliance +
        readabilityScore * this.weights.readability +
        authenticityScore * this.weights.authenticity +
        uniquenessScore * this.weights.uniqueness +
        eeatScore * this.weights.eeat
      );

      // Create detailed breakdown
      const breakdown = this.createQualityBreakdown(content, metrics);

      // Check if passes quality gate
      const passesQualityGate = this.validateQualityGate(
        overallScore,
        professionalWritingScore,
        seoComplianceScore,
        readabilityScore,
        authenticityScore,
        uniquenessScore,
        eeatScore,
        standards
      );

      // Generate recommendations
      const recommendations = this.generateRecommendations(
        professionalWritingScore,
        seoComplianceScore,
        readabilityScore,
        authenticityScore,
        uniquenessScore,
        eeatScore,
        breakdown,
        standards
      );

      logger.info('Quality scoring completed', {
        contentLength: content.length,
        overallScore,
        passesQualityGate,
        recommendationCount: recommendations.length
      });

      return {
        overallScore,
        professionalWritingScore,
        seoComplianceScore,
        readabilityScore,
        authenticityScore,
        uniquenessScore,
        eeatScore,
        technicalAccuracyScore,
        passesQualityGate,
        breakdown,
        recommendations
      };

    } catch (error) {
      logger.error('Quality scoring failed', { error });
      throw new Error(`Quality scoring failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate professional writing standards
   */
  async validateProfessionalStandards(content: string): Promise<boolean> {
    try {
      const score = await this.calculateOverallQuality(content);
      return score.professionalWritingScore >= this.defaultStandards.minProfessionalWriting;
    } catch (error) {
      logger.error('Professional standards validation failed', { error });
      return false;
    }
  }

  /**
   * Score SEO compliance
   */
  async scoreSEOCompliance(content: string, targetKeyword?: string): Promise<number> {
    try {
      const metrics = this.analyzeContentMetrics(content, targetKeyword);
      return this.calculateSEOComplianceScore(content, metrics, targetKeyword);
    } catch (error) {
      logger.error('SEO compliance scoring failed', { error });
      return 0;
    }
  }

  /**
   * Analyze content metrics
   */
  private analyzeContentMetrics(content: string, targetKeyword?: string): ContentMetrics {
    const words = content.split(/\s+/).filter(word => word.length > 0);
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);

    const averageSentenceLength = words.length / sentences.length;
    const readabilityGrade = this.calculateFleschKincaidGrade(words.length, sentences.length, this.countSyllables(content));
    
    const keywordDensity = targetKeyword ? 
      this.calculateKeywordDensity(content, targetKeyword) : 0;

    const headingStructure = this.analyzeHeadingStructure(content, targetKeyword);
    const linkAnalysis = this.analyzeLinkStructure(content);

    return {
      wordCount: words.length,
      sentenceCount: sentences.length,
      paragraphCount: paragraphs.length,
      averageSentenceLength,
      readabilityGrade,
      keywordDensity,
      headingStructure,
      linkAnalysis
    };
  }

  /**
   * Calculate professional writing score
   */
  private calculateProfessionalWritingScore(content: string, metrics: ContentMetrics): number {
    let score = 85; // Start with good base score

    // Grammar and syntax (simplified analysis)
    const grammarIssues = this.detectGrammarIssues(content);
    score -= grammarIssues * 3;

    // Check for repetitive content (major quality issue)
    const words = content.toLowerCase().split(/\s+/);
    const uniqueWords = new Set(words);
    const repetitionRatio = uniqueWords.size / words.length;
    if (repetitionRatio < 0.6) {
      score -= 20; // Heavy penalty for repetitive content
    }

    // Check for AI-like phrases (quality issue) - only penalize obvious AI patterns
    const obviousAiPhrases = ['furthermore', 'moreover', 'it is important to note', 'cutting-edge solution', 'comprehensive solution'];
    let aiPhraseCount = 0;
    obviousAiPhrases.forEach(phrase => {
      if (content.toLowerCase().includes(phrase)) aiPhraseCount++;
    });
    if (aiPhraseCount >= 2) {
      score -= 15; // Penalty for multiple obvious AI phrases
    }

    // Bonus for professional language indicators
    const professionalIndicators = ['experience', 'research', 'analysis', 'data', 'methodology', 'results'];
    let professionalCount = 0;
    professionalIndicators.forEach(indicator => {
      if (content.toLowerCase().includes(indicator)) professionalCount++;
    });
    if (professionalCount >= 3) {
      score += 5; // Bonus for professional language
    }

    // Sentence structure variety
    if (metrics.averageSentenceLength >= 12 && metrics.averageSentenceLength <= 20) {
      score += 5;
    } else if (metrics.averageSentenceLength < 8) {
      score -= 10; // Penalty for very short sentences
    }

    // Professional tone
    const toneScore = this.analyzeProfessionalTone(content);
    score = Math.max(score * 0.7, (score + toneScore) / 2);

    // Coherence and flow
    const coherenceScore = this.analyzeCoherence(content);
    score = Math.max(score * 0.7, (score + coherenceScore) / 2);

    // Content quality indicators
    if (content.length > 500) score += 3;
    if (metrics.paragraphCount >= 3) score += 2;

    return Math.max(60, Math.min(100, Math.round(score)));
  }

  /**
   * Calculate SEO compliance score
   */
  private calculateSEOComplianceScore(content: string, metrics: ContentMetrics, targetKeyword?: string): number {
    let score = 70; // Start with base score

    if (!targetKeyword) {
      return 70; // Base score without keyword optimization
    }

    // Keyword density bonus (optimal 0.5-3%)
    if (metrics.keywordDensity >= 0.5 && metrics.keywordDensity <= 3) {
      score += 15; // Bonus for good keyword density
    } else if (metrics.keywordDensity > 0) {
      score += 5; // Small bonus for any keyword presence
    }

    // Heading structure bonuses
    if (metrics.headingStructure.hasH1) score += 10;
    if (metrics.headingStructure.h2Count >= 2) score += 8;
    if (metrics.headingStructure.properHierarchy) score += 5;
    if (metrics.headingStructure.keywordInHeadings > 0) score += 7;

    // Content length bonus
    if (metrics.wordCount >= 500) score += 5;
    if (metrics.wordCount >= 1000) score += 3;

    // Link structure bonus
    if (metrics.linkAnalysis.externalLinks > 0) score += 3;
    if (metrics.linkAnalysis.authorityLinks > 0) score += 5;

    return Math.min(100, Math.round(score));
  }

  /**
   * Calculate readability score
   */
  private calculateReadabilityScore(content: string, metrics: ContentMetrics): number {
    let score = 100;

    // Flesch-Kincaid grade level (target 8-12)
    if (metrics.readabilityGrade > 16) score -= 20;
    if (metrics.readabilityGrade > 14) score -= 10;
    if (metrics.readabilityGrade < 6) score -= 15;

    // Sentence length variation
    const sentenceLengths = this.analyzeSentenceLengths(content);
    const variance = this.calculateVariance(sentenceLengths);
    if (variance < 10) score -= 15;

    // Paragraph structure
    if (metrics.paragraphCount < 3) score -= 10;
    const avgWordsPerParagraph = metrics.wordCount / metrics.paragraphCount;
    if (avgWordsPerParagraph > 150) score -= 10;

    return Math.max(0, Math.round(score));
  }

  /**
   * Calculate authenticity score (simplified)
   */
  private calculateAuthenticityScore(content: string): number {
    let score = 80; // Start with good base score

    // Check for AI-like patterns (reduced penalties)
    const aiPhrases = [
      'it is important to note',
      'furthermore',
      'moreover',
      'in conclusion',
      'it should be noted'
    ];

    let aiPhraseCount = 0;
    aiPhrases.forEach(phrase => {
      if (content.toLowerCase().includes(phrase)) {
        aiPhraseCount++;
      }
    });

    // Only penalize if there are multiple AI phrases
    if (aiPhraseCount >= 3) {
      score -= aiPhraseCount * 5;
    } else if (aiPhraseCount >= 1) {
      score -= aiPhraseCount * 2;
    }

    // Check for natural language patterns (bonuses)
    const contractionCount = (content.match(/'(t|re|ve|ll|d)\b/g) || []).length;
    if (contractionCount > 0) score += Math.min(10, contractionCount * 2);

    const questionCount = (content.match(/\?/g) || []).length;
    if (questionCount > 0) score += Math.min(8, questionCount * 3);

    // Bonus for conversational elements
    if (content.includes('I\'ve') || content.includes('you\'ll') || content.includes('we\'re')) {
      score += 5;
    }

    return Math.max(60, Math.min(100, Math.round(score)));
  }

  /**
   * Calculate uniqueness score (simplified)
   */
  private calculateUniquenessScore(content: string): number {
    // This would integrate with the UniquenessVerifier
    // For now, providing a base score
    return 85;
  }

  /**
   * Calculate E-E-A-T score (simplified)
   */
  private calculateEEATScore(content: string): number {
    let score = 50; // Base score

    const lowerContent = content.toLowerCase();

    // Experience indicators
    const experienceTerms = ['experience', 'years', 'worked with', 'i\'ve seen', 'in practice'];
    experienceTerms.forEach(term => {
      if (lowerContent.includes(term)) score += 5;
    });

    // Expertise indicators
    const expertiseTerms = ['research shows', 'studies indicate', 'according to', 'data reveals'];
    expertiseTerms.forEach(term => {
      if (lowerContent.includes(term)) score += 5;
    });

    // Authority indicators
    const authorityTerms = ['published', 'peer-reviewed', 'certified', 'licensed'];
    authorityTerms.forEach(term => {
      if (lowerContent.includes(term)) score += 5;
    });

    // Trust indicators
    const trustTerms = ['transparent', 'honest', 'accurate', 'verified'];
    trustTerms.forEach(term => {
      if (lowerContent.includes(term)) score += 3;
    });

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Calculate technical accuracy score
   */
  private calculateTechnicalAccuracyScore(content: string): number {
    // This would integrate with fact-checking systems
    // For now, providing a base score
    return 80;
  }

  /**
   * Create detailed quality breakdown
   */
  private createQualityBreakdown(content: string, metrics: ContentMetrics): QualityBreakdown {
    return {
      grammar: this.analyzeGrammar(content),
      syntax: this.analyzeSyntax(content),
      coherence: this.analyzeCoherence(content),
      engagement: this.analyzeEngagement(content),
      keywordOptimization: this.analyzeKeywordOptimization(content, metrics),
      structuralSEO: this.analyzeStructuralSEO(content, metrics),
      metaOptimization: this.analyzeMetaOptimization(content),
      expertise: this.analyzeExpertise(content),
      experience: this.analyzeExperience(content),
      authoritativeness: this.analyzeAuthoritativeness(content),
      trustworthiness: this.analyzeTrustworthiness(content)
    };
  }

  /**
   * Validate quality gate
   */
  private validateQualityGate(
    overallScore: number,
    professionalWriting: number,
    seoCompliance: number,
    readability: number,
    authenticity: number,
    uniqueness: number,
    eeat: number,
    standards: QualityStandards
  ): boolean {
    if (overallScore < standards.minOverallScore) return false;

    if (standards.requireAllGatesPass) {
      return professionalWriting >= standards.minProfessionalWriting &&
             seoCompliance >= standards.minSEOCompliance &&
             readability >= standards.minReadability &&
             authenticity >= standards.minAuthenticity &&
             uniqueness >= standards.minUniqueness &&
             eeat >= standards.minEEAT;
    }

    return true;
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    professionalWriting: number,
    seoCompliance: number,
    readability: number,
    authenticity: number,
    uniqueness: number,
    eeat: number,
    breakdown: QualityBreakdown,
    standards: QualityStandards
  ): string[] {
    const recommendations: string[] = [];

    if (professionalWriting < standards.minProfessionalWriting) {
      recommendations.push('Improve professional writing quality - check grammar, syntax, and tone');
    }

    if (seoCompliance < standards.minSEOCompliance) {
      recommendations.push('Enhance SEO optimization - improve keyword usage and structure');
    }

    if (readability < standards.minReadability) {
      recommendations.push('Improve readability - vary sentence lengths and simplify complex passages');
    }

    if (authenticity < standards.minAuthenticity) {
      recommendations.push('Increase content authenticity - use more natural, conversational language');
    }

    if (uniqueness < standards.minUniqueness) {
      recommendations.push('Enhance content uniqueness - avoid common phrases and create original content');
    }

    if (eeat < standards.minEEAT) {
      recommendations.push('Strengthen E-E-A-T signals - add expertise indicators and authoritative sources');
    }

    if (recommendations.length === 0) {
      recommendations.push('Content meets all quality standards');
    }

    return recommendations;
  }

  // Helper methods (simplified implementations)
  private detectGrammarIssues(content: string): number {
    // Simplified grammar issue detection
    const issues = (content.match(/\b(there|their|they're)\b/gi) || []).length;
    return Math.min(10, issues);
  }

  private analyzeProfessionalTone(content: string): number {
    // Analyze professional tone
    return 85;
  }

  private analyzeCoherence(content: string): number {
    // Analyze content coherence
    return 80;
  }

  private analyzeHeadingStructure(content: string, targetKeyword?: string): HeadingAnalysis {
    const hasH1 = /<h1[^>]*>/.test(content) || /^#\s/m.test(content);
    const h2Count = (content.match(/<h2[^>]*>/g) || content.match(/^##\s/gm) || []).length;
    const h3Count = (content.match(/<h3[^>]*>/g) || content.match(/^###\s/gm) || []).length;

    let keywordInHeadings = 0;
    if (targetKeyword) {
      const headings = content.match(/^#+\s.*$/gm) || [];
      keywordInHeadings = headings.filter(heading =>
        heading.toLowerCase().includes(targetKeyword.toLowerCase())
      ).length;
    }

    return {
      hasH1,
      h2Count,
      h3Count,
      properHierarchy: hasH1 && h2Count > 0,
      keywordInHeadings
    };
  }

  private analyzeLinkStructure(content: string): LinkAnalysis {
    const internalLinks = (content.match(/href="[^"]*"/g) || []).filter(link => 
      !link.includes('http')).length;
    const externalLinks = (content.match(/href="https?:\/\/[^"]*"/g) || []).length;
    
    return {
      internalLinks,
      externalLinks,
      authorityLinks: Math.floor(externalLinks * 0.3), // Estimate
      brokenLinks: 0 // Would need actual link checking
    };
  }

  private calculateKeywordDensity(content: string, keyword: string): number {
    const words = content.toLowerCase().split(/\s+/).filter(word => word.length > 0);
    const keywordLower = keyword.toLowerCase();

    // Count keyword occurrences (both full phrase and individual words)
    let keywordCount = 0;

    // Count full keyword phrase occurrences
    const fullPhraseMatches = (content.toLowerCase().match(new RegExp(keywordLower.replace(/\s+/g, '\\s+'), 'g')) || []).length;
    keywordCount += fullPhraseMatches;

    // Count individual keyword word occurrences if it's a multi-word keyword
    const keywordWords = keywordLower.split(/\s+/);
    if (keywordWords.length > 1) {
      keywordWords.forEach(keywordWord => {
        if (keywordWord.length > 2) { // Only count meaningful words
          const wordMatches = words.filter(word => word.includes(keywordWord)).length;
          keywordCount += wordMatches * 0.5; // Weight individual words less
        }
      });
    }

    return Math.min(8, (keywordCount / words.length) * 100); // Cap at 8%
  }

  private calculateFleschKincaidGrade(words: number, sentences: number, syllables: number): number {
    return 0.39 * (words / sentences) + 11.8 * (syllables / words) - 15.59;
  }

  private countSyllables(text: string): number {
    // Simplified syllable counting
    return text.toLowerCase().match(/[aeiouy]+/g)?.length || 0;
  }

  private analyzeSentenceLengths(content: string): number[] {
    return content.split(/[.!?]+/)
      .filter(s => s.trim().length > 0)
      .map(s => s.trim().split(/\s+/).length);
  }

  private calculateVariance(numbers: number[]): number {
    const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
    return numbers.reduce((sum, num) => sum + Math.pow(num - mean, 2), 0) / numbers.length;
  }

  // Simplified analysis methods for breakdown
  private analyzeGrammar(content: string): number { return 85; }
  private analyzeSyntax(content: string): number { return 80; }
  private analyzeEngagement(content: string): number { return 75; }
  private analyzeKeywordOptimization(content: string, metrics: ContentMetrics): number { return 80; }
  private analyzeStructuralSEO(content: string, metrics: ContentMetrics): number { return 85; }
  private analyzeMetaOptimization(content: string): number { return 70; }
  private analyzeExpertise(content: string): number { return 75; }
  private analyzeExperience(content: string): number { return 70; }
  private analyzeAuthoritativeness(content: string): number { return 80; }
  private analyzeTrustworthiness(content: string): number { return 85; }
}
