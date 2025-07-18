
import { NextRequest, NextResponse } from 'next/server';
import { SeoMetricsRepository } from '@/repositories/seo/seo-metrics.repository';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: 'Missing metric ID' }, { status: 400 });
    }

    const seoMetricsRepo = new SeoMetricsRepository();
    const metrics = await seoMetricsRepo.findByCompetitorAnalysisId(id);

    if (!metrics) {
      return NextResponse.json({ error: 'Metrics not found' }, { status: 404 });
    }

    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Error fetching SEO metrics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
