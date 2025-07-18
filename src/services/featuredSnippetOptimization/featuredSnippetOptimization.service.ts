import { z } from 'zod';

// Define the snippet types
const SnippetTypeEnum = z.enum(['paragraph', 'list', 'table', 'auto']);

// Define the input schema for featured snippet optimization
const FeaturedSnippetOptimizationInputSchema = z.object({
  content: z.string().min(10, 'Content must be at least 10 characters long.'),
  targetQuery: z.string().min(1, 'Target query is required for snippet optimization.'),
  preferredSnippetType: SnippetTypeEnum.optional().default('auto'),
});

// Define the output schema for featured snippet optimization
const FeaturedSnippetOptimizationOutputSchema = z.object({
  snippetScore: z.number().min(0).max(100),
  optimizedContent: z.string(),
  optimizedSnippetScore: z.number().min(0).max(100),
  recommendedSnippetType: SnippetTypeEnum,
  snippetFormats: z.object({
    paragraph: z.object({
      content: z.string(),
      score: z.number().min(0).max(100),
    }),
    list: z.object({
      content: z.string(),
      score: z.number().min(0).max(100),
    }),
    table: z.object({
      content: z.string(),
      score: z.number().min(0).max(100),
    }),
  }),
  suggestions: z.array(z.string()),
  snippetOptimizations: z.array(z.object({
    type: z.string(),
    suggestion: z.string(),
    priority: z.enum(['high', 'medium', 'low']),
  })),
});

export type FeaturedSnippetOptimizationInput = z.infer<typeof FeaturedSnippetOptimizationInputSchema>;
export type FeaturedSnippetOptimizationOutput = z.infer<typeof FeaturedSnippetOptimizationOutputSchema>;
export type SnippetType = z.infer<typeof SnippetTypeEnum>;

export class FeaturedSnippetOptimizationService {
  private questionWords = ['what', 'how', 'why', 'when', 'where', 'which', 'who'];
  private listIndicators = ['steps', 'ways', 'methods', 'tips', 'benefits', 'types', 'examples'];
  private tableIndicators = ['comparison', 'vs', 'versus', 'compare', 'price', 'cost', 'features'];

  /**
   * Optimizes content for featured snippet opportunities (position zero).
   *
   * @param input - The input containing content, target query, and preferred snippet type.
   * @returns The featured snippet optimization output with scores, formatted content, and suggestions.
   */
  async optimize(input: FeaturedSnippetOptimizationInput): Promise<FeaturedSnippetOptimizationOutput> {
    FeaturedSnippetOptimizationInputSchema.parse(input); // Validate input

    const { content, targetQuery, preferredSnippetType } = input;
    
    const currentScore = this.calculateSnippetScore(content, targetQuery);
    const recommendedType = preferredSnippetType === 'auto' 
      ? this.determineOptimalSnippetType(targetQuery, content)
      : preferredSnippetType;
    
    const snippetFormats = this.generateAllSnippetFormats(content, targetQuery);
    const optimizationResult = this.optimizeForSnippet(content, targetQuery, recommendedType);
    
    const optimizedContent = optimizationResult.content;
    const optimizedScore = this.calculateSnippetScore(optimizedContent, targetQuery);
    const suggestions = optimizationResult.suggestions;
    const snippetOptimizations = optimizationResult.optimizations;

    return {
      snippetScore: parseFloat(currentScore.toFixed(1)),
      optimizedContent,
      optimizedSnippetScore: parseFloat(optimizedScore.toFixed(1)),
      recommendedSnippetType: recommendedType,
      snippetFormats,
      suggestions,
      snippetOptimizations,
    };
  }

  /**
   * Calculates a snippet optimization score (0-100) based on content structure and query alignment.
   */
  private calculateSnippetScore(content: string, targetQuery: string): number {
    let score = 0;
    const contentLower = content.toLowerCase();
    const queryLower = targetQuery.toLowerCase();
    
    // Check for direct question answer
    if (this.questionWords.some(word => queryLower.includes(word))) {
      if (contentLower.includes(queryLower) || this.hasDirectAnswer(content, targetQuery)) {
        score += 30;
      }
    }

    // Check for structured content
    if (this.hasStructuredFormat(content)) {
      score += 25;
    }

    // Check for concise answer (50-300 characters optimal for snippets)
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const firstSentence = sentences[0]?.trim() || '';
    if (firstSentence.length >= 50 && firstSentence.length <= 300) {
      score += 20;
    }

    // Check for keyword presence
    const queryWords = queryLower.split(/\s+/);
    const matchingWords = queryWords.filter(word => contentLower.includes(word));
    score += (matchingWords.length / queryWords.length) * 15;

    // Check for heading structure
    if (content.includes('#') || /^[A-Z][^.!?]*:/.test(content)) {
      score += 10;
    }

    return Math.min(100, score);
  }

  /**
   * Determines the optimal snippet type based on query and content analysis.
   */
  private determineOptimalSnippetType(query: string, content: string): SnippetType {
    const queryLower = query.toLowerCase();
    const contentLower = content.toLowerCase();

    // Check for list indicators
    if (this.listIndicators.some(indicator => queryLower.includes(indicator)) ||
        this.hasListStructure(content)) {
      return 'list';
    }

    // Check for table indicators
    if (this.tableIndicators.some(indicator => queryLower.includes(indicator)) ||
        this.hasTableStructure(content)) {
      return 'table';
    }

    // Default to paragraph for definition and explanation queries
    return 'paragraph';
  }

  /**
   * Generates all possible snippet formats for the content.
   */
  private generateAllSnippetFormats(content: string, targetQuery: string): {
    paragraph: { content: string; score: number };
    list: { content: string; score: number };
    table: { content: string; score: number };
  } {
    const paragraphFormat = this.formatAsParagraph(content, targetQuery);
    const listFormat = this.formatAsList(content, targetQuery);
    const tableFormat = this.formatAsTable(content, targetQuery);

    return {
      paragraph: {
        content: paragraphFormat,
        score: parseFloat(this.calculateSnippetScore(paragraphFormat, targetQuery).toFixed(1)),
      },
      list: {
        content: listFormat,
        score: parseFloat(this.calculateSnippetScore(listFormat, targetQuery).toFixed(1)),
      },
      table: {
        content: tableFormat,
        score: parseFloat(this.calculateSnippetScore(tableFormat, targetQuery).toFixed(1)),
      },
    };
  }

  /**
   * Formats content as a paragraph snippet.
   */
  private formatAsParagraph(content: string, targetQuery: string): string {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    // Find the most relevant sentence
    let bestSentence = sentences[0] || '';
    let maxRelevance = 0;
    
    const queryWords = targetQuery.toLowerCase().split(/\s+/);
    
    for (const sentence of sentences) {
      const sentenceLower = sentence.toLowerCase();
      const relevance = queryWords.filter(word => sentenceLower.includes(word)).length;
      
      if (relevance > maxRelevance) {
        maxRelevance = relevance;
        bestSentence = sentence;
      }
    }

    // Ensure optimal length (50-300 characters)
    let optimizedSentence = bestSentence.trim();
    if (optimizedSentence.length < 50 && sentences.length > 1) {
      optimizedSentence = sentences.slice(0, 2).join('. ').trim();
    }
    
    if (optimizedSentence.length > 300) {
      optimizedSentence = optimizedSentence.substring(0, 297) + '...';
    }

    return optimizedSentence;
  }

  /**
   * Formats content as a list snippet.
   */
  private formatAsList(content: string, targetQuery: string): string {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    // If already has list structure, preserve it
    if (this.hasListStructure(content)) {
      return content;
    }

    // Convert sentences to list items
    const listItems = sentences.slice(0, 8).map((sentence, index) => {
      const cleanSentence = sentence.trim();
      return `${index + 1}. ${cleanSentence}`;
    });

    return `Steps to ${targetQuery}:\n\n${listItems.join('\n')}`;
  }

  /**
   * Formats content as a table snippet.
   */
  private formatAsTable(content: string, targetQuery: string): string {
    // If already has table structure, preserve it
    if (this.hasTableStructure(content)) {
      return content;
    }

    // Create a basic comparison table
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const tableRows = sentences.slice(0, 5).map((sentence, index) => {
      const cleanSentence = sentence.trim();
      return `| Feature ${index + 1} | ${cleanSentence} |`;
    });

    return `${targetQuery} Comparison:\n\n| Feature | Description |\n|---------|-------------|\n${tableRows.join('\n')}`;
  }

  /**
   * Optimizes content for the recommended snippet type.
   */
  private optimizeForSnippet(
    content: string,
    targetQuery: string,
    snippetType: SnippetType
  ): {
    content: string;
    suggestions: string[];
    optimizations: Array<{ type: string; suggestion: string; priority: 'high' | 'medium' | 'low' }>;
  } {
    const suggestions: string[] = [];
    const optimizations: Array<{ type: string; suggestion: string; priority: 'high' | 'medium' | 'low' }> = [];
    
    let optimizedContent = content;

    // Add direct answer if missing
    if (!this.hasDirectAnswer(content, targetQuery)) {
      const directAnswer = this.generateDirectAnswer(targetQuery);
      optimizedContent = `${directAnswer}\n\n${optimizedContent}`;
      suggestions.push('Added direct answer for better snippet targeting');
    }

    // Format according to snippet type
    switch (snippetType) {
      case 'paragraph':
        optimizedContent = this.formatAsParagraph(optimizedContent, targetQuery);
        suggestions.push('Optimized content for paragraph snippet format');
        break;
      case 'list':
        optimizedContent = this.formatAsList(optimizedContent, targetQuery);
        suggestions.push('Optimized content for list snippet format');
        break;
      case 'table':
        optimizedContent = this.formatAsTable(optimizedContent, targetQuery);
        suggestions.push('Optimized content for table snippet format');
        break;
    }

    // Add general optimizations
    optimizations.push(
      {
        type: 'Query Targeting',
        suggestion: `Include exact query "${targetQuery}" in the first sentence`,
        priority: 'high'
      },
      {
        type: 'Content Length',
        suggestion: 'Keep snippet content between 50-300 characters for optimal display',
        priority: 'high'
      },
      {
        type: 'Structured Data',
        suggestion: 'Add structured data markup to improve snippet eligibility',
        priority: 'medium'
      },
      {
        type: 'Answer Format',
        suggestion: 'Use question-answer format to directly address user queries',
        priority: 'medium'
      },
      {
        type: 'Content Authority',
        suggestion: 'Include authoritative sources and expert information',
        priority: 'low'
      }
    );

    return { content: optimizedContent, suggestions, optimizations };
  }

  /**
   * Checks if content has a direct answer to the query.
   */
  private hasDirectAnswer(content: string, query: string): boolean {
    const contentLower = content.toLowerCase();
    const queryLower = query.toLowerCase();
    
    // Check if content starts with query keywords
    const queryWords = queryLower.split(/\s+/);
    const firstSentence = content.split(/[.!?]+/)[0]?.toLowerCase() || '';
    
    return queryWords.some(word => firstSentence.includes(word)) && 
           (firstSentence.length >= 30);
  }

  /**
   * Generates a direct answer for the query.
   */
  private generateDirectAnswer(query: string): string {
    const queryLower = query.toLowerCase();
    
    if (queryLower.startsWith('what is')) {
      return `${query.replace(/what is/i, '').trim()} is a concept that...`;
    } else if (queryLower.startsWith('how to')) {
      return `To ${query.replace(/how to/i, '').trim()}, follow these steps:`;
    } else if (queryLower.startsWith('why')) {
      return `${query} because of several key factors:`;
    } else {
      return `Regarding ${query}, here's what you need to know:`;
    }
  }

  /**
   * Checks if content has structured formatting.
   */
  private hasStructuredFormat(content: string): boolean {
    return this.hasListStructure(content) || 
           this.hasTableStructure(content) || 
           content.includes('#') ||
           /^\d+\./.test(content);
  }

  /**
   * Checks if content has list structure.
   */
  private hasListStructure(content: string): boolean {
    return /^\d+\./m.test(content) || 
           /^[-*•]/m.test(content) ||
           content.includes('\n-') ||
           content.includes('\n*');
  }

  /**
   * Checks if content has table structure.
   */
  private hasTableStructure(content: string): boolean {
    return content.includes('|') && content.includes('-') ||
           content.toLowerCase().includes('table') ||
           /\b\w+\s*:\s*\w+/g.test(content);
  }
}