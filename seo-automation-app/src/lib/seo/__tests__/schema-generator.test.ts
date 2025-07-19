import { SchemaGenerator } from '../schema-generator';

describe('SchemaGenerator', () => {
  let generator: SchemaGenerator;

  beforeEach(() => {
    generator = new SchemaGenerator();
  });

  describe('generateArticleSchema', () => {
    it('should generate valid article schema with required fields', () => {
      const options = {
        headline: 'Test Article Headline',
        datePublished: new Date('2023-01-01T12:00:00Z'),
        pageUrl: 'https://example.com/article',
      };

      const schema = generator.generateArticleSchema(options);

      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('Article');
      expect(schema.headline).toBe('Test Article Headline');
      expect(schema.datePublished).toBe('2023-01-01T12:00:00.000Z');
      expect(schema.mainEntityOfPage).toEqual({
        '@type': 'WebPage',
        '@id': 'https://example.com/article',
      });
    });

    it('should include optional fields when provided', () => {
      const options = {
        headline: 'Test Article',
        datePublished: new Date('2023-01-01T12:00:00Z'),
        dateModified: new Date('2023-01-02T12:00:00Z'),
        authorName: 'John Doe',
        publisherName: 'Test Publisher',
        publisherLogoUrl: 'https://example.com/logo.png',
        description: 'Test description',
        articleBody: 'Test article body',
        imageUrl: 'https://example.com/image.jpg',
        pageUrl: 'https://example.com/article',
      };

      const schema = generator.generateArticleSchema(options);

      expect(schema.dateModified).toBe('2023-01-02T12:00:00.000Z');
      expect(schema.author).toEqual({
        '@type': 'Person',
        name: 'John Doe',
      });
      expect(schema.publisher).toEqual({
        '@type': 'Organization',
        name: 'Test Publisher',
        logo: {
          '@type': 'ImageObject',
          url: 'https://example.com/logo.png',
        },
      });
      expect(schema.description).toBe('Test description');
      expect(schema.articleBody).toBe('Test article body');
      expect(schema.image).toEqual(['https://example.com/image.jpg']);
    });
  });

  describe('generateLocalBusinessSchema', () => {
    it('should generate valid local business schema', () => {
      const options = {
        type: 'LocalBusiness',
        name: 'Test Business',
        streetAddress: '123 Main St',
        addressLocality: 'Anytown',
        postalCode: '12345',
        addressCountry: 'US',
      };

      const schema = generator.generateLocalBusinessSchema(options);

      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('LocalBusiness');
      expect(schema.name).toBe('Test Business');
      expect(schema.address).toEqual({
        '@type': 'PostalAddress',
        streetAddress: '123 Main St',
        addressLocality: 'Anytown',
        postalCode: '12345',
        addressCountry: 'US',
      });
    });

    it('should include optional fields when provided', () => {
      const options = {
        type: 'Restaurant',
        name: 'Test Restaurant',
        streetAddress: '123 Main St',
        addressLocality: 'Anytown',
        postalCode: '12345',
        addressCountry: 'US',
        addressRegion: 'CA',
        telephone: '+1-555-123-4567',
        priceRange: '$$',
        url: 'https://example.com',
        imageUrl: ['https://example.com/image1.jpg'],
        latitude: 37.7749,
        longitude: -122.4194,
        openingHours: [
          {
            dayOfWeek: ['Monday', 'Tuesday'],
            opens: '09:00',
            closes: '17:00',
          },
        ],
      };

      const schema = generator.generateLocalBusinessSchema(options);

      expect(schema['@type']).toBe('Restaurant');
      expect(schema.address.addressRegion).toBe('CA');
      expect(schema.telephone).toBe('+1-555-123-4567');
      expect(schema.priceRange).toBe('$$');
      expect(schema.url).toBe('https://example.com');
      expect(schema.image).toEqual(['https://example.com/image1.jpg']);
      expect(schema.geo).toEqual({
        '@type': 'GeoCoordinates',
        latitude: 37.7749,
        longitude: -122.4194,
      });
      expect(schema.openingHoursSpecification).toEqual([
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: ['Monday', 'Tuesday'],
          opens: '09:00',
          closes: '17:00',
        },
      ]);
    });
  });

  describe('generateFaqSchema', () => {
    it('should extract FAQ from HTML content', () => {
      const htmlContent = `
        <div>
          <h3>What is SEO?</h3>
          <p>SEO stands for Search Engine Optimization.</p>
          <h3>How does it work?</h3>
          <p>It helps websites rank better in search results.</p>
        </div>
      `;

      const schema = generator.generateFaqSchema(htmlContent);

      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('FAQPage');
      expect(schema.mainEntity).toHaveLength(2);
      expect(schema.mainEntity[0]).toEqual({
        '@type': 'Question',
        name: 'What is SEO?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'SEO stands for Search Engine Optimization.',
        },
      });
      expect(schema.mainEntity[1]).toEqual({
        '@type': 'Question',
        name: 'How does it work?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'It helps websites rank better in search results.',
        },
      });
    });

    it('should handle empty content gracefully', () => {
      const htmlContent = '<div>No FAQ content here</div>';
      const schema = generator.generateFaqSchema(htmlContent);

      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('FAQPage');
      expect(schema.mainEntity).toHaveLength(0);
    });
  });

  describe('generateProductSchema', () => {
    it('should generate valid product schema with minimal data', () => {
      const options = {
        name: 'Test Product',
        priceCurrency: 'USD',
        price: '99.99',
      };

      const schema = generator.generateProductSchema(options);

      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('Product');
      expect(schema.name).toBe('Test Product');
      expect(schema.offers).toEqual({
        '@type': 'Offer',
        priceCurrency: 'USD',
        price: '99.99',
      });
    });

    it('should include all optional fields when provided', () => {
      const options = {
        name: 'Test Product',
        description: 'A great product',
        imageUrl: ['https://example.com/product.jpg'],
        sku: 'TEST-123',
        mpn: 'MPN-456',
        brandName: 'Test Brand',
        offerUrl: 'https://example.com/buy',
        priceCurrency: 'USD',
        price: '99.99',
        itemCondition: 'NewCondition' as const,
        availability: 'InStock' as const,
        sellerName: 'Test Seller',
        ratingValue: '4.5',
        reviewCount: '100',
        reviews: [
          {
            ratingValue: '5',
            authorName: 'John Doe',
            reviewBody: 'Great product!',
            datePublished: new Date('2023-01-01'),
          },
        ],
      };

      const schema = generator.generateProductSchema(options);

      expect(schema.description).toBe('A great product');
      expect(schema.image).toEqual(['https://example.com/product.jpg']);
      expect(schema.sku).toBe('TEST-123');
      expect(schema.mpn).toBe('MPN-456');
      expect(schema.brand).toEqual({
        '@type': 'Brand',
        name: 'Test Brand',
      });
      expect(schema.offers?.url).toBe('https://example.com/buy');
      expect(schema.offers?.itemCondition).toBe('https://schema.org/NewCondition');
      expect(schema.offers?.availability).toBe('https://schema.org/InStock');
      expect(schema.offers?.seller).toEqual({
        '@type': 'Organization',
        name: 'Test Seller',
      });
      expect(schema.aggregateRating).toEqual({
        '@type': 'AggregateRating',
        ratingValue: '4.5',
        reviewCount: '100',
      });
      expect(schema.review).toHaveLength(1);
      expect(schema.review?.[0]).toEqual({
        '@type': 'Review',
        reviewRating: {
          '@type': 'Rating',
          ratingValue: '5',
        },
        author: {
          '@type': 'Person',
          name: 'John Doe',
        },
        reviewBody: 'Great product!',
        datePublished: '2023-01-01T00:00:00.000Z',
      });
    });
  });

  describe('generateHowToSchema', () => {
    it('should extract steps from ordered list', () => {
      const htmlContent = `
        <div>
          <ol>
            <li>First step description</li>
            <li>Second step description</li>
            <li>Third step description</li>
          </ol>
        </div>
      `;

      const schema = generator.generateHowToSchema(htmlContent, 'How to Test');

      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('HowTo');
      expect(schema.name).toBe('How to Test');
      expect(schema.step).toHaveLength(3);
      expect(schema.step[0]).toEqual({
        '@type': 'HowToStep',
        text: 'First step description',
      });
    });

    it('should extract steps from headings when no ordered list', () => {
      const htmlContent = `
        <div>
          <h3>Step 1: Prepare</h3>
          <p>Prepare your materials</p>
          <h3>Step 2: Execute</h3>
          <p>Execute the plan</p>
        </div>
      `;

      const schema = generator.generateHowToSchema(htmlContent, 'How to Test');

      expect(schema.step).toHaveLength(2);
      expect(schema.step[0]).toEqual({
        '@type': 'HowToStep',
        name: 'Step 1: Prepare',
        text: 'Prepare your materials',
      });
    });
  });

  describe('generateBreadcrumbSchema', () => {
    it('should generate valid breadcrumb schema', () => {
      const items = [
        { name: 'Home', item: 'https://example.com' },
        { name: 'Category', item: 'https://example.com/category' },
        { name: 'Current Page' },
      ];

      const schema = generator.generateBreadcrumbSchema(items);

      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('BreadcrumbList');
      expect(schema.itemListElement).toHaveLength(3);
      expect(schema.itemListElement[0]).toEqual({
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://example.com',
      });
      expect(schema.itemListElement[2]).toEqual({
        '@type': 'ListItem',
        position: 3,
        name: 'Current Page',
      });
    });
  });

  describe('toScriptTag', () => {
    it('should convert schema to JSON-LD script tag', () => {
      const schema = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: 'Test',
      };

      const scriptTag = generator.toScriptTag(schema);

      expect(scriptTag).toContain('<script type="application/ld+json">');
      expect(scriptTag).toContain('"@context": "https://schema.org"');
      expect(scriptTag).toContain('"@type": "Article"');
      expect(scriptTag).toContain('"headline": "Test"');
      expect(scriptTag).toContain('</script>');
    });
  });
});
