
import { NextRequest, NextResponse } from 'next/server';
import { analyzeSeo } from '@/lib/seo/seo-analyzer';
import { SeoMetricsRepository } from '@/repositories/seo/seo-metrics.repository';

export async function POST(request: NextRequest) {
  try {
    const { analyses } = await request.json();

    if (!analyses || !Array.isArray(analyses) || analyses.length === 0) {
      return NextResponse.json({ error: 'No analyses provided for batch processing' }, { status: 400 });
    }

    const seoMetricsRepo = new SeoMetricsRepository();
    const results = [];

    for (const { text, html, keyword, headings, competitorAnalysisId, competitors } of analyses) {
      if (!text || !html || !keyword || !headings || !competitorAnalysisId) {
        results.push({ error: 'Missing required parameters for one or more analyses' });
        continue;
      }

      try {
        const analysis = await analyzeSeo(text, html, keyword, headings, competitors);
        await seoMetricsRepo.create({
          competitorAnalysisId,
          keyword,
          location: 'unknown', // Location should ideally come from the request as well
          metrics: analysis,
        });
        results.push({ success: true, analysis });
      } catch (error) {
        console.error('Error processing batch competitive intelligence analysis:', error);
        results.push({ error: 'Internal server error during analysis' });
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error in batch competitive intelligence analysis:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
