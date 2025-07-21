import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { ids, format = 'json' } = await request.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'No metric IDs provided for export' }, { status: 400 });
    }

    // Mock data for now - replace with actual repository call
    const metricsToExport = ids.map(id => ({
      id,
      metrics: {
        url: `https://example.com/page-${id}`,
        seoScore: Math.floor(Math.random() * 100),
        pageSpeed: Math.floor(Math.random() * 100),
        mobileScore: Math.floor(Math.random() * 100)
      }
    }));

    if (format === 'json') {
      return new NextResponse(JSON.stringify(metricsToExport, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': 'attachment; filename="seo_metrics.json"',
        },
      });
    } else if (format === 'csv') {
      if (metricsToExport.length === 0) {
        return new NextResponse('', {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename="seo_metrics.csv"'
          }
        });
      }

      const headers = Object.keys(metricsToExport[0].metrics);
      const csvRows = [
        headers.join(','),
        ...metricsToExport.map(row =>
          headers.map(header => JSON.stringify(row.metrics[header])).join(',')
        )
      ];

      return new NextResponse(csvRows.join('\n'), {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="seo_metrics.csv"',
        },
      });
    }

    return NextResponse.json({ error: 'Unsupported export format' }, { status: 400 });
  } catch (error) {
    console.error('Error exporting SEO metrics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}