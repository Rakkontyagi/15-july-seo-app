
import { NextRequest, NextResponse } from 'next/server';
import { SeoMetricsRepository } from '@/repositories/seo/seo-metrics.repository';
import { SeoAnalysisResult } from '@/types/seo';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get('keyword');
    const location = searchParams.get('location');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;

    if (!keyword || !location) {
      return NextResponse.json({ error: 'Missing keyword or location parameters' }, { status: 400 });
    }

    const seoMetricsRepo = new SeoMetricsRepository();
    const metricsHistory = await seoMetricsRepo.getMetricsHistory(keyword, location, limit);

    return NextResponse.json(metricsHistory);
  } catch (error) {
    console.error('Error fetching SEO metrics history:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
