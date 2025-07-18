export interface FillerDetectionResult {
  content: string;
  changes: Array<{
    type: 'filler';
    original: string;
    optimized: string;
    reason: string;
  }>;
  fillerPercentage: number;
  removedSentences: string[];
}

export class FillerContentDetector {
  private fillerPhrases = [
    'it is important to note that',
    'it should be mentioned that',
    'it is worth noting that',
    'as we all know',
    'needless to say',
    'without a doubt',
    'it goes without saying',
    'obviously',
    'clearly',
    'of course',
    'as you can see',
    'as mentioned before',
    'as previously stated',
    'in conclusion',
    'to sum up',
    'in summary',
    'all in all',
    'at the end of the day',
    'when all is said and done',
    'the bottom line is',
    'what this means is',
    'the point is',
    'the fact of the matter is',
    'the truth is',
    'believe it or not',
    'as a matter of fact',
    'in actual fact',
    'in reality',
    'in other words',
    'that is to say',
    'to put it simply',
    'to put it another way',
    'in simple terms',
    'basically',
    'essentially',
    'fundamentally',
    'ultimately',
    'at its core',
    'when you think about it',
    'if you really think about it',
    'upon closer inspection',
    'upon further reflection'
  ];

  private transitionFluff = [
    'furthermore',
    'moreover',
    'additionally',
    'in addition',
    'what is more',
    'not only that',
    'on top of that',
    'beyond that',
    'apart from that',
    'aside from that',
    'in the same vein',
    'along the same lines',
    'similarly',
    'likewise',
    'by the same token',
    'in the same way',
    'correspondingly',
    'comparatively',
    'on the other hand',
    'conversely',
    'however',
    'nevertheless',
    'nonetheless',
    'notwithstanding',
    'despite this',
    'in spite of this',
    'even so',
    'yet',
    'still',
    'although',
    'though',
    'while',
    'whereas'
  ];

  private valueIndicators = [
    'how to',
    'steps to',
    'method',
    'technique',
    'strategy',
    'approach',
    'process',
    'procedure',
    'system',
    'framework',
    'model',
    'benefit',
    'advantage',
    'result',
    'outcome',
    'solution',
    'answer',
    'example',
    'instance',
    'case study',
    'data',
    'research',
    'study',
    'analysis',
    'findings',
    'evidence',
    'proof',
    'statistics',
    'metrics',
    'measurement',
    'tool',
    'resource',
    'tip',
    'advice',
    'recommendation',
    'best practice',
    'guideline',
    'principle',
    'rule',
    'law',
    'formula',
    'equation',
    'calculation',
    'implementation',
    'execution',
    'application',
    'usage',
    'utilization'
  ];

  eliminateFillerContent(content: string): FillerDetectionResult {
    const originalSentences = this.splitIntoSentences(content);
    const changes: FillerDetectionResult['changes'] = [];
    const removedSentences: string[] = [];

    // Analyze each sentence for value
    const valuableSentences = originalSentences.filter(sentence => {
      const hasValue = this.hasDirectValue(sentence);
      const isFillerPhrase = this.isFillerPhrase(sentence);
      const isTransitionFluff = this.isTransitionFluff(sentence);

      if (!hasValue || isFillerPhrase || isTransitionFluff) {
        removedSentences.push(sentence);
        changes.push({
          type: 'filler',
          original: sentence,
          optimized: '',
          reason: this.getRemovalReason(sentence, hasValue, isFillerPhrase, isTransitionFluff)
        });
        return false;
      }

      return true;
    });

    // Remove filler phrases from remaining sentences
    const cleanedSentences = valuableSentences.map(sentence => {
      let cleanedSentence = sentence;
      let sentenceChanged = false;

      // Remove filler phrases within sentences
      this.fillerPhrases.forEach(phrase => {
        const regex = new RegExp(`\\b${phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
        if (regex.test(cleanedSentence)) {
          const original = cleanedSentence;
          cleanedSentence = cleanedSentence.replace(regex, '').replace(/\s+/g, ' ').trim();
          
          if (original !== cleanedSentence) {
            sentenceChanged = true;
          }
        }
      });

      // Clean up punctuation and spacing
      cleanedSentence = this.cleanupSentence(cleanedSentence);

      if (sentenceChanged) {
        changes.push({
          type: 'filler',
          original: sentence,
          optimized: cleanedSentence,
          reason: 'Removed filler phrases while preserving core message'
        });
      }

      return cleanedSentence;
    });

    const finalContent = cleanedSentences.join(' ');
    const fillerPercentage = originalSentences.length > 0 
      ? (removedSentences.length / originalSentences.length) * 100 
      : 0;

    return {
      content: finalContent,
      changes,
      fillerPercentage,
      removedSentences
    };
  }

  private hasDirectValue(sentence: string): boolean {
    const sentenceLower = sentence.toLowerCase();
    
    // Check for value indicators
    const hasValueIndicator = this.valueIndicators.some(indicator => 
      sentenceLower.includes(indicator.toLowerCase())
    );

    // Check for actionable content
    const actionWords = ['create', 'build', 'develop', 'implement', 'execute', 'perform', 'achieve', 'obtain', 'generate', 'produce'];
    const hasActionWord = actionWords.some(word => sentenceLower.includes(word));

    // Check for specific information
    const hasNumbers = /\d/.test(sentence);
    const hasSpecificTerms = /\b(percent|percentage|%|dollars?|\$|years?|months?|days?|hours?|minutes?)\b/i.test(sentence);

    // Check for concrete nouns (not abstract concepts)
    const concreteNouns = ['tool', 'system', 'method', 'process', 'technique', 'strategy', 'approach', 'solution', 'result', 'outcome'];
    const hasConcreteNoun = concreteNouns.some(noun => sentenceLower.includes(noun));

    // Sentence has value if it contains any of these elements
    return hasValueIndicator || hasActionWord || hasNumbers || hasSpecificTerms || hasConcreteNoun;
  }

  private isFillerPhrase(sentence: string): boolean {
    const sentenceLower = sentence.toLowerCase().trim();
    
    // Check if entire sentence is a filler phrase
    return this.fillerPhrases.some(phrase => {
      const phraseLower = phrase.toLowerCase();
      return sentenceLower === phraseLower || 
             sentenceLower.startsWith(phraseLower + ' ') ||
             sentenceLower.endsWith(' ' + phraseLower) ||
             (sentenceLower.length < 50 && sentenceLower.includes(phraseLower));
    });
  }

  private isTransitionFluff(sentence: string): boolean {
    const sentenceLower = sentence.toLowerCase().trim();
    const words = sentenceLower.split(/\s+/);
    
    // Check if sentence is mostly transition words
    if (words.length <= 5) {
      const transitionWordCount = words.filter(word => 
        this.transitionFluff.some(transition => transition.toLowerCase() === word)
      ).length;
      
      return transitionWordCount / words.length > 0.6;
    }
    
    return false;
  }

  private getRemovalReason(sentence: string, hasValue: boolean, isFillerPhrase: boolean, isTransitionFluff: boolean): string {
    if (isFillerPhrase) {
      return 'Removed filler phrase that adds no informational value';
    }
    if (isTransitionFluff) {
      return 'Removed transitional fluff that interrupts content flow';
    }
    if (!hasValue) {
      return 'Removed sentence lacking actionable information or specific value';
    }
    return 'Removed non-essential content';
  }

  private cleanupSentence(sentence: string): string {
    return sentence
      .replace(/\s+/g, ' ') // Multiple spaces to single space
      .replace(/\s+([,.!?;:])/g, '$1') // Remove space before punctuation
      .replace(/([,.!?;:])\s*([,.!?;:])/g, '$1 $2') // Fix punctuation spacing
      .replace(/^\s+|\s+$/g, '') // Trim
      .replace(/^[a-z]/, match => match.toUpperCase()); // Capitalize first letter
  }

  private splitIntoSentences(content: string): string[] {
    return content
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0)
      .map(s => s.charAt(0).toUpperCase() + s.slice(1));
  }

  analyzeContentValue(content: string): {
    totalSentences: number;
    valuableSentences: number;
    fillerSentences: number;
    fillerPercentage: number;
    valueScore: number;
    recommendations: string[];
  } {
    const sentences = this.splitIntoSentences(content);
    const valuableSentences = sentences.filter(sentence => this.hasDirectValue(sentence));
    const fillerSentences = sentences.filter(sentence => 
      this.isFillerPhrase(sentence) || this.isTransitionFluff(sentence) || !this.hasDirectValue(sentence)
    );

    const fillerPercentage = sentences.length > 0 ? (fillerSentences.length / sentences.length) * 100 : 0;
    const valueScore = sentences.length > 0 ? (valuableSentences.length / sentences.length) * 100 : 0;

    const recommendations: string[] = [];
    
    if (fillerPercentage > 20) {
      recommendations.push('Consider removing filler sentences to improve content density');
    }
    if (valueScore < 70) {
      recommendations.push('Add more actionable information and specific details');
    }
    if (sentences.length > 0 && valuableSentences.length / sentences.length < 0.6) {
      recommendations.push('Focus on sentences that provide direct value to readers');
    }

    return {
      totalSentences: sentences.length,
      valuableSentences: valuableSentences.length,
      fillerSentences: fillerSentences.length,
      fillerPercentage: Math.round(fillerPercentage * 100) / 100,
      valueScore: Math.round(valueScore * 100) / 100,
      recommendations
    };
  }

  identifyFillerContent(content: string): {
    fillerPhrases: Array<{ phrase: string; count: number; positions: number[] }>;
    fillerSentences: string[];
    suggestions: Array<{ original: string; suggestion: string; reason: string }>;
  } {
    const fillerPhrases: Array<{ phrase: string; count: number; positions: number[] }> = [];
    const fillerSentences: string[] = [];
    const suggestions: Array<{ original: string; suggestion: string; reason: string }> = [];

    // Find filler phrases
    this.fillerPhrases.forEach(phrase => {
      const regex = new RegExp(`\\b${phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      const matches = [...content.matchAll(regex)];
      
      if (matches.length > 0) {
        const positions = matches.map(match => match.index || 0);
        fillerPhrases.push({
          phrase,
          count: matches.length,
          positions
        });

        suggestions.push({
          original: phrase,
          suggestion: 'Remove this filler phrase',
          reason: 'Adds no informational value'
        });
      }
    });

    // Find filler sentences
    const sentences = this.splitIntoSentences(content);
    sentences.forEach(sentence => {
      if (this.isFillerPhrase(sentence) || this.isTransitionFluff(sentence) || !this.hasDirectValue(sentence)) {
        fillerSentences.push(sentence);
        
        suggestions.push({
          original: sentence,
          suggestion: 'Remove or rewrite with specific, actionable content',
          reason: 'Lacks direct value or contains only filler content'
        });
      }
    });

    return {
      fillerPhrases,
      fillerSentences,
      suggestions
    };
  }
}