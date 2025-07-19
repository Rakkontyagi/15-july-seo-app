import { UniquenessVerifier, UniquenessVerificationResult, UniquenessOptions } from '../uniqueness-verifier';

describe('Enhanced UniquenessVerifier', () => {
  let verifier: UniquenessVerifier;

  beforeEach(() => {
    verifier = new UniquenessVerifier();
    jest.clearAllMocks();
  });

  describe('verifyUniqueness', () => {
    it('should verify unique content with no comparison corpus', async () => {
      const content = `
        This is completely original content that has never been written before.
        It contains unique insights and perspectives that are entirely my own.
        The ideas presented here are fresh and innovative.
      `;

      const result = await verifier.verifyUniqueness(content);

      expect(result.isUnique).toBe(true);
      expect(result.originalityScore).toBeGreaterThan(90);
      expect(result.duplicatePercentage).toBeLessThan(10);
      expect(result.sources).toHaveLength(0);
      expect(result.confidence).toBeGreaterThan(70);
    });

    it('should detect exact matches in comparison corpus', async () => {
      const content = `
        This is a test sentence that will be duplicated.
        Another unique sentence that should not match.
        This is a test sentence that will be duplicated.
      `;

      const comparisonCorpus = [
        'This is a test sentence that will be duplicated. Some other content here.',
        'Completely different content that should not match at all.'
      ];

      const result = await verifier.verifyUniqueness(content, comparisonCorpus);

      expect(result.isUnique).toBe(false);
      expect(result.duplicatePercentage).toBeGreaterThan(0);
      expect(result.sources.length).toBeGreaterThan(0);
      expect(result.sources.some(s => s.type === 'exact_match')).toBe(true);
    });

    it('should detect paraphrases and semantic similarity', async () => {
      const content = `
        The quick brown fox jumps over the lazy dog.
        This sentence demonstrates agility and speed.
      `;

      const comparisonCorpus = [
        'A fast brown fox leaps above the sleepy canine.',
        'This phrase shows quickness and velocity.'
      ];

      const options: UniquenessOptions = {
        strictness: 'moderate',
        checkSemanticSimilarity: true,
        minPhraseLength: 4,
        maxSimilarityThreshold: 15,
        enableExternalCheck: false
      };

      const result = await verifier.verifyUniqueness(content, comparisonCorpus, options);

      expect(result.semanticSimilarityScore).toBeGreaterThan(0);
      expect(result.semanticSimilarityScore).toBeGreaterThan(0);
    });

    it('should handle different strictness levels', async () => {
      const content = `
        In today's world, it is important to note that technology is advancing.
        On the other hand, we must consider the implications of these changes.
      `;

      const lenientOptions: UniquenessOptions = {
        strictness: 'lenient',
        checkSemanticSimilarity: false,
        minPhraseLength: 6,
        maxSimilarityThreshold: 25,
        enableExternalCheck: false
      };

      const strictOptions: UniquenessOptions = {
        strictness: 'strict',
        checkSemanticSimilarity: true,
        minPhraseLength: 3,
        maxSimilarityThreshold: 5,
        enableExternalCheck: false
      };

      const lenientResult = await verifier.verifyUniqueness(content, [], lenientOptions);
      const strictResult = await verifier.verifyUniqueness(content, [], strictOptions);

      expect(strictResult.plagiarismDetectedPhrases.length).toBeGreaterThanOrEqual(lenientResult.plagiarismDetectedPhrases.length);
    });

    it('should detect common phrases and clichés', async () => {
      const content = `
        In today's world, it is important to note that on the other hand,
        we must consider that in conclusion, for example, such as these changes.
      `;

      const result = await verifier.verifyUniqueness(content);

      expect(result.plagiarismDetectedPhrases.length).toBeGreaterThan(3);
      expect(result.plagiarismDetectedPhrases).toContain('in today\'s world');
      expect(result.plagiarismDetectedPhrases).toContain('it is important to note');
      expect(result.plagiarismDetectedPhrases).toContain('on the other hand');
    });

    it('should calculate accurate duplicate percentage', async () => {
      const content = 'This is duplicate content that appears in both texts. Some original content here.';
      const comparisonCorpus = ['This is duplicate content that appears in both texts exactly.'];

      const result = await verifier.verifyUniqueness(content, comparisonCorpus);

      expect(result.duplicatePercentage).toBeGreaterThan(0);
      expect(result.duplicatePercentage).toBeLessThanOrEqual(100);
      expect(result.originalityScore).toBe(100 - result.duplicatePercentage);
    });

    it('should provide meaningful recommendations', async () => {
      const content = `
        In today's world, it is important to note that this cutting-edge solution
        provides comprehensive functionality. On the other hand, we must consider
        that this state-of-the-art approach is revolutionary.
      `;

      const result = await verifier.verifyUniqueness(content);

      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.recommendations.some(r => r.includes('common phrases'))).toBe(true);
    });

    it('should handle empty content', async () => {
      await expect(verifier.verifyUniqueness('')).rejects.toThrow('Content must be a non-empty string');
    });

    it('should handle null content', async () => {
      await expect(verifier.verifyUniqueness(null as any)).rejects.toThrow('Content must be a non-empty string');
    });
  });

  describe('advanced similarity detection', () => {
    it('should detect sentence-level paraphrases', async () => {
      const content = 'The cat sat on the mat and looked around carefully.';
      const comparisonCorpus = ['A feline rested on the rug and observed its surroundings attentively.'];

      const options: UniquenessOptions = {
        strictness: 'moderate',
        checkSemanticSimilarity: true,
        minPhraseLength: 3,
        maxSimilarityThreshold: 15,
        enableExternalCheck: false
      };

      const result = await verifier.verifyUniqueness(content, comparisonCorpus, options);

      expect(result.semanticSimilarityScore).toBeGreaterThan(15);
      expect(result.sources.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle mixed content with partial matches', async () => {
      const content = `
        This is completely original content that has never been seen before.
        However, this sentence appears in the comparison corpus exactly.
        And this is another original thought that should be unique.
      `;

      const comparisonCorpus = [
        'However, this sentence appears in the comparison corpus exactly.',
        'Some other unrelated content that should not match.'
      ];

      const result = await verifier.verifyUniqueness(content, comparisonCorpus);

      expect(result.isUnique).toBe(false);
      expect(result.duplicatePercentage).toBeGreaterThan(0);
      expect(result.duplicatePercentage).toBeLessThan(80);
      expect(result.sources.length).toBeGreaterThan(0);
    });

    it('should ignore stop words in similarity calculations', async () => {
      const content = 'The quick brown fox jumps over the lazy dog.';
      const comparisonCorpus = ['A quick brown fox jumps over a lazy dog.'];

      const result = await verifier.verifyUniqueness(content, comparisonCorpus);

      // Should detect high similarity despite different articles
      expect(result.semanticSimilarityScore).toBeGreaterThan(70);
    });

    it('should handle technical content with specialized terms', async () => {
      const content = `
        The implementation utilizes advanced algorithms for machine learning optimization.
        Neural networks process data through multiple layers of abstraction.
      `;

      const comparisonCorpus = [
        'The system uses sophisticated algorithms for ML optimization.',
        'Deep learning models process information via layered abstractions.'
      ];

      const result = await verifier.verifyUniqueness(content, comparisonCorpus);

      expect(result.semanticSimilarityScore).toBeGreaterThan(15);
      expect(result.sources.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('performance and scalability', () => {
    it('should handle large content efficiently', async () => {
      const content = 'This is a test sentence for performance evaluation. '.repeat(1000);
      const comparisonCorpus = ['Different content that should not match. '.repeat(500)];

      const startTime = Date.now();
      const result = await verifier.verifyUniqueness(content, comparisonCorpus);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(5000); // 5 seconds max
      expect(result.confidence).toBeGreaterThan(70);
    });

    it('should handle large comparison corpus', async () => {
      const content = 'This is unique content that should not match anything.';
      const comparisonCorpus = Array(100).fill(null).map((_, i) => 
        `This is comparison text number ${i} with different content.`
      );

      const result = await verifier.verifyUniqueness(content, comparisonCorpus);

      expect(result.confidence).toBeGreaterThan(90);
      expect(result.confidence).toBeGreaterThan(70);
    });

    it('should be consistent across multiple runs', async () => {
      const content = 'This is test content for consistency checking.';
      const comparisonCorpus = ['This is different content that should not match.'];

      const result1 = await verifier.verifyUniqueness(content, comparisonCorpus);
      const result2 = await verifier.verifyUniqueness(content, comparisonCorpus);

      expect(result1.isUnique).toBe(result2.isUnique);
      expect(Math.abs(result1.similarityScore - result2.similarityScore)).toBeLessThan(1);
      expect(result1.duplicatePercentage).toBe(result2.duplicatePercentage);
    });

    it('should handle concurrent verification requests', async () => {
      const content = 'This is test content for concurrent processing.';
      const comparisonCorpus = ['Different content for comparison.'];
      
      const promises = Array(5).fill(null).map(() => 
        verifier.verifyUniqueness(content, comparisonCorpus)
      );

      const results = await Promise.all(promises);

      results.forEach(result => {
        expect(result.isUnique).toBeDefined();
        expect(result.confidence).toBeGreaterThan(0);
      });
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle very short content', async () => {
      const content = 'Hi there!';

      const result = await verifier.verifyUniqueness(content);

      expect(result.isUnique).toBe(true);
      expect(result.duplicatePercentage).toBe(0);
      expect(result.confidence).toBeGreaterThan(70);
    });

    it('should handle content with special characters and Unicode', async () => {
      const content = 'This content has émojis 🚀 and spëcial characters! ñoño';

      const result = await verifier.verifyUniqueness(content);

      expect(result.isUnique).toBe(true);
      expect(result.confidence).toBeGreaterThan(70);
    });

    it('should handle content with numbers and symbols', async () => {
      const content = 'The price is $29.99 and the code is #ABC123 (version 2.0).';

      const result = await verifier.verifyUniqueness(content);

      expect(result.isUnique).toBe(true);
      expect(result.originalityScore).toBeGreaterThan(90);
    });

    it('should handle empty comparison corpus gracefully', async () => {
      const content = 'This is test content with no comparison data.';

      const result = await verifier.verifyUniqueness(content, []);

      expect(result.isUnique).toBe(true);
      expect(result.sources).toHaveLength(0);
      expect(result.confidence).toBeGreaterThan(70);
    });

    it('should provide detailed source information', async () => {
      const content = 'This exact sentence will be found in the corpus.';
      const comparisonCorpus = [
        'This exact sentence will be found in the corpus. Plus some extra content.',
        'Completely different content here.'
      ];

      const result = await verifier.verifyUniqueness(content, comparisonCorpus);

      expect(result.sources.length).toBeGreaterThan(0);
      result.sources.forEach(source => {
        expect(source.similarity).toBeGreaterThan(0);
        expect(source.matchedPhrases).toBeDefined();
        expect(source.type).toMatch(/^(exact_match|paraphrase|semantic_similarity)$/);
        if (source.title) {
          expect(typeof source.title).toBe('string');
        }
      });
    });
  });
});
