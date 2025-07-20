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
import { injectNaturalSpeechPattern } from './conversational/natural-speech-pattern-injection';
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

  // Human element extraction methods
  private extractPersonalInsights(content: string): any[] {
    const insights: any[] = [];
    const personalMarkers = [
      /\b(i think|i believe|in my opinion|personally|from my experience)\b/gi,
      /\b(i've found|i've noticed|i've learned|i've discovered)\b/gi,
      /\b(what i've seen|what i know|what i understand)\b/gi
    ];

    personalMarkers.forEach(marker => {
      const matches = content.match(marker);
      if (matches) {
        matches.forEach(match => {
          insights.push({
            content: match,
            position: content.indexOf(match),
            authenticity: 0.8,
            type: 'observation'
          });
        });
      }
    });

    return insights;
  }

  private extractOpinions(content: string): any[] {
    const opinions: any[] = [];
    const opinionMarkers = [
      /\b(i disagree|i agree|i support|i oppose)\b/gi,
      /\b(in my view|my take is|i feel that|i suspect)\b/gi,
      /\b(seems to me|appears that|looks like)\b/gi
    ];

    opinionMarkers.forEach(marker => {
      const matches = content.match(marker);
      if (matches) {
        matches.forEach(match => {
          opinions.push({
            statement: match,
            strength: 'moderate',
            position: content.indexOf(match),
            supportingEvidence: []
          });
        });
      }
    });

    return opinions;
  }

  private extractExperiences(content: string): any[] {
    const experiences: any[] = [];
    const experienceMarkers = [
      /\b(when i|i remember|i once|i used to)\b/gi,
      /\b(last year|yesterday|recently|a while ago)\b/gi,
      /\b(i worked|i studied|i lived|i traveled)\b/gi
    ];

    experienceMarkers.forEach(marker => {
      const matches = content.match(marker);
      if (matches) {
        matches.forEach(match => {
          experiences.push({
            narrative: match,
            relevance: 0.7,
            authenticity: 0.9,
            emotionalResonance: 0.6
          });
        });
      }
    });

    return experiences;
  }

  private extractSubjectiveCommentary(content: string): any[] {
    const commentary: any[] = [];
    const subjectiveMarkers = [
      /\b(obviously|clearly|definitely|certainly)\b/gi,
      /\b(probably|likely|possibly|maybe)\b/gi,
      /\b(surprisingly|interestingly|unfortunately|fortunately)\b/gi
    ];

    subjectiveMarkers.forEach(marker => {
      const matches = content.match(marker);
      if (matches) {
        matches.forEach(match => {
          commentary.push({
            comment: match,
            subjectivity: 0.8,
            position: content.indexOf(match),
            impact: 0.6
          });
        });
      }
    });

    return commentary;
  }

  private analyzeAuthenticVoice(content: string): any {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    let personalityScore = 0;
    const personalityTraits: string[] = [];

    // Analyze for personality markers
    if (content.match(/\b(honestly|frankly|to be honest)\b/gi)) {
      personalityTraits.push('direct');
      personalityScore += 0.2;
    }

    if (content.match(/\b(you know|i mean|like|actually)\b/gi)) {
      personalityTraits.push('conversational');
      personalityScore += 0.2;
    }

    if (content.match(/\b(amazing|incredible|fantastic|terrible)\b/gi)) {
      personalityTraits.push('expressive');
      personalityScore += 0.2;
    }

    return {
      tone: personalityScore > 0.4 ? 'personal' : 'neutral',
      personality: personalityTraits,
      consistency: Math.min(personalityScore + 0.3, 1),
      authenticity: Math.min(personalityScore + 0.4, 1)
    };
  }

  // Humanization transformation methods
  private addSentenceVariation(content: string): string {
    const sentences = content.split(/([.!?]+)/).filter(s => s.trim().length > 0);
    let result = '';

    for (let i = 0; i < sentences.length; i += 2) {
      let sentence = sentences[i];
      const punctuation = sentences[i + 1] || '.';

      // Vary sentence beginnings
      sentence = this.varyBeginnings(sentence);

      // Add occasional sentence combining
      if (i < sentences.length - 2 && Math.random() < 0.3) {
        const nextSentence = sentences[i + 2];
        if (nextSentence && nextSentence.length < 50) {
          sentence = sentence + ', and ' + nextSentence.toLowerCase();
          i += 2; // Skip the next sentence since we combined it
        }
      }

      result += sentence + punctuation + ' ';
    }

    return result.trim();
  }

  private varyBeginnings(sentence: string): string {
    const trimmed = sentence.trim();

    // Replace common AI beginnings
    const replacements = [
      { pattern: /^furthermore,/i, replacement: 'Also,' },
      { pattern: /^moreover,/i, replacement: 'Plus,' },
      { pattern: /^in addition,/i, replacement: 'And,' },
      { pattern: /^however,/i, replacement: 'But,' },
      { pattern: /^therefore,/i, replacement: 'So,' }
    ];

    for (const { pattern, replacement } of replacements) {
      if (pattern.test(trimmed)) {
        return trimmed.replace(pattern, replacement);
      }
    }

    return trimmed;
  }

  private insertPersonalTouches(content: string): string {
    const personalTouches = [
      'I think ',
      'In my experience, ',
      'What I\'ve found is that ',
      'Personally, ',
      'From what I\'ve seen, '
    ];

    const sentences = content.split(/([.!?]+)/).filter(s => s.trim().length > 0);
    let result = '';

    for (let i = 0; i < sentences.length; i += 2) {
      let sentence = sentences[i].trim();
      const punctuation = sentences[i + 1] || '.';

      // Add personal touch to some sentences (30% chance)
      if (Math.random() < 0.3 && !sentence.toLowerCase().startsWith('i ')) {
        const touch = personalTouches[Math.floor(Math.random() * personalTouches.length)];
        sentence = touch + sentence.toLowerCase();
      }

      result += sentence + punctuation + ' ';
    }

    return result.trim();
  }

  private addNaturalTransitions(content: string): string {
    const naturalTransitions = [
      'You know what?',
      'Here\'s the thing:',
      'Actually,',
      'By the way,',
      'Speaking of which,',
      'That reminds me,',
      'Funny thing is,'
    ];

    const sentences = content.split(/([.!?]+)/).filter(s => s.trim().length > 0);
    let result = '';

    for (let i = 0; i < sentences.length; i += 2) {
      let sentence = sentences[i].trim();
      const punctuation = sentences[i + 1] || '.';

      // Add natural transition occasionally (20% chance)
      if (Math.random() < 0.2 && i > 0) {
        const transition = naturalTransitions[Math.floor(Math.random() * naturalTransitions.length)];
        sentence = transition + ' ' + sentence.toLowerCase();
      }

      result += sentence + punctuation + ' ';
    }

    return result.trim();
  }

  private includeHumanQuirks(content: string): string {
    let result = content;

    // Add occasional parenthetical thoughts
    const sentences = result.split(/([.!?]+)/).filter(s => s.trim().length > 0);
    for (let i = 0; i < sentences.length; i += 2) {
      if (Math.random() < 0.15) { // 15% chance
        const quirks = [
          ' (at least in my opinion)',
          ' (though I could be wrong)',
          ' (if that makes sense)',
          ' (you get the idea)',
          ' (or something like that)'
        ];
        const quirk = quirks[Math.floor(Math.random() * quirks.length)];
        sentences[i] += quirk;
      }
    }

    result = sentences.join('');

    // Add occasional contractions
    result = result.replace(/\bdo not\b/g, 'don\'t');
    result = result.replace(/\bcannot\b/g, 'can\'t');
    result = result.replace(/\bwill not\b/g, 'won\'t');
    result = result.replace(/\bit is\b/g, 'it\'s');
    result = result.replace(/\bthat is\b/g, 'that\'s');

    return result;
  }

  private enhanceVocabulary(content: string): string {
    // Replace overly formal words with more natural alternatives
    const replacements = [
      { formal: /\butilize\b/gi, casual: 'use' },
      { formal: /\bfacilitate\b/gi, casual: 'help' },
      { formal: /\bdemonstrate\b/gi, casual: 'show' },
      { formal: /\bimplement\b/gi, casual: 'put in place' },
      { formal: /\boptimize\b/gi, casual: 'improve' },
      { formal: /\bleverage\b/gi, casual: 'use' },
      { formal: /\bsynergy\b/gi, casual: 'teamwork' },
      { formal: /\bparadigm shift\b/gi, casual: 'big change' }
    ];

    let result = content;
    replacements.forEach(({ formal, casual }) => {
      result = result.replace(formal, casual);
    });

    return result;
  }

  private breakPredictablePatterns(content: string): string {
    let result = content;

    // Break up predictable conclusion patterns
    result = result.replace(/\bin conclusion,/gi, 'So,');
    result = result.replace(/\bto summarize,/gi, 'Bottom line:');
    result = result.replace(/\bin summary,/gi, 'Here\'s what it comes down to:');

    // Break up predictable transition patterns
    result = result.replace(/\bfurthermore,/gi, 'Also,');
    result = result.replace(/\bmoreover,/gi, 'Plus,');
    result = result.replace(/\badditionally,/gi, 'And');

    return result;
  }

  // Analysis and metrics methods
  private calculateMetrics(originalContent: string, humanizedContent: string, aiPatterns: any): any {
    const originalRisk = aiPatterns.overallRiskScore;
    const humanizedAnalysis = this.aiPatternDetector.analyze(humanizedContent);
    const finalRisk = humanizedAnalysis.overallRiskScore;

    const improvement = Math.max(0, originalRisk - finalRisk);
    const humanizationScore = Math.min(0.5 + improvement, 1);

    return {
      humanizationScore: Math.round(humanizationScore * 100) / 100,
      authenticityScore: Math.min(0.6 + improvement * 0.5, 1),
      naturalness: Math.min(0.7 + improvement * 0.3, 1),
      aiDetectionRisk: Math.round(finalRisk * 100) / 100
    };
  }

  private generateRecommendations(aiPatterns: any, sentenceStructure: any, vocabulary: any): string[] {
    const recommendations: string[] = [];

    if (aiPatterns.overallRiskScore > 0.6) {
      recommendations.push('Reduce AI-typical phrases and patterns');
    }

    if (aiPatterns.repetitivePhrases.length > 0) {
      recommendations.push('Vary your language to avoid repetitive phrases');
    }

    if (sentenceStructure.predictabilityScore > 0.7) {
      recommendations.push('Add more variety to sentence structures and beginnings');
    }

    if (vocabulary.complexity.sophisticationLevel === 'basic') {
      recommendations.push('Consider using more sophisticated vocabulary where appropriate');
    }

    if (aiPatterns.predictableWritingPatterns.length > 0) {
      recommendations.push('Replace predictable transitions and conclusions with more natural alternatives');
    }

    recommendations.push('Add personal anecdotes and specific examples');
    recommendations.push('Include conversational elements and natural speech patterns');

    return recommendations;
  }

  private analyzeImperfections(content: string): NaturalImperfections {
    return {
      inconsistencies: this.findInconsistencies(content),
      styleVariations: this.findStyleVariations(content),
      humanQuirks: this.findHumanQuirks(content),
      hesitationMarkers: this.findHesitationMarkers(content),
      flowInterruptions: this.findFlowInterruptions(content)
    };
  }

  private analyzeConversationalElements(content: string): ConversationalElements {
    return {
      speechPatterns: this.findSpeechPatterns(content),
      colloquialisms: this.findColloquialisms(content),
      informalExpressions: this.findInformalExpressions(content),
      transitions: this.findConversationalTransitions(content),
      dialogueElements: this.findDialogueElements(content)
    };
  }

  private analyzePatternBreaking(content: string): PatternBreaking {
    return {
      structureRandomization: this.analyzeStructureRandomization(content),
      predictabilityElimination: this.analyzePredictabilityElimination(content),
      styleVariation: this.analyzeStyleVariation(content),
      diversityEnhancement: this.analyzeDiversityEnhancement(content),
      authenticityValidation: this.analyzeAuthenticityValidation(content)
    };
  }

  // Helper methods for analysis components
  private findInconsistencies(content: string): any[] {
    // Simple implementation - look for spelling variations
    const inconsistencies: any[] = [];
    const words = content.toLowerCase().match(/\b\w+\b/g) || [];
    const wordCounts = new Map<string, number>();

    words.forEach(word => {
      wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
    });

    // Look for potential spelling variations
    const variations = [
      ['color', 'colour'], ['realize', 'realise'], ['organize', 'organise']
    ];

    variations.forEach(([us, uk]) => {
      if (wordCounts.has(us) && wordCounts.has(uk)) {
        inconsistencies.push({
          type: 'spelling',
          original: us,
          position: content.indexOf(us),
          severity: 'subtle'
        });
      }
    });

    return inconsistencies;
  }

  private findStyleVariations(content: string): any[] {
    const variations: any[] = [];

    // Check for formality variations
    const formalWords = content.match(/\b(utilize|facilitate|demonstrate)\b/gi) || [];
    const casualWords = content.match(/\b(use|help|show)\b/gi) || [];

    if (formalWords.length > 0 && casualWords.length > 0) {
      variations.push({
        aspect: 'formality',
        variation: 'Mixed formal and casual language',
        naturalness: 0.8
      });
    }

    return variations;
  }

  private findHumanQuirks(content: string): any[] {
    const quirks: any[] = [];

    // Look for parenthetical thoughts
    const parentheticals = content.match(/\([^)]+\)/g) || [];
    parentheticals.forEach(p => {
      quirks.push({
        type: 'parenthetical',
        manifestation: p,
        frequency: 1
      });
    });

    return quirks;
  }

  private findHesitationMarkers(content: string): any[] {
    const markers: any[] = [];
    const hesitationWords = ['um', 'uh', 'well', 'you know', 'i mean'];

    hesitationWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      const matches = content.match(regex) || [];
      matches.forEach(match => {
        markers.push({
          marker: match,
          position: content.indexOf(match),
          naturalness: 0.9
        });
      });
    });

    return markers;
  }

  private findFlowInterruptions(content: string): any[] {
    const interruptions: any[] = [];

    // Look for em dashes and parenthetical asides
    const dashes = content.match(/—[^—]+—/g) || [];
    dashes.forEach(dash => {
      interruptions.push({
        type: 'aside',
        content: dash,
        position: content.indexOf(dash),
        effectiveness: 0.8
      });
    });

    return interruptions;
  }

  // Additional helper methods for conversational and pattern breaking analysis
  private findSpeechPatterns(content: string): any[] {
    const patterns: any[] = [];
    const speechMarkers = ['you know', 'i mean', 'like', 'actually', 'basically'];

    speechMarkers.forEach(marker => {
      const count = (content.toLowerCase().match(new RegExp(`\\b${marker}\\b`, 'g')) || []).length;
      if (count > 0) {
        patterns.push({
          pattern: marker,
          naturalness: 0.9,
          frequency: count,
          context: 'conversational'
        });
      }
    });

    return patterns;
  }

  private findColloquialisms(content: string): any[] {
    const colloquialisms: any[] = [];
    const expressions = [
      { expression: "can't", meaning: "cannot", appropriateness: 0.9 },
      { expression: "won't", meaning: "will not", appropriateness: 0.9 },
      { expression: "it's", meaning: "it is", appropriateness: 0.9 }
    ];

    expressions.forEach(expr => {
      if (content.includes(expr.expression)) {
        colloquialisms.push(expr);
      }
    });

    return colloquialisms;
  }

  private findInformalExpressions(content: string): any[] {
    const expressions: any[] = [];
    const informal = [
      { expression: "gonna", formalEquivalent: "going to", casualness: 0.8 },
      { expression: "wanna", formalEquivalent: "want to", casualness: 0.8 }
    ];

    informal.forEach(expr => {
      if (content.toLowerCase().includes(expr.expression)) {
        expressions.push(expr);
      }
    });

    return expressions;
  }

  private findConversationalTransitions(content: string): any[] {
    const transitions: any[] = [];
    const conversationalTransitions = [
      "by the way", "speaking of which", "that reminds me", "you know what"
    ];

    conversationalTransitions.forEach(transition => {
      if (content.toLowerCase().includes(transition)) {
        transitions.push({
          phrase: transition,
          function: 'topic shift',
          naturalness: 0.9
        });
      }
    });

    return transitions;
  }

  private findDialogueElements(content: string): any[] {
    const elements: any[] = [];

    // Look for questions
    const questions = content.match(/[^.!?]*\?/g) || [];
    questions.forEach(q => {
      elements.push({
        element: q.trim(),
        type: 'question',
        engagement: 0.8
      });
    });

    return elements;
  }

  // Pattern breaking analysis methods
  private analyzeStructureRandomization(content: string): any {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const lengths = sentences.map(s => s.split(/\s+/).length);
    const variance = this.calculateVariance(lengths, lengths.reduce((a, b) => a + b, 0) / lengths.length);

    return {
      sentenceStructures: ['varied'],
      randomizationScore: Math.min(variance / 20, 1),
      effectiveness: Math.min(variance / 15, 1)
    };
  }

  private analyzePredictabilityElimination(content: string): any {
    const predictablePatterns = ['furthermore', 'moreover', 'in conclusion', 'to summarize'];
    const eliminatedPatterns: string[] = [];

    predictablePatterns.forEach(pattern => {
      if (!content.toLowerCase().includes(pattern)) {
        eliminatedPatterns.push(pattern);
      }
    });

    return {
      eliminatedPatterns,
      replacements: {},
      improvementScore: eliminatedPatterns.length / predictablePatterns.length
    };
  }

  private analyzeStyleVariation(content: string): any {
    return {
      variations: [
        {
          aspect: 'formality',
          options: ['formal', 'casual'],
          selected: 'mixed',
          reasoning: 'Natural variation in formality'
        }
      ],
      consistency: 0.7,
      naturalness: 0.8
    };
  }

  private analyzeDiversityEnhancement(content: string): any {
    return {
      enhancements: [
        {
          type: 'vocabulary',
          description: 'Varied word choice',
          implementation: 'Synonym replacement',
          effectiveness: 0.8
        }
      ],
      diversityScore: 0.8,
      impact: 0.7
    };
  }

  private analyzeAuthenticityValidation(content: string): any {
    const personalMarkers = (content.match(/\b(i|my|me|personally)\b/gi) || []).length;
    const totalWords = (content.match(/\b\w+\b/g) || []).length;
    const personalityRatio = personalMarkers / totalWords;

    return {
      score: Math.min(0.5 + personalityRatio * 2, 1),
      factors: [
        {
          factor: 'Personal pronouns',
          score: personalityRatio,
          weight: 0.3,
          description: 'Use of first-person perspective'
        }
      ],
      recommendations: ['Add more personal anecdotes'],
      confidence: 0.8
    };
  }

  // Missing helper methods for vocabulary analysis
  private analyzeSynonymVariation(content: string): any[] {
    // Simple implementation - could be enhanced with actual synonym detection
    return [
      {
        word: 'good',
        synonyms: ['excellent', 'great', 'wonderful'],
        usageFrequency: { 'good': 3, 'great': 1 },
        variationScore: 0.6
      }
    ];
  }

  private generateEnhancementSuggestions(content: string): any[] {
    const suggestions: any[] = [];

    // Look for overused words
    const words = content.toLowerCase().match(/\b\w+\b/g) || [];
    const wordCounts = new Map<string, number>();

    words.forEach(word => {
      if (word.length > 3) { // Only consider longer words
        wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
      }
    });

    for (const [word, count] of wordCounts.entries()) {
      if (count > 3) { // Word appears more than 3 times
        suggestions.push({
          type: 'synonym',
          original: word,
          suggested: ['alternative', 'replacement'],
          reason: `Word "${word}" appears ${count} times - consider variation`
        });
      }
    }

    return suggestions.slice(0, 5); // Limit to 5 suggestions
  }

  private suggestWordReplacements(content: string): any[] {
    const replacements: any[] = [];
    const formalWords = [
      { word: 'utilize', replacement: 'use', improvement: 'More natural language' },
      { word: 'facilitate', replacement: 'help', improvement: 'Clearer communication' }
    ];

    formalWords.forEach(({ word, replacement, improvement }) => {
      const position = content.toLowerCase().indexOf(word);
      if (position !== -1) {
        replacements.push({
          position,
          original: word,
          replacement,
          improvement
        });
      }
    });

    return replacements;
  }

  private identifyAdditionOpportunities(content: string): string[] {
    const opportunities: string[] = [];

    // Check for missing personal elements
    if (!content.match(/\b(i think|in my opinion|personally)\b/gi)) {
      opportunities.push('Add personal opinions or perspectives');
    }

    if (!content.match(/\b(for example|such as|like)\b/gi)) {
      opportunities.push('Include specific examples');
    }

    if (!content.match(/\?/)) {
      opportunities.push('Add rhetorical questions for engagement');
    }

    return opportunities;
  }

  // Missing helper method
  private isImperative(sentence: string): boolean {
    const imperativeStarters = ['do', 'don\'t', 'please', 'try', 'make', 'take', 'use', 'consider'];
    const firstWord = sentence.trim().split(/\s+/)[0]?.toLowerCase();
    return imperativeStarters.includes(firstWord || '');
  }

  // Missing analysis methods
  private analyzeTransitions(content: string): number {
    const transitions = ['however', 'therefore', 'meanwhile', 'furthermore', 'moreover'];
    const transitionCount = transitions.reduce((count, transition) => {
      return count + (content.toLowerCase().match(new RegExp(`\\b${transition}\\b`, 'g')) || []).length;
    }, 0);

    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    return Math.min(transitionCount / sentences.length, 1);
  }

  private analyzeCoherence(content: string): number {
    // Simple coherence analysis based on topic consistency
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length < 2) return 1;

    // This is a simplified implementation
    // In a real system, this would use more sophisticated NLP
    return 0.8; // Default coherence score
  }

  private analyzeLogicalProgression(content: string): number {
    const progressionMarkers = ['first', 'second', 'then', 'next', 'finally', 'lastly'];
    const markerCount = progressionMarkers.reduce((count, marker) => {
      return count + (content.toLowerCase().match(new RegExp(`\\b${marker}\\b`, 'g')) || []).length;
    }, 0);

    return Math.min(markerCount / 3, 1); // Normalize to 0-1
  }

  /**
   * Calculates variance for a set of numbers
   */
  private calculateVariance(values: number[], mean: number): number {
    if (values.length === 0) return 0;

    const squaredDifferences = values.map(value => Math.pow(value - mean, 2));
    return squaredDifferences.reduce((sum, diff) => sum + diff, 0) / values.length;
  }
}
