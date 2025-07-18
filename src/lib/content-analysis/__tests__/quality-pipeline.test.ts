import { ContentQualityPipeline } from '../quality-pipeline';
import { ContentRequirements, ValidationStage, StageResult } from '../quality-pipeline.types';

describe('ContentQualityPipeline', () => {
  let pipeline: ContentQualityPipeline;
  let mockValidators: ValidationStage[];

  beforeEach(() => {
    mockValidators = [
      {
        validate: jest.fn().mockResolvedValue({
          stage: 'humanization',
          score: 90,
          passesThreshold: true,
          needsRefinement: false
        }),
        refine: jest.fn().mockResolvedValue('refined content')
      },
      {
        validate: jest.fn().mockResolvedValue({
          stage: 'seo',
          score: 95,
          passesThreshold: true,
          needsRefinement: false
        }),
        refine: jest.fn().mockResolvedValue('seo refined content')
      }
    ];
    pipeline = new ContentQualityPipeline(mockValidators);
  });

  describe('constructor', () => {
    it('should create pipeline with validators', () => {
      expect(pipeline).toBeInstanceOf(ContentQualityPipeline);
    });

    it('should throw error with empty validators array', () => {
      expect(() => new ContentQualityPipeline([])).toThrow('At least one validator must be provided');
    });

    it('should throw error with null validators', () => {
      expect(() => new ContentQualityPipeline(null as any)).toThrow('At least one validator must be provided');
    });
  });

  describe('validateContent', () => {
    const validContent = 'This is test content for validation';
    const validRequirements: ContentRequirements = {
      targetAudience: 'developers',
      tone: 'professional',
      keywords: ['test', 'validation']
    };

    it('should successfully validate content through all stages', async () => {
      const result = await pipeline.validateContent(validContent, validRequirements);

      expect(result.overallStatus).toBe('passed');
      expect(result.stageResults).toHaveLength(2);
      expect(result.finalContent).toBe(validContent);
      expect(result.failedStage).toBeNull();
    });

    it('should handle refinement when needed', async () => {
      mockValidators[0].validate = jest.fn().mockResolvedValue({
        stage: 'humanization',
        score: 85,
        passesThreshold: true,
        needsRefinement: true,
        issues: ['needs improvement']
      });

      const result = await pipeline.validateContent(validContent, validRequirements);

      expect(mockValidators[0].refine).toHaveBeenCalledWith(validContent, ['needs improvement']);
      expect(result.overallStatus).toBe('passed');
    });

    it('should fail when stage does not pass threshold', async () => {
      mockValidators[1].validate = jest.fn().mockResolvedValue({
        stage: 'seo',
        score: 70,
        passesThreshold: false,
        needsRefinement: false
      });

      const result = await pipeline.validateContent(validContent, validRequirements);

      expect(result.overallStatus).toBe('failed');
      expect(result.failedStage).toBe('seo');
      expect(result.finalContent).toBeNull();
    });

    it('should throw error for invalid content', async () => {
      await expect(pipeline.validateContent('', validRequirements))
        .rejects.toThrow('Content must be a non-empty string');
      
      await expect(pipeline.validateContent(null as any, validRequirements))
        .rejects.toThrow('Content must be a non-empty string');
    });

    it('should throw error for missing requirements', async () => {
      await expect(pipeline.validateContent(validContent, null as any))
        .rejects.toThrow('Content requirements must be provided');
    });

    it('should handle validator errors gracefully', async () => {
      mockValidators[0].validate = jest.fn().mockRejectedValue(new Error('Validator failed'));

      await expect(pipeline.validateContent(validContent, validRequirements))
        .rejects.toThrow('Validation pipeline failed: Validator failed');
    });

    it('should process all validators in sequence', async () => {
      await pipeline.validateContent(validContent, validRequirements);

      expect(mockValidators[0].validate).toHaveBeenCalledWith(validContent, validRequirements);
      expect(mockValidators[1].validate).toHaveBeenCalledWith(validContent, validRequirements);
    });
  });

  describe('integration scenarios', () => {
    it('should handle complex validation workflow', async () => {
      // Setup complex scenario with multiple refinements
      mockValidators[0].validate = jest.fn().mockResolvedValue({
        stage: 'humanization',
        score: 88,
        passesThreshold: true,
        needsRefinement: true,
        issues: ['tone adjustment needed']
      });
      
      mockValidators[0].refine = jest.fn().mockResolvedValue('humanized content');
      
      mockValidators[1].validate = jest.fn().mockResolvedValue({
        stage: 'seo',
        score: 92,
        passesThreshold: true,
        needsRefinement: false
      });

      const result = await pipeline.validateContent('original content', {
        targetAudience: 'general',
        tone: 'casual',
        keywords: ['test']
      });

      expect(result.overallStatus).toBe('passed');
      expect(mockValidators[0].refine).toHaveBeenCalledWith('original content', ['tone adjustment needed']);
      expect(mockValidators[1].validate).toHaveBeenCalledWith('humanized content', expect.any(Object));
    });
  });
});