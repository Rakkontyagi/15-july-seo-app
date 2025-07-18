import { ErrorDetectionCorrection, DetectedError } from '../error-detection-correction';

describe('ErrorDetectionCorrection', () => {
  let errorDetector: ErrorDetectionCorrection;

  beforeEach(() => {
    errorDetector = new ErrorDetectionCorrection();
  });

  describe('detectErrors', () => {
    it('should detect common typos', () => {
      const content = 'This is teh best content you will recieve today.';
      const errors = errorDetector.detectErrors(content);

      expect(errors).toHaveLength(2);
      expect(errors[0].type).toBe('Typo');
      expect(errors[0].message).toContain('teh');
      expect(errors[0].suggestion).toBe('the');
      expect(errors[1].message).toContain('recieve');
      expect(errors[1].suggestion).toBe('receive');
    });

    it('should detect grammar errors', () => {
      const content = 'I is happy and your welcome to join.';
      const errors = errorDetector.detectErrors(content);

      expect(errors.length).toBeGreaterThan(0);
      const grammarErrors = errors.filter(e => e.type === 'Grammar');
      expect(grammarErrors.length).toBeGreaterThan(0);
      expect(grammarErrors[0].message).toContain('I is');
    });

    it('should handle content without errors', () => {
      const content = 'This is perfectly written content with no errors.';
      const errors = errorDetector.detectErrors(content);

      expect(errors).toHaveLength(0);
    });

    it('should throw error for invalid input', () => {
      expect(() => errorDetector.detectErrors('')).toThrow('Content must be a non-empty string');
      expect(() => errorDetector.detectErrors(null as any)).toThrow('Content must be a non-empty string');
      expect(() => errorDetector.detectErrors(undefined as any)).toThrow('Content must be a non-empty string');
    });

    it('should detect multiple instances of same error', () => {
      const content = 'Teh first teh and teh second teh are wrong.';
      const errors = errorDetector.detectErrors(content);

      const tehErrors = errors.filter(e => e.message.includes('teh'));
      expect(tehErrors.length).toBeGreaterThanOrEqual(3); // Should detect multiple instances
    });

    it('should provide correct location information', () => {
      const content = 'This teh content has errors.';
      const errors = errorDetector.detectErrors(content);

      const tehError = errors.find(e => e.message.includes('teh'));
      expect(tehError?.location).toBe(5); // Position of 'teh' in the string
    });

    it('should assign appropriate severity levels', () => {
      const content = 'This has teh typo and I is grammar error.';
      const errors = errorDetector.detectErrors(content);

      const typoError = errors.find(e => e.type === 'Typo');
      const grammarError = errors.find(e => e.type === 'Grammar');

      expect(typoError?.severity).toBe('low');
      expect(grammarError?.severity).toBe('medium');
    });

    it('should be case insensitive for appropriate patterns', () => {
      const content = 'Your Welcome to this place.';
      const errors = errorDetector.detectErrors(content);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toContain('your welcome');
    });
  });

  describe('correctErrors', () => {
    it('should correct detected typos', () => {
      const content = 'This is teh best content.';
      const errors = errorDetector.detectErrors(content);
      const corrected = errorDetector.correctErrors(content, errors);

      expect(corrected).toBe('This is the best content.');
    });

    it('should handle multiple corrections', () => {
      const content = 'Teh content will recieve attention and be seperate.';
      const errors = errorDetector.detectErrors(content);
      const corrected = errorDetector.correctErrors(content, errors);

      expect(corrected).toContain('the content');
      expect(corrected).toContain('receive');
      expect(corrected).toContain('separate');
    });

    it('should handle content without errors', () => {
      const content = 'This content is perfect.';
      const corrected = errorDetector.correctErrors(content, []);

      expect(corrected).toBe(content);
    });

    it('should throw error for invalid content', () => {
      const errors: DetectedError[] = [];
      
      expect(() => errorDetector.correctErrors('', errors)).toThrow('Content must be a non-empty string');
      expect(() => errorDetector.correctErrors(null as any, errors)).toThrow('Content must be a non-empty string');
    });

    it('should handle invalid errors array gracefully', () => {
      const content = 'Test content';
      
      const result1 = errorDetector.correctErrors(content, null as any);
      const result2 = errorDetector.correctErrors(content, undefined as any);
      
      expect(result1).toBe(content);
      expect(result2).toBe(content);
    });

    it('should preserve content structure during correction', () => {
      const content = 'Line 1: teh error\nLine 2: recieve this\nLine 3: perfect';
      const errors = errorDetector.detectErrors(content);
      const corrected = errorDetector.correctErrors(content, errors);

      expect(corrected.split('\n')).toHaveLength(3);
      expect(corrected).toContain('Line 1: the error');
      expect(corrected).toContain('Line 2: receive this');
      expect(corrected).toContain('Line 3: perfect');
    });

    it('should handle errors without suggestions', () => {
      const content = 'Test content';
      const customError: DetectedError = {
        type: 'Custom',
        message: 'Custom error',
        location: 0,
        severity: 'low'
        // No suggestion provided
      };

      const corrected = errorDetector.correctErrors(content, [customError]);
      expect(corrected).toBe(content); // Should remain unchanged
    });

    it('should process errors in correct order to maintain indices', () => {
      const content = 'First teh and second teh errors.';
      const errors = errorDetector.detectErrors(content);
      const corrected = errorDetector.correctErrors(content, errors);

      expect(corrected).toBe('First the and second the errors.');
    });
  });

  describe('integration scenarios', () => {
    it('should handle complex content with mixed errors', () => {
      const content = `
        This articel contains teh following issues:
        - I is going to fix recieve
        - Your welcome to seperate these
        - Definately need to check occured events
      `;

      const errors = errorDetector.detectErrors(content);
      expect(errors.length).toBeGreaterThan(5);

      const corrected = errorDetector.correctErrors(content, errors);
      expect(corrected).toContain('the following');
      expect(corrected).toContain('receive');
      expect(corrected).toContain('separate');
      expect(corrected).toContain('definitely');
      expect(corrected).toContain('occurred');
    });

    it('should maintain performance with large content', () => {
      const largeContent = 'This teh content '.repeat(1000);
      
      const startTime = Date.now();
      const errors = errorDetector.detectErrors(largeContent);
      const corrected = errorDetector.correctErrors(largeContent, errors);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
      expect(errors.length).toBe(1000); // Should detect all instances
      expect(corrected).not.toContain('teh'); // Should correct all instances
    });
  });
});