import axios, { AxiosInstance, AxiosError } from 'axios';
import { z } from 'zod';

// Types and schemas for Serper.dev API
const SerperOrganicResultSchema = z.object({
  title: z.string(),
  link: z.string(),
  snippet: z.string().optional(),
  position: z.number(),
  date: z.string().optional(),
  sitelinks: z.array(z.object({
    title: z.string(),
    link: z.string()
  })).optional()
});

const SerperSearchResponseSchema = z.object({
  organic: z.array(SerperOrganicResultSchema),
  peopleAlsoAsk: z.array(z.object({
    question: z.string(),
    snippet: z.string().optional(),
    title: z.string().optional(),
    link: z.string().optional()
  })).optional(),
  relatedSearches: z.array(z.object({
    query: z.string()
  })).optional(),
  searchParameters: z.object({
    q: z.string(),
    gl: z.string().optional(),
    hl: z.string().optional(),
    num: z.number().optional(),
    type: z.string().optional()
  })
});

export type SerperOrganicResult = z.infer<typeof SerperOrganicResultSchema>;
export type SerperSearchResponse = z.infer<typeof SerperSearchResponseSchema>;

export interface SerperSearchOptions {
  keyword: string;
  location?: string;
  country?: string;
  language?: string;
  num?: number;
  domain?: string;
  timeout?: number; // Add timeout option
}

interface RetryOptions {
  retries: number;
  delay: number; // initial delay in ms
  factor: number; // exponential backoff factor
  codesToRetry: number[];
}

const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  retries: 3,
  delay: 1000,
  factor: 2,
  codesToRetry: [429, 500, 502, 503, 504],
};

async function retry<T>(fn: () => Promise<T>, options: RetryOptions): Promise<T> {
  let attempt = 0;
  while (attempt < options.retries) {
    try {
      return await fn();
    } catch (error) {
      if (axios.isAxiosError(error) && error.response && options.codesToRetry.includes(error.response.status)) {
        const delay = options.delay * (options.factor ** attempt);
        console.warn(`Attempt ${attempt + 1} failed with status ${error.response.status}. Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        attempt++;
      } else {
        throw error; // Re-throw if not a retriable error
      }
    }
  }
  throw new Error(`Failed after ${options.retries} attempts.`);
}

export class SerperClient {
  private client: AxiosInstance;
  private apiKey: string;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Serper API key is required');
    }

    this.apiKey = apiKey;
    this.client = axios.create({
      baseURL: 'https://google.serper.dev',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json'
      },
      timeout: 30000 // Default timeout: 30 seconds
    });
  }

  async search(options: SerperSearchOptions): Promise<SerperSearchResponse> {
    const searchOperation = async () => {
      const searchParams: Record<string, any> = {
        q: options.keyword,
        num: options.num || 10
      };

      // Add location parameters
      if (options.country) {
        searchParams.gl = options.country.toLowerCase();
      }
      
      if (options.language) {
        searchParams.hl = options.language.toLowerCase();
      }

      // Handle domain-specific searches (e.g., google.ae, google.co.uk)
      if (options.domain) {
        searchParams.google_domain = options.domain;
      }

      const response = await this.client.post('/search', searchParams, {
        timeout: options.timeout || this.client.defaults.timeout,
      });
      
      // Validate response
      const validatedResponse = SerperSearchResponseSchema.parse(response.data);
      
      return validatedResponse;
    };

    try {
      return await retry(searchOperation, DEFAULT_RETRY_OPTIONS);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 403) {
          throw new Error('Invalid Serper API key or quota exceeded');
        }
        if (error.response?.status === 429) {
          throw new Error('Serper API rate limit exceeded');
        }
        if (error.code === 'ECONNABORTED') {
          throw new Error('Serper API request timed out');
        }
        throw new Error(`Serper API error: ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  }

  async checkQuota(): Promise<{ used: number; limit: number }> {
    try {
      const response = await this.client.get('/account');
      return {
        used: response.data.searches_used || 0,
        limit: response.data.searches_limit || 0
      };
    } catch (error) {
      console.error('Failed to check Serper quota:', error);
      return { used: 0, limit: 0 };
    }
  }
}

// Export a singleton instance if API key is available
let serperClient: SerperClient | null = null;

export function getSerperClient(): SerperClient {
  if (!serperClient) {
    const apiKey = process.env.SERPER_API_KEY;
    if (!apiKey) {
      throw new Error('SERPER_API_KEY environment variable is not set');
    }
    serperClient = new SerperClient(apiKey);
  }
  return serperClient;
}