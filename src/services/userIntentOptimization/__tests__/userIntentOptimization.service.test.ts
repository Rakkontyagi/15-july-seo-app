import { UserIntentOptimizationService } from '../userIntentOptimization.service';

describe('UserIntentOptimizationService', () => {
  let service: UserIntentOptimizationService;

  beforeEach(() => {
    service = new UserIntentOptimizationService();
  });

  it('should optimize content for informational intent', async () => {
    const content = 'This is basic content about SEO practices.';
    const targetIntent = 'informational';
    const targetKeywords = ['SEO', 'search optimization'];

    const result = await service.optimize({
      content,
      targetIntent,
      targetKeywords,
    });

    expect(result.optimizedIntentScore).toBeGreaterThan(result.currentIntentScore);
    expect(result.optimizedContent).toContain('Introduction');
    expect(result.intentAlignment.informational).toBeGreaterThan(0);
    expect(result.suggestions).toContain('Added introduction section for informational intent');
    expect(result.intentOptimizations.some(opt => opt.type === 'Content Structure')).toBe(true);
  });

  it('should optimize content for commercial intent', async () => {
    const content = 'This product helps with marketing automation tasks.';
    const targetIntent = 'commercial';
    const targetKeywords = ['marketing automation', 'tools'];

    const result = await service.optimize({
      content,
      targetIntent,
      targetKeywords,
    });

    expect(result.optimizedIntentScore).toBeGreaterThan(result.currentIntentScore);
    expect(result.optimizedContent).toContain('Compare');
    expect(result.optimizedContent).toContain('reviews');
    expect(result.intentAlignment.commercial).toBeGreaterThan(0);
    expect(result.suggestions).toContain('Added comparison element for commercial intent');
    expect(result.intentOptimizations.some(opt => opt.type === 'Product Comparison')).toBe(true);
  });

  it('should optimize content for navigational intent', async () => {
    const content = 'Welcome to our website. Find information about our services.';
    const targetIntent = 'navigational';
    const targetKeywords = ['company', 'services'];

    const result = await service.optimize({
      content,
      targetIntent,
      targetKeywords,
    });

    expect(result.optimizedIntentScore).toBeGreaterThan(result.currentIntentScore);
    expect(result.optimizedContent).toContain('contact');
    expect(result.optimizedContent).toContain('Navigation');
    expect(result.intentAlignment.navigational).toBeGreaterThan(0);
    expect(result.suggestions).toContain('Added contact information for navigational intent');
    expect(result.intentOptimizations.some(opt => opt.type === 'Contact Information')).toBe(true);
  });

  it('should optimize content for transactional intent', async () => {
    const content = 'Our software solution helps businesses grow efficiently.';
    const targetIntent = 'transactional';
    const targetKeywords = ['software', 'business solution'];

    const result = await service.optimize({
      content,
      targetIntent,
      targetKeywords,
    });

    expect(result.optimizedIntentScore).toBeGreaterThan(result.currentIntentScore);
    expect(result.optimizedContent).toContain('get started');
    expect(result.optimizedContent).toContain('today');
    expect(result.intentAlignment.transactional).toBeGreaterThan(0);
    expect(result.suggestions).toContain('Added call-to-action for transactional intent');
    expect(result.intentOptimizations.some(opt => opt.type === 'Call-to-Action')).toBe(true);
  });

  it('should analyze intent alignment correctly for informational content', async () => {
    const content = 'Learn how to implement SEO best practices. This guide explains the process step by step.';
    const targetIntent = 'informational';
    const targetKeywords = ['SEO guide'];

    const result = await service.optimize({
      content,
      targetIntent,
      targetKeywords,
    });

    expect(result.intentAlignment.informational).toBeGreaterThan(result.intentAlignment.commercial);
    expect(result.intentAlignment.informational).toBeGreaterThan(result.intentAlignment.navigational);
    expect(result.intentAlignment.informational).toBeGreaterThan(result.intentAlignment.transactional);
  });

  it('should analyze intent alignment correctly for commercial content', async () => {
    const content = 'Compare the best SEO tools. Reviews and ratings help you choose the top alternatives.';
    const targetIntent = 'commercial';
    const targetKeywords = ['SEO tools'];

    const result = await service.optimize({
      content,
      targetIntent,
      targetKeywords,
    });

    expect(result.intentAlignment.commercial).toBeGreaterThan(result.intentAlignment.informational);
    expect(result.intentAlignment.commercial).toBeGreaterThan(result.intentAlignment.navigational);
    expect(result.intentAlignment.commercial).toBeGreaterThan(result.intentAlignment.transactional);
  });

  it('should analyze intent alignment correctly for transactional content', async () => {
    const content = 'Buy now and get started today. Purchase our premium plan with a special discount.';
    const targetIntent = 'transactional';
    const targetKeywords = ['premium plan'];

    const result = await service.optimize({
      content,
      targetIntent,
      targetKeywords,
    });

    expect(result.intentAlignment.transactional).toBeGreaterThan(result.intentAlignment.informational);
    expect(result.intentAlignment.transactional).toBeGreaterThan(result.intentAlignment.commercial);
    expect(result.intentAlignment.transactional).toBeGreaterThan(result.intentAlignment.navigational);
  });

  it('should provide intent-specific optimization suggestions', async () => {
    const content = 'Basic content about digital marketing strategies.';
    const targetIntent = 'informational';
    const targetKeywords = ['digital marketing'];

    const result = await service.optimize({
      content,
      targetIntent,
      targetKeywords,
    });

    expect(result.intentOptimizations.length).toBeGreaterThan(0);
    
    const highImpactOptimizations = result.intentOptimizations.filter(opt => opt.impact === 'high');
    const mediumImpactOptimizations = result.intentOptimizations.filter(opt => opt.impact === 'medium');
    const lowImpactOptimizations = result.intentOptimizations.filter(opt => opt.impact === 'low');

    expect(highImpactOptimizations.length).toBeGreaterThan(0);
    expect(mediumImpactOptimizations.length).toBeGreaterThan(0);
    expect(lowImpactOptimizations.length).toBeGreaterThan(0);
  });

  it('should handle content that already has strong intent alignment', async () => {
    const content = 'How to learn SEO: A comprehensive guide. Understand the basics and follow these steps to master search optimization.';
    const targetIntent = 'informational';
    const targetKeywords = ['SEO guide'];

    const result = await service.optimize({
      content,
      targetIntent,
      targetKeywords,
    });

    expect(result.currentIntentScore).toBeGreaterThan(0);
    expect(result.intentAlignment.informational).toBeGreaterThan(10);
  });

  it('should maintain content meaning during optimization', async () => {
    const content = 'Digital marketing strategies help businesses reach their target audience effectively.';
    const targetIntent = 'commercial';
    const targetKeywords = ['digital marketing', 'strategies'];

    const result = await service.optimize({
      content,
      targetIntent,
      targetKeywords,
    });

    expect(result.optimizedContent).toContain('Digital marketing');
    expect(result.optimizedContent).toContain('businesses');
    expect(result.optimizedContent).toContain('target audience');
  });

  it('should score intent alignment within valid range', async () => {
    const content = 'This is a test of the intent optimization system for various purposes.';
    const targetIntent = 'informational';
    const targetKeywords = ['test system'];

    const result = await service.optimize({
      content,
      targetIntent,
      targetKeywords,
    });

    expect(result.currentIntentScore).toBeGreaterThanOrEqual(0);
    expect(result.currentIntentScore).toBeLessThanOrEqual(100);
    expect(result.optimizedIntentScore).toBeGreaterThanOrEqual(0);
    expect(result.optimizedIntentScore).toBeLessThanOrEqual(100);

    Object.values(result.intentAlignment).forEach(score => {
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  it('should validate input and throw error for invalid content', async () => {
    const content = 'short'; // Too short
    const targetIntent = 'informational';
    const targetKeywords = ['test'];

    await expect(service.optimize({
      content,
      targetIntent,
      targetKeywords,
    })).rejects.toThrow('Content must be at least 10 characters long.');
  });

  it('should validate input and throw error for invalid target intent', async () => {
    const content = 'This is some content for testing.';
    const targetIntent = 'invalid' as any;
    const targetKeywords = ['test'];

    await expect(service.optimize({
      content,
      targetIntent,
      targetKeywords,
    })).rejects.toThrow();
  });

  it('should validate input and throw error for empty target keywords', async () => {
    const content = 'This is some content for testing.';
    const targetIntent = 'informational';
    const targetKeywords: string[] = [];

    await expect(service.optimize({
      content,
      targetIntent,
      targetKeywords,
    })).rejects.toThrow('At least one target keyword is required.');
  });

  it('should handle multiple keywords appropriately', async () => {
    const content = 'Content about SEO and digital marketing best practices.';
    const targetIntent = 'informational';
    const targetKeywords = ['SEO', 'digital marketing', 'best practices'];

    const result = await service.optimize({
      content,
      targetIntent,
      targetKeywords,
    });

    expect(result.optimizedContent).toContain('SEO');
    expect(result.suggestions.length).toBeGreaterThan(0);
    expect(result.intentOptimizations.length).toBeGreaterThan(0);
  });

  it('should provide different optimization suggestions for different intents', async () => {
    const content = 'Content about email marketing tools and software solutions.';
    const targetKeywords = ['email marketing'];

    const informationalResult = await service.optimize({
      content,
      targetIntent: 'informational',
      targetKeywords,
    });

    const commercialResult = await service.optimize({
      content,
      targetIntent: 'commercial',
      targetKeywords,
    });

    const transactionalResult = await service.optimize({
      content,
      targetIntent: 'transactional',
      targetKeywords,
    });

    // Each should have different optimization approaches
    expect(informationalResult.optimizedContent).not.toBe(commercialResult.optimizedContent);
    expect(commercialResult.optimizedContent).not.toBe(transactionalResult.optimizedContent);
    expect(informationalResult.optimizedContent).not.toBe(transactionalResult.optimizedContent);

    // Intent alignment scores should favor their respective targets
    expect(informationalResult.intentAlignment.informational).toBeGreaterThan(commercialResult.intentAlignment.informational);
    expect(commercialResult.intentAlignment.commercial).toBeGreaterThan(informationalResult.intentAlignment.commercial);
    expect(transactionalResult.intentAlignment.transactional).toBeGreaterThan(informationalResult.intentAlignment.transactional);
  });
});