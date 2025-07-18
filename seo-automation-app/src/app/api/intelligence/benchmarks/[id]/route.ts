
import { NextRequest, NextResponse } from 'next/server';
import { SeoMetricsRepository } from '@/repositories/seo/seo-metrics.repository';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: 'Missing benchmark ID' }, { status: 400 });
    }

    const seoMetricsRepo = new SeoMetricsRepository();
    const metrics = await seoMetricsRepo.findByCompetitorAnalysisId(id); // Assuming ID can fetch a single benchmark

    if (!metrics || !metrics.metrics.benchmarkReport) {
      return NextResponse.json({ error: 'Benchmark not found' }, { status: 404 });
    }

    return NextResponse.json(metrics.metrics.benchmarkReport);
  } catch (error) {
    console.error('Error fetching benchmark:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
