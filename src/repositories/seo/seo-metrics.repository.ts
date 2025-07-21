import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase'; // Assuming you have a Supabase database types file
import { SeoMetrics, AnalysisStatus } from '@/types/seo';

export class SeoMetricsRepository {
  private supabase: SupabaseClient<Database>;

  constructor() {
    this.supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
  }

  async create(metrics: Omit<SeoMetrics, 'id' | 'analysisDate' | 'status'>): Promise<SeoMetrics> {
    const { data, error } = await this.supabase
      .from('competitor_analysis') // Assuming seo_metrics is part of competitor_analysis table
      .insert({
        serp_analysis_id: metrics.competitorAnalysisId,
        keyword: metrics.keyword,
        location: metrics.location,
        seo_metrics: metrics.metrics, // Store the full analysis result in the JSONB column
        status: 'completed', // Default status on creation
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save SEO metrics: ${error.message}`);
    }
    return data as SeoMetrics; // Cast to SeoMetrics, assuming the DB returns all fields
  }

  async updateStatus(competitorAnalysisId: string, status: AnalysisStatus, errorMessage?: string): Promise<void> {
    const updates: { status: AnalysisStatus; error_message?: string } = { status };
    if (errorMessage) {
      updates.error_message = errorMessage;
    }

    const { error } = await this.supabase
      .from('competitor_analysis')
      .update(updates)
      .eq('serp_analysis_id', competitorAnalysisId);

    if (error) {
      throw new Error(`Failed to update analysis status: ${error.message}`);
    }
  }

  async findByCompetitorAnalysisId(competitorAnalysisId: string): Promise<SeoMetrics | null> {
    const { data, error } = await this.supabase
      .from('competitor_analysis')
      .select('*')
      .eq('serp_analysis_id', competitorAnalysisId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
      throw new Error(`Failed to fetch SEO metrics: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    return {
      id: data.id,
      competitorAnalysisId: data.serp_analysis_id,
      keyword: data.keyword,
      location: data.location,
      analysisDate: data.analysis_date, // Assuming this column exists and is correctly typed
      metrics: data.seo_metrics, // Assuming this column exists and is correctly typed
      status: data.status, // Assuming this column exists and is correctly typed
      errorMessage: data.error_message, // Assuming this column exists and is correctly typed
    };
  }

  async findByKeywordAndLocation(keyword: string, location: string): Promise<SeoMetrics[]> {
    const { data, error } = await this.supabase
      .from('competitor_analysis')
      .select('*')
      .eq('keyword', keyword)
      .eq('location', location)
      .order('analysis_date', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch SEO metrics by keyword and location: ${error.message}`);
    }
    return data as SeoMetrics[];
  }

  async getMetricsHistory(keyword: string, location: string, limit: number = 10): Promise<SeoMetrics[]> {
    const { data, error } = await this.supabase
      .from('competitor_analysis')
      .select('*')
      .eq('keyword', keyword)
      .eq('location', location)
      .order('analysis_date', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch SEO metrics history: ${error.message}`);
    }
    return data as SeoMetrics[];
  }

  async getMetricsForComparison(ids: string[]): Promise<SeoMetrics[]> {
    const { data, error } = await this.supabase
      .from('competitor_analysis')
      .select('*')
      .in('serp_analysis_id', ids);

    if (error) {
      throw new Error(`Failed to fetch SEO metrics for comparison: ${error.message}`);
    }
    return data as SeoMetrics[];
  }
}
