import { UserIntentAnalyzer } from '../intent-analyzer';

describe('UserIntentAnalyzer', () => {
  let analyzer: UserIntentAnalyzer;

  beforeEach(() => {
    analyzer = new UserIntentAnalyzer();
  });

  describe('Intent Classification', () => {
    it('should classify informational intent correctly', () => {
      const result = analyzer.classifyIntent('how to improve SEO ranking');
      
      expect(result.primaryIntent).toBe('informational');
      expect(result.intentConfidence).toBeGreaterThan(0);
      expect(result.contentRequirements).toContain('Provide comprehensive answers');
    });

    it('should classify commercial intent correctly', () => {
      const result = analyzer.classifyIntent('best SEO tools review');
      
      expect(result.primaryIntent).toBe('commercial');
      expect(result.contentRequirements).toContain('Highlight product benefits');
    });

    it('should classify navigational intent correctly', () => {
      const result = analyzer.classifyIntent('company about page');
      
      expect(result.primaryIntent).toBe('navigational');
      expect(result.contentRequirements).toContain('Provide clear links to relevant pages');
    });

    it('should classify transactional intent correctly', () => {
      const result = analyzer.classifyIntent('buy SEO software');
      
      expect(result.primaryIntent).toBe('transactional');
      expect(result.contentRequirements).toContain('Include clear calls to action');
    });

    it('should identify secondary intents', () => {
      const result = analyzer.classifyIntent('best SEO guide tutorial');
      
      expect(result.secondaryIntents).toContain('informational');
      expect(result.secondaryIntents.length).toBeGreaterThan(0);
    });

    it('should handle empty keyword gracefully', () => {
      const result = analyzer.classifyIntent('');
      
      expect(result.primaryIntent).toBeDefined();
      expect(result.intentConfidence).toBe(0);
      expect(result.contentRequirements).toEqual([]);
    });
  });

  describe('Intent Confidence Scoring', () => {
    it('should calculate confidence accurately', () => {
      const result = analyzer.classifyIntent('how to tutorial guide');
      
      expect(result.intentConfidence).toBeGreaterThan(0);
      expect(result.intentConfidence).toBeLessThanOrEqual(1);
    });

    it('should have high confidence for clear intent signals', () => {
      const result = analyzer.classifyIntent('what is SEO and how does it work');
      
      expect(result.intentConfidence).toBeGreaterThan(0.5);
    });
  });

  describe('Content Requirements Generation', () => {
    it('should generate appropriate requirements for each intent type', () => {
      const informationalResult = analyzer.classifyIntent('what is SEO');
      const commercialResult = analyzer.classifyIntent('best SEO tools');
      const navigationalResult = analyzer.classifyIntent('contact us');
      const transactionalResult = analyzer.classifyIntent('buy SEO course');

      expect(informationalResult.contentRequirements).toContain('Provide comprehensive answers');
      expect(commercialResult.contentRequirements).toContain('Highlight product benefits');
      expect(navigationalResult.contentRequirements).toContain('Provide clear links to relevant pages');
      expect(transactionalResult.contentRequirements).toContain('Include clear calls to action');
    });
  });
});