import { FeaturedSnippetOptimizationService } from '../featuredSnippetOptimization.service';

describe('FeaturedSnippetOptimizationService', () => {
  let service: FeaturedSnippetOptimizationService;

  beforeEach(() => {
    service = new FeaturedSnippetOptimizationService();
  });

  it('should optimize content for featured snippet with auto type detection', async () => {
    const content = 'SEO is the practice of increasing website visibility. It involves keyword research and content optimization.';
    const targetQuery = 'what is SEO';

    const result = await service.optimize({
      content,
      targetQuery,
    });

    expect(result.optimizedSnippetScore).toBeGreaterThan(result.snippetScore);
    expect(result.recommendedSnippetType).toBe('paragraph');
    expect(result.optimizedContent).toContain('SEO');
    expect(result.suggestions.length).toBeGreaterThan(0);
    expect(result.snippetOptimizations.length).toBeGreaterThan(0);
  });

  it('should detect list format for step-based queries', async () => {
    const content = 'First, research keywords. Second, create content. Third, optimize for search engines.';
    const targetQuery = 'how to improve SEO steps';

    const result = await service.optimize({
      content,
      targetQuery,
    });

    expect(result.recommendedSnippetType).toBe('list');
    expect(result.snippetFormats.list.content).toContain('1.');
    expect(result.snippetFormats.list.score).toBeGreaterThan(0);
  });

  it('should detect table format for comparison queries', async () => {
    const content = 'Tool A costs $50 and has basic features. Tool B costs $100 with advanced features.';
    const targetQuery = 'SEO tools comparison';

    const result = await service.optimize({
      content,
      targetQuery,
    });

    expect(result.recommendedSnippetType).toBe('table');
    expect(result.snippetFormats.table.content).toContain('|');
    expect(result.snippetFormats.table.score).toBeGreaterThan(0);
  });

  it('should generate all snippet formats correctly', async () => {
    const content = 'Digital marketing includes SEO, PPC, and social media. Each has unique benefits for businesses.';
    const targetQuery = 'what is digital marketing';

    const result = await service.optimize({
      content,
      targetQuery,
    });

    expect(result.snippetFormats.paragraph.content).toBeDefined();
    expect(result.snippetFormats.list.content).toBeDefined();
    expect(result.snippetFormats.table.content).toBeDefined();

    expect(result.snippetFormats.paragraph.score).toBeGreaterThanOrEqual(0);
    expect(result.snippetFormats.list.score).toBeGreaterThanOrEqual(0);
    expect(result.snippetFormats.table.score).toBeGreaterThanOrEqual(0);
  });

  it('should optimize paragraph format with optimal length', async () => {
    const content = 'A very short sentence. This is a much longer sentence that provides detailed information about the topic and should be selected for the paragraph snippet because it contains relevant keywords and maintains appropriate length for featured snippets which typically display between 50 to 300 characters for optimal user experience.';
    const targetQuery = 'detailed information';

    const result = await service.optimize({
      content,
      targetQuery,
      preferredSnippetType: 'paragraph',
    });

    expect(result.snippetFormats.paragraph.content.length).toBeGreaterThan(50);
    expect(result.snippetFormats.paragraph.content.length).toBeLessThanOrEqual(300);
    expect(result.snippetFormats.paragraph.content).toContain('detailed information');
  });

  it('should create list format from sentences', async () => {
    const content = 'First step is planning. Second step involves execution. Third step requires monitoring. Final step is optimization.';
    const targetQuery = 'project management steps';

    const result = await service.optimize({
      content,
      targetQuery,
      preferredSnippetType: 'list',
    });

    expect(result.snippetFormats.list.content).toContain('1.');
    expect(result.snippetFormats.list.content).toContain('2.');
    expect(result.snippetFormats.list.content).toContain('3.');
    expect(result.snippetFormats.list.content).toContain('4.');
  });

  it('should create table format from content', async () => {
    const content = 'Basic plan offers limited features. Premium plan includes advanced tools. Enterprise plan provides full access.';
    const targetQuery = 'pricing plans comparison';

    const result = await service.optimize({
      content,
      targetQuery,
      preferredSnippetType: 'table',
    });

    expect(result.snippetFormats.table.content).toContain('|');
    expect(result.snippetFormats.table.content).toContain('Feature');
    expect(result.snippetFormats.table.content).toContain('Description');
  });

  it('should add direct answer when missing', async () => {
    const content = 'The process involves multiple steps and requires careful planning for successful implementation.';
    const targetQuery = 'what is content marketing';

    const result = await service.optimize({
      content,
      targetQuery,
    });

    expect(result.optimizedContent).toContain('content marketing');
    expect(result.suggestions).toContain('Added direct answer for better snippet targeting');
  });

  it('should calculate snippet scores correctly', async () => {
    const highQualityContent = 'What is SEO? SEO is search engine optimization that helps websites rank higher in search results.';
    const lowQualityContent = 'Random content without any relation to the target query or proper structure.';
    const targetQuery = 'what is SEO';

    const highQualityResult = await service.optimize({
      content: highQualityContent,
      targetQuery,
    });

    const lowQualityResult = await service.optimize({
      content: lowQualityContent,
      targetQuery,
    });

    expect(highQualityResult.snippetScore).toBeGreaterThan(lowQualityResult.snippetScore);
  });

  it('should provide optimization suggestions with priorities', async () => {
    const content = 'Content about digital marketing strategies and implementation.';
    const targetQuery = 'digital marketing guide';

    const result = await service.optimize({
      content,
      targetQuery,
    });

    expect(result.snippetOptimizations.length).toBeGreaterThan(0);

    const highPriorityOptimizations = result.snippetOptimizations.filter(opt => opt.priority === 'high');
    const mediumPriorityOptimizations = result.snippetOptimizations.filter(opt => opt.priority === 'medium');
    const lowPriorityOptimizations = result.snippetOptimizations.filter(opt => opt.priority === 'low');

    expect(highPriorityOptimizations.length).toBeGreaterThan(0);
    expect(mediumPriorityOptimizations.length).toBeGreaterThan(0);
    expect(lowPriorityOptimizations.length).toBeGreaterThan(0);
  });

  it('should handle content with existing list structure', async () => {
    const content = '1. First step\n2. Second step\n3. Third step';
    const targetQuery = 'process steps';

    const result = await service.optimize({
      content,
      targetQuery,
      preferredSnippetType: 'list',
    });

    expect(result.snippetFormats.list.content).toContain('1.');
    expect(result.snippetFormats.list.content).toContain('2.');
    expect(result.snippetFormats.list.content).toContain('3.');
  });

  it('should handle content with existing table structure', async () => {
    const content = '| Feature | Value |\n|---------|-------|\n| Price | $50 |\n| Users | 10 |';
    const targetQuery = 'pricing table';

    const result = await service.optimize({
      content,
      targetQuery,
      preferredSnippetType: 'table',
    });

    expect(result.snippetFormats.table.content).toContain('|');
    expect(result.snippetFormats.table.content).toContain('Feature');
    expect(result.snippetFormats.table.content).toContain('Value');
  });

  it('should score snippet formats within valid range', async () => {
    const content = 'This is test content for snippet scoring validation purposes.';
    const targetQuery = 'test content';

    const result = await service.optimize({
      content,
      targetQuery,
    });

    expect(result.snippetScore).toBeGreaterThanOrEqual(0);
    expect(result.snippetScore).toBeLessThanOrEqual(100);
    expect(result.optimizedSnippetScore).toBeGreaterThanOrEqual(0);
    expect(result.optimizedSnippetScore).toBeLessThanOrEqual(100);

    Object.values(result.snippetFormats).forEach(format => {
      expect(format.score).toBeGreaterThanOrEqual(0);
      expect(format.score).toBeLessThanOrEqual(100);
    });
  });

  it('should validate input and throw error for invalid content', async () => {
    const content = 'short'; // Too short
    const targetQuery = 'test query';

    await expect(service.optimize({
      content,
      targetQuery,
    })).rejects.toThrow('Content must be at least 10 characters long.');
  });

  it('should validate input and throw error for missing target query', async () => {
    const content = 'This is some content for testing.';
    const targetQuery = '';

    await expect(service.optimize({
      content,
      targetQuery,
    })).rejects.toThrow('Target query is required for snippet optimization.');
  });

  it('should handle different question types appropriately', async () => {
    const content = 'Email marketing involves sending targeted messages to subscribers for business growth.';

    const whatQuery = 'what is email marketing';
    const howQuery = 'how to do email marketing';
    const whyQuery = 'why use email marketing';

    const whatResult = await service.optimize({ content, targetQuery: whatQuery });
    const howResult = await service.optimize({ content, targetQuery: howQuery });
    const whyResult = await service.optimize({ content, targetQuery: whyQuery });

    expect(whatResult.optimizedContent.toLowerCase()).toContain('email marketing');
    expect(howResult.optimizedContent.toLowerCase()).toContain('email marketing');
    expect(whyResult.optimizedContent.toLowerCase()).toContain('email marketing');

    // Different query types should potentially recommend different formats
    expect([whatResult.recommendedSnippetType, howResult.recommendedSnippetType, whyResult.recommendedSnippetType])
      .toContain('paragraph');
  });

  it('should maintain content relevance during optimization', async () => {
    const content = 'Search engine optimization helps websites improve their visibility in organic search results through various techniques.';
    const targetQuery = 'SEO benefits';

    const result = await service.optimize({
      content,
      targetQuery,
    });

    expect(result.optimizedContent).toContain('search');
    expect(result.optimizedContent).toContain('optimization');
    expect(result.optimizedContent).toContain('websites');
  });

  it('should handle auto snippet type selection correctly', async () => {
    const listContent = 'How to improve SEO: 1. Research keywords 2. Create quality content 3. Build backlinks';
    const tableContent = 'SEO vs PPC: SEO is organic while PPC is paid advertising';
    const paragraphContent = 'SEO is the practice of optimizing websites for search engines';

    const listQuery = 'SEO improvement steps';
    const tableQuery = 'SEO vs PPC comparison';
    const paragraphQuery = 'what is SEO';

    const listResult = await service.optimize({ content: listContent, targetQuery: listQuery });
    const tableResult = await service.optimize({ content: tableContent, targetQuery: tableQuery });
    const paragraphResult = await service.optimize({ content: paragraphContent, targetQuery: paragraphQuery });

    expect(listResult.recommendedSnippetType).toBe('list');
    expect(tableResult.recommendedSnippetType).toBe('table');
    expect(paragraphResult.recommendedSnippetType).toBe('paragraph');
  });
});