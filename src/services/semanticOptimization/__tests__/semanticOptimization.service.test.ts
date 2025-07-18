import { SemanticOptimizationService } from '../semanticOptimization.service';

describe('SemanticOptimizationService', () => {
  let service: SemanticOptimizationService;

  beforeEach(() => {
    service = new SemanticOptimizationService();
  });

  it('should replace main keywords with suggested terms and return optimized content', async () => {
    const content = 'SEO is important for content marketing.';
    const mainKeywords = ['SEO', 'content'];

    const result = await service.optimize({
      content,
      mainKeywords,
    });

    expect(result.optimizedContent).toBe('search engine optimization is important for article marketing.');
    expect(result.suggestedTerms).toEqual(['search engine optimization', 'article']);
  });

  it('should handle content with no matching keywords', async () => {
    const content = 'This is a test sentence.';
    const mainKeywords = ['nonexistent'];

    const result = await service.optimize({
      content,
      mainKeywords,
    });

    expect(result.optimizedContent).toBe('This is a test sentence.');
    expect(result.suggestedTerms).toEqual([]);
  });

  it('should throw error for empty mainKeywords array', async () => {
    const content = 'SEO is important.';
    const mainKeywords: string[] = [];

    await expect(service.optimize({
      content,
      mainKeywords,
    })).rejects.toThrow('At least one main keyword is required.');
  });

  it('should be case-insensitive when replacing keywords', async () => {
    const content = 'Seo is important for CoNtEnT.';
    const mainKeywords = ['Seo', 'CoNtEnT'];

    const result = await service.optimize({
      content,
      mainKeywords,
    });

    expect(result.optimizedContent).toBe('search engine optimization is important for article.');
    expect(result.suggestedTerms).toEqual(['search engine optimization', 'article']);
  });

  it('should validate input and throw error for invalid content', async () => {
    const content = 'short'; // Too short
    const mainKeywords = ['keyword'];

    await expect(service.optimize({
      content,
      mainKeywords,
    })).rejects.toThrow('Content must be at least 10 characters long.');
  });

});
