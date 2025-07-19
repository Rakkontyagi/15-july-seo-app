import { z } from 'zod';

// Define the input schema for content freshness optimization
const ContentFreshnessInputSchema = z.object({
  content: z.string().min(10, 'Content must be at least 10 characters long.'),
  topic: z.string().min(1, 'Topic is required for freshness analysis.'),
  lastUpdated: z.date().optional(),
});

// Define the output schema for content freshness optimization
const ContentFreshnessOutputSchema = z.object({
  freshnessScore: z.number().min(0).max(100),
  optimizedContent: z.string(),
  suggestions: z.array(z.string()),
  outdatedIndicators: z.array(z.string()),
  freshnessImprovements: z.array(z.object({
    type: z.string(),
    suggestion: z.string(),
    priority: z.enum(['high', 'medium', 'low']),
  })),
});

export type ContentFreshnessInput = z.infer<typeof ContentFreshnessInputSchema>;
export type ContentFreshnessOutput = z.infer<typeof ContentFreshnessOutputSchema>;

export class ContentFreshnessService {
  private outdatedKeywords = [
    'last year', 'in 2020', 'in 2021', 'in 2022', 'previously', 'formerly',
    'recently announced', 'upcoming', 'soon to be released', 'planned for',
  ];

  private datePhrases = [
    'as of today', 'current trends', 'latest developments', 'recent studies',
    'new research', 'updated guidelines', 'current best practices',
  ];

  private currentEventSuggestions = [
    'Include recent industry reports and statistics',
    'Add current market trends and data',
    'Reference latest research findings',
    'Mention recent regulatory changes',
    'Include contemporary case studies',
    'Add current social media trends',
    'Reference recent news and developments',
  ];

  /**
   * Optimizes content freshness by identifying outdated information
   * and suggesting current events and recent developments to include.
   *
   * @param input - The input containing content, topic, and optional last updated date.
   * @returns The content freshness optimization output with scores, optimized content, and suggestions.
   */
  async optimize(input: ContentFreshnessInput): Promise<ContentFreshnessOutput> {
    ContentFreshnessInputSchema.parse(input); // Validate input

    const { content, topic, lastUpdated } = input;
    const freshnessScore = this.calculateFreshnessScore(content, lastUpdated);
    const outdatedIndicators = this.findOutdatedIndicators(content);
    
    const optimizationResult = this.optimizeForFreshness(content, topic);
    const optimizedContent = optimizationResult.content;
    const suggestions = optimizationResult.suggestions;
    const freshnessImprovements = optimizationResult.improvements;

    return {
      freshnessScore: parseFloat(freshnessScore.toFixed(1)),
      optimizedContent,
      suggestions,
      outdatedIndicators,
      freshnessImprovements,
    };
  }

  /**
   * Calculates a freshness score (0-100) based on content indicators and last updated date.
   */
  private calculateFreshnessScore(content: string, lastUpdated?: Date): number {
    let score = 50; // Base score

    // Check for current vs outdated language
    const hasCurrentLanguage = this.datePhrases.some(phrase => 
      content.toLowerCase().includes(phrase.toLowerCase())
    );
    const hasOutdatedLanguage = this.outdatedKeywords.some(keyword => 
      content.toLowerCase().includes(keyword.toLowerCase())
    );

    if (hasCurrentLanguage) {
      score += 20;
      // Extra bonus for multiple current language indicators
      const currentPhraseCount = this.datePhrases.filter(phrase =>
        content.toLowerCase().includes(phrase.toLowerCase())
      ).length;
      if (currentPhraseCount >= 2) score += 5;
    }
    if (hasOutdatedLanguage) score -= 30;

    // Factor in last updated date if provided
    if (lastUpdated) {
      const daysSinceUpdate = Math.floor((Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceUpdate < 30) score += 20;
      else if (daysSinceUpdate < 90) score += 10;
      else if (daysSinceUpdate < 180) score -= 10;
      else score -= 20;
    }

    // Check for specific year mentions that might be outdated
    const currentYear = new Date().getFullYear();
    const yearMentions = content.match(/\b(20\d{2})\b/g) || [];
    const oldYearMentions = yearMentions.filter(year => parseInt(year) < currentYear - 1);
    if (oldYearMentions.length > 0) score -= 15;

    // Check for statistical data patterns
    const hasStatistics = /\d+%|\d+\s*(percent|million|billion|thousand)/.test(content);
    if (hasStatistics && !hasCurrentLanguage) score -= 10;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Finds indicators of outdated content.
   */
  private findOutdatedIndicators(content: string): string[] {
    const indicators: string[] = [];
    const contentLower = content.toLowerCase();

    // Check for outdated keywords
    for (const keyword of this.outdatedKeywords) {
      if (contentLower.includes(keyword.toLowerCase())) {
        indicators.push(`Outdated time reference: "${keyword}"`);
      }
    }

    // Check for old year mentions
    const currentYear = new Date().getFullYear();
    const yearMentions = content.match(/\b(20\d{2})\b/g) || [];
    const oldYears = yearMentions.filter(year => parseInt(year) < currentYear - 1);
    oldYears.forEach(year => {
      indicators.push(`Outdated year reference: ${year}`);
    });

    // Check for phrases that suggest content needs updating
    const updateNeededPhrases = [
      'will be released', 'is planned', 'is expected', 'upcoming',
      'in the near future', 'beta version', 'under development'
    ];

    for (const phrase of updateNeededPhrases) {
      if (contentLower.includes(phrase.toLowerCase())) {
        indicators.push(`Potentially outdated future reference: "${phrase}"`);
      }
    }

    return [...new Set(indicators)]; // Remove duplicates
  }

  /**
   * Optimizes content for freshness by updating language and adding current references.
   */
  private optimizeForFreshness(content: string, topic: string): {
    content: string;
    suggestions: string[];
    improvements: Array<{ type: string; suggestion: string; priority: 'high' | 'medium' | 'low' }>;
  } {
    let optimizedContent = content;
    const suggestions: string[] = [];
    const improvements: Array<{ type: string; suggestion: string; priority: 'high' | 'medium' | 'low' }> = [];

    // Replace outdated time references
    const timeReplacements = [
      { old: /\blast year\b/gi, new: 'in recent months', suggestion: 'Updated time reference to be more current' },
      { old: /\bpreviously\b/gi, new: 'historically', suggestion: 'Replaced vague time reference' },
      { old: /\brecently announced\b/gi, new: 'as announced', suggestion: 'Updated announcement reference' },
      { old: /\bupcoming\b/gi, new: 'current', suggestion: 'Updated future reference to present tense' },
      { old: /\bsoon\b/gi, new: 'currently', suggestion: 'Updated vague future reference to present tense' },
      { old: /will be released soon/gi, new: 'is currently available', suggestion: 'Updated release status to current' },
    ];

    for (const replacement of timeReplacements) {
      if (optimizedContent.match(replacement.old)) {
        optimizedContent = optimizedContent.replace(replacement.old, replacement.new);
        suggestions.push(replacement.suggestion);
      }
    }

    // Add current context where appropriate
    const currentYear = new Date().getFullYear();
    const hasYearMention = optimizedContent.includes(currentYear.toString());
    
    if (!hasYearMention) {
      // Add current year context if missing
      optimizedContent = optimizedContent + ` As of ${currentYear}, these practices remain relevant and effective.`;
      suggestions.push(`Added current year (${currentYear}) context for timeliness`);
    }

    // Generate freshness improvement suggestions
    improvements.push(
      {
        type: 'Statistics Update',
        suggestion: `Include latest ${topic} statistics and market data for ${currentYear}`,
        priority: 'high'
      },
      {
        type: 'Recent Developments',
        suggestion: `Add section covering recent developments in ${topic}`,
        priority: 'medium'
      },
      {
        type: 'Current Trends',
        suggestion: `Reference current ${topic} trends and industry shifts`,
        priority: 'medium'
      },
      {
        type: 'Expert Insights',
        suggestion: `Include recent expert opinions and thought leadership in ${topic}`,
        priority: 'low'
      }
    );

    // Add general freshness suggestions
    suggestions.push(...this.currentEventSuggestions.slice(0, 3));

    // Add topic-specific suggestions
    if (topic.toLowerCase().includes('technology') || topic.toLowerCase().includes('software')) {
      suggestions.push('Reference latest software versions and technology updates');
      improvements.push({
        type: 'Technology Updates',
        suggestion: 'Include information about latest software versions and tech developments',
        priority: 'high'
      });
    }

    if (topic.toLowerCase().includes('marketing') || topic.toLowerCase().includes('seo')) {
      suggestions.push('Include recent algorithm updates and marketing trends');
      improvements.push({
        type: 'Algorithm Updates',
        suggestion: 'Reference recent search engine algorithm changes and marketing platform updates',
        priority: 'high'
      });
    }

    return {
      content: optimizedContent,
      suggestions: [...new Set(suggestions)], // Remove duplicates
      improvements
    };
  }
}