import { NextRequest, NextResponse } from 'next/server';
import { analyzeSeo } from '@/lib/seo/seo-analyzer';
import { SeoMetricsRepository } from '@/repositories/seo/seo-metrics.repository';
import { sanitizeText, sanitizeHtml } from '@/lib/validation/sanitizer';
import { createServiceLogger } from '@/lib/logging/logger';

const logger = createServiceLogger('seo-analyze-api');

export async function POST(request: NextRequest) {
  const seoMetricsRepo = new SeoMetricsRepository();
  let competitorAnalysisId: string | undefined;

  try {
    const { text, html, keyword, headings, competitorAnalysisId: reqCompetitorAnalysisId, competitors } = await request.json();
    competitorAnalysisId = reqCompetitorAnalysisId;

    if (!text || !html || !keyword || !headings || !competitorAnalysisId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Sanitize all input data
    const sanitizedData = {
      text: sanitizeText(text, { maxLength: 50000 }),
      html: sanitizeHtml(html, { maxLength: 100000 }),
      keyword: sanitizeText(keyword, { maxLength: 100 }),
      headings: Array.isArray(headings) ? headings.map((h: any) => ({
        level: h.level,
        text: sanitizeText(h.text || '', { maxLength: 500 })
      })) : [],
      competitorAnalysisId: sanitizeText(competitorAnalysisId, { maxLength: 50 }),
      competitors: Array.isArray(competitors) ? competitors.map((c: any) => ({
        url: c.url,
        title: sanitizeText(c.title || '', { maxLength: 200 }),
        content: sanitizeText(c.content || '', { maxLength: 10000 })
      })) : []
    };

    // Set status to in_progress
    await seoMetricsRepo.updateStatus(competitorAnalysisId, 'in_progress');

    const analysis = await analyzeSeo(
      sanitizedData.text,
      sanitizedData.html,
      sanitizedData.keyword,
      sanitizedData.headings,
      sanitizedData.competitors
    );

    await seoMetricsRepo.create({
      competitorAnalysisId: sanitizedData.competitorAnalysisId,
      keyword: sanitizedData.keyword,
      location: 'unknown', // Location should ideally come from the request as well
      metrics: analysis,
    });

    // Set status to completed
    await seoMetricsRepo.updateStatus(competitorAnalysisId, 'completed');

    return NextResponse.json(analysis);
  } catch (error) {
    logger.error('Error in SEO analysis:', { error: error instanceof Error ? error.message : error });
    if (competitorAnalysisId) {
      await seoMetricsRepo.updateStatus(competitorAnalysisId, 'failed', error instanceof Error ? error.message : 'Unknown error');
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}