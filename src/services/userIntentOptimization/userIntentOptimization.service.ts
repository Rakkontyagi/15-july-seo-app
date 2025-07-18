import { z } from 'zod';

// Define the search intent types
const SearchIntentEnum = z.enum(['informational', 'commercial', 'navigational', 'transactional']);

// Define the input schema for user intent optimization
const UserIntentOptimizationInputSchema = z.object({
  content: z.string().min(10, 'Content must be at least 10 characters long.'),
  targetIntent: SearchIntentEnum,
  targetKeywords: z.array(z.string()).min(1, 'At least one target keyword is required.'),
});

// Define the output schema for user intent optimization
const UserIntentOptimizationOutputSchema = z.object({
  currentIntentScore: z.number().min(0).max(100),
  optimizedContent: z.string(),
  optimizedIntentScore: z.number().min(0).max(100),
  intentAlignment: z.object({
    informational: z.number().min(0).max(100),
    commercial: z.number().min(0).max(100),
    navigational: z.number().min(0).max(100),
    transactional: z.number().min(0).max(100),
  }),
  suggestions: z.array(z.string()),
  intentOptimizations: z.array(z.object({
    type: z.string(),
    suggestion: z.string(),
    impact: z.enum(['high', 'medium', 'low']),
  })),
});

export type UserIntentOptimizationInput = z.infer<typeof UserIntentOptimizationInputSchema>;
export type UserIntentOptimizationOutput = z.infer<typeof UserIntentOptimizationOutputSchema>;
export type SearchIntent = z.infer<typeof SearchIntentEnum>;

export class UserIntentOptimizationService {
  private intentIndicators = {
    informational: [
      'what is', 'how to', 'guide', 'tutorial', 'learn', 'understand',
      'definition', 'meaning', 'explanation', 'overview', 'introduction',
      'steps', 'process', 'method', 'technique', 'tips', 'advice'
    ],
    commercial: [
      'best', 'top', 'review', 'compare', 'vs', 'versus', 'alternative',
      'rating', 'recommendation', 'pros and cons', 'features', 'benefits',
      'price', 'cost', 'cheap', 'affordable', 'discount', 'deal'
    ],
    navigational: [
      'login', 'sign in', 'account', 'dashboard', 'contact', 'about us',
      'support', 'help center', 'official', 'website', 'homepage',
      'location', 'address', 'phone', 'email', 'hours'
    ],
    transactional: [
      'buy', 'purchase', 'order', 'shop', 'cart', 'checkout', 'payment',
      'subscribe', 'download', 'free trial', 'get started', 'sign up',
      'book now', 'reserve', 'apply', 'join', 'register'
    ]
  };

  /**
   * Optimizes content for specific user search intent types.
   *
   * @param input - The input containing content, target intent, and keywords.
   * @returns The user intent optimization output with scores, optimized content, and suggestions.
   */
  async optimize(input: UserIntentOptimizationInput): Promise<UserIntentOptimizationOutput> {
    UserIntentOptimizationInputSchema.parse(input); // Validate input

    const { content, targetIntent, targetKeywords } = input;
    
    const currentIntentAlignment = this.analyzeIntentAlignment(content);
    const currentIntentScore = currentIntentAlignment[targetIntent];
    
    const optimizationResult = this.optimizeForIntent(content, targetIntent, targetKeywords);
    const optimizedContent = optimizationResult.content;
    const suggestions = optimizationResult.suggestions;
    const intentOptimizations = optimizationResult.optimizations;
    
    const optimizedIntentAlignment = this.analyzeIntentAlignment(optimizedContent);
    const optimizedIntentScore = optimizedIntentAlignment[targetIntent];

    return {
      currentIntentScore: parseFloat(currentIntentScore.toFixed(1)),
      optimizedContent,
      optimizedIntentScore: parseFloat(optimizedIntentScore.toFixed(1)),
      intentAlignment: {
        informational: parseFloat(optimizedIntentAlignment.informational.toFixed(1)),
        commercial: parseFloat(optimizedIntentAlignment.commercial.toFixed(1)),
        navigational: parseFloat(optimizedIntentAlignment.navigational.toFixed(1)),
        transactional: parseFloat(optimizedIntentAlignment.transactional.toFixed(1)),
      },
      suggestions,
      intentOptimizations,
    };
  }

  /**
   * Analyzes how well content aligns with different search intents.
   */
  private analyzeIntentAlignment(content: string): Record<SearchIntent, number> {
    const contentLower = content.toLowerCase();
    const words = contentLower.split(/\s+/);
    const totalWords = words.length;

    const scores: Record<SearchIntent, number> = {
      informational: 0,
      commercial: 0,
      navigational: 0,
      transactional: 0,
    };

    // Calculate scores based on intent indicators
    for (const [intent, indicators] of Object.entries(this.intentIndicators)) {
      let matchCount = 0;
      
      for (const indicator of indicators) {
        const indicatorWords = indicator.split(/\s+/);
        
        if (indicatorWords.length === 1) {
          // Single word indicator
          if (words.includes(indicator)) {
            matchCount += 1;
          }
        } else {
          // Multi-word phrase indicator
          if (contentLower.includes(indicator)) {
            matchCount += indicatorWords.length;
          }
        }
      }
      
      // Calculate percentage score
      scores[intent as SearchIntent] = Math.min(100, (matchCount / totalWords) * 100 * 10);
    }

    // Boost scores based on content structure
    if (contentLower.includes('table of contents') || contentLower.includes('introduction')) {
      scores.informational += 10;
    }
    
    if (contentLower.includes('$') || contentLower.includes('price') || contentLower.includes('rating')) {
      scores.commercial += 15;
    }
    
    if (contentLower.includes('contact') || contentLower.includes('location')) {
      scores.navigational += 20;
    }
    
    if (contentLower.includes('buy now') || contentLower.includes('add to cart')) {
      scores.transactional += 25;
    }

    // Normalize scores to ensure they don't exceed 100
    Object.keys(scores).forEach(intent => {
      scores[intent as SearchIntent] = Math.min(100, scores[intent as SearchIntent]);
    });

    return scores;
  }

  /**
   * Optimizes content for the target intent.
   */
  private optimizeForIntent(
    content: string, 
    targetIntent: SearchIntent, 
    targetKeywords: string[]
  ): {
    content: string;
    suggestions: string[];
    optimizations: Array<{ type: string; suggestion: string; impact: 'high' | 'medium' | 'low' }>;
  } {
    let optimizedContent = content;
    const suggestions: string[] = [];
    const optimizations: Array<{ type: string; suggestion: string; impact: 'high' | 'medium' | 'low' }> = [];

    switch (targetIntent) {
      case 'informational':
        optimizedContent = this.optimizeForInformational(optimizedContent, targetKeywords, suggestions, optimizations);
        break;
      case 'commercial':
        optimizedContent = this.optimizeForCommercial(optimizedContent, targetKeywords, suggestions, optimizations);
        break;
      case 'navigational':
        optimizedContent = this.optimizeForNavigational(optimizedContent, targetKeywords, suggestions, optimizations);
        break;
      case 'transactional':
        optimizedContent = this.optimizeForTransactional(optimizedContent, targetKeywords, suggestions, optimizations);
        break;
    }

    return { content: optimizedContent, suggestions, optimizations };
  }

  private optimizeForInformational(
    content: string, 
    keywords: string[], 
    suggestions: string[], 
    optimizations: Array<{ type: string; suggestion: string; impact: 'high' | 'medium' | 'low' }>
  ): string {
    let optimized = content;

    // Add informational structure if missing
    if (!content.toLowerCase().includes('introduction') && !content.toLowerCase().includes('overview')) {
      optimized = `Introduction: This guide provides comprehensive information about ${keywords[0]}.\n\n${optimized}`;
      suggestions.push('Added introduction section for informational intent');
    }

    // Add educational elements
    if (!content.toLowerCase().includes('learn') && !content.toLowerCase().includes('understand')) {
      optimized = optimized.replace(/\./g, '. Learn more about this topic to understand the key concepts.');
      suggestions.push('Added educational language for informational intent');
    }

    optimizations.push(
      { type: 'Content Structure', suggestion: 'Add FAQ section to address common questions', impact: 'high' },
      { type: 'Educational Content', suggestion: 'Include step-by-step explanations and examples', impact: 'medium' },
      { type: 'Related Topics', suggestion: 'Add "Related Articles" or "Learn More" sections', impact: 'low' }
    );

    return optimized;
  }

  private optimizeForCommercial(
    content: string, 
    keywords: string[], 
    suggestions: string[], 
    optimizations: Array<{ type: string; suggestion: string; impact: 'high' | 'medium' | 'low' }>
  ): string {
    let optimized = content;

    // Add comparison elements
    if (!content.toLowerCase().includes('compare') && !content.toLowerCase().includes('vs')) {
      optimized = `${optimized}\n\nCompare different options to find the best ${keywords[0]} for your needs.`;
      suggestions.push('Added comparison element for commercial intent');
    }

    // Add review/rating context
    if (!content.toLowerCase().includes('review') && !content.toLowerCase().includes('rating')) {
      optimized = `${optimized}\n\nCheck reviews and ratings to make an informed decision.`;
      suggestions.push('Added review context for commercial intent');
    }

    optimizations.push(
      { type: 'Product Comparison', suggestion: 'Add detailed feature comparison tables', impact: 'high' },
      { type: 'Social Proof', suggestion: 'Include customer testimonials and reviews', impact: 'high' },
      { type: 'Pricing Information', suggestion: 'Add transparent pricing and value propositions', impact: 'medium' }
    );

    return optimized;
  }

  private optimizeForNavigational(
    content: string, 
    keywords: string[], 
    suggestions: string[], 
    optimizations: Array<{ type: string; suggestion: string; impact: 'high' | 'medium' | 'low' }>
  ): string {
    let optimized = content;

    // Add contact/location information
    if (!content.toLowerCase().includes('contact') && !content.toLowerCase().includes('location')) {
      optimized = `${optimized}\n\nFor more information, contact us or visit our location.`;
      suggestions.push('Added contact information for navigational intent');
    }

    // Add navigation elements
    if (!content.toLowerCase().includes('menu') && !content.toLowerCase().includes('navigation')) {
      optimized = `Navigation: Find what you're looking for quickly.\n\n${optimized}`;
      suggestions.push('Added navigation context for navigational intent');
    }

    optimizations.push(
      { type: 'Contact Information', suggestion: 'Add clear contact details and office hours', impact: 'high' },
      { type: 'Site Navigation', suggestion: 'Include breadcrumb navigation and site map', impact: 'medium' },
      { type: 'Location Services', suggestion: 'Add maps and location-based information', impact: 'low' }
    );

    return optimized;
  }

  private optimizeForTransactional(
    content: string, 
    keywords: string[], 
    suggestions: string[], 
    optimizations: Array<{ type: string; suggestion: string; impact: 'high' | 'medium' | 'low' }>
  ): string {
    let optimized = content;

    // Add call-to-action elements
    if (!content.toLowerCase().includes('buy') && !content.toLowerCase().includes('get started')) {
      optimized = `${optimized}\n\nReady to get started? Take action now and begin your journey with ${keywords[0]}.`;
      suggestions.push('Added call-to-action for transactional intent');
    }

    // Add urgency/action elements
    if (!content.toLowerCase().includes('now') && !content.toLowerCase().includes('today')) {
      optimized = optimized.replace(/\./g, '. Act today to secure your spot.');
      suggestions.push('Added urgency language for transactional intent');
    }

    optimizations.push(
      { type: 'Call-to-Action', suggestion: 'Add prominent CTA buttons and action-oriented language', impact: 'high' },
      { type: 'Purchase Process', suggestion: 'Simplify the buying process and reduce friction', impact: 'high' },
      { type: 'Trust Signals', suggestion: 'Add security badges and money-back guarantees', impact: 'medium' }
    );

    return optimized;
  }
}