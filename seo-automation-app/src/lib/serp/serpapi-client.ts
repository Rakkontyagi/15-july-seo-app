import axios, { AxiosInstance } from 'axios';
import { z } from 'zod';

// SerpApi result schemas
const SerpApiOrganicResultSchema = z.object({
  position: z.number(),
  title: z.string(),
  link: z.string(),
  snippet: z.string().optional(),
  displayed_link: z.string().optional(),
  date: z.string().optional(),
  sitelinks: z.object({
    inline: z.array(z.object({
      title: z.string(),
      link: z.string()
    })).optional()
  }).optional()
});

const SerpApiSearchResponseSchema = z.object({
  search_metadata: z.object({
    id: z.string(),
    status: z.string(),
    json_endpoint: z.string(),
    created_at: z.string(),
    processed_at: z.string(),
    google_url: z.string(),
    total_time_taken: z.number()
  }),
  search_parameters: z.object({
    q: z.string(),
    location: z.string().optional(),
    google_domain: z.string().optional(),
    gl: z.string().optional(),
    hl: z.string().optional(),
    num: z.number().optional()
  }),
  organic_results: z.array(SerpApiOrganicResultSchema).optional(),
  related_questions: z.array(z.object({
    question: z.string(),
    snippet: z.string().optional(),
    title: z.string().optional(),
    link: z.string().optional()
  })).optional(),
  related_searches: z.array(z.object({
    query: z.string(),
    link: z.string().optional()
  })).optional()
});

export type SerpApiOrganicResult = z.infer<typeof SerpApiOrganicResultSchema>;
export type SerpApiSearchResponse = z.infer<typeof SerpApiSearchResponseSchema>;

export interface SerpApiSearchOptions {
  keyword: string;
  location?: string;
  googleDomain?: string;
  countryCode?: string;
  languageCode?: string;
  num?: number;
}

export class SerpApiClient {
  private client: AxiosInstance;
  private apiKey: string;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('SerpApi key is required');
    }

    this.apiKey = apiKey;
    this.client = axios.create({
      baseURL: 'https://serpapi.com',
      timeout: 30000
    });
  }

  async search(options: SerpApiSearchOptions): Promise<SerpApiSearchResponse> {
    try {
      const params: Record<string, any> = {
        api_key: this.apiKey,
        q: options.keyword,
        engine: 'google',
        num: options.num || 10
      };

      // Add location parameters
      if (options.location) {
        params.location = options.location;
      }

      if (options.googleDomain) {
        params.google_domain = options.googleDomain;
      }

      if (options.countryCode) {
        params.gl = options.countryCode;
      }

      if (options.languageCode) {
        params.hl = options.languageCode;
      }

      const response = await this.client.get('/search', { params });
      
      // Validate response
      const validatedResponse = SerpApiSearchResponseSchema.parse(response.data);
      
      return validatedResponse;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error('Invalid SerpApi key');
        }
        if (error.response?.status === 429) {
          throw new Error('SerpApi rate limit exceeded');
        }
        throw new Error(`SerpApi error: ${error.response?.data?.error || error.message}`);
      }
      throw error;
    }
  }

  // Convert SerpApi response to match Serper format for compatibility
  convertToSerperFormat(serpApiResponse: SerpApiSearchResponse): any {
    return {
      organic: serpApiResponse.organic_results?.map(result => ({
        position: result.position,
        title: result.title,
        link: result.link,
        snippet: result.snippet,
        date: result.date,
        sitelinks: result.sitelinks?.inline
      })) || [],
      peopleAlsoAsk: serpApiResponse.related_questions?.map(q => ({
        question: q.question,
        snippet: q.snippet,
        title: q.title,
        link: q.link
      })) || [],
      relatedSearches: serpApiResponse.related_searches?.map(s => ({
        query: s.query
      })) || [],
      searchParameters: {
        q: serpApiResponse.search_parameters.q,
        gl: serpApiResponse.search_parameters.gl,
        hl: serpApiResponse.search_parameters.hl,
        num: serpApiResponse.search_parameters.num
      }
    };
  }

  async checkAccount(): Promise<{ plan: string; searches_left: number }> {
    try {
      const response = await this.client.get('/account', {
        params: { api_key: this.apiKey }
      });
      
      return {
        plan: response.data.plan_name || 'unknown',
        searches_left: response.data.searches_left || 0
      };
    } catch (error) {
      console.error('Failed to check SerpApi account:', error);
      return { plan: 'unknown', searches_left: 0 };
    }
  }
}

// Export singleton instance if API key is available
let serpApiClient: SerpApiClient | null = null;

export function getSerpApiClient(): SerpApiClient | null {
  if (!serpApiClient) {
    const apiKey = process.env.SERPAPI_API_KEY;
    if (!apiKey) {
      return null; // SerpApi is optional backup
    }
    serpApiClient = new SerpApiClient(apiKey);
  }
  return serpApiClient;
}