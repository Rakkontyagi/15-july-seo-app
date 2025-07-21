export interface CrawlResult {
  url: string;
  title: string;
  content: string;
  markdown: string;
  metadata: {
    title: string;
    description: string;
    keywords: string[];
    author?: string;
    publishedDate?: string;
  };
  wordCount: number;
  headings: {
    h1: string[];
    h2: string[];
    h3: string[];
  };
}

export interface CrawlOptions {
  includeHtml?: boolean;
  includeMarkdown?: boolean;
  includeMetadata?: boolean;
  timeout?: number;
}

export class FirecrawlService {
  private apiKey: string;
  private baseUrl = 'https://api.firecrawl.dev/v0';

  constructor() {
    this.apiKey = process.env.FIRECRAWL_API_KEY || '';
  }

  async crawlUrl(url: string, options: CrawlOptions = {}): Promise<CrawlResult> {
    try {
      const response = await fetch(`${this.baseUrl}/scrape`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          formats: ['markdown', 'html'],
          includeTags: ['title', 'meta', 'h1', 'h2', 'h3'],
          excludeTags: ['script', 'style', 'nav', 'footer'],
          timeout: options.timeout || 30000,
        }),
      });

      if (!response.ok) {
        throw new Error(`Firecrawl API error: ${response.status}`);
      }

      const data = await response.json();
      
      return this.parseFirecrawlResponse(data, url);
    } catch (error) {
      console.error('Firecrawl error:', error);
      
      // Return mock data for development
      return {
        url,
        title: 'Sample Page Title',
        content: 'This is sample content for development purposes.',
        markdown: '# Sample Page Title\n\nThis is sample content for development purposes.',
        metadata: {
          title: 'Sample Page Title',
          description: 'Sample description',
          keywords: ['sample', 'development'],
        },
        wordCount: 10,
        headings: {
          h1: ['Sample Page Title'],
          h2: [],
          h3: [],
        },
      };
    }
  }

  async crawlMultipleUrls(urls: string[], options: CrawlOptions = {}): Promise<CrawlResult[]> {
    const results = await Promise.allSettled(
      urls.map(url => this.crawlUrl(url, options))
    );

    return results
      .filter((result): result is PromiseFulfilledResult<CrawlResult> => 
        result.status === 'fulfilled'
      )
      .map(result => result.value);
  }

  async extractCompetitorData(urls: string[]): Promise<{
    averageWordCount: number;
    commonKeywords: string[];
    headingStructures: string[][];
    contentPatterns: string[];
  }> {
    const crawlResults = await this.crawlMultipleUrls(urls);
    
    if (crawlResults.length === 0) {
      return {
        averageWordCount: 1000,
        commonKeywords: [],
        headingStructures: [],
        contentPatterns: [],
      };
    }

    const totalWordCount = crawlResults.reduce((sum, result) => sum + result.wordCount, 0);
    const averageWordCount = Math.round(totalWordCount / crawlResults.length);

    // Extract common keywords
    const allKeywords = crawlResults.flatMap(result => result.metadata.keywords);
    const keywordCounts = new Map<string, number>();
    allKeywords.forEach(keyword => {
      keywordCounts.set(keyword, (keywordCounts.get(keyword) || 0) + 1);
    });

    const commonKeywords = Array.from(keywordCounts.entries())
      .filter(([, count]) => count >= Math.ceil(crawlResults.length / 2))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([keyword]) => keyword);

    // Extract heading structures
    const headingStructures = crawlResults.map(result => [
      ...result.headings.h1,
      ...result.headings.h2,
      ...result.headings.h3,
    ]);

    // Extract content patterns (simplified)
    const contentPatterns = this.extractContentPatterns(crawlResults);

    return {
      averageWordCount,
      commonKeywords,
      headingStructures,
      contentPatterns,
    };
  }

  private parseFirecrawlResponse(data: any, url: string): CrawlResult {
    const content = data.content || '';
    const markdown = data.markdown || '';
    const metadata = data.metadata || {};

    // Extract headings from markdown
    const headings = this.extractHeadings(markdown);
    
    // Count words
    const wordCount = this.countWords(content);

    return {
      url,
      title: metadata.title || 'Untitled',
      content,
      markdown,
      metadata: {
        title: metadata.title || '',
        description: metadata.description || '',
        keywords: metadata.keywords || [],
        author: metadata.author,
        publishedDate: metadata.publishedDate,
      },
      wordCount,
      headings,
    };
  }

  private extractHeadings(markdown: string): { h1: string[]; h2: string[]; h3: string[] } {
    const headings = { h1: [], h2: [], h3: [] };
    
    const lines = markdown.split('\n');
    lines.forEach(line => {
      if (line.startsWith('# ')) {
        headings.h1.push(line.replace('# ', '').trim());
      } else if (line.startsWith('## ')) {
        headings.h2.push(line.replace('## ', '').trim());
      } else if (line.startsWith('### ')) {
        headings.h3.push(line.replace('### ', '').trim());
      }
    });

    return headings;
  }

  private countWords(text: string): number {
    return text.split(/\s+/).filter(word => word.length > 0).length;
  }

  private extractContentPatterns(results: CrawlResult[]): string[] {
    // Simplified pattern extraction
    const patterns: string[] = [];

    // Check for common content structures
    const hasIntroduction = results.filter(r => 
      r.content.toLowerCase().includes('introduction') || 
      r.content.toLowerCase().includes('overview')
    ).length;

    if (hasIntroduction > results.length / 2) {
      patterns.push('Most content includes an introduction section');
    }

    const hasConclusion = results.filter(r => 
      r.content.toLowerCase().includes('conclusion') || 
      r.content.toLowerCase().includes('summary')
    ).length;

    if (hasConclusion > results.length / 2) {
      patterns.push('Most content includes a conclusion section');
    }

    const hasList = results.filter(r => 
      r.markdown.includes('- ') || r.markdown.includes('1. ')
    ).length;

    if (hasList > results.length / 2) {
      patterns.push('Most content uses lists for better readability');
    }

    return patterns;
  }
}
