import axios, { AxiosInstance, AxiosError } from 'axios';
import { z } from 'zod';

// Types and schemas for ScrapingBee API
const ScrapingBeeOrganicResultSchema = z.object({
  title: z.string(),
  url: z.string(),
  displayed_url: z.string(),
  snippet: z.string().optional(),
});

const ScrapingBeeSearchResponseSchema = z.object({
  organic_results: z.array(ScrapingBeeOrganicResultSchema),
  related_searches: z.array(z.object({
    query: z.string(),
  })).optional(),
  people_also_ask: z.array(z.string()).optional(),
});

export type ScrapingBeeOrganicResult = z.infer<typeof ScrapingBeeOrganicResultSchema>;
export type ScrapingBeeSearchResponse = z.infer<typeof ScrapingBeeSearchResponseSchema>;

export interface ScrapingBeeSearchOptions {
  keyword: string;
  country?: string;
  num?: number;
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
      } else if (axios.isAxiosError(error) && error.code === 'ECONNABORTED') {
        const delay = options.delay * (options.factor ** attempt);
        console.warn(`Attempt ${attempt + 1} timed out. Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        attempt++;
      } else {
        throw error; // Re-throw if not a retriable error
      }
    }
  }
  throw new Error(`Failed after ${options.retries} attempts.`);
}

export class ScrapingBeeClient {
  private client: AxiosInstance;
  private apiKey: string;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('ScrapingBee API key is required');
    }

    this.apiKey = apiKey;
    this.client = axios.create({
      baseURL: 'https://app.scrapingbee.com/api/v1/',
      params: {
        api_key: apiKey,
        engine: 'google',
      },
      timeout: 60000 // Default timeout: 60 seconds
    });
  }

  async search(options: ScrapingBeeSearchOptions): Promise<ScrapingBeeSearchResponse> {
    const searchOperation = async () => {
      const searchParams: Record<string, any> = {
        search: options.keyword,
        nb_results: options.num || 10,
      };

      if (options.country) {
        searchParams.country_code = options.country.toLowerCase();
      }

      const response = await this.client.get('', {
        params: searchParams,
        timeout: options.timeout || this.client.defaults.timeout,
      });

      // Validate response
      const validatedResponse = ScrapingBeeSearchResponseSchema.parse(response.data);

      return validatedResponse;
    };

    try {
      return await retry(searchOperation, DEFAULT_RETRY_OPTIONS);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 403) {
          throw new Error('Invalid ScrapingBee API key or quota exceeded');
        }
        if (error.response?.status === 429) {
          throw new Error('ScrapingBee API rate limit exceeded');
        }
        if (error.code === 'ECONNABORTED') {
          throw new Error('ScrapingBee API request timed out');
        }
        throw new Error(`ScrapingBee API error: ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  }
}