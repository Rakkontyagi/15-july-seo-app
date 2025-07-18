import { TopicalAnalysisService } from '../topicalAnalysis.service';

describe('TopicalAnalysisService', () => {
  let service: TopicalAnalysisService;

  beforeEach(() => {
    service = new TopicalAnalysisService();
  });

  it('should analyze content and cluster keywords', async () => {
    const content = 
      'SEO is important for websites. Keyword research is a core part of SEO. ' +
      'Content marketing also plays a role in SEO. Digital marketing encompasses SEO and content.';
    const keywords = ['SEO', 'keyword research', 'content marketing', 'digital marketing', 'unrelated'];

    const result = await service.analyze({
      content,
      keywords,
    });

    expect(result.clusters).toHaveLength(4); // SEO, keyword research, content marketing, digital marketing
    expect(result.unclusteredKeywords).toEqual(['unrelated']);

    const seoCluster = result.clusters.find(c => c.topic === 'SEO');
    expect(seoCluster).toBeDefined();
    expect(seoCluster?.keywords).toEqual(['SEO']);
    expect(seoCluster?.relevanceScore).toBeGreaterThan(0);

    const keywordResearchCluster = result.clusters.find(c => c.topic === 'keyword research');
    expect(keywordResearchCluster).toBeDefined();
    expect(keywordResearchCluster?.keywords).toEqual(['keyword research']);

    const contentMarketingCluster = result.clusters.find(c => c.topic === 'content marketing');
    expect(contentMarketingCluster).toBeDefined();
    expect(contentMarketingCluster?.keywords).toEqual(['content marketing']);

    const digitalMarketingCluster = result.clusters.find(c => c.topic === 'digital marketing');
    expect(digitalMarketingCluster).toBeDefined();
    expect(digitalMarketingCluster?.keywords).toEqual(['digital marketing']);
  });

  it('should throw an error for empty content', async () => {
    const content = '';
    const keywords = ['SEO', 'keyword research'];

    await expect(service.analyze({
      content,
      keywords,
    })).rejects.toThrow('Content must be at least 10 characters long.');
  });

  it('should throw an error for no keywords', async () => {
    const content = 'This is some content.';
    const keywords: string[] = [];

    await expect(service.analyze({
      content,
      keywords,
    })).rejects.toThrow('At least one keyword is required.');
  });

  it('should be case-insensitive when matching keywords', async () => {
    const content = 'This is about seo and SeO.';
    const keywords = ['seo'];

    const result = await service.analyze({
      content,
      keywords,
    });

    expect(result.clusters).toHaveLength(1);
    expect(result.clusters[0].topic).toBe('seo');
    expect(result.unclusteredKeywords).toHaveLength(0);
  });

  it('should validate input and throw error for invalid content', async () => {
    const content = 'short'; // Too short
    const keywords = ['keyword'];

    await expect(service.analyze({
      content,
      keywords,
    })).rejects.toThrow('Content must be at least 10 characters long.');
  });

  it('should validate input and throw error for no keywords', async () => {
    const content = 'This is some content.';
    const keywords: string[] = [];

    await expect(service.analyze({
      content,
      keywords,
    })).rejects.toThrow('At least one keyword is required.');
  });
});
