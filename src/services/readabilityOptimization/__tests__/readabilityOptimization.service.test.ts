import { ReadabilityOptimizationService } from '../readabilityOptimization.service';

describe('ReadabilityOptimizationService', () => {
  let service: ReadabilityOptimizationService;

  beforeEach(() => {
    service = new ReadabilityOptimizationService();
  });

  it('should optimize content for beginner audience', async () => {
    const content = 'This is an extremely complex sentence that contains multiple clauses and demonstrates sophisticated vocabulary utilization which might be difficult for beginners to understand completely.';
    const targetAudience = 'beginner';

    const result = await service.optimize({
      content,
      targetAudience,
    });

    expect(result.originalReadabilityScore).toBeLessThan(result.optimizedReadabilityScore);
    expect(result.optimizedContent).not.toBe(content);
    expect(result.optimizedContent).toContain('use'); // Should replace 'utilization'
    expect(result.suggestions).toContain('Replaced "utilization" with simpler "use".');
    expect(result.suggestions.length).toBeGreaterThan(0);
  });

  it('should optimize content for intermediate audience', async () => {
    const content = 'This sentence contains multiple independent clauses and subordinate clauses that create a very long and complex structure which can be challenging for intermediate readers to follow effectively and efficiently.';
    const targetAudience = 'intermediate';

    const result = await service.optimize({
      content,
      targetAudience,
    });

    expect(result.originalReadabilityScore).toBeDefined();
    expect(result.optimizedReadabilityScore).toBeDefined();
    expect(result.optimizedContent).toBeDefined();
    expect(result.suggestions).toContain('Split long sentences for better readability.');
  });

  it('should handle advanced audience with minimal changes', async () => {
    const content = 'Advanced readers can handle complex sentences and sophisticated vocabulary without significant difficulty.';
    const targetAudience = 'advanced';

    const result = await service.optimize({
      content,
      targetAudience,
    });

    expect(result.originalReadabilityScore).toBeDefined();
    expect(result.optimizedReadabilityScore).toBeDefined();
    expect(result.suggestions).toContain('Content readability is already suitable for the target audience.');
  });

  it('should handle content that already meets target readability', async () => {
    const content = 'This is simple content. It has short sentences. It is easy to read.';
    const targetAudience = 'beginner';

    const result = await service.optimize({
      content,
      targetAudience,
    });

    expect(result.originalReadabilityScore).toBeGreaterThan(70);
    expect(result.suggestions).toContain('Content readability is already suitable for the target audience.');
  });

  it('should split long sentences appropriately', async () => {
    const content = 'This is a very long sentence that contains many words and multiple clauses and should be split into smaller sentences for better readability and comprehension.';
    const targetAudience = 'beginner';

    const result = await service.optimize({
      content,
      targetAudience,
    });

    expect(result.optimizedContent).toContain('. '); // Should contain sentence splits
    expect(result.suggestions).toContain('Split long sentences for better readability.');
  });

  it('should replace complex words for beginners', async () => {
    const content = 'We will utilize advanced techniques to demonstrate the effectiveness of this approach and facilitate better understanding.';
    const targetAudience = 'beginner';

    const result = await service.optimize({
      content,
      targetAudience,
    });

    expect(result.optimizedContent).toContain('use');
    expect(result.optimizedContent).toContain('show');
    expect(result.optimizedContent).toContain('help');
    expect(result.suggestions.some(s => s.includes('Replaced'))).toBe(true);
  });

  it('should not replace complex words for advanced audience', async () => {
    const content = 'We will utilize advanced techniques to demonstrate the effectiveness.';
    const targetAudience = 'advanced';

    const result = await service.optimize({
      content,
      targetAudience,
    });

    expect(result.optimizedContent).toContain('utilize');
    expect(result.optimizedContent).toContain('demonstrate');
  });

  it('should calculate readability scores within valid range', async () => {
    const content = 'This is a test sentence for readability calculation purposes.';
    const targetAudience = 'intermediate';

    const result = await service.optimize({
      content,
      targetAudience,
    });

    expect(result.originalReadabilityScore).toBeGreaterThanOrEqual(0);
    expect(result.originalReadabilityScore).toBeLessThanOrEqual(100);
    expect(result.optimizedReadabilityScore).toBeGreaterThanOrEqual(0);
    expect(result.optimizedReadabilityScore).toBeLessThanOrEqual(100);
  });

  it('should handle very short content', async () => {
    const content = 'Short text.';
    const targetAudience = 'beginner';

    const result = await service.optimize({
      content,
      targetAudience,
    });

    expect(result.originalReadabilityScore).toBeDefined();
    expect(result.optimizedContent).toBe(content);
    expect(result.suggestions).toContain('Content readability is already suitable for the target audience.');
  });

  it('should validate input and throw error for invalid content', async () => {
    const content = 'short'; // Too short
    const targetAudience = 'beginner';

    await expect(service.optimize({
      content,
      targetAudience,
    })).rejects.toThrow('Content must be at least 10 characters long.');
  });

  it('should validate input and throw error for invalid target audience', async () => {
    const content = 'This is some content for testing.';
    const targetAudience = 'invalid' as any;

    await expect(service.optimize({
      content,
      targetAudience,
    })).rejects.toThrow();
  });

  it('should handle content with multiple sentences correctly', async () => {
    const content = 'First sentence is short. Second sentence is also relatively brief and easy to understand. Third sentence contains multiple clauses and demonstrates more complex sentence structure that might benefit from optimization.';
    const targetAudience = 'beginner';

    const result = await service.optimize({
      content,
      targetAudience,
    });

    expect(result.optimizedContent).toBeDefined();
    expect(result.originalReadabilityScore).toBeDefined();
    expect(result.optimizedReadabilityScore).toBeDefined();
    expect(result.suggestions.length).toBeGreaterThan(0);
  });

  it('should maintain content meaning during optimization', async () => {
    const content = 'We utilize sophisticated algorithms to demonstrate optimal performance.';
    const targetAudience = 'beginner';

    const result = await service.optimize({
      content,
      targetAudience,
    });

    // Check that key words are still present (or replaced appropriately)
    expect(result.optimizedContent.toLowerCase()).toContain('algorithm');
    expect(result.optimizedContent.toLowerCase()).toContain('performance');
    expect(result.optimizedContent.toLowerCase()).toContain('optimal');
  });
});