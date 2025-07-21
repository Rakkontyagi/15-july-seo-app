// Generated API Types

export interface AuthResponse {
  user?: User;
  token?: string;
  refreshToken?: string;
}

export interface User {
  id?: string;
  email?: string;
  fullName?: string;
  role?: 'user' | 'admin';
  createdAt?: string;
}

export interface ContentGenerationRequest {
  keyword: string;
  industry: string;
  targetAudience: string;
  tone?: 'authoritative' | 'conversational' | 'academic' | 'practical' | 'thought-provoking';
  wordCount: number;
  competitorInsights?: string;
  targetKeywordDensity?: number;
  lsiKeywords?: string[];
  entities?: Record<string, any>[];
}

export interface ContentGenerationResponse {
  success?: boolean;
  data?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface ContentIntegrationRequest {
  content: string;
  primaryKeyword: string;
  lsiKeywords: string[];
  entities: Record<string, any>[];
  competitorData: CompetitorData[];
}

export interface ContentIntegrationResponse {
  success?: boolean;
  data?: Record<string, any>;
}

export interface CompetitorData {
  url: string;
  wordCount: number;
  keywordDensity: number;
  headingOptimization: number;
  lsiKeywordCount?: number;
  entityCount?: number;
  readabilityScore?: number;
  contentQuality?: number;
}

export interface SERPAnalysisResponse {
  success?: boolean;
  data?: Record<string, any>;
}

export interface SEOAnalysisResponse {
  success?: boolean;
  data?: Record<string, any>;
}

export interface IntelligenceResponse {
  success?: boolean;
  data?: Record<string, any>;
}

export interface Error {
  error?: string;
  message?: string;
  details?: Record<string, any>;
  timestamp?: string;
}



// Generated API Client

export class SEOAutomationClient {
  private baseUrl: string;
  private token?: string;

  constructor(options: { baseUrl?: string; token?: string } = {}) {
    this.baseUrl = options.baseUrl || 'https://seo-automation-app.vercel.app/api';
    this.token = options.token;
  }

  setToken(token: string): void {
    this.token = token;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, { ...options, headers });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

}
