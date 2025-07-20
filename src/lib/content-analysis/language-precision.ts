export interface PrecisionResult {
  content: string;
  changes: Array<{
    type: 'precision';
    original: string;
    optimized: string;
    reason: string;
  }>;
}

export class LanguagePrecisionEngine {
  private vagueTermReplacements: Record<string, string[]> = {
    'things': ['elements', 'components', 'factors', 'aspects'],
    'stuff': ['components', 'materials', 'elements', 'items'],
    'very': [''], // Remove intensifiers
    'really': [''],
    'quite': [''],
    'somewhat': [''],
    'pretty': [''],
    'rather': [''],
    'fairly': [''],
    'good': ['effective', 'valuable', 'beneficial', 'useful'],
    'bad': ['ineffective', 'problematic', 'detrimental', 'harmful'],
    'big': ['significant', 'substantial', 'major', 'extensive'],
    'small': ['minor', 'limited', 'minimal', 'specific'],
    'nice': ['beneficial', 'valuable', 'effective', 'useful'],
    'great': ['excellent', 'outstanding', 'exceptional', 'superior'],
    'amazing': ['remarkable', 'exceptional', 'outstanding', 'impressive'],
    'awesome': ['impressive', 'remarkable', 'excellent', 'outstanding']
  };

  private clarityEnhancements: Record<string, string[]> = {
    'a lot of': ['numerous', 'many', 'multiple', 'several'],
    'lots of': ['numerous', 'many', 'multiple', 'several'],
    'tons of': ['numerous', 'many', 'multiple', 'extensive'],
    'bunch of': ['several', 'multiple', 'numerous', 'various'],
    'kind of': ['somewhat', 'partially', 'moderately'],
    'sort of': ['somewhat', 'partially', 'moderately'],
    'type of': ['form of', 'variety of', 'category of'],
    'in order to': ['to'],
    'due to the fact that': ['because'],
    'for the reason that': ['because'],
    'in spite of the fact that': ['although'],
    'at this point in time': ['now', 'currently'],
    'in the event that': ['if'],
    'with regard to': ['regarding', 'about'],
    'in relation to': ['regarding', 'about'],
    'as a matter of fact': ['actually', 'in fact']
  };

  private semanticEnhancements: Record<string, string[]> = {
    'help': ['assist', 'support', 'facilitate', 'enable'],
    'make': ['create', 'develop', 'generate', 'produce'],
    'get': ['obtain', 'acquire', 'receive', 'achieve'],
    'do': ['perform', 'execute', 'implement', 'conduct'],
    'use': ['utilize', 'employ', 'apply', 'implement'],
    'show': ['demonstrate', 'illustrate', 'display', 'reveal'],
    'tell': ['inform', 'explain', 'communicate', 'describe'],
    'give': ['provide', 'offer', 'supply', 'deliver'],
    'take': ['require', 'demand', 'necessitate', 'involve'],
    'put': ['place', 'position', 'install', 'implement']
  };

  enhancePrecision(content: string): PrecisionResult {
    const changes: PrecisionResult['changes'] = [];
    let preciseContent = content;

    // Replace vague terms
    const vagueResult = this.replaceVagueTerms(preciseContent);
    preciseContent = vagueResult.content;
    changes.push(...vagueResult.changes);

    // Improve clarity and specificity
    const clarityResult = this.improveClarityAndSpecificity(preciseContent);
    preciseContent = clarityResult.content;
    changes.push(...clarityResult.changes);

    // Maximize semantic value
    const semanticResult = this.maximizeSemanticValue(preciseContent);
    preciseContent = semanticResult.content;
    changes.push(...semanticResult.changes);

    return {
      content: preciseContent,
      changes
    };
  }

  private replaceVagueTerms(content: string): PrecisionResult {
    const changes: PrecisionResult['changes'] = [];
    let optimizedContent = content;

    for (const [vagueWord, replacements] of Object.entries(this.vagueTermReplacements)) {
      const regex = new RegExp(`\\b${vagueWord}\\b`, 'gi');
      const matches = optimizedContent.match(regex);
      
      if (matches) {
        const replacement = this.selectContextualReplacement(replacements, optimizedContent, vagueWord);
        if (replacement !== null && replacement !== undefined) {
          optimizedContent = optimizedContent.replace(regex, replacement);
          changes.push({
            type: 'precision',
            original: vagueWord,
            optimized: replacement || '[removed]',
            reason: `Replaced vague term "${vagueWord}" with ${replacement ? `more specific "${replacement}"` : 'removal'}`
          });
        }
      }
    }

    return {
      content: optimizedContent,
      changes
    };
  }

  private improveClarityAndSpecificity(content: string): PrecisionResult {
    const changes: PrecisionResult['changes'] = [];
    let optimizedContent = content;

    for (const [phrase, replacements] of Object.entries(this.clarityEnhancements)) {
      const regex = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      const matches = optimizedContent.match(regex);
      
      if (matches) {
        const replacement = this.selectContextualReplacement(replacements, optimizedContent, phrase);
        if (replacement !== null && replacement !== undefined) {
          optimizedContent = optimizedContent.replace(regex, replacement);
          changes.push({
            type: 'precision',
            original: phrase,
            optimized: replacement,
            reason: `Enhanced clarity by replacing "${phrase}" with "${replacement}"`
          });
        }
      }
    }

    return {
      content: optimizedContent,
      changes
    };
  }

  private maximizeSemanticValue(content: string): PrecisionResult {
    const changes: PrecisionResult['changes'] = [];
    let optimizedContent = content;

    for (const [genericWord, specificWords] of Object.entries(this.semanticEnhancements)) {
      const regex = new RegExp(`\\b${genericWord}\\b`, 'gi');
      const matches = optimizedContent.match(regex);
      
      if (matches && matches.length > 2) { // Only replace if word appears frequently
        const replacement = this.selectContextualReplacement(specificWords, optimizedContent, genericWord);
        if (replacement !== null && replacement !== undefined && replacement !== '') {
          // Replace only some instances to maintain variety
          let replacementCount = 0;
          optimizedContent = optimizedContent.replace(regex, (match) => {
            replacementCount++;
            return replacementCount <= Math.ceil(matches.length / 2) ? replacement : match;
          });
          
          if (replacementCount > 0) {
            changes.push({
              type: 'precision',
              original: genericWord,
              optimized: replacement,
              reason: `Enhanced semantic value by replacing generic "${genericWord}" with specific "${replacement}"`
            });
          }
        }
      }
    }

    return {
      content: optimizedContent,
      changes
    };
  }

  private selectContextualReplacement(replacements: string[], content: string, originalWord: string): string {
    if (replacements.length === 0) return '';
    if (replacements.length === 1) return replacements[0];

    // Simple context analysis - in production would use more sophisticated NLP
    const contentLower = content.toLowerCase();
    
    // Check for technical context
    const technicalIndicators = ['system', 'process', 'method', 'algorithm', 'data', 'analysis'];
    const isTechnical = technicalIndicators.some(indicator => contentLower.includes(indicator));
    
    // Check for business context
    const businessIndicators = ['strategy', 'market', 'customer', 'revenue', 'growth', 'business'];
    const isBusiness = businessIndicators.some(indicator => contentLower.includes(indicator));
    
    // Select replacement based on context
    if (isTechnical && replacements.includes('implement')) return 'implement';
    if (isTechnical && replacements.includes('execute')) return 'execute';
    if (isBusiness && replacements.includes('facilitate')) return 'facilitate';
    if (isBusiness && replacements.includes('enable')) return 'enable';
    
    // Default to first replacement
    return replacements[0];
  }

  calculatePrecisionScore(content: string): number {
    const words = content.toLowerCase().split(/\s+/);
    const totalWords = words.length;
    
    // Count vague words
    const vagueWords = Object.keys(this.vagueTermReplacements);
    const vagueWordCount = words.filter(word => vagueWords.includes(word)).length;
    
    // Count unclear phrases
    const unclearPhrases = Object.keys(this.clarityEnhancements);
    const unclearPhraseCount = unclearPhrases.reduce((count, phrase) => {
      const regex = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      const matches = content.match(regex);
      return count + (matches ? matches.length : 0);
    }, 0);
    
    // Calculate precision score
    const imprecisionCount = vagueWordCount + unclearPhraseCount;
    const precisionScore = Math.max(0, 100 - (imprecisionCount / totalWords) * 100);
    
    return Math.round(precisionScore * 100) / 100;
  }

  analyzeWordChoice(content: string): {
    vagueWords: string[];
    unclearPhrases: string[];
    suggestions: Array<{
      word: string;
      suggestions: string[];
      context: string;
    }>;
  } {
    const words = content.toLowerCase().split(/\s+/);
    const vagueWords: string[] = [];
    const unclearPhrases: string[] = [];
    const suggestions: Array<{ word: string; suggestions: string[]; context: string }> = [];

    // Find vague words
    words.forEach(word => {
      // Clean word of punctuation
      const cleanWord = word.replace(/[^\w]/g, '');
      if (this.vagueTermReplacements[cleanWord]) {
        vagueWords.push(cleanWord);
        suggestions.push({
          word: cleanWord,
          suggestions: this.vagueTermReplacements[cleanWord],
          context: 'vague term'
        });
      }
    });

    // Find unclear phrases
    Object.keys(this.clarityEnhancements).forEach(phrase => {
      const regex = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      if (regex.test(content)) {
        unclearPhrases.push(phrase);
        suggestions.push({
          word: phrase,
          suggestions: this.clarityEnhancements[phrase],
          context: 'unclear phrase'
        });
      }
    });

    return {
      vagueWords,
      unclearPhrases,
      suggestions
    };
  }
}