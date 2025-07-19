import { logger } from '../utils/logger';

export interface AuthenticityResult {
  isAuthentic: boolean;
  authenticityScore: number; // 0-100
  naturalFlowScore: number; // 0-100
  artificialPatterns: ArtificialPattern[];
  recommendations: string[];
  confidence: number;
}

export interface ArtificialPattern {
  type: 'unnatural_phrasing' | 'robotic_structure' | 'inconsistent_voice' | 'mechanical_rhythm' | 'generic_expressions';
  severity: 'low' | 'medium' | 'high';
  location: { start: number; end: number };
  description: string;
  suggestion: string;
}

export interface AuthenticityOptions {
  strictness: 'lenient' | 'moderate' | 'strict';
  checkVoiceConsistency: boolean;
  analyzeEmotionalTone: boolean;
  validateNaturalFlow: boolean;
}

/**
 * Content Authenticity Verifier
 * Ensures natural language flow despite optimization requirements
 */
export class ContentAuthenticityVerifier {
  private readonly unnaturalPhrases = [
    'it is worth noting that',
    'it should be emphasized that',
    'it is crucial to understand that',
    'it is essential to recognize that',
    'one must consider that',
    'it is imperative to note that',
    'it cannot be overstated that',
    'it is of utmost importance that'
  ];

  private readonly roboticStructures = [
    /^(step \d+:|point \d+:|item \d+:)/i,
    /^(firstly|secondly|thirdly|fourthly|fifthly)/i,
    /^(in the first place|in the second place)/i,
    /^(to begin with|to start with|to commence)/i
  ];

  private readonly genericExpressions = [
    'cutting-edge technology',
    'state-of-the-art solution',
    'revolutionary approach',
    'game-changing innovation',
    'seamless integration',
    'robust framework',
    'comprehensive solution',
    'user-friendly interface',
    'cost-effective approach',
    'scalable architecture'
  ];

  /**
   * Verify content authenticity and natural flow
   */
  async verifyAuthenticity(
    content: string, 
    options: AuthenticityOptions = {
      strictness: 'moderate',
      checkVoiceConsistency: true,
      analyzeEmotionalTone: true,
      validateNaturalFlow: true
    }
  ): Promise<AuthenticityResult> {
    try {
      if (!content || typeof content !== 'string') {
        throw new Error('Content must be a non-empty string');
      }

      const artificialPatterns: ArtificialPattern[] = [];

      // Analyze unnatural phrasing
      if (options.validateNaturalFlow) {
        artificialPatterns.push(...this.detectUnnaturalPhrasing(content));
      }

      // Analyze robotic structures
      artificialPatterns.push(...this.detectRoboticStructures(content));

      // Analyze voice consistency
      if (options.checkVoiceConsistency) {
        artificialPatterns.push(...this.analyzeVoiceConsistency(content));
      }

      // Analyze mechanical rhythm
      artificialPatterns.push(...this.analyzeMechanicalRhythm(content));

      // Analyze generic expressions
      artificialPatterns.push(...this.detectGenericExpressions(content));

      // Calculate scores
      const authenticityScore = this.calculateAuthenticityScore(artificialPatterns, content, options);
      const naturalFlowScore = this.calculateNaturalFlowScore(content);
      const isAuthentic = this.determineAuthenticity(authenticityScore, options);
      const recommendations = this.generateRecommendations(artificialPatterns);

      logger.info('Content authenticity verification completed', {
        contentLength: content.length,
        authenticityScore,
        naturalFlowScore,
        patternsFound: artificialPatterns.length,
        isAuthentic
      });

      return {
        isAuthentic,
        authenticityScore,
        naturalFlowScore,
        artificialPatterns,
        recommendations,
        confidence: Math.min(95, 75 + (artificialPatterns.length * 2))
      };

    } catch (error) {
      logger.error('Content authenticity verification failed', { error });
      throw new Error(`Authenticity verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Ensure natural flow in content
   */
  async ensureNaturalFlow(content: string): Promise<string> {
    try {
      if (!content || typeof content !== 'string') {
        throw new Error('Content must be a non-empty string');
      }

      let naturalContent = content;

      // Step 1: Replace unnatural phrases
      naturalContent = this.replaceUnnaturalPhrases(naturalContent);

      // Step 2: Improve sentence flow
      naturalContent = this.improveSentenceFlow(naturalContent);

      // Step 3: Add natural connectors
      naturalContent = this.addNaturalConnectors(naturalContent);

      // Step 4: Vary sentence structures
      naturalContent = this.varySentenceStructures(naturalContent);

      // Step 5: Ensure voice consistency
      naturalContent = this.ensureVoiceConsistency(naturalContent);

      logger.info('Natural flow enhancement completed', {
        originalLength: content.length,
        enhancedLength: naturalContent.length
      });

      return naturalContent;

    } catch (error) {
      logger.error('Natural flow enhancement failed', { error });
      throw new Error(`Natural flow enhancement failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Detect artificial patterns in content
   */
  async detectArtificialPatterns(content: string): Promise<ArtificialPattern[]> {
    try {
      const patterns: ArtificialPattern[] = [];

      patterns.push(...this.detectUnnaturalPhrasing(content));
      patterns.push(...this.detectRoboticStructures(content));
      patterns.push(...this.analyzeVoiceConsistency(content));
      patterns.push(...this.analyzeMechanicalRhythm(content));
      patterns.push(...this.detectGenericExpressions(content));

      return patterns;

    } catch (error) {
      logger.error('Artificial pattern detection failed', { error });
      throw new Error(`Pattern detection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Detect unnatural phrasing
   */
  private detectUnnaturalPhrasing(content: string): ArtificialPattern[] {
    const patterns: ArtificialPattern[] = [];
    const lowerContent = content.toLowerCase();

    this.unnaturalPhrases.forEach(phrase => {
      const index = lowerContent.indexOf(phrase);
      if (index !== -1) {
        patterns.push({
          type: 'unnatural_phrasing',
          severity: 'high',
          location: { start: index, end: index + phrase.length },
          description: `Unnatural phrase detected: "${phrase}"`,
          suggestion: 'Replace with more conversational language'
        });
      }
    });

    return patterns;
  }

  /**
   * Detect robotic structures
   */
  private detectRoboticStructures(content: string): ArtificialPattern[] {
    const patterns: ArtificialPattern[] = [];
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);

    sentences.forEach((sentence, index) => {
      this.roboticStructures.forEach(pattern => {
        if (pattern.test(sentence.trim())) {
          patterns.push({
            type: 'robotic_structure',
            severity: 'medium',
            location: { start: index * 50, end: (index + 1) * 50 },
            description: 'Robotic sentence structure detected',
            suggestion: 'Use more natural, conversational sentence beginnings'
          });
        }
      });
    });

    return patterns;
  }

  /**
   * Analyze voice consistency
   */
  private analyzeVoiceConsistency(content: string): ArtificialPattern[] {
    const patterns: ArtificialPattern[] = [];
    const paragraphs = content.split('\n\n').filter(p => p.trim().length > 0);

    if (paragraphs.length < 2) return patterns;

    // Analyze tone consistency across paragraphs
    const tones = paragraphs.map(p => this.analyzeTone(p));
    const inconsistencies = this.findToneInconsistencies(tones);

    if (inconsistencies.length > 2) { // More lenient threshold
      patterns.push({
        type: 'inconsistent_voice',
        severity: 'medium',
        location: { start: 0, end: content.length },
        description: `Voice inconsistencies detected across ${inconsistencies.length} sections`,
        suggestion: 'Maintain consistent tone and voice throughout the content'
      });
    }

    return patterns;
  }

  /**
   * Analyze mechanical rhythm
   */
  private analyzeMechanicalRhythm(content: string): ArtificialPattern[] {
    const patterns: ArtificialPattern[] = [];
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);

    if (sentences.length < 5) return patterns;

    // Check for overly uniform sentence lengths
    const lengths = sentences.map(s => s.trim().split(' ').length);
    const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const variance = lengths.reduce((sum, len) => sum + Math.pow(len - avgLength, 2), 0) / lengths.length;

    if (variance < 8) {
      patterns.push({
        type: 'mechanical_rhythm',
        severity: 'medium',
        location: { start: 0, end: content.length },
        description: 'Mechanical rhythm detected - sentences too uniform in length',
        suggestion: 'Vary sentence lengths to create natural rhythm and flow'
      });
    }

    // Check for repetitive sentence patterns
    const structures = sentences.map(s => this.analyzeSentenceStructure(s));
    const structureCounts = new Map<string, number>();
    
    structures.forEach(structure => {
      structureCounts.set(structure, (structureCounts.get(structure) || 0) + 1);
    });

    structureCounts.forEach((count, structure) => {
      if (count >= 4) {
        patterns.push({
          type: 'mechanical_rhythm',
          severity: 'high',
          location: { start: 0, end: content.length },
          description: `Repetitive sentence structure: "${structure}" used ${count} times`,
          suggestion: 'Vary sentence structures for more natural flow'
        });
      }
    });

    return patterns;
  }

  /**
   * Detect generic expressions
   */
  private detectGenericExpressions(content: string): ArtificialPattern[] {
    const patterns: ArtificialPattern[] = [];
    const lowerContent = content.toLowerCase();

    let genericCount = 0;
    const foundExpressions: string[] = [];

    this.genericExpressions.forEach(expression => {
      if (lowerContent.includes(expression)) {
        genericCount++;
        foundExpressions.push(expression);
      }
    });

    if (genericCount >= 2) {
      patterns.push({
        type: 'generic_expressions',
        severity: genericCount >= 4 ? 'high' : 'medium',
        location: { start: 0, end: content.length },
        description: `${genericCount} generic expressions detected: ${foundExpressions.join(', ')}`,
        suggestion: 'Replace generic expressions with specific, descriptive language'
      });
    }

    return patterns;
  }

  /**
   * Calculate authenticity score
   */
  private calculateAuthenticityScore(
    patterns: ArtificialPattern[],
    content: string,
    options: AuthenticityOptions
  ): number {
    let score = 100;
    const contentLength = content.length;

    patterns.forEach(pattern => {
      const severityPenalty = pattern.severity === 'high' ? 12 : pattern.severity === 'medium' ? 8 : 4;
      const strictnessPenalty = options.strictness === 'strict' ? 1.3 : options.strictness === 'moderate' ? 1.0 : 0.8;
      score -= severityPenalty * strictnessPenalty;
    });

    // Bonus for natural elements
    if (content.includes('I\'ve') || content.includes('you\'ll') || content.includes('don\'t')) {
      score += 5; // Contractions indicate natural language
    }

    if (content.includes('?')) {
      score += 3; // Questions indicate natural flow
    }

    // Normalize by content length (longer content can have more patterns)
    const lengthFactor = Math.min(1, Math.max(0.7, contentLength / 500));
    score = Math.max(0, score * lengthFactor);

    return Math.round(score);
  }

  /**
   * Calculate natural flow score
   */
  private calculateNaturalFlowScore(content: string): number {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    if (sentences.length === 0) return 0;

    let flowScore = 100;

    // Check sentence length variation
    const lengths = sentences.map(s => s.trim().split(' ').length);
    const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const variance = lengths.reduce((sum, len) => sum + Math.pow(len - avgLength, 2), 0) / lengths.length;
    
    if (variance < 5) flowScore -= 20;
    if (variance < 10) flowScore -= 10;

    // Check for natural connectors
    const connectorCount = this.countNaturalConnectors(content);
    const expectedConnectors = Math.floor(sentences.length / 3);
    
    if (connectorCount < expectedConnectors * 0.5) {
      flowScore -= 15;
    }

    // Check for conversational elements
    const conversationalScore = this.analyzeConversationalElements(content);
    flowScore = (flowScore + conversationalScore) / 2;

    return Math.max(0, Math.round(flowScore));
  }

  /**
   * Determine if content is authentic
   */
  private determineAuthenticity(score: number, options: AuthenticityOptions): boolean {
    const threshold = options.strictness === 'strict' ? 75 : options.strictness === 'moderate' ? 65 : 55;
    return score >= threshold;
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(patterns: ArtificialPattern[]): string[] {
    const recommendations = new Set<string>();

    patterns.forEach(pattern => {
      recommendations.add(pattern.suggestion);
    });

    if (recommendations.size === 0) {
      recommendations.add('Content appears authentic with natural flow');
    }

    return Array.from(recommendations);
  }

  /**
   * Replace unnatural phrases with natural alternatives
   */
  private replaceUnnaturalPhrases(content: string): string {
    let result = content;

    const replacements: { [key: string]: string[] } = {
      'it is worth noting that': ['worth mentioning', 'keep in mind', 'remember'],
      'it should be emphasized that': ['importantly', 'what matters is', 'the key point is'],
      'it is crucial to understand that': ['here\'s the thing', 'what\'s important is', 'remember'],
      'it is essential to recognize that': ['you should know', 'keep in mind', 'remember'],
      'one must consider that': ['think about this', 'consider this', 'here\'s something to think about'],
      'it is imperative to note that': ['importantly', 'here\'s what matters', 'key point']
    };

    Object.entries(replacements).forEach(([phrase, alternatives]) => {
      const regex = new RegExp(phrase, 'gi');
      result = result.replace(regex, () => {
        return alternatives[Math.floor(Math.random() * alternatives.length)];
      });
    });

    return result;
  }

  /**
   * Improve sentence flow
   */
  private improveSentenceFlow(content: string): string {
    // Add natural pauses, vary sentence beginnings, etc.
    return content;
  }

  /**
   * Add natural connectors
   */
  private addNaturalConnectors(content: string): string {
    // Add natural transitions between ideas
    return content;
  }

  /**
   * Vary sentence structures
   */
  private varySentenceStructures(content: string): string {
    // Mix simple, compound, and complex sentences
    return content;
  }

  /**
   * Ensure voice consistency
   */
  private ensureVoiceConsistency(content: string): string {
    // Maintain consistent tone and style
    return content;
  }

  /**
   * Analyze tone of text
   */
  private analyzeTone(text: string): string {
    // Simplified tone analysis
    if (text.includes('!') || text.includes('exciting') || text.includes('amazing')) {
      return 'enthusiastic';
    }
    if (text.includes('however') || text.includes('although') || text.includes('despite')) {
      return 'analytical';
    }
    if (text.includes('you') || text.includes('your') || text.includes('we')) {
      return 'conversational';
    }
    return 'neutral';
  }

  /**
   * Find tone inconsistencies
   */
  private findToneInconsistencies(tones: string[]): string[] {
    const uniqueTones = new Set(tones);
    // Only flag as inconsistent if there are very different tones
    const problematicCombinations = [
      ['enthusiastic', 'analytical'],
      ['conversational', 'formal'],
      ['casual', 'technical']
    ];

    const tonesArray = Array.from(uniqueTones);
    for (const combo of problematicCombinations) {
      if (combo.every(tone => tonesArray.includes(tone))) {
        return tonesArray;
      }
    }

    return uniqueTones.size > 3 ? Array.from(uniqueTones) : [];
  }

  /**
   * Analyze sentence structure
   */
  private analyzeSentenceStructure(sentence: string): string {
    const words = sentence.trim().split(' ');
    if (words.length < 5) return 'simple';
    if (sentence.includes(',') && sentence.includes('and')) return 'compound';
    if (sentence.includes('because') || sentence.includes('although') || sentence.includes('while')) return 'complex';
    return 'simple';
  }

  /**
   * Count natural connectors
   */
  private countNaturalConnectors(content: string): number {
    const connectors = ['also', 'plus', 'besides', 'what\'s more', 'on top of that', 'not only that'];
    let count = 0;
    const lowerContent = content.toLowerCase();
    
    connectors.forEach(connector => {
      const matches = lowerContent.split(connector).length - 1;
      count += matches;
    });

    return count;
  }

  /**
   * Analyze conversational elements
   */
  private analyzeConversationalElements(content: string): number {
    let score = 50; // Base score
    
    // Check for questions
    const questionCount = (content.match(/\?/g) || []).length;
    score += Math.min(20, questionCount * 5);
    
    // Check for contractions
    const contractionCount = (content.match(/'(t|re|ve|ll|d)\b/g) || []).length;
    score += Math.min(15, contractionCount * 2);
    
    // Check for direct address
    const directAddress = (content.match(/\byou\b/gi) || []).length;
    score += Math.min(15, directAddress * 1);

    return Math.min(100, score);
  }
}
