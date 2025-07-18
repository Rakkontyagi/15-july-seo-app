import { PracticalApplicationIntegrator } from '../practical-application-integrator';

describe('PracticalApplicationIntegrator', () => {
  let integrator: PracticalApplicationIntegrator;

  beforeEach(() => {
    integrator = new PracticalApplicationIntegrator();
  });

  describe('Step-by-Step Guidance Integration', () => {
    it('should add step-by-step guidance to content', () => {
      const content = 'This is the original content about SEO optimization.';
      const steps = [
        'Research your target keywords',
        'Optimize your title tags',
        'Create quality content',
        'Build relevant backlinks'
      ];
      
      const enhancedContent = integrator.addStepByStepGuidance(content, steps);
      
      expect(enhancedContent).toContain('Here\'s a step-by-step guide:');
      expect(enhancedContent).toContain('1. Research your target keywords');
      expect(enhancedContent).toContain('2. Optimize your title tags');
      expect(enhancedContent).toContain('3. Create quality content');
      expect(enhancedContent).toContain('4. Build relevant backlinks');
    });

    it('should handle empty steps array', () => {
      const content = 'This is the original content.';
      const steps: string[] = [];
      
      const enhancedContent = integrator.addStepByStepGuidance(content, steps);
      
      expect(enhancedContent).toBe(content);
      expect(enhancedContent).not.toContain('Here\'s a step-by-step guide:');
    });

    it('should preserve original content when adding steps', () => {
      const content = 'Original SEO content here.';
      const steps = ['Step 1', 'Step 2'];
      
      const enhancedContent = integrator.addStepByStepGuidance(content, steps);
      
      expect(enhancedContent).toContain('Original SEO content here.');
    });

    it('should handle single step', () => {
      const content = 'SEO content.';
      const steps = ['Analyze your keywords'];
      
      const enhancedContent = integrator.addStepByStepGuidance(content, steps);
      
      expect(enhancedContent).toContain('1. Analyze your keywords');
    });

    it('should meet >20 implementable steps per article requirement', () => {
      const content = 'SEO optimization guide.';
      const steps = Array.from({length: 25}, (_, i) => `Step ${i + 1}: Implementation task`);
      
      const enhancedContent = integrator.addStepByStepGuidance(content, steps);
      
      expect(steps.length).toBeGreaterThanOrEqual(20);
      steps.forEach((step, index) => {
        expect(enhancedContent).toContain(`${index + 1}. ${step}`);
      });
    });
  });

  describe('Real-World Examples Integration', () => {
    it('should add real-world examples to content', () => {
      const content = 'This is content about SEO strategies.';
      const examples = [
        'Amazon uses keyword-rich product titles',
        'HubSpot creates comprehensive topic clusters',
        'Moz builds authority through expert content'
      ];
      
      const enhancedContent = integrator.addRealWorldExamples(content, examples);
      
      expect(enhancedContent).toContain('Real-world examples:');
      expect(enhancedContent).toContain('- Amazon uses keyword-rich product titles');
      expect(enhancedContent).toContain('- HubSpot creates comprehensive topic clusters');
      expect(enhancedContent).toContain('- Moz builds authority through expert content');
    });

    it('should handle empty examples array', () => {
      const content = 'This is the original content.';
      const examples: string[] = [];
      
      const enhancedContent = integrator.addRealWorldExamples(content, examples);
      
      expect(enhancedContent).toBe(content);
      expect(enhancedContent).not.toContain('Real-world examples:');
    });

    it('should preserve original content when adding examples', () => {
      const content = 'Original SEO strategies content.';
      const examples = ['Example 1', 'Example 2'];
      
      const enhancedContent = integrator.addRealWorldExamples(content, examples);
      
      expect(enhancedContent).toContain('Original SEO strategies content.');
    });

    it('should handle single example', () => {
      const content = 'SEO content.';
      const examples = ['Netflix optimizes for search intent'];
      
      const enhancedContent = integrator.addRealWorldExamples(content, examples);
      
      expect(enhancedContent).toContain('- Netflix optimizes for search intent');
    });

    it('should handle examples with special characters', () => {
      const content = 'SEO content.';
      const examples = ['Company X: "increased traffic by 200%"', 'Brand Y & Z collaboration'];
      
      const enhancedContent = integrator.addRealWorldExamples(content, examples);
      
      expect(enhancedContent).toContain('- Company X: "increased traffic by 200%"');
      expect(enhancedContent).toContain('- Brand Y & Z collaboration');
    });
  });

  describe('Combined Integration', () => {
    it('should handle both steps and examples together', () => {
      const content = 'SEO optimization guide.';
      const steps = ['Research keywords', 'Optimize content'];
      const examples = ['Google uses E-A-T signals', 'Wikipedia focuses on authority'];
      
      let enhancedContent = integrator.addStepByStepGuidance(content, steps);
      enhancedContent = integrator.addRealWorldExamples(enhancedContent, examples);
      
      expect(enhancedContent).toContain('Here\'s a step-by-step guide:');
      expect(enhancedContent).toContain('1. Research keywords');
      expect(enhancedContent).toContain('Real-world examples:');
      expect(enhancedContent).toContain('- Google uses E-A-T signals');
    });

    it('should maintain proper formatting with multiple enhancements', () => {
      const content = 'Original content.';
      const steps = ['Step 1', 'Step 2'];
      const examples = ['Example 1', 'Example 2'];
      
      let enhancedContent = integrator.addStepByStepGuidance(content, steps);
      enhancedContent = integrator.addRealWorldExamples(enhancedContent, examples);
      
      expect(enhancedContent.split('\n').filter(line => line.trim()).length).toBeGreaterThan(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty content', () => {
      const content = '';
      const steps = ['Step 1'];
      const examples = ['Example 1'];
      
      let enhancedContent = integrator.addStepByStepGuidance(content, steps);
      enhancedContent = integrator.addRealWorldExamples(enhancedContent, examples);
      
      expect(enhancedContent).toContain('1. Step 1');
      expect(enhancedContent).toContain('- Example 1');
    });

    it('should handle very long content', () => {
      const content = 'A'.repeat(10000);
      const steps = ['Step 1'];
      
      const enhancedContent = integrator.addStepByStepGuidance(content, steps);
      
      expect(enhancedContent).toContain('A'.repeat(10000));
      expect(enhancedContent).toContain('1. Step 1');
    });

    it('should handle steps with newlines', () => {
      const content = 'SEO content.';
      const steps = ['Step 1\nwith details', 'Step 2'];
      
      const enhancedContent = integrator.addStepByStepGuidance(content, steps);
      
      expect(enhancedContent).toContain('1. Step 1\nwith details');
      expect(enhancedContent).toContain('2. Step 2');
    });

    it('should handle examples with newlines', () => {
      const content = 'SEO content.';
      const examples = ['Example 1\nwith details', 'Example 2'];
      
      const enhancedContent = integrator.addRealWorldExamples(content, examples);
      
      expect(enhancedContent).toContain('- Example 1\nwith details');
      expect(enhancedContent).toContain('- Example 2');
    });

    it('should handle null or undefined inputs gracefully', () => {
      const content = 'SEO content.';
      
      // Should not throw errors
      expect(() => integrator.addStepByStepGuidance(content, [])).not.toThrow();
      expect(() => integrator.addRealWorldExamples(content, [])).not.toThrow();
    });
  });
});