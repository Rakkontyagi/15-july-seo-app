import { LanguagePrecisionEngine } from './language-precision';
import { FillerContentDetector } from './filler-detector';
import { GrammarValidator } from './grammar-validator';
import { SemanticCoherenceOptimizer } from './semantic-coherence-optimizer';

export interface NLPOptimizationResult {
  optimizedContent: string;
  metrics: {
    svoCompliance: number;
    prohibitedPhrasesRemoved: number;
    languagePrecisionScore: number;
    fillerContentPercentage: number;
    grammarAccuracy: number;
    semanticCoherenceScore: number;
  };
  changes: Array<{
    type: 'svo' | 'prohibited' | 'precision' | 'filler' | 'grammar' | 'coherence';
    original: string;
    optimized: string;
    reason: string;
  }>;
}

export class AdvancedNLPOptimizer {
  private languagePrecision: LanguagePrecisionEngine;
  private fillerDetector: FillerContentDetector;
  private grammarValidator: GrammarValidator;
  private coherenceOptimizer: SemanticCoherenceOptimizer;

  constructor() {
    this.languagePrecision = new LanguagePrecisionEngine();
    this.fillerDetector = new FillerContentDetector();
    this.grammarValidator = new GrammarValidator();
    this.coherenceOptimizer = new SemanticCoherenceOptimizer();
  }

  async optimizeForNLP(content: string): Promise<NLPOptimizationResult> {
    const changes: NLPOptimizationResult['changes'] = [];
    let optimizedContent = content;

    // Handle very short content
    if (!content || content.trim().length < 5) {
      return {
        optimizedContent: content,
        metrics: this.calculateMetrics(content, content),
        changes: []
      };
    }

    // 1. Enforce SVO structure
    const svoResult = this.enforceSubjectVerbObject(optimizedContent);
    optimizedContent = svoResult.content;
    changes.push(...svoResult.changes);

    // 2. Remove prohibited phrases
    const prohibitedResult = await this.eliminateProhibitedPhrases(optimizedContent);
    optimizedContent = prohibitedResult.content;
    changes.push(...prohibitedResult.changes);

    // 3. Enhance language precision
    const precisionResult = this.languagePrecision.enhancePrecision(optimizedContent);
    optimizedContent = precisionResult.content;
    changes.push(...precisionResult.changes);

    // 4. Remove filler content
    const fillerResult = this.fillerDetector.eliminateFillerContent(optimizedContent);
    optimizedContent = fillerResult.content;
    changes.push(...fillerResult.changes);

    // 5. Optimize sentence complexity
    const complexityResult = this.optimizeSentenceComplexity(optimizedContent);
    optimizedContent = complexityResult.content;
    changes.push(...complexityResult.changes);

    // 6. Validate grammar and syntax
    const grammarResult = await this.grammarValidator.validateAndCorrect(optimizedContent);
    optimizedContent = grammarResult.content;
    changes.push(...grammarResult.changes);

    // 7. Optimize semantic coherence
    const coherenceResult = this.coherenceOptimizer.optimizeCoherence(optimizedContent);
    optimizedContent = coherenceResult.content;
    changes.push(...coherenceResult.changes);

    // Calculate metrics
    const metrics = await this.calculateMetrics(content, optimizedContent, changes);

    return {
      optimizedContent,
      metrics,
      changes
    };
  }

  private enforceSubjectVerbObject(content: string): { content: string; changes: NLPOptimizationResult['changes'] } {
    const sentences = this.splitIntoSentences(content);
    const changes: NLPOptimizationResult['changes'] = [];
    
    const optimizedSentences = sentences.map(sentence => {
      const svoAnalysis = this.analyzeSVOStructure(sentence);
      
      if (svoAnalysis.needsRestructuring) {
        const restructured = this.restructureToSVO(sentence, svoAnalysis);
        if (restructured !== sentence) {
          changes.push({
            type: 'svo',
            original: sentence,
            optimized: restructured,
            reason: 'Restructured to Subject-Verb-Object pattern for better NLP processing'
          });
          return restructured;
        }
      }
      
      return sentence;
    });

    return {
      content: optimizedSentences.join(' '),
      changes
    };
  }

  private analyzeSVOStructure(sentence: string): { needsRestructuring: boolean; subject?: string; verb?: string; object?: string } {
    // Simple SVO analysis - in production would use more sophisticated NLP
    const words = sentence.toLowerCase().split(/\s+/);
    
    // Check for passive voice indicators
    const passiveIndicators = ['was', 'were', 'been', 'being', 'is', 'are', 'am'];
    const hasPassive = passiveIndicators.some(indicator => words.includes(indicator));
    
    // Check for complex sentence structures that could be simplified
    const complexIndicators = ['which', 'that', 'where', 'when', 'although', 'however'];
    const isComplex = complexIndicators.some(indicator => words.includes(indicator));
    
    return {
      needsRestructuring: hasPassive || isComplex
    };
  }

  private restructureToSVO(sentence: string, analysis: any): string {
    // Basic restructuring logic - would be more sophisticated in production
    let restructured = sentence;
    
    // Convert passive to active voice
    if (sentence.includes(' was ') || sentence.includes(' were ')) {
      restructured = sentence
        .replace(/(\w+)\s+was\s+(\w+ed)\s+by\s+(\w+)/g, '$3 $2 $1')
        .replace(/(\w+)\s+were\s+(\w+ed)\s+by\s+(\w+)/g, '$3 $2 $1');
    }
    
    return restructured;
  }

  private async eliminateProhibitedPhrases(content: string): Promise<{ content: string; changes: NLPOptimizationResult['changes'] }> {
    const prohibitedPhrases = await this.getProhibitedPhrases();
    const changes: NLPOptimizationResult['changes'] = [];
    let optimizedContent = content;

    for (const phrase of prohibitedPhrases) {
      const regex = new RegExp(`\\b${phrase.phrase}\\b`, 'gi');
      if (regex.test(optimizedContent)) {
        const replacement = this.selectBestReplacement(phrase.replacementSuggestions, optimizedContent);
        const original = optimizedContent;
        optimizedContent = optimizedContent.replace(regex, replacement);
        
        if (original !== optimizedContent) {
          changes.push({
            type: 'prohibited',
            original: phrase.phrase,
            optimized: replacement,
            reason: `Replaced overused SEO term "${phrase.phrase}" with more natural alternative`
          });
        }
      }
    }

    return { content: optimizedContent, changes };
  }

  private async getProhibitedPhrases(): Promise<Array<{ phrase: string; replacementSuggestions: string[]; severityLevel: number }>> {
    // In production, this would query the database
    return [
      { phrase: 'meticulous', replacementSuggestions: ['careful', 'thorough', 'detailed', 'precise'], severityLevel: 4 },
      { phrase: 'navigating', replacementSuggestions: ['managing', 'handling', 'addressing', 'dealing with'], severityLevel: 4 },
      { phrase: 'complexities', replacementSuggestions: ['challenges', 'difficulties', 'intricacies', 'complications'], severityLevel: 4 },
      { phrase: 'realm', replacementSuggestions: ['field', 'area', 'domain', 'sector'], severityLevel: 5 },
      { phrase: 'bespoke', replacementSuggestions: ['custom', 'tailored', 'personalized', 'specialized'], severityLevel: 5 },
      { phrase: 'tailored', replacementSuggestions: ['customized', 'personalized', 'adapted', 'designed'], severityLevel: 3 }
    ];
  }

  private selectBestReplacement(suggestions: string[], context: string): string {
    // Simple selection - in production would use context analysis
    return suggestions[Math.floor(Math.random() * suggestions.length)];
  }

  private optimizeSentenceComplexity(content: string): { content: string; changes: NLPOptimizationResult['changes'] } {
    const sentences = this.splitIntoSentences(content);
    const changes: NLPOptimizationResult['changes'] = [];
    
    const optimizedSentences = sentences.map(sentence => {
      const complexity = this.calculateSentenceComplexity(sentence);
      
      if (complexity.score > 0.8) { // Too complex
        const simplified = this.simplifySentence(sentence);
        if (simplified !== sentence) {
          changes.push({
            type: 'grammar',
            original: sentence,
            optimized: simplified,
            reason: 'Simplified overly complex sentence while maintaining professional tone'
          });
          return simplified;
        }
      }
      
      return sentence;
    });

    return {
      content: optimizedSentences.join(' '),
      changes
    };
  }

  private calculateSentenceComplexity(sentence: string): { score: number; factors: string[] } {
    const words = sentence.split(/\s+/);
    const factors: string[] = [];
    let score = 0;

    // Length factor
    if (words.length > 25) {
      score += 0.3;
      factors.push('long sentence');
    }

    // Subordinate clauses
    const subordinateWords = ['which', 'that', 'where', 'when', 'although', 'because', 'since'];
    const subordinateCount = subordinateWords.filter(word => 
      sentence.toLowerCase().includes(word)
    ).length;
    
    if (subordinateCount > 2) {
      score += 0.4;
      factors.push('multiple subordinate clauses');
    }

    // Complex punctuation
    const commaCount = (sentence.match(/,/g) || []).length;
    if (commaCount > 3) {
      score += 0.2;
      factors.push('excessive commas');
    }

    return { score, factors };
  }

  private simplifySentence(sentence: string): string {
    // Basic simplification - split long sentences
    if (sentence.length > 150 && sentence.includes(',')) {
      const parts = sentence.split(',');
      if (parts.length > 2) {
        return parts.slice(0, 2).join(',') + '.';
      }
    }
    
    return sentence;
  }

  private splitIntoSentences(content: string): string[] {
    if (!content || content.trim().length === 0) return [];
    return content.split(/[.!?]+/).filter(s => s.trim().length > 0).map(s => s.trim());
  }

  private async calculateMetrics(
    originalContent: string, 
    optimizedContent: string, 
    changes: NLPOptimizationResult['changes']
  ): Promise<NLPOptimizationResult['metrics']> {
    const originalSentences = this.splitIntoSentences(originalContent);
    const optimizedSentences = this.splitIntoSentences(optimizedContent);

    return {
      svoCompliance: this.calculateSVOCompliance(optimizedSentences),
      prohibitedPhrasesRemoved: changes.filter(c => c.type === 'prohibited').length,
      languagePrecisionScore: await this.calculatePrecisionScore(optimizedContent),
      fillerContentPercentage: this.calculateFillerPercentage(optimizedContent),
      grammarAccuracy: await this.calculateGrammarAccuracy(optimizedContent),
      semanticCoherenceScore: this.calculateCoherenceScore(optimizedContent)
    };
  }

  private calculateSVOCompliance(sentences: string[]): number {
    const svoCompliantSentences = sentences.filter(sentence => {
      const analysis = this.analyzeSVOStructure(sentence);
      return !analysis.needsRestructuring;
    });
    
    return sentences.length > 0 ? (svoCompliantSentences.length / sentences.length) * 100 : 0;
  }

  private async calculatePrecisionScore(content: string): Promise<number> {
    // Simplified precision scoring
    const words = content.toLowerCase().split(/\s+/);
    const vagueWords = ['things', 'stuff', 'very', 'really', 'quite', 'somewhat'];
    const vagueWordCount = words.filter(word => vagueWords.includes(word)).length;
    
    return Math.max(0, 100 - (vagueWordCount / words.length) * 100);
  }

  private calculateFillerPercentage(content: string): number {
    const sentences = this.splitIntoSentences(content);
    const fillerSentences = sentences.filter(sentence => 
      !this.hasDirectValue(sentence)
    );
    
    return sentences.length > 0 ? (fillerSentences.length / sentences.length) * 100 : 0;
  }

  private hasDirectValue(sentence: string): boolean {
    const valueIndicators = [
      'how to', 'steps to', 'method', 'technique', 'strategy',
      'benefit', 'advantage', 'result', 'outcome', 'solution',
      'example', 'instance', 'case', 'data', 'research'
    ];
    
    return valueIndicators.some(indicator => 
      sentence.toLowerCase().includes(indicator)
    );
  }

  private async calculateGrammarAccuracy(content: string): Promise<number> {
    // Simplified grammar accuracy - would use proper grammar checker in production
    const commonErrors = [
      /\s{2,}/g, // Multiple spaces
      /[.]{2,}/g, // Multiple periods
      /[,]{2,}/g, // Multiple commas
    ];
    
    const errorCount = commonErrors.reduce((count, regex) => {
      const matches = content.match(regex);
      return count + (matches ? matches.length : 0);
    }, 0);
    
    const sentences = this.splitIntoSentences(content);
    return sentences.length > 0 ? Math.max(0, 100 - (errorCount / sentences.length) * 10) : 100;
  }

  private calculateCoherenceScore(content: string): number {
    const sentences = this.splitIntoSentences(content);
    
    if (sentences.length === 0) return 0;
    if (sentences.length === 1) return 100;
    
    // Simple coherence scoring based on transition words and topic consistency
    const transitionWords = ['however', 'therefore', 'furthermore', 'additionally', 'consequently'];
    const transitionCount = sentences.filter(sentence =>
      transitionWords.some(word => sentence.toLowerCase().includes(word))
    ).length;
    
    // Base score with bonus for appropriate transitions
    const baseScore = 75;
    const transitionBonus = sentences.length > 0 ? Math.min(25, (transitionCount / sentences.length) * 100) : 0;
    
    return Math.min(100, baseScore + transitionBonus);
  }
}