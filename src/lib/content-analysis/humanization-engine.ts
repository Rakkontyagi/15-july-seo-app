/**
 * Internal AI Humanization Engine
 * Story 7.1: Internal AI Humanization Engine and Pattern Detection
 * 
 * This is the main integration class that orchestrates all humanization components
 * as specified in the Dev Notes of the story.
 */

import { AIPatternDetector } from './ai-pattern-detector';
import { analyzeSentenceLengthDistribution } from './patterns/sentence-length-distribution';
import { calculateStructuralPredictabilityScore } from './patterns/structural-predictability-scoring';
import { calculateLexicalDiversityScore } from './vocabulary/lexical-diversity-scoring';
import { analyzeWordChoiceComplexity } from './vocabulary/word-choice-complexity';
import { injectPersonalInsight } from './human-markers/personal-insight-injection';
import { addHumanLikeWritingQuirks } from './imperfections/human-like-writing-quirks';
import { addNaturalSpeechPatterns } from './conversational/natural-speech-pattern-injection';
import { validateAuthenticityScoring } from './pattern-breaking/authenticity-scoring-validation';
import { 
  AIPatternAnalysis, 
  SentenceStructureAnalysis,
  VocabularyAnalysis,
  HumanWritingMarkers,
  NaturalImperfections,
  ConversationalElements,
  PatternBreaking,
  HumanizationResult,
  HumanizationConfig,
  ProcessingOptions
} from '../../types/content-analysis';

/**
 * Main Internal Humanization Engine class as specified in Dev Notes
 * Implements the exact interface shown in the story requirements
 */
export class InternalHumanizationEngine {
  private aiPatternDetector: AIPatternDetector;
  private config: HumanizationConfig;
  private processingOptions: ProcessingOptions;

  constructor(config?: Partial<HumanizationConfig>, options?: Partial<ProcessingOptions>) {
    this.aiPatternDetector = new AIPatternDetector();
    this.config = this.getDefaultConfig(config);
    this.processingOptions = this.getDefaultOptions(options);
  }

  /**
   * Detects AI patterns in content as specified in Dev Notes
   * Returns comprehensive analysis of AI writing patterns
   */
  detectAIPatterns(content: string): AIPatternAnalysis {
    if (!content || content.trim().length === 0) {
      throw new Error('Content cannot be empty');
    }

    try {
      const analysis = this.aiPatternDetector.analyze(content);
      
      // Add additional analysis components
      const enhancedAnalysis: AIPatternAnalysis = {
        ...analysis,
        // Ensure all required fields are present
        repetitivePhrases: analysis.repetitivePhrases || [],
        sentenceStructurePatterns: analysis.sentenceStructurePatterns || [],
        predictableWritingPatterns: analysis.predictableWritingPatterns || [],
        aiTypicalPhraseCount: analysis.aiTypicalPhraseCount || 0,
        patternFrequencyScore: analysis.patternFrequencyScore || 0,
        overallRiskScore: analysis.overallRiskScore || 0
      };

      return enhancedAnalysis;
    } catch (error) {
      console.error('Error in detectAIPatterns:', error);
      throw new Error(`Failed to analyze AI patterns: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Analyzes sentence structure variation as specified in Dev Notes
   */
  analyzeSentenceVariation(content: string): SentenceStructureAnalysis {
    try {
      const lengthDistribution = analyzeSentenceLengthDistribution(content);
      const predictabilityScore = calculateStructuralPredictabilityScore(content);
      
      // Create comprehensive sentence structure analysis
      const analysis: SentenceStructureAnalysis = {
        lengthDistribution,
        structuralVariation: {
          sentenceTypes: this.analyzeSentenceTypes(content),
          startingWords: this.analyzeStartingWords(content),
          variationScore: this.calculateVariationScore(lengthDistribution, predictabilityScore)
        },
        flowDiversity: {
          transitionVariety: this.analyzeTransitionVariety(content),
          rhythmScore: this.calculateRhythmScore(content),
          naturalness: this.calculateNaturalnessScore(content)
        },
        predictabilityScore
      };

      return analysis;
    } catch (error) {
      console.error('Error in analyzeSentenceVariation:', error);
      throw new Error(`Failed to analyze sentence variation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Assesses vocabulary range and complexity as specified in Dev Notes
   */
  assessVocabularyRange(content: string): VocabularyAnalysis {
    try {
      const complexity = analyzeWordChoiceComplexity(content);
      const lexicalDiversity = calculateLexicalDiversityScore(content);
      
      const analysis: VocabularyAnalysis = {
        complexity: {
          averageWordLength: complexity,
          syllableComplexity: this.calculateSyllableComplexity(content),
          readabilityScore: this.calculateReadabilityScore(content),
          sophisticationLevel: this.determineSophisticationLevel(complexity)
        },
        range: {
          uniqueWords: this.countUniqueWords(content),
          totalWords: this.countTotalWords(content),
          vocabularyRichness: lexicalDiversity,
          domainSpecificTerms: this.extractDomainTerms(content)
        },
        diversity: {
          typeTokenRatio: this.calculateTypeTokenRatio(content),
          movingAverageTypeTokenRatio: this.calculateMATTR(content),
          lexicalDensity: this.calculateLexicalDensity(content),
          synonymVariation: this.analyzeSynonymVariation(content)
        },
        enhancement: {
          suggestions: this.generateEnhancementSuggestions(content),
          replacements: this.suggestWordReplacements(content),
          additionOpportunities: this.identifyAdditionOpportunities(content)
        }
      };

      return analysis;
    } catch (error) {
      console.error('Error in assessVocabularyRange:', error);
      throw new Error(`Failed to assess vocabulary range: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Evaluates content flow and naturalness as specified in Dev Notes
   */
  evaluateContentFlow(content: string): number {
    try {
      const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
      if (sentences.length === 0) return 0;

      let flowScore = 0;
      
      // Analyze transition quality
      const transitionScore = this.analyzeTransitions(content);
      flowScore += transitionScore * 0.3;
      
      // Analyze coherence
      const coherenceScore = this.analyzeCoherence(content);
      flowScore += coherenceScore * 0.3;
      
      // Analyze rhythm and pacing
      const rhythmScore = this.calculateRhythmScore(content);
      flowScore += rhythmScore * 0.2;
      
      // Analyze logical progression
      const progressionScore = this.analyzeLogicalProgression(content);
      flowScore += progressionScore * 0.2;

      return Math.max(0, Math.min(1, flowScore));
    } catch (error) {
      console.error('Error in evaluateContentFlow:', error);
      return 0;
    }
  }

  /**
   * Identifies human writing elements as specified in Dev Notes
   */
  identifyHumanElements(content: string): HumanWritingMarkers {
    try {
      const analysis: HumanWritingMarkers = {
        personalInsights: this.extractPersonalInsights(content),
        opinions: this.extractOpinions(content),
        experiences: this.extractExperiences(content),
        subjectiveCommentary: this.extractSubjectiveCommentary(content),
        authenticVoice: this.analyzeAuthenticVoice(content)
      };

      return analysis;
    } catch (error) {
      console.error('Error in identifyHumanElements:', error);
      throw new Error(`Failed to identify human elements: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Main humanization function as specified in Dev Notes
   * Applies all humanization techniques to make content appear human-written
   */
  humanizeContent(content: string): string {
    if (!content || content.trim().length === 0) {
      throw new Error('Content cannot be empty');
    }

    try {
      let humanizedContent = content;
      
      // Apply humanization techniques based on configuration
      if (this.config.enabledFeatures.structureVariation) {
        humanizedContent = this.addSentenceVariation(humanizedContent);
      }
      
      if (this.config.enabledFeatures.humanMarkers) {
        humanizedContent = this.insertPersonalTouches(humanizedContent);
      }
      
      if (this.config.enabledFeatures.conversationalElements) {
        humanizedContent = this.addNaturalTransitions(humanizedContent);
      }
      
      if (this.config.enabledFeatures.imperfections) {
        humanizedContent = this.includeHumanQuirks(humanizedContent);
      }
      
      if (this.config.enabledFeatures.vocabularyEnhancement) {
        humanizedContent = this.enhanceVocabulary(humanizedContent);
      }
      
      if (this.config.enabledFeatures.patternBreaking) {
        humanizedContent = this.breakPredictablePatterns(humanizedContent);
      }

      return humanizedContent;
    } catch (error) {
      console.error('Error in humanizeContent:', error);
      throw new Error(`Failed to humanize content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Performs comprehensive humanization analysis and processing
   */
  async processContent(content: string): Promise<HumanizationResult> {
    const startTime = Date.now();
    
    try {
      // Analyze original content
      const aiPatterns = this.detectAIPatterns(content);
      const sentenceStructure = this.analyzeSentenceVariation(content);
      const vocabulary = this.assessVocabularyRange(content);
      const humanMarkers = this.identifyHumanElements(content);
      
      // Apply humanization
      const humanizedContent = this.humanizeContent(content);
      
      // Calculate metrics
      const metrics = this.calculateMetrics(content, humanizedContent, aiPatterns);
      
      // Generate recommendations
      const recommendations = this.generateRecommendations(aiPatterns, sentenceStructure, vocabulary);
      
      const processingTime = Date.now() - startTime;
      
      const result: HumanizationResult = {
        originalContent: content,
        humanizedContent,
        analysis: {
          aiPatterns,
          sentenceStructure,
          vocabulary,
          humanMarkers,
          imperfections: this.analyzeImperfections(humanizedContent),
          conversational: this.analyzeConversationalElements(humanizedContent),
          patternBreaking: this.analyzePatternBreaking(humanizedContent)
        },
        metrics,
        processingTime,
        recommendations
      };
      
      return result;
    } catch (error) {
      console.error('Error in processContent:', error);
      throw new Error(`Failed to process content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Private helper methods will be implemented in the next part
  private getDefaultConfig(config?: Partial<HumanizationConfig>): HumanizationConfig {
    return {
      aggressiveness: 'moderate',
      preserveStyle: true,
      targetAudience: 'general',
      qualityThreshold: 0.8,
      enabledFeatures: {
        patternDetection: true,
        structureVariation: true,
        vocabularyEnhancement: true,
        humanMarkers: true,
        imperfections: true,
        conversationalElements: true,
        patternBreaking: true
      },
      ...config
    };
  }

  private getDefaultOptions(options?: Partial<ProcessingOptions>): ProcessingOptions {
    return {
      maxProcessingTime: 30000, // 30 seconds
      enableCaching: true,
      parallelProcessing: false,
      detailedAnalysis: true,
      ...options
    };
  }

  // Sentence analysis helper methods
  private analyzeSentenceTypes(content: string): { [type: string]: number } {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const types: { [type: string]: number } = {
      declarative: 0,
      interrogative: 0,
      exclamatory: 0,
      imperative: 0
    };

    sentences.forEach(sentence => {
      const trimmed = sentence.trim();
      if (trimmed.endsWith('?')) {
        types.interrogative++;
      } else if (trimmed.endsWith('!')) {
        types.exclamatory++;
      } else if (this.isImperative(trimmed)) {
        types.imperative++;
      } else {
        types.declarative++;
      }
    });

    return types;
  }

  private analyzeStartingWords(content: string): { [word: string]: number } {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const startingWords: { [word: string]: number } = {};

    sentences.forEach(sentence => {
      const words = sentence.trim().split(/\s+/);
      if (words.length > 0) {
        const firstWord = words[0].toLowerCase().replace(/[^\w]/g, '');
        startingWords[firstWord] = (startingWords[firstWord] || 0) + 1;
      }
    });

    return startingWords;
  }

  private calculateVariationScore(lengthDistribution: any, predictabilityScore: number): number {
    const diversityScore = lengthDistribution.diversityScore || 0;
    const variationScore = (diversityScore + (1 - predictabilityScore)) / 2;
    return Math.max(0, Math.min(1, variationScore));
  }

  private analyzeTransitionVariety(content: string): number {
    const transitions = [
      'however', 'moreover', 'furthermore', 'additionally', 'meanwhile',
      'consequently', 'therefore', 'thus', 'nevertheless', 'nonetheless',
      'also', 'besides', 'similarly', 'likewise', 'conversely'
    ];

    const lowerContent = content.toLowerCase();
    const usedTransitions = transitions.filter(transition =>
      lowerContent.includes(transition)
    );

    return Math.min(usedTransitions.length / 10, 1); // Normalize to 0-1
  }

  private calculateRhythmScore(content: string): number {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length < 2) return 0.5;

    const lengths = sentences.map(s => s.split(/\s+/).length);
    let rhythmScore = 0;

    // Check for varied rhythm patterns
    for (let i = 1; i < lengths.length; i++) {
      const diff = Math.abs(lengths[i] - lengths[i - 1]);
      rhythmScore += Math.min(diff / 10, 1); // Reward variation
    }

    return Math.min(rhythmScore / (lengths.length - 1), 1);
  }

  private calculateNaturalnessScore(content: string): number {
    let naturalness = 0.5; // Base score

    // Check for natural language markers
    const naturalMarkers = [
      /\b(i think|i believe|in my opinion|personally)\b/gi,
      /\b(you know|you see|well|actually)\b/gi,
      /\b(for example|for instance|such as)\b/gi,
      /\b(by the way|speaking of|that reminds me)\b/gi
    ];

    naturalMarkers.forEach(marker => {
      const matches = content.match(marker);
      if (matches) {
        naturalness += Math.min(matches.length * 0.1, 0.2);
      }
    });

    return Math.min(naturalness, 1);
  }

  // Vocabulary analysis helper methods
  private calculateSyllableComplexity(content: string): number {
    const words = content.toLowerCase().match(/\b\w+\b/g) || [];
    if (words.length === 0) return 0;

    const totalSyllables = words.reduce((sum, word) => {
      return sum + this.countSyllables(word);
    }, 0);

    return totalSyllables / words.length;
  }

  private countSyllables(word: string): number {
    // Simple syllable counting algorithm
    word = word.toLowerCase();
    if (word.length <= 3) return 1;

    word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
    word = word.replace(/^y/, '');
    const matches = word.match(/[aeiouy]{1,2}/g);
    return matches ? matches.length : 1;
  }

  private calculateReadabilityScore(content: string): number {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = content.match(/\b\w+\b/g) || [];

    if (sentences.length === 0 || words.length === 0) return 0;

    const avgWordsPerSentence = words.length / sentences.length;
    const avgSyllablesPerWord = this.calculateSyllableComplexity(content);

    // Simplified Flesch Reading Ease formula
    const readabilityScore = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);

    // Normalize to 0-1 scale
    return Math.max(0, Math.min(1, readabilityScore / 100));
  }

  private determineSophisticationLevel(complexity: number): 'basic' | 'intermediate' | 'advanced' | 'expert' {
    if (complexity < 4) return 'basic';
    if (complexity < 5.5) return 'intermediate';
    if (complexity < 7) return 'advanced';
    return 'expert';
  }

  private countUniqueWords(content: string): number {
    const words = content.toLowerCase().match(/\b\w+\b/g) || [];
    return new Set(words).size;
  }

  private countTotalWords(content: string): number {
    const words = content.match(/\b\w+\b/g) || [];
    return words.length;
  }

  private extractDomainTerms(content: string): string[] {
    // This is a simplified implementation
    // In a real system, this would use domain-specific dictionaries
    const words = content.toLowerCase().match(/\b\w{6,}\b/g) || [];
    const uniqueWords = [...new Set(words)];

    // Return words that might be domain-specific (longer, less common words)
    return uniqueWords.filter(word => word.length > 7).slice(0, 10);
  }

  private calculateTypeTokenRatio(content: string): number {
    const words = content.toLowerCase().match(/\b\w+\b/g) || [];
    if (words.length === 0) return 0;

    const uniqueWords = new Set(words).size;
    return uniqueWords / words.length;
  }

  private calculateMATTR(content: string): number {
    // Moving Average Type-Token Ratio
    const words = content.toLowerCase().match(/\b\w+\b/g) || [];
    if (words.length < 50) return this.calculateTypeTokenRatio(content);

    const windowSize = 50;
    let totalTTR = 0;
    let windowCount = 0;

    for (let i = 0; i <= words.length - windowSize; i += 10) {
      const window = words.slice(i, i + windowSize);
      const uniqueInWindow = new Set(window).size;
      totalTTR += uniqueInWindow / windowSize;
      windowCount++;
    }

    return windowCount > 0 ? totalTTR / windowCount : 0;
  }

  private calculateLexicalDensity(content: string): number {
    const words = content.toLowerCase().match(/\b\w+\b/g) || [];
    if (words.length === 0) return 0;

    const functionWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
      'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those'
    ]);

    const contentWords = words.filter(word => !functionWords.has(word));
    return contentWords.length / words.length;
  }
