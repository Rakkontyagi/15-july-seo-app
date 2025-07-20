
import { SentenceTokenizer, WordTokenizer } from 'natural';
import compromise from 'compromise';

export interface SearchIntent {
  type: 'informational' | 'navigational' | 'transactional' | 'commercial';
  confidence: number;
  indicators: string[];
  subtype?: string;
  urgency: 'low' | 'medium' | 'high';
}

export interface IntentSignal {
  signal: string;
  weight: number;
  type: SearchIntent['type'];
  context: string;
}

export interface IntentSatisfactionScore {
  overallScore: number;
  informationalScore: number;
  navigationalScore: number;
  transactionalScore: number;
  commercialScore: number;
  contentGaps: string[];
  recommendations: string[];
}

export interface UserBehaviorPattern {
  searchQuery: string;
  expectedContentType: string;
  satisfactionIndicators: string[];
  bounceRiskFactors: string[];
  engagementTriggers: string[];
}

export interface IntentAlignmentResult {
  originalContent: string;
  optimizedContent: string;
  originalIntent: SearchIntent;
  targetIntent: SearchIntent;
  alignmentScore: number;
  satisfactionScore: IntentSatisfactionScore;
  modificationsApplied: number;
  userBehaviorAlignment: number;
}

export interface CompetitorIntentAnalysis {
  dominantIntent: SearchIntent;
  intentDistribution: { [key: string]: number };
  satisfactionFactors: string[];
  contentStrategies: string[];
  userBehaviorPatterns: UserBehaviorPattern[];
}

export class UserIntentAlignmentSystem {
  private readonly sentenceTokenizer = new SentenceTokenizer();
  private readonly wordTokenizer = new WordTokenizer();
  
  // Intent classification patterns
  private readonly intentPatterns = {
    informational: {
      keywords: ['how', 'what', 'why', 'when', 'where', 'guide', 'tutorial', 'learn', 'understand', 'explain'],
      phrases: ['how to', 'what is', 'why does', 'guide to', 'learn about', 'understand the'],
      weight: 1.0
    },
    navigational: {
      keywords: ['login', 'sign in', 'download', 'contact', 'about', 'official', 'website', 'homepage'],
      phrases: ['official website', 'login page', 'contact us', 'download page', 'sign in'],
      weight: 1.0
    },
    transactional: {
      keywords: ['buy', 'purchase', 'order', 'cart', 'checkout', 'payment', 'price', 'cost', 'discount'],
      phrases: ['buy now', 'add to cart', 'purchase online', 'order now', 'checkout process'],
      weight: 1.0
    },
    commercial: {
      keywords: ['best', 'top', 'review', 'compare', 'vs', 'versus', 'alternative', 'recommendation'],
      phrases: ['best practices', 'top rated', 'product review', 'compare products', 'vs comparison'],
      weight: 1.0
    }
  };

  /**
   * Classify search intent from content and query
   */
  classifySearchIntent(query: string, content?: string): SearchIntent {
    const combinedText = `${query} ${content || ''}`.toLowerCase();
    const intentScores = this.calculateIntentScores(combinedText);
    
    // Find dominant intent
    const dominantIntent = Object.entries(intentScores)
      .sort(([, a], [, b]) => b - a)[0];
    
    const [intentType, confidence] = dominantIntent;
    const indicators = this.extractIntentIndicators(combinedText, intentType as SearchIntent['type']);
    const subtype = this.determineSubtype(intentType as SearchIntent['type'], combinedText);
    const urgency = this.calculateUrgency(combinedText);

    return {
      type: intentType as SearchIntent['type'],
      confidence,
      indicators,
      subtype,
      urgency
    };
  }

  /**
   * Analyze user behavior patterns from search queries
   */
  analyzeUserBehaviorPatterns(searchQueries: string[], contentSamples: string[]): UserBehaviorPattern[] {
    const patterns: UserBehaviorPattern[] = [];

    searchQueries.forEach((query, index) => {
      const content = contentSamples[index] || '';
      const intent = this.classifySearchIntent(query, content);
      
      const pattern: UserBehaviorPattern = {
        searchQuery: query,
        expectedContentType: this.mapIntentToContentType(intent.type),
        satisfactionIndicators: this.identifySatisfactionIndicators(query, content),
        bounceRiskFactors: this.identifyBounceRiskFactors(query, content),
        engagementTriggers: this.identifyEngagementTriggers(query, content)
      };

      patterns.push(pattern);
    });

    return patterns;
  }

  /**
   * Calculate intent satisfaction score
   */
  calculateIntentSatisfactionScore(content: string, targetIntent: SearchIntent): IntentSatisfactionScore {
    const contentIntent = this.classifySearchIntent('', content);
    
    // Calculate type-specific scores
    const informationalScore = this.calculateInformationalSatisfaction(content);
    const navigationalScore = this.calculateNavigationalSatisfaction(content);
    const transactionalScore = this.calculateTransactionalSatisfaction(content);
    const commercialScore = this.calculateCommercialSatisfaction(content);

    // Weight scores based on target intent
    const intentWeights = {
      informational: targetIntent.type === 'informational' ? 1.0 : 0.3,
      navigational: targetIntent.type === 'navigational' ? 1.0 : 0.3,
      transactional: targetIntent.type === 'transactional' ? 1.0 : 0.3,
      commercial: targetIntent.type === 'commercial' ? 1.0 : 0.3
    };

    const overallScore = (
      informationalScore * intentWeights.informational +
      navigationalScore * intentWeights.navigational +
      transactionalScore * intentWeights.transactional +
      commercialScore * intentWeights.commercial
    ) / (intentWeights.informational + intentWeights.navigational + intentWeights.transactional + intentWeights.commercial);

    const contentGaps = this.identifyContentGaps(content, targetIntent);
    const recommendations = this.generateIntentRecommendations(content, targetIntent);

    return {
      overallScore,
      informationalScore,
      navigationalScore,
      transactionalScore,
      commercialScore,
      contentGaps,
      recommendations
    };
  }

  /**
   * Align content with target intent
   */
  alignContentWithIntent(content: string, targetIntent: SearchIntent): IntentAlignmentResult {
    const originalContent = content;
    const originalIntent = this.classifySearchIntent('', content);
    
    let optimizedContent = content;
    let modificationsApplied = 0;

    // Apply intent-specific optimizations
    switch (targetIntent.type) {
      case 'informational':
        const infoResult = this.optimizeForInformationalIntent(optimizedContent, targetIntent);
        optimizedContent = infoResult.content;
        modificationsApplied += infoResult.modifications;
        break;
        
      case 'navigational':
        const navResult = this.optimizeForNavigationalIntent(optimizedContent, targetIntent);
        optimizedContent = navResult.content;
        modificationsApplied += navResult.modifications;
        break;
        
      case 'transactional':
        const transResult = this.optimizeForTransactionalIntent(optimizedContent, targetIntent);
        optimizedContent = transResult.content;
        modificationsApplied += transResult.modifications;
        break;
        
      case 'commercial':
        const commResult = this.optimizeForCommercialIntent(optimizedContent, targetIntent);
        optimizedContent = commResult.content;
        modificationsApplied += commResult.modifications;
        break;
    }

    // Calculate final scores
    const alignmentScore = this.calculateAlignmentScore(originalIntent, targetIntent, optimizedContent);
    const satisfactionScore = this.calculateIntentSatisfactionScore(optimizedContent, targetIntent);
    const userBehaviorAlignment = this.calculateUserBehaviorAlignment(optimizedContent, targetIntent);

    return {
      originalContent,
      optimizedContent,
      originalIntent,
      targetIntent,
      alignmentScore,
      satisfactionScore,
      modificationsApplied,
      userBehaviorAlignment
    };
  }

  /**
   * Analyze competitor intent strategies
   */
  analyzeCompetitorIntentStrategy(competitorContents: string[], searchQueries: string[]): CompetitorIntentAnalysis {
    const intentCounts = { informational: 0, navigational: 0, transactional: 0, commercial: 0 };
    const allSatisfactionFactors: string[] = [];
    const allContentStrategies: string[] = [];
    
    // Analyze each competitor's content
    competitorContents.forEach(content => {
      const intent = this.classifySearchIntent('', content);
      intentCounts[intent.type]++;
      
      const satisfactionFactors = this.extractSatisfactionFactors(content, intent);
      allSatisfactionFactors.push(...satisfactionFactors);
      
      const contentStrategies = this.extractContentStrategies(content, intent);
      allContentStrategies.push(...contentStrategies);
    });

    // Calculate intent distribution
    const totalContent = competitorContents.length;
    const intentDistribution = {
      informational: (intentCounts.informational / totalContent) * 100,
      navigational: (intentCounts.navigational / totalContent) * 100,
      transactional: (intentCounts.transactional / totalContent) * 100,
      commercial: (intentCounts.commercial / totalContent) * 100
    };

    // Determine dominant intent
    const dominantIntentType = Object.entries(intentDistribution)
      .sort(([, a], [, b]) => b - a)[0][0] as SearchIntent['type'];
    
    const dominantIntent: SearchIntent = {
      type: dominantIntentType,
      confidence: intentDistribution[dominantIntentType] / 100,
      indicators: [...new Set(allSatisfactionFactors)],
      urgency: 'medium'
    };

    // Analyze user behavior patterns
    const userBehaviorPatterns = this.analyzeUserBehaviorPatterns(searchQueries, competitorContents);

    return {
      dominantIntent,
      intentDistribution,
      satisfactionFactors: [...new Set(allSatisfactionFactors)],
      contentStrategies: [...new Set(allContentStrategies)],
      userBehaviorPatterns
    };
  }

  /**
   * Calculate intent scores for text
   */
  private calculateIntentScores(text: string): { [key: string]: number } {
    const scores = { informational: 0, navigational: 0, transactional: 0, commercial: 0 };
    
    Object.entries(this.intentPatterns).forEach(([intentType, patterns]) => {
      // Score keywords
      patterns.keywords.forEach(keyword => {
        const matches = (text.match(new RegExp(`\\b${keyword}\\b`, 'gi')) || []).length;
        scores[intentType] += matches * patterns.weight;
      });
      
      // Score phrases (higher weight)
      patterns.phrases.forEach(phrase => {
        const matches = (text.match(new RegExp(phrase, 'gi')) || []).length;
        scores[intentType] += matches * patterns.weight * 2;
      });
    });

    // Normalize scores
    const maxScore = Math.max(...Object.values(scores));
    if (maxScore > 0) {
      Object.keys(scores).forEach(key => {
        scores[key] = Math.min(1, scores[key] / maxScore);
      });
    }

    return scores;
  }

  /**
   * Extract intent indicators from text
   */
  private extractIntentIndicators(text: string, intentType: SearchIntent['type']): string[] {
    const indicators: string[] = [];
    const patterns = this.intentPatterns[intentType];
    
    patterns.keywords.forEach(keyword => {
      if (text.includes(keyword)) {
        indicators.push(keyword);
      }
    });
    
    patterns.phrases.forEach(phrase => {
      if (text.includes(phrase)) {
        indicators.push(phrase);
      }
    });

    return indicators;
  }

  /**
   * Determine intent subtype
   */
  private determineSubtype(intentType: SearchIntent['type'], text: string): string {
    const subtypes = {
      informational: ['how-to', 'definition', 'explanation', 'tutorial', 'guide'],
      navigational: ['homepage', 'login', 'contact', 'download', 'specific-page'],
      transactional: ['purchase', 'booking', 'subscription', 'download', 'signup'],
      commercial: ['comparison', 'review', 'recommendation', 'best-of', 'alternative']
    };

    const typeSubtypes = subtypes[intentType];
    
    for (const subtype of typeSubtypes) {
      const subtypeKeywords = {
        'how-to': ['how to', 'step by step', 'instructions'],
        'definition': ['what is', 'define', 'meaning'],
        'explanation': ['why', 'explain', 'because'],
        'tutorial': ['tutorial', 'guide', 'learn'],
        'guide': ['guide', 'manual', 'handbook'],
        'homepage': ['home', 'main', 'index'],
        'login': ['login', 'sign in', 'access'],
        'contact': ['contact', 'support', 'help'],
        'download': ['download', 'get', 'install'],
        'specific-page': ['page', 'section', 'area'],
        'purchase': ['buy', 'purchase', 'order'],
        'booking': ['book', 'reserve', 'schedule'],
        'subscription': ['subscribe', 'membership', 'plan'],
        'signup': ['sign up', 'register', 'join'],
        'comparison': ['vs', 'versus', 'compare'],
        'review': ['review', 'rating', 'feedback'],
        'recommendation': ['recommend', 'suggest', 'advice'],
        'best-of': ['best', 'top', 'greatest'],
        'alternative': ['alternative', 'option', 'choice']
      };

      const keywords = subtypeKeywords[subtype] || [];
      if (keywords.some(keyword => text.includes(keyword))) {
        return subtype;
      }
    }

    return typeSubtypes[0];
  }

  /**
   * Calculate urgency level
   */
  private calculateUrgency(text: string): SearchIntent['urgency'] {
    const urgencyKeywords = {
      high: ['urgent', 'immediate', 'now', 'quickly', 'fast', 'emergency'],
      medium: ['soon', 'today', 'this week', 'need to', 'should'],
      low: ['eventually', 'someday', 'maybe', 'consider', 'might']
    };

    if (urgencyKeywords.high.some(keyword => text.includes(keyword))) {
      return 'high';
    } else if (urgencyKeywords.medium.some(keyword => text.includes(keyword))) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  /**
   * Map intent to content type
   */
  private mapIntentToContentType(intentType: SearchIntent['type']): string {
    const mapping = {
      informational: 'Educational/Tutorial Content',
      navigational: 'Navigation/Directory Content',
      transactional: 'Product/Service Pages',
      commercial: 'Comparison/Review Content'
    };

    return mapping[intentType];
  }

  /**
   * Identify satisfaction indicators
   */
  private identifySatisfactionIndicators(query: string, content: string): string[] {
    const indicators: string[] = [];
    const doc = compromise(content);
    
    // Check for direct question answering
    if (query.includes('?') && content.includes('answer')) {
      indicators.push('Direct question answering');
    }
    
    // Check for comprehensive coverage
    const headings = doc.match('#Heading').out('array');
    if (headings.length > 3) {
      indicators.push('Comprehensive topic coverage');
    }
    
    // Check for examples and illustrations
    if (content.includes('example') || content.includes('for instance')) {
      indicators.push('Concrete examples provided');
    }
    
    // Check for actionable content
    if (content.includes('step') || content.includes('action')) {
      indicators.push('Actionable guidance');
    }

    return indicators;
  }

  /**
   * Identify bounce risk factors
   */
  private identifyBounceRiskFactors(query: string, content: string): string[] {
    const risks: string[] = [];
    const words = this.wordTokenizer.tokenize(content);
    
    // Check content length
    if (words.length < 300) {
      risks.push('Content too short');
    }
    
    // Check for vague language
    const vagueWords = ['maybe', 'perhaps', 'possibly', 'might', 'could'];
    if (vagueWords.some(word => content.includes(word))) {
      risks.push('Vague language usage');
    }
    
    // Check for missing query terms
    const queryWords = this.wordTokenizer.tokenize(query);
    const missingWords = queryWords.filter(word => !content.toLowerCase().includes(word.toLowerCase()));
    if (missingWords.length > queryWords.length / 2) {
      risks.push('Poor query-content alignment');
    }

    return risks;
  }

  /**
   * Identify engagement triggers
   */
  private identifyEngagementTriggers(query: string, content: string): string[] {
    const triggers: string[] = [];
    
    // Check for interactive elements
    if (content.includes('click') || content.includes('try')) {
      triggers.push('Interactive elements');
    }
    
    // Check for personalization
    if (content.includes('you') || content.includes('your')) {
      triggers.push('Personalized content');
    }
    
    // Check for urgency
    if (content.includes('now') || content.includes('today')) {
      triggers.push('Urgency indicators');
    }
    
    // Check for social proof
    if (content.includes('review') || content.includes('rating')) {
      triggers.push('Social proof elements');
    }

    return triggers;
  }

  /**
   * Intent-specific satisfaction calculations
   */
  private calculateInformationalSatisfaction(content: string): number {
    let score = 0;
    
    // Check for educational elements
    if (content.includes('how') || content.includes('what') || content.includes('why')) {
      score += 0.2;
    }
    
    // Check for structured information
    const doc = compromise(content);
    const headings = doc.match('#Heading').out('array');
    if (headings.length > 0) {
      score += Math.min(0.3, headings.length * 0.1);
    }
    
    // Check for examples
    if (content.includes('example') || content.includes('instance')) {
      score += 0.2;
    }
    
    // Check for comprehensive coverage
    const words = this.wordTokenizer.tokenize(content);
    if (words.length > 500) {
      score += 0.3;
    }

    return Math.min(1, score);
  }

  private calculateNavigationalSatisfaction(content: string): number {
    let score = 0;
    
    // Check for navigation elements
    if (content.includes('menu') || content.includes('nav') || content.includes('link')) {
      score += 0.3;
    }
    
    // Check for contact information
    if (content.includes('contact') || content.includes('email') || content.includes('phone')) {
      score += 0.2;
    }
    
    // Check for clear pathways
    if (content.includes('go to') || content.includes('visit') || content.includes('access')) {
      score += 0.2;
    }
    
    // Check for site structure
    if (content.includes('home') || content.includes('about') || content.includes('service')) {
      score += 0.3;
    }

    return Math.min(1, score);
  }

  private calculateTransactionalSatisfaction(content: string): number {
    let score = 0;
    
    // Check for purchase elements
    if (content.includes('buy') || content.includes('purchase') || content.includes('order')) {
      score += 0.3;
    }
    
    // Check for pricing information
    if (content.includes('price') || content.includes('cost') || content.includes('$')) {
      score += 0.2;
    }
    
    // Check for product details
    if (content.includes('feature') || content.includes('specification') || content.includes('detail')) {
      score += 0.2;
    }
    
    // Check for call-to-action
    if (content.includes('now') || content.includes('today') || content.includes('get')) {
      score += 0.3;
    }

    return Math.min(1, score);
  }

  private calculateCommercialSatisfaction(content: string): number {
    let score = 0;
    
    // Check for comparison elements
    if (content.includes('vs') || content.includes('versus') || content.includes('compare')) {
      score += 0.3;
    }
    
    // Check for reviews
    if (content.includes('review') || content.includes('rating') || content.includes('feedback')) {
      score += 0.2;
    }
    
    // Check for recommendations
    if (content.includes('best') || content.includes('top') || content.includes('recommend')) {
      score += 0.2;
    }
    
    // Check for alternatives
    if (content.includes('alternative') || content.includes('option') || content.includes('choice')) {
      score += 0.3;
    }

    return Math.min(1, score);
  }

  /**
   * Intent-specific optimizations
   */
  private optimizeForInformationalIntent(content: string, targetIntent: SearchIntent): { content: string; modifications: number } {
    let optimizedContent = content;
    let modifications = 0;
    
    // Add how-to structure if missing
    if (!content.includes('how to') && targetIntent.indicators.includes('how')) {
      optimizedContent = 'Here\'s how to ' + optimizedContent;
      modifications++;
    }
    
    // Add examples if missing
    if (!content.includes('example') && content.length > 500) {
      const sentences = this.sentenceTokenizer.tokenize(optimizedContent);
      const midPoint = Math.floor(sentences.length / 2);
      sentences.splice(midPoint, 0, 'For example, this demonstrates the concept clearly.');
      optimizedContent = sentences.join(' ');
      modifications++;
    }
    
    // Add step-by-step structure
    if (targetIntent.subtype === 'how-to' && !content.includes('step')) {
      optimizedContent = optimizedContent.replace(/\.\s+([A-Z])/g, '.\n\nStep: $1');
      modifications++;
    }

    return { content: optimizedContent, modifications };
  }

  private optimizeForNavigationalIntent(content: string, targetIntent: SearchIntent): { content: string; modifications: number } {
    let optimizedContent = content;
    let modifications = 0;
    
    // Add navigation elements
    if (!content.includes('navigate') && !content.includes('find')) {
      optimizedContent = 'Navigate to: ' + optimizedContent;
      modifications++;
    }
    
    // Add clear pathways
    if (!content.includes('click') && !content.includes('go to')) {
      optimizedContent += '\n\nClick here to access the main page.';
      modifications++;
    }

    return { content: optimizedContent, modifications };
  }

  private optimizeForTransactionalIntent(content: string, targetIntent: SearchIntent): { content: string; modifications: number } {
    let optimizedContent = content;
    let modifications = 0;
    
    // Add purchase encouragement
    if (!content.includes('buy') && !content.includes('purchase')) {
      optimizedContent += '\n\nReady to purchase? Get started today.';
      modifications++;
    }
    
    // Add urgency if needed
    if (targetIntent.urgency === 'high' && !content.includes('now')) {
      optimizedContent = optimizedContent.replace(/\./g, ' now.');
      modifications++;
    }

    return { content: optimizedContent, modifications };
  }

  private optimizeForCommercialIntent(content: string, targetIntent: SearchIntent): { content: string; modifications: number } {
    let optimizedContent = content;
    let modifications = 0;
    
    // Add comparison elements
    if (!content.includes('compare') && !content.includes('vs')) {
      optimizedContent += '\n\nCompare your options to make the best choice.';
      modifications++;
    }
    
    // Add recommendations
    if (!content.includes('recommend') && !content.includes('best')) {
      optimizedContent = 'Our top recommendation: ' + optimizedContent;
      modifications++;
    }

    return { content: optimizedContent, modifications };
  }

  /**
   * Helper methods
   */
  private identifyContentGaps(content: string, targetIntent: SearchIntent): string[] {
    const gaps: string[] = [];
    
    // Check for missing intent-specific elements
    switch (targetIntent.type) {
      case 'informational':
        if (!content.includes('how') && !content.includes('what')) {
          gaps.push('Missing explanatory content');
        }
        break;
      case 'navigational':
        if (!content.includes('link') && !content.includes('page')) {
          gaps.push('Missing navigation elements');
        }
        break;
      case 'transactional':
        if (!content.includes('price') && !content.includes('buy')) {
          gaps.push('Missing purchase information');
        }
        break;
      case 'commercial':
        if (!content.includes('compare') && !content.includes('review')) {
          gaps.push('Missing comparison elements');
        }
        break;
    }

    return gaps;
  }

  private generateIntentRecommendations(content: string, targetIntent: SearchIntent): string[] {
    const recommendations: string[] = [];
    
    // Generate intent-specific recommendations
    switch (targetIntent.type) {
      case 'informational':
        recommendations.push('Add more detailed explanations and examples');
        recommendations.push('Include step-by-step instructions');
        break;
      case 'navigational':
        recommendations.push('Add clear navigation paths');
        recommendations.push('Include contact information');
        break;
      case 'transactional':
        recommendations.push('Add pricing information');
        recommendations.push('Include clear call-to-action buttons');
        break;
      case 'commercial':
        recommendations.push('Add product comparisons');
        recommendations.push('Include user reviews and ratings');
        break;
    }

    return recommendations;
  }

  private calculateAlignmentScore(originalIntent: SearchIntent, targetIntent: SearchIntent, optimizedContent: string): number {
    const newIntent = this.classifySearchIntent('', optimizedContent);
    
    // Calculate type alignment
    const typeAlignment = newIntent.type === targetIntent.type ? 1 : 0.5;
    
    // Calculate confidence alignment
    const confidenceAlignment = Math.min(1, newIntent.confidence / targetIntent.confidence);
    
    // Calculate indicator alignment
    const commonIndicators = newIntent.indicators.filter(i => targetIntent.indicators.includes(i));
    const indicatorAlignment = targetIntent.indicators.length > 0 ? 
      commonIndicators.length / targetIntent.indicators.length : 0;

    return (typeAlignment + confidenceAlignment + indicatorAlignment) / 3;
  }

  private calculateUserBehaviorAlignment(content: string, targetIntent: SearchIntent): number {
    const contentType = this.mapIntentToContentType(targetIntent.type);
    const satisfactionIndicators = this.identifySatisfactionIndicators('', content);
    const bounceRiskFactors = this.identifyBounceRiskFactors('', content);
    
    // Calculate alignment based on behavior factors
    const satisfactionScore = satisfactionIndicators.length * 0.2;
    const riskScore = Math.max(0, 1 - bounceRiskFactors.length * 0.1);
    
    return Math.min(1, (satisfactionScore + riskScore) / 2);
  }

  private extractSatisfactionFactors(content: string, intent: SearchIntent): string[] {
    const factors: string[] = [];
    
    // Extract intent-specific satisfaction factors
    switch (intent.type) {
      case 'informational':
        if (content.includes('step')) factors.push('Step-by-step guidance');
        if (content.includes('example')) factors.push('Concrete examples');
        break;
      case 'navigational':
        if (content.includes('link')) factors.push('Clear navigation links');
        if (content.includes('contact')) factors.push('Contact information');
        break;
      case 'transactional':
        if (content.includes('price')) factors.push('Pricing information');
        if (content.includes('secure')) factors.push('Security assurance');
        break;
      case 'commercial':
        if (content.includes('review')) factors.push('User reviews');
        if (content.includes('compare')) factors.push('Product comparisons');
        break;
    }

    return factors;
  }

  private extractContentStrategies(content: string, intent: SearchIntent): string[] {
    const strategies: string[] = [];
    
    // Extract content strategy patterns
    if (content.includes('comprehensive')) strategies.push('Comprehensive coverage');
    if (content.includes('detailed')) strategies.push('Detailed explanations');
    if (content.includes('quick')) strategies.push('Quick access');
    if (content.includes('expert')) strategies.push('Expert authority');
    
    return strategies;
  }
}
