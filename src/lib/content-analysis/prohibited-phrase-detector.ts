
export interface ProhibitedPhrase {
  phrase: string;
  replacementSuggestions: string[];
  category: 'overused_seo' | 'filler' | 'cliche' | 'redundant' | 'weak' | 'ai_typical';
  severity: number; // 1-5 scale
  context?: string[];
  isRegex?: boolean;
}

export interface PhraseDetectionResult {
  phrase: string;
  suggestions: string[];
  category: string;
  severity: number;
  positions: number[];
  context: string[];
}

export interface PhraseQualityScore {
  overallScore: number;
  detectedPhrases: number;
  highSeverityCount: number;
  categoryBreakdown: { [key: string]: number };
  recommendations: string[];
}

export class ProhibitedPhraseDetector {
  private prohibitedPhrases: ProhibitedPhrase[] = [
    // Overused SEO terms (as specified in story)
    { phrase: 'meticulous', replacementSuggestions: ['careful', 'thorough', 'detailed', 'precise'], category: 'overused_seo', severity: 4 },
    { phrase: 'navigating', replacementSuggestions: ['managing', 'handling', 'addressing', 'dealing with'], category: 'overused_seo', severity: 4 },
    { phrase: 'complexities', replacementSuggestions: ['challenges', 'difficulties', 'intricacies', 'complications'], category: 'overused_seo', severity: 4 },
    { phrase: 'realm', replacementSuggestions: ['field', 'area', 'domain', 'sector'], category: 'overused_seo', severity: 5 },
    { phrase: 'bespoke', replacementSuggestions: ['custom', 'tailored', 'personalized', 'specialized'], category: 'overused_seo', severity: 5 },
    { phrase: 'tailored', replacementSuggestions: ['customized', 'personalized', 'adapted', 'designed'], category: 'overused_seo', severity: 3 },
    
    // Additional overused SEO terms
    { phrase: 'synergy', replacementSuggestions: ['collaboration', 'cooperation', 'partnership', 'teamwork'], category: 'overused_seo', severity: 4 },
    { phrase: 'paradigm', replacementSuggestions: ['model', 'approach', 'framework', 'system'], category: 'overused_seo', severity: 4 },
    { phrase: 'leverage', replacementSuggestions: ['use', 'utilize', 'employ', 'apply'], category: 'overused_seo', severity: 3 },
    { phrase: 'holistic', replacementSuggestions: ['comprehensive', 'complete', 'integrated', 'unified'], category: 'overused_seo', severity: 3 },
    { phrase: 'cutting-edge', replacementSuggestions: ['advanced', 'innovative', 'modern', 'state-of-the-art'], category: 'overused_seo', severity: 4 },
    { phrase: 'game-changing', replacementSuggestions: ['revolutionary', 'transformative', 'significant', 'important'], category: 'overused_seo', severity: 4 },
    { phrase: 'seamless', replacementSuggestions: ['smooth', 'effortless', 'integrated', 'unified'], category: 'overused_seo', severity: 3 },
    { phrase: 'robust', replacementSuggestions: ['strong', 'reliable', 'durable', 'comprehensive'], category: 'overused_seo', severity: 3 },
    { phrase: 'scalable', replacementSuggestions: ['expandable', 'flexible', 'adaptable', 'growable'], category: 'overused_seo', severity: 3 },
    { phrase: 'innovative', replacementSuggestions: ['creative', 'original', 'new', 'advanced'], category: 'overused_seo', severity: 3 },
    { phrase: 'groundbreaking', replacementSuggestions: ['pioneering', 'revolutionary', 'innovative', 'novel'], category: 'overused_seo', severity: 4 },
    { phrase: 'streamlined', replacementSuggestions: ['simplified', 'efficient', 'optimized', 'improved'], category: 'overused_seo', severity: 3 },
    { phrase: 'next-level', replacementSuggestions: ['advanced', 'superior', 'enhanced', 'improved'], category: 'overused_seo', severity: 4 },
    { phrase: 'world-class', replacementSuggestions: ['excellent', 'superior', 'high-quality', 'outstanding'], category: 'overused_seo', severity: 4 },
    
    // Filler words and phrases
    { phrase: 'very', replacementSuggestions: [''], category: 'filler', severity: 2 },
    { phrase: 'really', replacementSuggestions: [''], category: 'filler', severity: 2 },
    { phrase: 'quite', replacementSuggestions: [''], category: 'filler', severity: 2 },
    { phrase: 'rather', replacementSuggestions: [''], category: 'filler', severity: 2 },
    { phrase: 'actually', replacementSuggestions: [''], category: 'filler', severity: 2 },
    { phrase: 'basically', replacementSuggestions: [''], category: 'filler', severity: 3 },
    { phrase: 'essentially', replacementSuggestions: [''], category: 'filler', severity: 2 },
    { phrase: 'literally', replacementSuggestions: [''], category: 'filler', severity: 3 },
    { phrase: 'obviously', replacementSuggestions: [''], category: 'filler', severity: 3 },
    { phrase: 'clearly', replacementSuggestions: [''], category: 'filler', severity: 2 },
    { phrase: 'of course', replacementSuggestions: [''], category: 'filler', severity: 2 },
    { phrase: 'needless to say', replacementSuggestions: [''], category: 'filler', severity: 4 },
    { phrase: 'it goes without saying', replacementSuggestions: [''], category: 'filler', severity: 4 },
    { phrase: 'to be honest', replacementSuggestions: [''], category: 'filler', severity: 3 },
    { phrase: 'in my opinion', replacementSuggestions: [''], category: 'filler', severity: 2 },
    { phrase: 'I think', replacementSuggestions: [''], category: 'filler', severity: 2 },
    { phrase: 'I believe', replacementSuggestions: [''], category: 'filler', severity: 2 },
    
    // Cliches and weak phrases
    { phrase: 'think outside the box', replacementSuggestions: ['be creative', 'innovate', 'find new approaches', 'explore alternatives'], category: 'cliche', severity: 4 },
    { phrase: 'at the end of the day', replacementSuggestions: ['ultimately', 'finally', 'in conclusion', 'most importantly'], category: 'cliche', severity: 4 },
    { phrase: 'low-hanging fruit', replacementSuggestions: ['easy opportunities', 'simple solutions', 'quick wins', 'accessible options'], category: 'cliche', severity: 4 },
    { phrase: 'move the needle', replacementSuggestions: ['make progress', 'create impact', 'drive results', 'achieve change'], category: 'cliche', severity: 4 },
    { phrase: 'circle back', replacementSuggestions: ['follow up', 'revisit', 'return to', 'discuss later'], category: 'cliche', severity: 3 },
    { phrase: 'touch base', replacementSuggestions: ['connect', 'contact', 'communicate', 'meet'], category: 'cliche', severity: 3 },
    { phrase: 'deep dive', replacementSuggestions: ['thorough analysis', 'detailed examination', 'comprehensive review', 'in-depth study'], category: 'cliche', severity: 3 },
    { phrase: 'drill down', replacementSuggestions: ['examine closely', 'analyze in detail', 'investigate thoroughly', 'explore deeply'], category: 'cliche', severity: 3 },
    { phrase: 'ballpark figure', replacementSuggestions: ['estimate', 'approximation', 'rough calculation', 'preliminary number'], category: 'cliche', severity: 3 },
    { phrase: 'best practices', replacementSuggestions: ['proven methods', 'effective approaches', 'recommended techniques', 'standard procedures'], category: 'cliche', severity: 2 },
    
    // Redundant phrases
    { phrase: 'advance planning', replacementSuggestions: ['planning'], category: 'redundant', severity: 3 },
    { phrase: 'future plans', replacementSuggestions: ['plans'], category: 'redundant', severity: 3 },
    { phrase: 'end result', replacementSuggestions: ['result'], category: 'redundant', severity: 3 },
    { phrase: 'final outcome', replacementSuggestions: ['outcome'], category: 'redundant', severity: 3 },
    { phrase: 'past history', replacementSuggestions: ['history'], category: 'redundant', severity: 3 },
    { phrase: 'close proximity', replacementSuggestions: ['proximity'], category: 'redundant', severity: 3 },
    { phrase: 'added bonus', replacementSuggestions: ['bonus'], category: 'redundant', severity: 3 },
    { phrase: 'basic fundamentals', replacementSuggestions: ['fundamentals'], category: 'redundant', severity: 3 },
    { phrase: 'completely finished', replacementSuggestions: ['finished'], category: 'redundant', severity: 3 },
    { phrase: 'absolutely essential', replacementSuggestions: ['essential'], category: 'redundant', severity: 3 },
    
    // Weak or vague terms
    { phrase: 'stuff', replacementSuggestions: ['items', 'materials', 'components', 'elements'], category: 'weak', severity: 3 },
    { phrase: 'things', replacementSuggestions: ['items', 'elements', 'factors', 'aspects'], category: 'weak', severity: 3 },
    { phrase: 'a lot', replacementSuggestions: ['many', 'numerous', 'substantial', 'significant'], category: 'weak', severity: 2 },
    { phrase: 'sort of', replacementSuggestions: ['somewhat', 'partially', 'to some extent'], category: 'weak', severity: 2 },
    { phrase: 'kind of', replacementSuggestions: ['somewhat', 'partially', 'to some extent'], category: 'weak', severity: 2 },
    { phrase: 'pretty much', replacementSuggestions: ['mostly', 'largely', 'essentially'], category: 'weak', severity: 2 },
    { phrase: 'something like', replacementSuggestions: ['approximately', 'roughly', 'about'], category: 'weak', severity: 2 },
    { phrase: 'more or less', replacementSuggestions: ['approximately', 'roughly', 'about'], category: 'weak', severity: 2 },
    
    // AI-typical phrases (common in AI-generated content)
    { phrase: 'delve into', replacementSuggestions: ['explore', 'examine', 'investigate', 'study'], category: 'ai_typical', severity: 4 },
    { phrase: 'it is worth noting', replacementSuggestions: ['notably', 'importantly', 'significantly'], category: 'ai_typical', severity: 3 },
    { phrase: 'it is important to note', replacementSuggestions: ['notably', 'importantly', 'significantly'], category: 'ai_typical', severity: 3 },
    { phrase: 'it should be noted', replacementSuggestions: ['notably', 'importantly', 'significantly'], category: 'ai_typical', severity: 3 },
    { phrase: 'furthermore', replacementSuggestions: ['additionally', 'also', 'moreover', 'in addition'], category: 'ai_typical', severity: 2 },
    { phrase: 'moreover', replacementSuggestions: ['additionally', 'also', 'furthermore', 'in addition'], category: 'ai_typical', severity: 2 },
    { phrase: 'in conclusion', replacementSuggestions: ['finally', 'ultimately', 'in summary'], category: 'ai_typical', severity: 2 },
    { phrase: 'in summary', replacementSuggestions: ['finally', 'ultimately', 'in conclusion'], category: 'ai_typical', severity: 2 },
    { phrase: 'comprehensive guide', replacementSuggestions: ['complete guide', 'thorough guide', 'detailed guide'], category: 'ai_typical', severity: 3 },
    { phrase: 'ultimate guide', replacementSuggestions: ['complete guide', 'thorough guide', 'detailed guide'], category: 'ai_typical', severity: 4 },
    { phrase: 'dive deep', replacementSuggestions: ['explore thoroughly', 'examine closely', 'investigate carefully'], category: 'ai_typical', severity: 3 },
  ];

  detectProhibitedPhrases(content: string): PhraseDetectionResult[] {
    const detected: PhraseDetectionResult[] = [];
    
    this.prohibitedPhrases.forEach(item => {
      const regex = new RegExp(item.phrase, 'gi');
      const matches = content.match(regex);
      
      if (matches) {
        const positions: number[] = [];
        const context: string[] = [];
        
        // Find all positions and contexts
        let match;
        const globalRegex = new RegExp(item.phrase, 'gi');
        while ((match = globalRegex.exec(content)) !== null) {
          positions.push(match.index);
          context.push(this.extractContext(content, match.index, item.phrase.length));
        }
        
        detected.push({
          phrase: item.phrase,
          suggestions: item.replacementSuggestions,
          category: item.category,
          severity: item.severity,
          positions,
          context
        });
      }
    });
    
    return detected;
  }




  private getContextAwareReplacement(match: string, suggestions: string[], context?: string): string {
    return suggestions[0] || '';
  }

  // Enhanced elimination method with better context awareness
  eliminateProhibitedPhrasesWithContext(content: string): string {
    let newContent = content;
    
    // Sort by severity (highest first) to handle most critical issues first
    const sortedPhrases = [...this.prohibitedPhrases].sort((a, b) => b.severity - a.severity);
    
    sortedPhrases.forEach(item => {
      const regex = new RegExp(item.phrase, 'gi');
      
      // Enhanced context-aware replacement
      newContent = newContent.replace(regex, (match, offset) => {
        const context = this.extractContext(newContent, offset, item.phrase.length);
        return this.getContextAwareReplacement(match, item.replacementSuggestions, context);
      });
    });
    
    return newContent;
  }

  // Override the original method to use the enhanced version
  eliminateProhibitedPhrases(content: string): string {
    return this.eliminateProhibitedPhrasesWithContext(content);
  }

  private extractContext(content: string, position: number, phraseLength: number): string {
    const contextRadius = 50;
    const start = Math.max(0, position - contextRadius);
    const end = Math.min(content.length, position + phraseLength + contextRadius);
    
    return content.substring(start, end);
  }

  calculatePhraseQualityScore(content: string): PhraseQualityScore {
    const detected = this.detectProhibitedPhrases(content);
    const totalWords = content.split(/\s+/).length;
    
    // Calculate category breakdown
    const categoryBreakdown: { [key: string]: number } = {};
    detected.forEach(phrase => {
      categoryBreakdown[phrase.category] = (categoryBreakdown[phrase.category] || 0) + 1;
    });
    
    // Calculate severity counts
    const highSeverityCount = detected.filter(p => p.severity >= 4).length;
    
    // Calculate overall score (0-100)
    const penaltyPerPhrase = Math.min(5, 100 / totalWords); // Max 5 points per phrase
    const severityMultiplier = detected.reduce((sum, phrase) => sum + phrase.severity, 0) / detected.length || 1;
    const totalPenalty = detected.length * penaltyPerPhrase * severityMultiplier;
    const overallScore = Math.max(0, 100 - totalPenalty);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(detected, categoryBreakdown);
    
    return {
      overallScore: Math.round(overallScore),
      detectedPhrases: detected.length,
      highSeverityCount,
      categoryBreakdown,
      recommendations
    };
  }

  private generateRecommendations(detected: PhraseDetectionResult[], categoryBreakdown: { [key: string]: number }): string[] {
    const recommendations: string[] = [];
    
    if (detected.length === 0) {
      recommendations.push('Excellent! No prohibited phrases detected.');
      return recommendations;
    }
    
    // General recommendation
    recommendations.push(`Found ${detected.length} prohibited phrases that should be replaced.`);
    
    // Category-specific recommendations
    if (categoryBreakdown['overused_seo']) {
      recommendations.push(`${categoryBreakdown['overused_seo']} overused SEO terms detected. Replace with more specific, natural language.`);
    }
    
    if (categoryBreakdown['filler']) {
      recommendations.push(`${categoryBreakdown['filler']} filler words found. Remove these to improve content density.`);
    }
    
    if (categoryBreakdown['cliche']) {
      recommendations.push(`${categoryBreakdown['cliche']} cliches detected. Use more original, specific language.`);
    }
    
    if (categoryBreakdown['redundant']) {
      recommendations.push(`${categoryBreakdown['redundant']} redundant phrases found. Simplify for better readability.`);
    }
    
    if (categoryBreakdown['weak']) {
      recommendations.push(`${categoryBreakdown['weak']} weak or vague terms detected. Use more precise language.`);
    }
    
    if (categoryBreakdown['ai_typical']) {
      recommendations.push(`${categoryBreakdown['ai_typical']} AI-typical phrases found. Replace with more human-like expressions.`);
    }
    
    // Severity-based recommendations
    const highSeverity = detected.filter(p => p.severity >= 4).length;
    if (highSeverity > 0) {
      recommendations.push(`${highSeverity} high-priority phrases need immediate attention.`);
    }
    
    return recommendations;
  }

  // Method to add custom prohibited phrases
  addProhibitedPhrase(phrase: ProhibitedPhrase): void {
    this.prohibitedPhrases.push(phrase);
  }

  // Method to remove prohibited phrases
  removeProhibitedPhrase(phrase: string): void {
    this.prohibitedPhrases = this.prohibitedPhrases.filter(p => p.phrase !== phrase);
  }

  // Method to get all prohibited phrases by category
  getProhibitedPhrasesByCategory(category: string): ProhibitedPhrase[] {
    return this.prohibitedPhrases.filter(p => p.category === category);
  }

  // Method to get statistics about prohibited phrases
  getPhraseDatabaseStats(): {
    totalPhrases: number;
    byCategory: { [key: string]: number };
    bySeverity: { [key: number]: number };
  } {
    const byCategory: { [key: string]: number } = {};
    const bySeverity: { [key: number]: number } = {};
    
    this.prohibitedPhrases.forEach(phrase => {
      byCategory[phrase.category] = (byCategory[phrase.category] || 0) + 1;
      bySeverity[phrase.severity] = (bySeverity[phrase.severity] || 0) + 1;
    });
    
    return {
      totalPhrases: this.prohibitedPhrases.length,
      byCategory,
      bySeverity
    };
  }
}
