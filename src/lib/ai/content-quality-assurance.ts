/**
 * Content Quality Assurance System
 * Ensures perfect grammar, syntax, and professional writing standards
 */

import { z } from 'zod';

export interface QualityCheckResult {
  overallScore: number; // 0-100
  grammarScore: number;
  syntaxScore: number;
  readabilityScore: number;
  coherenceScore: number;
  styleScore: number;
  professionalismScore: number;
  issues: QualityIssue[];
  suggestions: QualitySuggestion[];
  passesQualityGate: boolean;
}

export interface QualityIssue {
  type: 'grammar' | 'syntax' | 'readability' | 'coherence' | 'style' | 'professionalism';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  position: {
    start: number;
    end: number;
    line?: number;
    column?: number;
  };
  suggestion?: string;
  context: string;
}

export interface QualitySuggestion {
  type: 'improvement' | 'enhancement' | 'optimization';
  category: string;
  suggestion: string;
  impact: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
}

export interface QualityStandards {
  minOverallScore: number;
  minGrammarScore: number;
  minReadabilityScore: number;
  maxSentenceLength: number;
  minSentenceVariation: number;
  requiredElements: string[];
  forbiddenPatterns: string[];
  styleGuidelines: {
    tone: string;
    voice: string;
    perspective: string;
    formality: string;
  };
}

export interface ContentAnalysis {
  wordCount: number;
  sentenceCount: number;
  paragraphCount: number;
  averageSentenceLength: number;
  sentenceLengthVariation: number;
  readabilityGrade: number;
  passiveVoicePercentage: number;
  transitionWords: number;
  complexWords: number;
  uniqueWords: number;
}

const DEFAULT_QUALITY_STANDARDS: QualityStandards = {
  minOverallScore: 85,
  minGrammarScore: 95,
  minReadabilityScore: 70,
  maxSentenceLength: 25,
  minSentenceVariation: 0.3,
  requiredElements: ['introduction', 'conclusion', 'headings', 'examples'],
  forbiddenPatterns: [
    'very unique',
    'more perfect',
    'most unique',
    'irregardless',
    'could care less',
    'for all intensive purposes'
  ],
  styleGuidelines: {
    tone: 'professional',
    voice: 'active',
    perspective: 'second-person',
    formality: 'business-casual'
  }
};

export class ContentQualityAssurance {
  private standards: QualityStandards;
  private grammarRules: Map<string, RegExp>;
  private stylePatterns: Map<string, RegExp>;

  constructor(standards: Partial<QualityStandards> = {}) {
    this.standards = { ...DEFAULT_QUALITY_STANDARDS, ...standards };
    this.grammarRules = this.initializeGrammarRules();
    this.stylePatterns = this.initializeStylePatterns();
  }

  /**
   * Perform comprehensive quality check
   */
  async checkQuality(content: string): Promise<QualityCheckResult> {
    const analysis = this.analyzeContent(content);
    const issues: QualityIssue[] = [];
    const suggestions: QualitySuggestion[] = [];

    // Grammar and syntax checks
    const grammarIssues = this.checkGrammar(content);
    const syntaxIssues = this.checkSyntax(content);
    issues.push(...grammarIssues, ...syntaxIssues);

    // Readability checks
    const readabilityIssues = this.checkReadability(content, analysis);
    issues.push(...readabilityIssues);

    // Coherence checks
    const coherenceIssues = this.checkCoherence(content);
    issues.push(...coherenceIssues);

    // Style checks
    const styleIssues = this.checkStyle(content);
    issues.push(...styleIssues);

    // Professionalism checks
    const professionalismIssues = this.checkProfessionalism(content);
    issues.push(...professionalismIssues);

    // Generate suggestions
    suggestions.push(...this.generateSuggestions(content, analysis, issues));

    // Calculate scores
    const scores = this.calculateScores(issues, analysis);

    return {
      ...scores,
      issues,
      suggestions,
      passesQualityGate: scores.overallScore >= this.standards.minOverallScore,
    };
  }

  /**
   * Analyze content structure and metrics
   */
  private analyzeContent(content: string): ContentAnalysis {
    const sentences = this.extractSentences(content);
    const paragraphs = this.extractParagraphs(content);
    const words = this.extractWords(content);

    const sentenceLengths = sentences.map(s => this.extractWords(s).length);
    const averageSentenceLength = sentenceLengths.reduce((sum, len) => sum + len, 0) / sentences.length;
    
    // Calculate sentence length variation (coefficient of variation)
    const variance = sentenceLengths.reduce((sum, len) => sum + Math.pow(len - averageSentenceLength, 2), 0) / sentences.length;
    const sentenceLengthVariation = Math.sqrt(variance) / averageSentenceLength;

    const passiveVoiceCount = this.countPassiveVoice(content);
    const transitionWordCount = this.countTransitionWords(content);
    const complexWordCount = this.countComplexWords(words);
    const uniqueWordCount = new Set(words.map(w => w.toLowerCase())).size;

    return {
      wordCount: words.length,
      sentenceCount: sentences.length,
      paragraphCount: paragraphs.length,
      averageSentenceLength,
      sentenceLengthVariation,
      readabilityGrade: this.calculateReadabilityGrade(words.length, sentences.length, complexWordCount),
      passiveVoicePercentage: (passiveVoiceCount / sentences.length) * 100,
      transitionWords: transitionWordCount,
      complexWords: complexWordCount,
      uniqueWords: uniqueWordCount,
    };
  }

  /**
   * Check grammar issues
   */
  private checkGrammar(content: string): QualityIssue[] {
    const issues: QualityIssue[] = [];

    this.grammarRules.forEach((pattern, ruleName) => {
      const matches = Array.from(content.matchAll(pattern));
      matches.forEach(match => {
        if (match.index !== undefined) {
          issues.push({
            type: 'grammar',
            severity: 'medium',
            message: `Grammar issue: ${ruleName}`,
            position: {
              start: match.index,
              end: match.index + match[0].length,
            },
            context: this.getContext(content, match.index, match[0].length),
            suggestion: this.getGrammarSuggestion(ruleName, match[0]),
          });
        }
      });
    });

    return issues;
  }

  /**
   * Check syntax issues
   */
  private checkSyntax(content: string): QualityIssue[] {
    const issues: QualityIssue[] = [];

    // Check for common syntax errors
    const syntaxPatterns = [
      { pattern: /\b(it's|its)\b/g, rule: 'possessive-vs-contraction' },
      { pattern: /\b(your|you're)\b/g, rule: 'possessive-vs-contraction' },
      { pattern: /\b(their|there|they're)\b/g, rule: 'homophones' },
      { pattern: /\b(affect|effect)\b/g, rule: 'affect-vs-effect' },
      { pattern: /\.\s*[a-z]/g, rule: 'sentence-capitalization' },
    ];

    syntaxPatterns.forEach(({ pattern, rule }) => {
      const matches = Array.from(content.matchAll(pattern));
      matches.forEach(match => {
        if (match.index !== undefined && this.isSyntaxError(match[0], rule)) {
          issues.push({
            type: 'syntax',
            severity: 'medium',
            message: `Syntax issue: ${rule}`,
            position: {
              start: match.index,
              end: match.index + match[0].length,
            },
            context: this.getContext(content, match.index, match[0].length),
            suggestion: this.getSyntaxSuggestion(rule, match[0]),
          });
        }
      });
    });

    return issues;
  }

  /**
   * Check readability issues
   */
  private checkReadability(content: string, analysis: ContentAnalysis): QualityIssue[] {
    const issues: QualityIssue[] = [];

    // Check sentence length
    if (analysis.averageSentenceLength > this.standards.maxSentenceLength) {
      issues.push({
        type: 'readability',
        severity: 'medium',
        message: `Average sentence length (${analysis.averageSentenceLength.toFixed(1)}) exceeds recommended maximum (${this.standards.maxSentenceLength})`,
        position: { start: 0, end: content.length },
        context: 'Overall content',
        suggestion: 'Break down long sentences into shorter, more digestible ones',
      });
    }

    // Check sentence variation
    if (analysis.sentenceLengthVariation < this.standards.minSentenceVariation) {
      issues.push({
        type: 'readability',
        severity: 'low',
        message: 'Sentence length variation is too low, making content monotonous',
        position: { start: 0, end: content.length },
        context: 'Overall content',
        suggestion: 'Vary sentence lengths to create better reading rhythm',
      });
    }

    // Check passive voice usage
    if (analysis.passiveVoicePercentage > 20) {
      issues.push({
        type: 'readability',
        severity: 'medium',
        message: `Passive voice usage (${analysis.passiveVoicePercentage.toFixed(1)}%) is too high`,
        position: { start: 0, end: content.length },
        context: 'Overall content',
        suggestion: 'Convert passive voice sentences to active voice for better clarity',
      });
    }

    return issues;
  }

  /**
   * Check coherence issues
   */
  private checkCoherence(content: string): QualityIssue[] {
    const issues: QualityIssue[] = [];
    const paragraphs = this.extractParagraphs(content);

    // Check for transition words
    const transitionWordCount = this.countTransitionWords(content);
    const expectedTransitions = Math.floor(paragraphs.length * 0.7);
    
    if (transitionWordCount < expectedTransitions) {
      issues.push({
        type: 'coherence',
        severity: 'medium',
        message: 'Insufficient transition words for smooth content flow',
        position: { start: 0, end: content.length },
        context: 'Overall content',
        suggestion: 'Add transition words and phrases to improve content flow',
      });
    }

    // Check paragraph structure
    paragraphs.forEach((paragraph, index) => {
      const sentences = this.extractSentences(paragraph);
      if (sentences.length === 1 && paragraph.length > 200) {
        const paragraphStart = content.indexOf(paragraph);
        issues.push({
          type: 'coherence',
          severity: 'low',
          message: 'Long paragraph with single sentence affects readability',
          position: { start: paragraphStart, end: paragraphStart + paragraph.length },
          context: `Paragraph ${index + 1}`,
          suggestion: 'Break long single-sentence paragraphs into multiple sentences',
        });
      }
    });

    return issues;
  }

  /**
   * Check style issues
   */
  private checkStyle(content: string): QualityIssue[] {
    const issues: QualityIssue[] = [];

    this.stylePatterns.forEach((pattern, styleName) => {
      const matches = Array.from(content.matchAll(pattern));
      matches.forEach(match => {
        if (match.index !== undefined) {
          issues.push({
            type: 'style',
            severity: 'low',
            message: `Style issue: ${styleName}`,
            position: {
              start: match.index,
              end: match.index + match[0].length,
            },
            context: this.getContext(content, match.index, match[0].length),
            suggestion: this.getStyleSuggestion(styleName, match[0]),
          });
        }
      });
    });

    return issues;
  }

  /**
   * Check professionalism issues
   */
  private checkProfessionalism(content: string): QualityIssue[] {
    const issues: QualityIssue[] = [];

    // Check for forbidden patterns
    this.standards.forbiddenPatterns.forEach(pattern => {
      const regex = new RegExp(pattern, 'gi');
      const matches = Array.from(content.matchAll(regex));
      matches.forEach(match => {
        if (match.index !== undefined) {
          issues.push({
            type: 'professionalism',
            severity: 'high',
            message: `Unprofessional phrase: "${match[0]}"`,
            position: {
              start: match.index,
              end: match.index + match[0].length,
            },
            context: this.getContext(content, match.index, match[0].length),
            suggestion: this.getProfessionalismSuggestion(pattern),
          });
        }
      });
    });

    // Check for required elements
    this.standards.requiredElements.forEach(element => {
      if (!this.hasRequiredElement(content, element)) {
        issues.push({
          type: 'professionalism',
          severity: 'medium',
          message: `Missing required element: ${element}`,
          position: { start: 0, end: content.length },
          context: 'Overall content structure',
          suggestion: `Add ${element} to improve content completeness`,
        });
      }
    });

    return issues;
  }

  /**
   * Generate improvement suggestions
   */
  private generateSuggestions(content: string, analysis: ContentAnalysis, issues: QualityIssue[]): QualitySuggestion[] {
    const suggestions: QualitySuggestion[] = [];

    // Readability improvements
    if (analysis.readabilityGrade > 12) {
      suggestions.push({
        type: 'improvement',
        category: 'readability',
        suggestion: 'Simplify complex sentences and use more common vocabulary',
        impact: 'high',
        effort: 'medium',
      });
    }

    // Structure improvements
    if (analysis.paragraphCount < 5 && analysis.wordCount > 1000) {
      suggestions.push({
        type: 'improvement',
        category: 'structure',
        suggestion: 'Break content into more paragraphs for better readability',
        impact: 'medium',
        effort: 'low',
      });
    }

    // Engagement improvements
    if (analysis.transitionWords < analysis.paragraphCount * 0.5) {
      suggestions.push({
        type: 'enhancement',
        category: 'engagement',
        suggestion: 'Add more transition words to improve content flow',
        impact: 'medium',
        effort: 'low',
      });
    }

    // Critical issue suggestions
    const criticalIssues = issues.filter(issue => issue.severity === 'critical');
    if (criticalIssues.length > 0) {
      suggestions.push({
        type: 'improvement',
        category: 'critical',
        suggestion: `Address ${criticalIssues.length} critical issues before publication`,
        impact: 'high',
        effort: 'high',
      });
    }

    return suggestions;
  }

  /**
   * Calculate quality scores
   */
  private calculateScores(issues: QualityIssue[], analysis: ContentAnalysis): Omit<QualityCheckResult, 'issues' | 'suggestions' | 'passesQualityGate'> {
    const grammarIssues = issues.filter(i => i.type === 'grammar');
    const syntaxIssues = issues.filter(i => i.type === 'syntax');
    const readabilityIssues = issues.filter(i => i.type === 'readability');
    const coherenceIssues = issues.filter(i => i.type === 'coherence');
    const styleIssues = issues.filter(i => i.type === 'style');
    const professionalismIssues = issues.filter(i => i.type === 'professionalism');

    const grammarScore = Math.max(0, 100 - (grammarIssues.length * 10));
    const syntaxScore = Math.max(0, 100 - (syntaxIssues.length * 8));
    const readabilityScore = Math.max(0, 100 - (readabilityIssues.length * 15));
    const coherenceScore = Math.max(0, 100 - (coherenceIssues.length * 12));
    const styleScore = Math.max(0, 100 - (styleIssues.length * 5));
    const professionalismScore = Math.max(0, 100 - (professionalismIssues.length * 20));

    const overallScore = Math.round(
      (grammarScore * 0.25 + 
       syntaxScore * 0.20 + 
       readabilityScore * 0.20 + 
       coherenceScore * 0.15 + 
       styleScore * 0.10 + 
       professionalismScore * 0.10)
    );

    return {
      overallScore,
      grammarScore,
      syntaxScore,
      readabilityScore,
      coherenceScore,
      styleScore,
      professionalismScore,
    };
  }

  // Helper methods
  private initializeGrammarRules(): Map<string, RegExp> {
    const rules = new Map<string, RegExp>();

    rules.set('double-negative', /\b(don't|doesn't|didn't|won't|wouldn't|can't|couldn't)\s+(no|none|nothing|never|nobody)\b/gi);
    rules.set('subject-verb-disagreement', /\b(he|she|it)\s+(are|were)\b|\b(they|we|you)\s+(is|was)\b/gi);
    rules.set('dangling-modifier', /^(After|Before|While|During)\s+\w+ing\s*,\s*(?!the|a|an|this|that|these|those)/gm);
    rules.set('comma-splice', /\b\w+\s*,\s*\w+\s+(is|are|was|were|will|would|can|could|should|must)\b/gi);

    return rules;
  }

  private initializeStylePatterns(): Map<string, RegExp> {
    const patterns = new Map<string, RegExp>();

    patterns.set('redundant-phrases', /\b(in order to|for the purpose of|due to the fact that|in spite of the fact that)\b/gi);
    patterns.set('weak-verbs', /\b(is|are|was|were|has|have|had)\s+\w+ing\b/gi);
    patterns.set('filler-words', /\b(very|really|quite|rather|somewhat|pretty|fairly)\s+/gi);
    patterns.set('wordy-phrases', /\b(a large number of|a great deal of|in the event that|at this point in time)\b/gi);

    return patterns;
  }

  private extractSentences(text: string): string[] {
    return text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 0);
  }

  private extractParagraphs(text: string): string[] {
    return text.split(/\n\s*\n/).map(p => p.trim()).filter(p => p.length > 0);
  }

  private extractWords(text: string): string[] {
    return text.toLowerCase().match(/\b\w+\b/g) || [];
  }

  private countPassiveVoice(text: string): number {
    const passivePattern = /\b(is|are|was|were|been|being)\s+\w*ed\b/gi;
    return (text.match(passivePattern) || []).length;
  }

  private countTransitionWords(text: string): number {
    const transitions = [
      'however', 'therefore', 'furthermore', 'moreover', 'additionally', 'consequently',
      'meanwhile', 'nevertheless', 'nonetheless', 'similarly', 'likewise', 'conversely',
      'in contrast', 'on the other hand', 'for example', 'for instance', 'in fact',
      'indeed', 'specifically', 'particularly', 'especially', 'notably'
    ];

    let count = 0;
    transitions.forEach(transition => {
      const regex = new RegExp(`\\b${transition}\\b`, 'gi');
      count += (text.match(regex) || []).length;
    });

    return count;
  }

  private countComplexWords(words: string[]): number {
    return words.filter(word => this.countSyllables(word) >= 3).length;
  }

  private countSyllables(word: string): number {
    word = word.toLowerCase();
    if (word.length <= 3) return 1;

    const vowels = 'aeiouy';
    let syllables = 0;
    let previousWasVowel = false;

    for (let i = 0; i < word.length; i++) {
      const isVowel = vowels.includes(word[i]);
      if (isVowel && !previousWasVowel) {
        syllables++;
      }
      previousWasVowel = isVowel;
    }

    if (word.endsWith('e')) syllables--;
    return Math.max(1, syllables);
  }

  private calculateReadabilityGrade(wordCount: number, sentenceCount: number, complexWords: number): number {
    if (sentenceCount === 0) return 0;

    const avgSentenceLength = wordCount / sentenceCount;
    const complexWordPercentage = (complexWords / wordCount) * 100;

    // Flesch-Kincaid Grade Level formula
    return 0.39 * avgSentenceLength + 11.8 * (complexWordPercentage / 100) - 15.59;
  }

  private getContext(content: string, start: number, length: number): string {
    const contextStart = Math.max(0, start - 50);
    const contextEnd = Math.min(content.length, start + length + 50);
    return content.substring(contextStart, contextEnd);
  }

  private isSyntaxError(text: string, rule: string): boolean {
    // Simplified syntax error detection
    switch (rule) {
      case 'possessive-vs-contraction':
        return text.includes("'") && Math.random() > 0.7; // Simplified check
      case 'sentence-capitalization':
        return /\.\s*[a-z]/.test(text);
      default:
        return true;
    }
  }

  private getGrammarSuggestion(rule: string, text: string): string {
    const suggestions: Record<string, string> = {
      'double-negative': 'Use a single negative for clarity',
      'subject-verb-disagreement': 'Ensure subject and verb agree in number',
      'dangling-modifier': 'Place modifier next to the word it modifies',
      'comma-splice': 'Use a semicolon or separate into two sentences',
    };

    return suggestions[rule] || 'Review grammar rules for this construction';
  }

  private getSyntaxSuggestion(rule: string, text: string): string {
    const suggestions: Record<string, string> = {
      'possessive-vs-contraction': 'Check if you need possessive or contraction',
      'homophones': 'Verify you\'re using the correct word',
      'affect-vs-effect': 'Affect is a verb, effect is a noun',
      'sentence-capitalization': 'Capitalize the first word after a period',
    };

    return suggestions[rule] || 'Review syntax rules';
  }

  private getStyleSuggestion(style: string, text: string): string {
    const suggestions: Record<string, string> = {
      'redundant-phrases': 'Use simpler, more direct language',
      'weak-verbs': 'Use stronger, more specific verbs',
      'filler-words': 'Remove unnecessary qualifiers',
      'wordy-phrases': 'Use concise alternatives',
    };

    return suggestions[style] || 'Consider more concise phrasing';
  }

  private getProfessionalismSuggestion(pattern: string): string {
    const suggestions: Record<string, string> = {
      'very unique': 'Use "unique" (it\'s already absolute)',
      'more perfect': 'Use "perfect" (it\'s already absolute)',
      'irregardless': 'Use "regardless"',
      'could care less': 'Use "couldn\'t care less"',
      'for all intensive purposes': 'Use "for all intents and purposes"',
    };

    return suggestions[pattern] || 'Use more professional language';
  }

  private hasRequiredElement(content: string, element: string): boolean {
    switch (element) {
      case 'introduction':
        return content.length > 100; // Simplified check
      case 'conclusion':
        return /\b(conclusion|summary|in summary|to conclude|finally)\b/i.test(content);
      case 'headings':
        return /^#+\s+/m.test(content) || /<h[1-6]>/i.test(content);
      case 'examples':
        return /\b(example|for instance|such as|like)\b/i.test(content);
      default:
        return true;
    }
  }

  /**
   * Update quality standards
   */
  updateStandards(newStandards: Partial<QualityStandards>): void {
    this.standards = { ...this.standards, ...newStandards };
  }

  /**
   * Get current quality standards
   */
  getStandards(): QualityStandards {
    return { ...this.standards };
  }

  /**
   * Add custom grammar rule
   */
  addGrammarRule(name: string, pattern: RegExp): void {
    this.grammarRules.set(name, pattern);
  }

  /**
   * Add custom style pattern
   */
  addStylePattern(name: string, pattern: RegExp): void {
    this.stylePatterns.set(name, pattern);
  }
}

// Factory function
export const createContentQualityAssurance = (standards?: Partial<QualityStandards>): ContentQualityAssurance => {
  return new ContentQualityAssurance(standards);
};

// Default export
export default ContentQualityAssurance;
