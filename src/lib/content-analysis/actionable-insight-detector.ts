import nlp from 'compromise';

export interface InsightAnalysis {
  totalSentences: number;
  actionableSentences: number;
  insightDensity: number;
  practicalAdviceCount: number;
  implementationSteps: string[];
  actionableCategories: Record<string, number>;
  confidenceScore: number;
}

export class ActionableInsightDetector {
  private actionableCategories = {
    instruction: ['follow', 'implement', 'apply', 'use', 'try', 'do', 'create', 'build', 'make', 'develop'],
    suggestion: ['consider', 'could', 'might', 'may', 'suggest', 'recommend', 'advise'],
    requirement: ['should', 'must', 'need to', 'have to', 'required', 'necessary', 'essential'],
    process: ['start by', 'next step', 'first', 'then', 'finally', 'lastly', 'begin with'],
    enablement: ['to achieve', 'you can', 'allows you to', 'enables', 'helps you', 'lets you'],
    prevention: ['avoid', 'prevent', 'don\'t', 'never', 'be careful not to', 'watch out for']
  };

  /**
   * Measures the density of actionable insights in content
   */
  measureInsightDensity(content: string): InsightAnalysis {
    const sentences = this.splitIntoSentences(content);
    
    if (sentences.length === 0) {
      return {
        totalSentences: 0,
        actionableSentences: 0,
        insightDensity: 0,
        practicalAdviceCount: 0,
        implementationSteps: [],
        actionableCategories: {},
        confidenceScore: 0
      };
    }
    
    // Track actionable sentences and their categories
    const actionableSentences: string[] = [];
    const categoryCounts: Record<string, number> = {};
    
    // Initialize category counts
    Object.keys(this.actionableCategories).forEach(category => {
      categoryCounts[category] = 0;
    });
    
    // Analyze each sentence
    sentences.forEach(sentence => {
      const actionableResult = this.analyzeActionableSentence(sentence);
      
      if (actionableResult.isActionable) {
        actionableSentences.push(sentence);
        
        // Increment category counts
        actionableResult.categories.forEach(category => {
          categoryCounts[category] = (categoryCounts[category] || 0) + 1;
        });
      }
    });
    
    // Extract implementation steps
    const implementationSteps = this.extractImplementationSteps(content);
    
    // Count practical advice instances
    const practicalAdviceCount = this.countPracticalAdvice(content);
    
    // Calculate confidence score based on multiple factors
    const confidenceScore = this.calculateConfidenceScore(
      actionableSentences.length / sentences.length,
      implementationSteps.length,
      practicalAdviceCount,
      categoryCounts
    );
    
    return {
      totalSentences: sentences.length,
      actionableSentences: actionableSentences.length,
      insightDensity: (actionableSentences.length / sentences.length) * 100,
      practicalAdviceCount,
      implementationSteps,
      actionableCategories: categoryCounts,
      confidenceScore
    };
  }

  /**
   * Splits content into sentences
   */
  private splitIntoSentences(content: string): string[] {
    // Simple sentence splitting - can be enhanced with better NLP
    return content
      .split(/[.!?]+/)
      .map(sentence => sentence.trim())
      .filter(sentence => sentence.length > 0);
  }

  /**
   * Analyzes a sentence to determine if it's actionable and which categories it belongs to
   */
  private analyzeActionableSentence(sentence: string): { isActionable: boolean; categories: string[] } {
    const lowerSentence = sentence.toLowerCase();
    const matchedCategories: string[] = [];
    
    // Check each category for matches
    for (const [category, indicators] of Object.entries(this.actionableCategories)) {
      for (const indicator of indicators) {
        if (lowerSentence.includes(indicator)) {
          matchedCategories.push(category);
          break; // Only count each category once per sentence
        }
      }
    }
    
    return {
      isActionable: matchedCategories.length > 0,
      categories: matchedCategories
    };
  }

  /**
   * Counts instances of practical advice in content
   */
  private countPracticalAdvice(content: string): number {
    // Use NLP to identify advice patterns
    const doc = nlp(content);
    let count = 0;
    
    // Count advice keywords
    const adviceKeywords = ['tip', 'advice', 'recommendation', 'strategy', 'guideline', 'best practice'];
    adviceKeywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}s?\\b`, 'gi');
      count += (content.match(regex) || []).length;
    });
    
    // Count imperative verbs at the beginning of sentences (simplified)
    const imperativePatterns = /^(start|begin|create|make|build|develop|implement|use|try|consider|remember|ensure|avoid|check|verify|test|analyze|review|update|optimize|improve)/gim;
    const imperativeMatches = content.match(imperativePatterns);
    count += imperativeMatches ? imperativeMatches.length : 0;
    
    // Count "how to" phrases
    const howToMatches = content.match(/how to \\w+/gi);
    count += howToMatches ? howToMatches.length : 0;
    
    return count;
  }

  /**
   * Extracts implementation steps from content
   */
  private extractImplementationSteps(content: string): string[] {
    const steps: string[] = [];
    const lines = content.split('\n');
    
    // Check for numbered lists (e.g., "1. Step one")
    lines.forEach(line => {
      const numberedMatch = line.match(/^\\s*(\\d+)\\.\\s+(.+)$/);
      if (numberedMatch) {
        steps.push(numberedMatch[2].trim());
      }
    });
    
    // Check for bullet points
    lines.forEach(line => {
      const bulletMatch = line.match(/^\\s*[\\-\\*•]\\s+(.+)$/);
      if (bulletMatch) {
        steps.push(bulletMatch[1].trim());
      }
    });
    
    // Check for step-by-step instructions in paragraphs
    const stepPhrases = [
      'first', 'second', 'third', 'fourth', 'fifth',
      'next', 'then', 'finally', 'lastly', 'to begin'
    ];
    
    // Simplified step extraction using regex
    stepPhrases.forEach(phrase => {
      const regex = new RegExp(`\\b${phrase}\\b[^.!?]*[.!?]`, 'gi');
      const matches = content.match(regex) || [];
      matches.forEach(match => {
        const cleanMatch = match.trim();
        if (!steps.includes(cleanMatch)) {
          steps.push(cleanMatch);
        }
      });
    });
    
    return steps;
  }

  /**
   * Calculates confidence score for actionable insight detection
   */
  private calculateConfidenceScore(
    densityRatio: number,
    stepCount: number,
    adviceCount: number,
    categoryCounts: Record<string, number>
  ): number {
    // Base score from density ratio (0-0.5)
    let score = densityRatio * 0.5;
    
    // Add points for implementation steps (0-0.2)
    score += Math.min(stepCount / 10, 1) * 0.2;
    
    // Add points for practical advice (0-0.1)
    score += Math.min(adviceCount / 5, 1) * 0.1;
    
    // Add points for category diversity (0-0.2)
    const categoryCount = Object.values(categoryCounts).filter(count => count > 0).length;
    score += (categoryCount / Object.keys(this.actionableCategories).length) * 0.2;
    
    // Ensure score is between 0 and 1
    return Math.min(Math.max(score, 0), 1);
  }
}