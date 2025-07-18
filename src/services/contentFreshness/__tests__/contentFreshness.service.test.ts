import { ContentFreshnessService } from '../contentFreshness.service';

describe('ContentFreshnessService', () => {
  let service: ContentFreshnessService;

  beforeEach(() => {
    service = new ContentFreshnessService();
  });

  it('should optimize content freshness and provide suggestions', async () => {
    const content = 'This technology was announced last year and will be released soon. In 2020, it was considered groundbreaking.';
    const topic = 'technology';

    const result = await service.optimize({
      content,
      topic,
    });

    expect(result.freshnessScore).toBeLessThan(70); // Should be low due to outdated references
    expect(result.optimizedContent).not.toBe(content);
    expect(result.optimizedContent).toContain('current'); // Should replace 'upcoming'
    expect(result.suggestions.length).toBeGreaterThan(0);
    expect(result.outdatedIndicators.length).toBeGreaterThan(0);
    expect(result.freshnessImprovements.length).toBeGreaterThan(0);
  });

  it('should identify outdated indicators correctly', async () => {
    const content = 'Last year we saw major changes. In 2021, the industry was different. This was previously not possible.';
    const topic = 'business';

    const result = await service.optimize({
      content,
      topic,
    });

    expect(result.outdatedIndicators).toContain('Outdated time reference: "last year"');
    expect(result.outdatedIndicators).toContain('Outdated time reference: "previously"');
    expect(result.outdatedIndicators).toContain('Outdated year reference: 2021');
  });

  it('should handle fresh content with high freshness score', async () => {
    const currentYear = new Date().getFullYear();
    const content = `As of today, current trends show significant growth. Latest developments in ${currentYear} demonstrate new research findings.`;
    const topic = 'research';

    const result = await service.optimize({
      content,
      topic,
    });

    expect(result.freshnessScore).toBeGreaterThan(70);
    expect(result.suggestions.length).toBeGreaterThan(0);
  });

  it('should factor in last updated date for scoring', async () => {
    const content = 'This is standard content without specific time references.';
    const topic = 'general';
    const recentDate = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000); // 20 days ago
    const oldDate = new Date(Date.now() - 200 * 24 * 60 * 60 * 1000); // 200 days ago

    const recentResult = await service.optimize({
      content,
      topic,
      lastUpdated: recentDate,
    });

    const oldResult = await service.optimize({
      content,
      topic,
      lastUpdated: oldDate,
    });

    expect(recentResult.freshnessScore).toBeGreaterThan(oldResult.freshnessScore);
  });

  it('should provide topic-specific suggestions for technology content', async () => {
    const content = 'Software development practices are important for teams.';
    const topic = 'technology';

    const result = await service.optimize({
      content,
      topic,
    });

    expect(result.suggestions).toContain('Reference latest software versions and technology updates');
    expect(result.freshnessImprovements.some(imp => imp.type === 'Technology Updates')).toBe(true);
  });

  it('should provide topic-specific suggestions for marketing content', async () => {
    const content = 'SEO strategies help improve website rankings effectively.';
    const topic = 'marketing';

    const result = await service.optimize({
      content,
      topic,
    });

    expect(result.suggestions).toContain('Include recent algorithm updates and marketing trends');
    expect(result.freshnessImprovements.some(imp => imp.type === 'Algorithm Updates')).toBe(true);
  });

  it('should handle content with statistics and data', async () => {
    const content = 'Studies show that 75% of users prefer mobile apps. These statistics demonstrate clear trends.';
    const topic = 'mobile technology';

    const result = await service.optimize({
      content,
      topic,
    });

    expect(result.freshnessImprovements.some(imp => imp.type === 'Statistics Update')).toBe(true);
    expect(result.suggestions).toContain('Include recent industry reports and statistics');
  });

  it('should detect potentially outdated future references', async () => {
    const content = 'This feature will be released next month. The beta version is under development.';
    const topic = 'software';

    const result = await service.optimize({
      content,
      topic,
    });

    expect(result.outdatedIndicators).toContain('Potentially outdated future reference: "will be released"');
    expect(result.outdatedIndicators).toContain('Potentially outdated future reference: "under development"');
  });

  it('should add current year context when missing', async () => {
    const currentYear = new Date().getFullYear();
    const content = 'These practices are effective for business growth.';
    const topic = 'business';

    const result = await service.optimize({
      content,
      topic,
    });

    expect(result.optimizedContent).toContain(currentYear.toString());
    expect(result.suggestions).toContain(`Added current year (${currentYear}) context for timeliness`);
  });

  it('should replace outdated time references', async () => {
    const content = 'Last year, the industry changed significantly. Previously, this was not possible.';
    const topic = 'industry';

    const result = await service.optimize({
      content,
      topic,
    });

    expect(result.optimizedContent).toContain('in recent months');
    expect(result.optimizedContent).toContain('historically');
    expect(result.suggestions).toContain('Updated time reference to be more current');
    expect(result.suggestions).toContain('Replaced vague time reference');
  });

  it('should validate input and throw error for invalid content', async () => {
    const content = 'short'; // Too short
    const topic = 'test';

    await expect(service.optimize({
      content,
      topic,
    })).rejects.toThrow('Content must be at least 10 characters long.');
  });

  it('should validate input and throw error for missing topic', async () => {
    const content = 'This is some content for testing.';
    const topic = '';

    await expect(service.optimize({
      content,
      topic,
    })).rejects.toThrow('Topic is required for freshness analysis.');
  });

  it('should generate improvement suggestions with priorities', async () => {
    const content = 'Basic content about business practices and strategies.';
    const topic = 'business';

    const result = await service.optimize({
      content,
      topic,
    });

    expect(result.freshnessImprovements.length).toBeGreaterThan(0);
    
    const highPriorityImprovements = result.freshnessImprovements.filter(imp => imp.priority === 'high');
    const mediumPriorityImprovements = result.freshnessImprovements.filter(imp => imp.priority === 'medium');
    const lowPriorityImprovements = result.freshnessImprovements.filter(imp => imp.priority === 'low');

    expect(highPriorityImprovements.length).toBeGreaterThan(0);
    expect(mediumPriorityImprovements.length).toBeGreaterThan(0);
    expect(lowPriorityImprovements.length).toBeGreaterThan(0);
  });

  it('should maintain content structure during optimization', async () => {
    const content = 'Introduction paragraph. Last year was important. Conclusion follows.';
    const topic = 'general';

    const result = await service.optimize({
      content,
      topic,
    });

    expect(result.optimizedContent).toContain('Introduction paragraph');
    expect(result.optimizedContent).toContain('Conclusion follows');
    expect(result.optimizedContent).not.toContain('Last year');
  });

  it('should handle edge case with no outdated indicators', async () => {
    const currentYear = new Date().getFullYear();
    const content = `Current trends in ${currentYear} show latest developments with recent studies.`;
    const topic = 'research';

    const result = await service.optimize({
      content,
      topic,
    });

    expect(result.outdatedIndicators.length).toBe(0);
    expect(result.freshnessScore).toBeGreaterThan(60);
  });
});