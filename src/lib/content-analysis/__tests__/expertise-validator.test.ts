/**
 * Comprehensive tests for Expertise Validator
 * Story 7.3: E-E-A-T Optimization and Trust Signal Integration
 */

import { ExpertiseValidator, ExpertiseValidationResult } from '../expertise-validator';

describe('ExpertiseValidator', () => {
  let validator: ExpertiseValidator;

  beforeEach(() => {
    validator = new ExpertiseValidator();
  });

  describe('Constructor', () => {
    it('should initialize with technical term database', () => {
      expect(validator).toBeInstanceOf(ExpertiseValidator);
    });
  });

  describe('validateExpertise', () => {
    it('should validate basic expertise requirements', () => {
      const content = 'This article discusses SEO techniques and best practices.';
      const result = validator.validateExpertise(content);
      
      expect(result).toBeDefined();
      expect(typeof result.isValid).toBe('boolean');
      expect(typeof result.score).toBe('number');
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.details).toBeDefined();
      expect(Array.isArray(result.issues)).toBe(true);
      expect(Array.isArray(result.recommendations)).toBe(true);
    });

    it('should validate high expertise content', () => {
      const expertContent = `Technical analysis of Core Web Vitals optimization requires 
        specialized knowledge of JavaScript execution patterns, critical rendering path 
        optimization, and advanced caching strategies. Research demonstrates that 
        systematic implementation of resource prioritization methodologies can improve 
        Largest Contentful Paint by 40% while maintaining First Input Delay under 100ms.`;
      
      const result = validator.validateExpertise(expertContent, 'seo');
      
      expect(result.score).toBeGreaterThan(70);
      expect(result.isValid).toBe(true);
      expect(result.details.technicalAccuracy).toBeGreaterThan(60);
      expect(result.details.specializedKnowledge).toBeGreaterThan(60);
      expect(result.details.conceptDepth).toBeGreaterThan(60);
    });

    it('should identify low expertise content', () => {
      const basicContent = 'SEO is good for websites. It helps with rankings.';
      const result = validator.validateExpertise(basicContent);
      
      expect(result.score).toBeLessThan(70);
      expect(result.isValid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('should validate industry-specific expertise', () => {
      const seoContent = `SERP analysis reveals that topical authority requires 
        comprehensive entity optimization and strategic schema markup implementation. 
        Crawl budget optimization through hreflang configuration and canonical URL 
        management directly impacts Core Web Vitals performance metrics.`;
      
      const result = validator.validateExpertise(seoContent, 'seo');
      
      expect(result.details.industryTerminology).toBeGreaterThan(60);
      expect(result.details.specializedKnowledge).toBeGreaterThan(60);
    });

    it('should handle technology industry content', () => {
      const techContent = `Microservices architecture implementation requires deep understanding 
        of distributed systems, containerization strategies, and API design patterns. 
        Machine learning algorithms utilizing neural networks demand specialized knowledge 
        of quantum computing principles for optimal performance.`;
      
      const result = validator.validateExpertise(techContent, 'technology');
      
      expect(result.details.specializedKnowledge).toBeGreaterThan(60);
      expect(result.details.industryTerminology).toBeGreaterThan(50);
    });

    it('should validate marketing expertise', () => {
      const marketingContent = `Attribution modeling analysis demonstrates that customer lifetime value 
        optimization requires sophisticated predictive analytics and cohort analysis. 
        ROI calculations must account for conversion rate variations across multiple touchpoints.`;
      
      const result = validator.validateExpertise(marketingContent, 'marketing');
      
      expect(result.details.specializedKnowledge).toBeGreaterThan(60);
      expect(result.details.industryTerminology).toBeGreaterThan(50);
    });
  });

  describe('validateTechnicalAccuracy', () => {
    it('should score accuracy indicators highly', () => {
      const accurateContent = `Research precisely demonstrates that 95% of websites 
        experience improved rankings when implementing these methodologies. 
        According to peer-reviewed studies (2023), this systematic approach 
        scientifically validates the framework's effectiveness.`;
      
      const score = validator.validateTechnicalAccuracy(accurateContent);
      
      expect(score).toBeGreaterThan(70);
    });

    it('should detect statistical evidence', () => {
      const statisticalContent = `Studies show 85% improvement in organic traffic. 
        Research by Stanford University indicates 67% of users prefer this approach. 
        Data from 10,000 websites demonstrates 45% increase in conversion rates.`;
      
      const score = validator.validateTechnicalAccuracy(statisticalContent);
      
      expect(score).toBeGreaterThan(60);
    });

    it('should recognize citations and sources', () => {
      const citedContent = `According to Google's research team, published findings (2023) 
        indicate significant improvements. Study by MIT [1] demonstrates effectiveness. 
        Research by industry experts shows measurable results.`;
      
      const score = validator.validateTechnicalAccuracy(citedContent);
      
      expect(score).toBeGreaterThan(60);
    });

    it('should identify methodological approaches', () => {
      const methodicalContent = `This systematic methodology follows established frameworks 
        and proven processes. The comprehensive approach utilizes structured systems 
        for optimal implementation and measurable outcomes.`;
      
      const score = validator.validateTechnicalAccuracy(methodicalContent);
      
      expect(score).toBeGreaterThan(60);
    });
  });

  describe('validateSpecializedKnowledge', () => {
    it('should score advanced terms higher than basic terms', () => {
      const basicContent = 'SEO and API are important for websites.';
      const advancedContent = 'Entity optimization and neural networks require topical authority.';
      
      const basicScore = validator.validateSpecializedKnowledge(basicContent, 'seo');
      const advancedScore = validator.validateSpecializedKnowledge(advancedContent, 'seo');
      
      expect(advancedScore).toBeGreaterThan(basicScore);
    });

    it('should handle content without industry specification', () => {
      const generalContent = 'Machine learning algorithms and SEO backlinks are important.';
      const score = validator.validateSpecializedKnowledge(generalContent);
      
      expect(score).toBeGreaterThanOrEqual(40);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should recognize term complexity levels', () => {
      const content = `Basic API integration with intermediate microservices architecture 
        requires advanced quantum computing knowledge for optimal neural network performance.`;
      
      const score = validator.validateSpecializedKnowledge(content, 'technology');
      
      expect(score).toBeGreaterThan(60);
    });
  });

  describe('validateIndustryTerminology', () => {
    it('should calculate terminology density correctly', () => {
      const denseContent = `SERP analysis using schema markup and hreflang optimization 
        improves Core Web Vitals through canonical URL management and crawl budget allocation.`;
      
      const sparseContent = `Website optimization is important for search engine rankings 
        and user experience improvement through various techniques and methods.`;
      
      const denseScore = validator.validateIndustryTerminology(denseContent, 'seo');
      const sparseScore = validator.validateIndustryTerminology(sparseContent, 'seo');
      
      expect(denseScore).toBeGreaterThan(sparseScore);
    });

    it('should reward terminology consistency', () => {
      const consistentContent = `Technical optimization requires technical analysis and 
        technical implementation. Systematic approaches demand systematic planning and 
        systematic execution for optimal systematic results.`;
      
      const score = validator.validateIndustryTerminology(consistentContent);
      
      expect(score).toBeGreaterThan(50);
    });
  });

  describe('Error Handling', () => {
    it('should handle empty content gracefully', () => {
      const result = validator.validateExpertise('');
      
      expect(result).toBeDefined();
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.isValid).toBe(false);
    });

    it('should handle very long content efficiently', () => {
      const longContent = 'Technical analysis requires specialized knowledge. '.repeat(1000);
      const startTime = Date.now();
      
      const result = validator.validateExpertise(longContent, 'technology');
      
      const endTime = Date.now();
      const processingTime = endTime - startTime;
      
      expect(result).toBeDefined();
      expect(processingTime).toBeLessThan(1000);
    });

    it('should handle invalid industry gracefully', () => {
      const content = 'Technical content with specialized knowledge.';
      const result = validator.validateExpertise(content, 'nonexistent-industry');
      
      expect(result).toBeDefined();
      expect(result.score).toBeGreaterThanOrEqual(0);
    });

    it('should handle content with special characters', () => {
      const content = 'API integration (REST/GraphQL) requires 100% accuracy & systematic approach!';
      const result = validator.validateExpertise(content, 'technology');
      
      expect(result).toBeDefined();
      expect(result.score).toBeGreaterThan(0);
    });
  });

  describe('Recommendations and Issues', () => {
    it('should provide specific recommendations for low scores', () => {
      const basicContent = 'Simple content without expertise.';
      const result = validator.validateExpertise(basicContent);
      
      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.issues.length).toBeGreaterThan(0);
      
      const hasRelevantRecommendations = result.recommendations.some(rec => 
        rec.includes('technical') || rec.includes('specialized') || 
        rec.includes('industry') || rec.includes('concept')
      );
      expect(hasRelevantRecommendations).toBe(true);
    });

    it('should identify specific expertise gaps', () => {
      const content = 'Basic information without depth.';
      const result = validator.validateExpertise(content);
      
      const hasSpecificIssues = result.issues.some(issue => 
        issue.includes('technical accuracy') || issue.includes('specialized knowledge') ||
        issue.includes('industry terminology') || issue.includes('concept')
      );
      expect(hasSpecificIssues).toBe(true);
    });
  });

  describe('Performance and Quality', () => {
    it('should provide consistent results for identical content', () => {
      const content = 'Technical analysis requires specialized knowledge and systematic methodology.';
      
      const result1 = validator.validateExpertise(content, 'technology');
      const result2 = validator.validateExpertise(content, 'technology');
      
      expect(result1.score).toBe(result2.score);
      expect(result1.isValid).toBe(result2.isValid);
      expect(result1.details.technicalAccuracy).toBe(result2.details.technicalAccuracy);
    });

    it('should handle concurrent validation requests', async () => {
      const content = 'Technical content for concurrent processing.';
      
      const promises = Array(5).fill(null).map(() => 
        Promise.resolve(validator.validateExpertise(content, 'technology'))
      );
      
      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(typeof result.score).toBe('number');
      });
    });

    it('should differentiate expertise levels effectively', () => {
      const noviceContent = 'SEO helps websites rank better in search engines.';
      const expertContent = `Advanced entity optimization through strategic schema markup 
        implementation requires deep understanding of topical authority development and 
        semantic search algorithms. Technical SEO audits must analyze crawl budget 
        allocation, hreflang configuration, and Core Web Vitals optimization patterns.`;
      
      const noviceResult = validator.validateExpertise(noviceContent, 'seo');
      const expertResult = validator.validateExpertise(expertContent, 'seo');
      
      expect(expertResult.score).toBeGreaterThan(noviceResult.score + 30);
      expect(expertResult.isValid).toBe(true);
      expect(noviceResult.isValid).toBe(false);
    });
  });
});
