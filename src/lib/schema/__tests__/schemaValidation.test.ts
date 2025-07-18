import { 
  validateSchema, 
  articleSchema, 
  localBusinessSchema, 
  faqPageSchema, 
  productSchema, 
  howToSchema, 
  breadcrumbListSchema 
} from '../schemaValidation';

describe('Schema Validation', () => {
  // Test validateSchema function
  it('should validate a correct schema object', () => {
    const validArticle = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: 'Test Article',
      author: { '@type': 'Person', name: 'John Doe' },
      datePublished: '2023-01-01T12:00:00Z',
      articleBody: 'This is a test article body.',
    };
    expect(() => validateSchema(articleSchema, validArticle)).not.toThrow();
  });

  it('should throw an error for an invalid schema object', () => {
    const invalidArticle = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: 'Test Article',
      // author is completely missing
    };
    expect(() => validateSchema(articleSchema, invalidArticle)).toThrow('Schema validation failed: Invalid input: expected object, received undefined');
  });

  // Test individual schemas
  describe('articleSchema', () => {
    it('should validate a minimal article schema', () => {
      const data = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: 'Minimal Article',
        author: { '@type': 'Person', name: 'Author Name' },
      };
      expect(() => articleSchema.parse(data)).not.toThrow();
    });

    it('should reject article schema without headline', () => {
      const data = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        author: { '@type': 'Person', name: 'Author Name' },
      };
      expect(() => articleSchema.parse(data)).toThrow();
    });
  });

  describe('localBusinessSchema', () => {
    it('should validate a minimal local business schema', () => {
      const data = {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        name: 'Test Business',
        address: {
          '@type': 'PostalAddress',
          streetAddress: '123 Main St',
          addressLocality: 'Anytown',
          addressRegion: 'CA',
          postalCode: '90210',
          addressCountry: 'US',
        },
      };
      expect(() => localBusinessSchema.parse(data)).not.toThrow();
    });
  });

  describe('faqPageSchema', () => {
    it('should validate a minimal FAQ page schema', () => {
      const data = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'What is this?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'This is a test.',
            },
          },
        ],
      };
      expect(() => faqPageSchema.parse(data)).not.toThrow();
    });
  });

  describe('productSchema', () => {
    it('should validate a minimal product schema', () => {
      const data = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: 'Test Product',
      };
      expect(() => productSchema.parse(data)).not.toThrow();
    });
  });

  describe('howToSchema', () => {
    it('should validate a minimal how-to schema', () => {
      const data = {
        '@context': 'https://schema.org',
        '@type': 'HowTo',
        name: 'How to do something',
        step: [
          {
            '@type': 'HowToStep',
            text: 'Step 1 description',
          },
        ],
      };
      expect(() => howToSchema.parse(data)).not.toThrow();
    });
  });

  describe('breadcrumbListSchema', () => {
    it('should validate a minimal breadcrumb list schema', () => {
      const data = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
          },
        ],
      };
      expect(() => breadcrumbListSchema.parse(data)).not.toThrow();
    });
  });
});
