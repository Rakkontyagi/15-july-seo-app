export interface GrammarValidationResult {
  content: string;
  changes: Array<{
    type: 'grammar';
    original: string;
    optimized: string;
    reason: string;
  }>;
  errors: Array<{
    type: 'spelling' | 'grammar' | 'punctuation' | 'style';
    message: string;
    position: number;
    suggestion: string;
  }>;
  accuracy: number;
}

export class GrammarValidator {
  private commonErrors = {
    // Spelling corrections
    spelling: {
      'recieve': 'receive',
      'seperate': 'separate',
      'definately': 'definitely',
      'occured': 'occurred',
      'neccessary': 'necessary',
      'accomodate': 'accommodate',
      'embarass': 'embarrass',
      'existance': 'existence',
      'maintainance': 'maintenance',
      'occassion': 'occasion'
    },
    
    // Grammar corrections
    grammar: {
      'could of': 'could have',
      'would of': 'would have',
      'should of': 'should have',
      'alot': 'a lot',
      'its\'': 'its',
      'who\'s': 'whose',
      'there own': 'their own',
      'your welcome': 'you\'re welcome',
      'loose weight': 'lose weight',
      'effect change': 'affect change'
    },
    
    // Punctuation patterns
    punctuation: [
      { pattern: /\s+([,.!?;:])/g, replacement: '$1', reason: 'Remove space before punctuation' },
      { pattern: /([,.!?;:])\s*([,.!?;:])/g, replacement: '$1 $2', reason: 'Fix punctuation spacing' },
      { pattern: /\s{2,}/g, replacement: ' ', reason: 'Replace multiple spaces with single space' },
      { pattern: /\.{2,}/g, replacement: '.', reason: 'Replace multiple periods with single period' },
      { pattern: /,{2,}/g, replacement: ',', reason: 'Replace multiple commas with single comma' },
      { pattern: /\?{2,}/g, replacement: '?', reason: 'Replace multiple question marks with single' },
      { pattern: /!{2,}/g, replacement: '!', reason: 'Replace multiple exclamation marks with single' }
    ]
  };

  private styleRules = [
    {
      pattern: /\b(very|really|quite|rather|pretty|fairly|extremely|incredibly|absolutely)\s+/gi,
      replacement: '',
      reason: 'Remove unnecessary intensifiers for cleaner prose'
    },
    {
      pattern: /\b(in order to)\b/gi,
      replacement: 'to',
      reason: 'Simplify "in order to" to "to"'
    },
    {
      pattern: /\b(due to the fact that)\b/gi,
      replacement: 'because',
      reason: 'Simplify "due to the fact that" to "because"'
    },
    {
      pattern: /\b(at this point in time)\b/gi,
      replacement: 'now',
      reason: 'Simplify "at this point in time" to "now"'
    },
    {
      pattern: /\b(in the event that)\b/gi,
      replacement: 'if',
      reason: 'Simplify "in the event that" to "if"'
    }
  ];

  async validateAndCorrect(content: string): Promise<GrammarValidationResult> {
    const changes: GrammarValidationResult['changes'] = [];
    const errors: GrammarValidationResult['errors'] = [];
    let correctedContent = content;

    // Fix spelling errors
    const spellingResult = this.correctSpelling(correctedContent);
    correctedContent = spellingResult.content;
    changes.push(...spellingResult.changes);
    errors.push(...spellingResult.errors);

    // Fix grammar errors
    const grammarResult = this.correctGrammar(correctedContent);
    correctedContent = grammarResult.content;
    changes.push(...grammarResult.changes);
    errors.push(...grammarResult.errors);

    // Fix punctuation
    const punctuationResult = this.correctPunctuation(correctedContent);
    correctedContent = punctuationResult.content;
    changes.push(...punctuationResult.changes);
    errors.push(...punctuationResult.errors);

    // Apply style improvements
    const styleResult = this.applyStyleRules(correctedContent);
    correctedContent = styleResult.content;
    changes.push(...styleResult.changes);

    // Validate sentence structure
    const structureResult = this.validateSentenceStructure(correctedContent);
    errors.push(...structureResult.errors);

    // Calculate accuracy
    const accuracy = this.calculateAccuracy(content, errors);

    return {
      content: correctedContent,
      changes,
      errors,
      accuracy
    };
  }

  private correctSpelling(content: string): {
    content: string;
    changes: GrammarValidationResult['changes'];
    errors: GrammarValidationResult['errors'];
  } {
    const changes: GrammarValidationResult['changes'] = [];
    const errors: GrammarValidationResult['errors'] = [];
    let correctedContent = content;

    for (const [incorrect, correct] of Object.entries(this.commonErrors.spelling)) {
      const regex = new RegExp(`\\b${incorrect}\\b`, 'gi');
      const matches = [...correctedContent.matchAll(regex)];
      
      if (matches.length > 0) {
        correctedContent = correctedContent.replace(regex, correct);
        
        matches.forEach(match => {
          changes.push({
            type: 'grammar',
            original: incorrect,
            optimized: correct,
            reason: `Corrected spelling: "${incorrect}" → "${correct}"`
          });
          
          errors.push({
            type: 'spelling',
            message: `Spelling error: "${incorrect}" should be "${correct}"`,
            position: match.index || 0,
            suggestion: correct
          });
        });
      }
    }

    return { content: correctedContent, changes, errors };
  }

  private correctGrammar(content: string): {
    content: string;
    changes: GrammarValidationResult['changes'];
    errors: GrammarValidationResult['errors'];
  } {
    const changes: GrammarValidationResult['changes'] = [];
    const errors: GrammarValidationResult['errors'] = [];
    let correctedContent = content;

    for (const [incorrect, correct] of Object.entries(this.commonErrors.grammar)) {
      const regex = new RegExp(incorrect.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      const matches = [...correctedContent.matchAll(regex)];
      
      if (matches.length > 0) {
        correctedContent = correctedContent.replace(regex, correct);
        
        matches.forEach(match => {
          changes.push({
            type: 'grammar',
            original: incorrect,
            optimized: correct,
            reason: `Corrected grammar: "${incorrect}" → "${correct}"`
          });
          
          errors.push({
            type: 'grammar',
            message: `Grammar error: "${incorrect}" should be "${correct}"`,
            position: match.index || 0,
            suggestion: correct
          });
        });
      }
    }

    return { content: correctedContent, changes, errors };
  }

  private correctPunctuation(content: string): {
    content: string;
    changes: GrammarValidationResult['changes'];
    errors: GrammarValidationResult['errors'];
  } {
    const changes: GrammarValidationResult['changes'] = [];
    const errors: GrammarValidationResult['errors'] = [];
    let correctedContent = content;

    this.commonErrors.punctuation.forEach(rule => {
      const matches = [...correctedContent.matchAll(rule.pattern)];
      
      if (matches.length > 0) {
        const originalContent = correctedContent;
        correctedContent = correctedContent.replace(rule.pattern, rule.replacement);
        
        if (originalContent !== correctedContent) {
          changes.push({
            type: 'grammar',
            original: 'punctuation error',
            optimized: 'corrected punctuation',
            reason: rule.reason
          });
          
          matches.forEach(match => {
            errors.push({
              type: 'punctuation',
              message: rule.reason,
              position: match.index || 0,
              suggestion: rule.replacement
            });
          });
        }
      }
    });

    return { content: correctedContent, changes, errors };
  }

  private applyStyleRules(content: string): {
    content: string;
    changes: GrammarValidationResult['changes'];
  } {
    const changes: GrammarValidationResult['changes'] = [];
    let styledContent = content;

    this.styleRules.forEach(rule => {
      const matches = [...styledContent.matchAll(rule.pattern)];
      
      if (matches.length > 0) {
        const originalContent = styledContent;
        styledContent = styledContent.replace(rule.pattern, rule.replacement);
        
        if (originalContent !== styledContent) {
          matches.forEach(match => {
            changes.push({
              type: 'grammar',
              original: match[0],
              optimized: rule.replacement,
              reason: rule.reason
            });
          });
        }
      }
    });

    return { content: styledContent, changes };
  }

  private validateSentenceStructure(content: string): {
    errors: GrammarValidationResult['errors'];
  } {
    const errors: GrammarValidationResult['errors'] = [];
    const sentences = this.splitIntoSentences(content);

    sentences.forEach((sentence, index) => {
      // Check for sentence fragments
      if (sentence.length < 10 && !this.isValidShortSentence(sentence)) {
        errors.push({
          type: 'grammar',
          message: 'Possible sentence fragment',
          position: index,
          suggestion: 'Consider expanding this sentence or combining with adjacent sentences'
        });
      }

      // Check for run-on sentences
      if (sentence.length > 200 && this.countClauses(sentence) > 3) {
        errors.push({
          type: 'style',
          message: 'Sentence may be too long and complex',
          position: index,
          suggestion: 'Consider breaking this sentence into shorter, clearer sentences'
        });
      }

      // Check for missing capitalization
      if (sentence.length > 0 && sentence[0] !== sentence[0].toUpperCase()) {
        errors.push({
          type: 'grammar',
          message: 'Sentence should start with capital letter',
          position: index,
          suggestion: 'Capitalize the first letter'
        });
      }

      // Check for proper sentence ending
      if (sentence.length > 0 && !/[.!?]$/.test(sentence.trim())) {
        errors.push({
          type: 'punctuation',
          message: 'Sentence should end with proper punctuation',
          position: index,
          suggestion: 'Add appropriate ending punctuation (. ! ?)'
        });
      }
    });

    return { errors };
  }

  private isValidShortSentence(sentence: string): boolean {
    // Valid short sentences (commands, exclamations, etc.)
    const validPatterns = [
      /^(yes|no|okay|ok|sure|exactly|absolutely|definitely|certainly)\.?$/i,
      /^(stop|wait|help|look|listen)\.?$/i,
      /^\w+!$/,
      /^\w+\?$/
    ];

    return validPatterns.some(pattern => pattern.test(sentence.trim()));
  }

  private countClauses(sentence: string): number {
    // Count independent and dependent clauses
    const clauseIndicators = [',', ';', 'and', 'but', 'or', 'because', 'since', 'although', 'while', 'if', 'when', 'where', 'that', 'which'];
    
    return clauseIndicators.reduce((count, indicator) => {
      const regex = new RegExp(`\\b${indicator}\\b`, 'gi');
      const matches = sentence.match(regex);
      return count + (matches ? matches.length : 0);
    }, 1); // Start with 1 for the main clause
  }

  private splitIntoSentences(content: string): string[] {
    return content
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }

  private calculateAccuracy(originalContent: string, errors: GrammarValidationResult['errors']): number {
    const sentences = this.splitIntoSentences(originalContent);
    const totalSentences = sentences.length;
    const errorCount = errors.length;
    
    if (totalSentences === 0) return 100;
    
    // Calculate accuracy based on error density
    const errorRate = errorCount / totalSentences;
    const accuracy = Math.max(0, 100 - (errorRate * 20)); // Each error reduces accuracy by up to 20 points
    
    return Math.round(accuracy * 100) / 100;
  }

  analyzeGrammar(content: string): {
    totalSentences: number;
    errorCount: number;
    errorTypes: Record<string, number>;
    suggestions: string[];
    readabilityScore: number;
  } {
    const sentences = this.splitIntoSentences(content);
    const errors: GrammarValidationResult['errors'] = [];
    const errorTypes: Record<string, number> = {};
    const suggestions: string[] = [];

    // Analyze for common errors
    Object.keys(this.commonErrors.spelling).forEach(error => {
      const regex = new RegExp(`\\b${error}\\b`, 'gi');
      const matches = content.match(regex);
      if (matches) {
        errorTypes.spelling = (errorTypes.spelling || 0) + matches.length;
      }
    });

    Object.keys(this.commonErrors.grammar).forEach(error => {
      const regex = new RegExp(error.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      const matches = content.match(regex);
      if (matches) {
        errorTypes.grammar = (errorTypes.grammar || 0) + matches.length;
      }
    });

    // Calculate readability score (simplified)
    const avgWordsPerSentence = sentences.length > 0 
      ? content.split(/\s+/).length / sentences.length 
      : 0;
    
    const readabilityScore = Math.max(0, 100 - Math.abs(avgWordsPerSentence - 15) * 2);

    // Generate suggestions
    if (errorTypes.spelling > 0) {
      suggestions.push('Review spelling for common errors');
    }
    if (errorTypes.grammar > 0) {
      suggestions.push('Check grammar for common mistakes');
    }
    if (avgWordsPerSentence > 25) {
      suggestions.push('Consider shortening long sentences for better readability');
    }
    if (avgWordsPerSentence < 8) {
      suggestions.push('Consider combining short sentences for better flow');
    }

    return {
      totalSentences: sentences.length,
      errorCount: Object.values(errorTypes).reduce((sum, count) => sum + count, 0),
      errorTypes,
      suggestions,
      readabilityScore: Math.round(readabilityScore * 100) / 100
    };
  }
}