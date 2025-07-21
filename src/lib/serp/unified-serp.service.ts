export interface SerpResult {
  title: string;
  url: string;
  snippet: string;
  position: number;
}

export interface SerpAnalysis {
  keyword: string;
  results: SerpResult[];
  totalResults: number;
  searchTime: number;
}

export class UnifiedSerpService {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.SERPER_API_KEY || '';
  }

  async analyzeSERP(keyword: string, location = 'us'): Promise<SerpAnalysis> {
    try {
      const response = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: {
          'X-API-KEY': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: keyword,
          gl: location,
          num: 10,
        }),
      });

      if (!response.ok) {
        throw new Error(`SERP API error: ${response.status}`);
      }

      const data = await response.json();
      
      const results: SerpResult[] = (data.organic || []).map((result: any, index: number) => ({
        title: result.title || '',
        url: result.link || '',
        snippet: result.snippet || '',
        position: index + 1,
      }));

      return {
        keyword,
        results,
        totalResults: data.searchInformation?.totalResults || 0,
        searchTime: data.searchInformation?.searchTime || 0,
      };
    } catch (error) {
      console.error('SERP analysis error:', error);
      
      // Return mock data for development
      return {
        keyword,
        results: [
          {
            title: `Sample result for ${keyword}`,
            url: 'https://example.com',
            snippet: 'This is a sample snippet for development purposes.',
            position: 1,
          },
        ],
        totalResults: 1,
        searchTime: 0.1,
      };
    }
  }

  async getTopCompetitors(keyword: string, count = 5): Promise<SerpResult[]> {
    const analysis = await this.analyzeSERP(keyword);
    return analysis.results.slice(0, count);
  }

  async extractKeywords(content: string): Promise<string[]> {
    // Simple keyword extraction - in production, use more sophisticated NLP
    const words = content.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3);
    
    const wordCount = new Map<string, number>();
    words.forEach(word => {
      wordCount.set(word, (wordCount.get(word) || 0) + 1);
    });

    return Array.from(wordCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([word]) => word);
  }
}

// Export singleton instance
export const getUnifiedSERPService = () => new UnifiedSerpService();
