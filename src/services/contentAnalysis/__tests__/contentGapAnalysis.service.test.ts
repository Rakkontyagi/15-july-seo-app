import { ContentGapAnalysisService } from '../contentGapAnalysis.service';

describe('ContentGapAnalysisService', () => {
  let service: ContentGapAnalysisService;

  beforeEach(() => {
    service = new ContentGapAnalysisService();
  });

  it('should identify missing keywords in target content compared to competitors', async () => {
    const targetContent = 'This is about SEO and content marketing.';
    const competitorContents = [
      'Competitor A talks about SEO, content marketing, and keyword research.',
      'Competitor B focuses on SEO, keyword research, and digital marketing.',
    ];
    const keywordsToAnalyze = ['SEO', 'content marketing', 'keyword research', 'digital marketing', 'unrelated'];

    const result = await service.analyze({
      targetContent,
      competitorContents,
      keywordsToAnalyze,
    });

    expect(result.missingKeywords).toEqual(['keyword research', 'digital marketing']);
    expect(result.presentKeywords).toEqual(['SEO', 'content marketing']);
    expect(result.gapScore).toBeCloseTo(0.4, 2); // 2 missing / 5 total
  });

  it('should return empty missingKeywords if target content covers all keywords', async () => {
    const targetContent = 'SEO, content marketing, keyword research, digital marketing.';
    const competitorContents = [
      'Competitor A talks about SEO, content marketing, and keyword research.',
      'Competitor B focuses on SEO, keyword research, and digital marketing.',
    ];
    const keywordsToAnalyze = ['SEO', 'content marketing', 'keyword research', 'digital marketing'];

    const result = await service.analyze({
      targetContent,
      competitorContents,
      keywordsToAnalyze,
    });

    expect(result.missingKeywords).toHaveLength(0);
    expect(result.presentKeywords).toEqual(['SEO', 'content marketing', 'keyword research', 'digital marketing']);
    expect(result.gapScore).toBe(0);
  });

  it('should throw an error for empty competitor contents', async () => {
    const targetContent = 'This is about SEO.';
    const competitorContents: string[] = [];
    const keywordsToAnalyze = ['SEO', 'keyword research'];

    await expect(service.analyze({
      targetContent,
      competitorContents,
      keywordsToAnalyze,
    })).rejects.toThrow('At least one competitor content is required.');
  });

  it('should throw an error for no keywordsToAnalyze', async () => {
    const targetContent = 'This is some content.';
    const competitorContents = ['some content'];
    const keywordsToAnalyze: string[] = [];

    await expect(service.analyze({
      targetContent,
      competitorContents,
      keywordsToAnalyze,
    })).rejects.toThrow('At least one keyword to analyze is required.');
  });

  it('should be case-insensitive when matching keywords', async () => {
    const targetContent = 'This is about seo.';
    const competitorContents = ['Competitor A talks about SEO.'];
    const keywordsToAnalyze = ['SEO'];

    const result = await service.analyze({
      targetContent,
      competitorContents,
      keywordsToAnalyze,
    });

    expect(result.missingKeywords).toHaveLength(0);
    expect(result.presentKeywords).toEqual(['SEO']);
  });

  it('should validate input and throw error for invalid targetContent', async () => {
    const targetContent = 'short'; // Too short
    const competitorContents = ['some content'];
    const keywordsToAnalyze = ['keyword'];

    await expect(service.analyze({
      targetContent,
      competitorContents,
      keywordsToAnalyze,
    })).rejects.toThrow('Target content must be at least 10 characters long.');
  });

  it('should validate input and throw error for no competitorContents', async () => {
    const targetContent = 'This is some content.';
    const competitorContents: string[] = [];
    const keywordsToAnalyze = ['keyword'];

    await expect(service.analyze({
      targetContent,
      competitorContents,
      keywordsToAnalyze,
    })).rejects.toThrow('At least one competitor content is required.');
  });

  it('should validate input and throw error for no keywordsToAnalyze', async () => {
    const targetContent = 'This is some content.';
    const competitorContents = ['some content'];
    const keywordsToAnalyze: string[] = [];

    await expect(service.analyze({
      targetContent,
      competitorContents,
      keywordsToAnalyze,
    })).rejects.toThrow('At least one keyword to analyze is required.');
  });
});
