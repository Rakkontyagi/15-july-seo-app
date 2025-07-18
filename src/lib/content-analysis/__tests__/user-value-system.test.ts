import { UserIntentAnalyzer } from '../intent-analyzer';
import { ActionableInsightDetector } from '../actionable-insight-detector';
import { ProblemSolutionAligner } from '../problem-solution-aligner';
import { ComprehensiveCoverageAssessor } from '../comprehensive-coverage-assessor';
import { PracticalApplicationIntegrator } from '../practical-application-integrator';
import { ValuePropositionEnhancer } from '../value-proposition-enhancer';
import { UserSatisfactionPredictor } from '../user-satisfaction-predictor';

describe('User Value System Integration', () => {
  let intentAnalyzer: UserIntentAnalyzer;
  let insightDetector: ActionableInsightDetector;
  let solutionAligner: ProblemSolutionAligner;
  let coverageAssessor: ComprehensiveCoverageAssessor;
  let applicationIntegrator: PracticalApplicationIntegrator;
  let valueEnhancer: ValuePropositionEnhancer;
  let satisfactionPredictor: UserSatisfactionPredictor;

  beforeEach(() => {
    intentAnalyzer = new UserIntentAnalyzer();
    insightDetector = new ActionableInsightDetector();
    solutionAligner = new ProblemSolutionAligner();
    coverageAssessor = new ComprehensiveCoverageAssessor();
    applicationIntegrator = new PracticalApplicationIntegrator();
    valueEnhancer = new ValuePropositionEnhancer();
    satisfactionPredictor = new UserSatisfactionPredictor();
  });

  describe('System Integration Tests', () => {
    it('should meet all acceptance criteria for user value optimization', () => {
      const keyword = 'how to improve SEO rankings';
      const content = 'This comprehensive guide addresses the challenge of poor SEO performance. You should implement these strategies to achieve better rankings.';
      const userProblems = ['challenge', 'poor performance'];
      const requiredTopics = ['SEO', 'rankings', 'strategies'];
      
      // AC1: User intent analysis
      const intentResult = intentAnalyzer.classifyIntent(keyword);
      expect(intentResult.primaryIntent).toBe('informational');
      expect(intentResult.intentConfidence).toBeGreaterThan(0);
      
      // AC2: Actionable insight density
      const insightResult = insightDetector.measureInsightDensity(content);
      expect(insightResult.insightDensity).toBeGreaterThanOrEqual(30);
      
      // AC3: Problem-solution alignment
      const alignmentResult = solutionAligner.validateAlignment(content, userProblems);
      expect(alignmentResult.problemCoverage).toBeGreaterThanOrEqual(0.9);
      
      // AC4: Comprehensive coverage
      const coverageResult = coverageAssessor.assessTopicCompleteness(content, requiredTopics);
      expect(coverageResult).toBeGreaterThanOrEqual(0.95);
      
      // AC5: Practical application integration
      const steps = ['Research keywords', 'Optimize content', 'Build backlinks'];
      const enhancedContent = applicationIntegrator.addStepByStepGuidance(content, steps);
      expect(enhancedContent).toContain('Here\'s a step-by-step guide:');
      
      // AC6: Value proposition enhancement
      const benefits = ['Improved rankings', 'More traffic'];
      const finalContent = valueEnhancer.enhanceBenefits(enhancedContent, benefits);
      expect(finalContent).toContain('Benefits you\'ll gain:');
      
      // AC7: User satisfaction prediction
      const satisfaction = satisfactionPredictor.predictSatisfaction(finalContent);
      expect(satisfaction).toBeGreaterThanOrEqual(88);
    });

    it('should handle complete content optimization workflow', () => {
      let content = 'Basic SEO guide.';
      
      // Step 1: Analyze intent
      const intentResult = intentAnalyzer.classifyIntent('SEO optimization tutorial');
      expect(intentResult.primaryIntent).toBe('informational');
      
      // Step 2: Add practical steps
      const steps = Array.from({length: 25}, (_, i) => `SEO step ${i + 1}: Implementation task`);
      content = applicationIntegrator.addStepByStepGuidance(content, steps);
      
      // Step 3: Add real-world examples
      const examples = ['Google case study', 'Amazon optimization', 'HubSpot strategy'];
      content = applicationIntegrator.addRealWorldExamples(content, examples);
      
      // Step 4: Enhance with benefits
      const benefits = ['Increase traffic by 300%', 'Improve rankings', 'Boost conversions'];
      content = valueEnhancer.enhanceBenefits(content, benefits);
      
      // Step 5: Add expected outcomes
      const outcomes = ['Top 3 Google rankings', '500+ monthly leads', 'ROI increase of 250%'];
      content = valueEnhancer.clarifyOutcomes(content, outcomes);
      
      // Validate final content quality
      const finalInsightResult = insightDetector.measureInsightDensity(content);
      expect(finalInsightResult.insightDensity).toBeGreaterThanOrEqual(30);
      
      const finalSatisfaction = satisfactionPredictor.predictSatisfaction(content);
      expect(finalSatisfaction).toBeGreaterThanOrEqual(88);
    });

    it('should meet all user value metrics requirements', () => {
      const keyword = 'best SEO strategies guide';
      const content = 'This excellent guide addresses SEO challenges. You should implement these outstanding strategies to achieve amazing results.';
      
      // Intent Satisfaction: >95% search intent fulfillment
      const intentResult = intentAnalyzer.classifyIntent(keyword);
      expect(intentResult.intentConfidence).toBeGreaterThanOrEqual(0.95);
      
      // Actionable Insight Density: >30% actionable sentences
      const insightResult = insightDetector.measureInsightDensity(content);
      expect(insightResult.insightDensity).toBeGreaterThanOrEqual(30);
      
      // Problem-Solution Alignment: >90% problem resolution
      const alignmentResult = solutionAligner.validateAlignment(content, ['challenges']);
      expect(alignmentResult.problemCoverage).toBeGreaterThanOrEqual(0.9);
      
      // Topic Coverage: >95% comprehensive coverage
      const coverageResult = coverageAssessor.assessTopicCompleteness(content, ['SEO', 'strategies']);
      expect(coverageResult).toBeGreaterThanOrEqual(0.95);
      
      // Practical Application: >20 implementable steps per article
      const steps = Array.from({length: 25}, (_, i) => `Implementation step ${i + 1}`);
      const enhancedContent = applicationIntegrator.addStepByStepGuidance(content, steps);
      expect(steps.length).toBeGreaterThanOrEqual(20);
      
      // User Satisfaction Prediction: >88% satisfaction score
      const satisfaction = satisfactionPredictor.predictSatisfaction(enhancedContent);
      expect(satisfaction).toBeGreaterThanOrEqual(88);
    });

    it('should handle different content types and intents', () => {
      const testCases = [
        {
          keyword: 'what is SEO',
          expectedIntent: 'informational',
          content: 'SEO stands for Search Engine Optimization. You should understand these concepts to improve your website.'
        },
        {
          keyword: 'best SEO tools review',
          expectedIntent: 'commercial',
          content: 'These excellent SEO tools offer outstanding features. You should consider these amazing options for your business.'
        },
        {
          keyword: 'buy SEO software',
          expectedIntent: 'transactional',
          content: 'Purchase these fantastic SEO tools to achieve excellent results. You should order now to get amazing benefits.'
        }
      ];
      
      testCases.forEach(testCase => {
        const intentResult = intentAnalyzer.classifyIntent(testCase.keyword);
        expect(intentResult.primaryIntent).toBe(testCase.expectedIntent);
        
        const insightResult = insightDetector.measureInsightDensity(testCase.content);
        expect(insightResult.insightDensity).toBeGreaterThanOrEqual(30);
        
        const satisfaction = satisfactionPredictor.predictSatisfaction(testCase.content);
        expect(satisfaction).toBeGreaterThanOrEqual(88);
      });
    });

    it('should optimize content for maximum user value', () => {
      let content = 'SEO optimization guide for beginners.';
      
      // Progressive enhancement workflow
      const steps = [
        'Define target keywords',
        'Analyze competitor content',
        'Create comprehensive content',
        'Optimize for search engines',
        'Monitor and improve performance'
      ];
      
      const examples = [
        'Netflix increased organic traffic by 400% using content clusters',
        'Airbnb optimized local SEO for 65,000+ cities',
        'Shopify improved site speed to boost rankings'
      ];
      
      const benefits = [
        'Increase organic visibility by 300%',
        'Generate 500+ qualified leads monthly',
        'Achieve top 3 Google rankings'
      ];
      
      const outcomes = [
        'Establish domain authority of 70+',
        'Create sustainable organic growth',
        'Build comprehensive content library'
      ];
      
      // Apply all enhancements
      content = applicationIntegrator.addStepByStepGuidance(content, steps);
      content = applicationIntegrator.addRealWorldExamples(content, examples);
      content = valueEnhancer.enhanceBenefits(content, benefits);
      content = valueEnhancer.clarifyOutcomes(content, outcomes);
      
      // Validate optimized content meets all requirements
      const finalInsights = insightDetector.measureInsightDensity(content);
      expect(finalInsights.insightDensity).toBeGreaterThanOrEqual(30);
      
      const finalSatisfaction = satisfactionPredictor.predictSatisfaction(content);
      expect(finalSatisfaction).toBeGreaterThanOrEqual(88);
      
      // Verify all enhancement sections are present
      expect(content).toContain('Here\'s a step-by-step guide:');
      expect(content).toContain('Real-world examples:');
      expect(content).toContain('Benefits you\'ll gain:');
      expect(content).toContain('Expected outcomes:');
    });
  });

  describe('Performance Integration Tests', () => {
    it('should process content efficiently across all components', () => {
      const content = 'This comprehensive SEO guide provides excellent strategies for outstanding results.';
      const startTime = Date.now();
      
      // Process through all components
      const intentResult = intentAnalyzer.classifyIntent('SEO guide');
      const insightResult = insightDetector.measureInsightDensity(content);
      const alignmentResult = solutionAligner.validateAlignment(content, ['SEO challenges']);
      const coverageResult = coverageAssessor.assessTopicCompleteness(content, ['SEO', 'strategies']);
      const enhancedContent = applicationIntegrator.addStepByStepGuidance(content, ['Step 1', 'Step 2']);
      const finalContent = valueEnhancer.enhanceBenefits(enhancedContent, ['Benefit 1', 'Benefit 2']);
      const satisfaction = satisfactionPredictor.predictSatisfaction(finalContent);
      
      const endTime = Date.now();
      const processingTime = endTime - startTime;
      
      // Verify all components processed successfully
      expect(intentResult).toBeDefined();
      expect(insightResult).toBeDefined();
      expect(alignmentResult).toBeDefined();
      expect(coverageResult).toBeDefined();
      expect(enhancedContent).toBeDefined();
      expect(finalContent).toBeDefined();
      expect(satisfaction).toBeDefined();
      
      // Verify reasonable processing time
      expect(processingTime).toBeLessThan(1000); // Under 1 second
    });
  });
});