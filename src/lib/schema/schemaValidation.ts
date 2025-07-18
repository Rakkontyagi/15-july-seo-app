import { z } from 'zod';

// Define common schema properties
const baseSchema = z.object({
  '@context': z.literal('https://schema.org'),
  '@type': z.string().min(1, 'Schema type is required'),
});

// Article Schema
export const articleSchema = baseSchema.extend({
  '@type': z.literal('Article'),
  headline: z.string().min(1, 'Headline is required'),
  author: z.object({
    '@type': z.literal('Person').or(z.literal('Organization')),
    name: z.string().min(1, 'Author name is required'),
  }),
  datePublished: z.string().datetime('Invalid publish date format').optional(),
  articleBody: z.string().min(1, 'Article body is required').optional(),
});

// Local Business Schema
export const localBusinessSchema = baseSchema.extend({
  '@type': z.literal('LocalBusiness'),
  name: z.string().min(1, 'Business name is required'),
  address: z.object({
    '@type': z.literal('PostalAddress'),
    streetAddress: z.string().min(1, 'Street address is required'),
    addressLocality: z.string().min(1, 'Locality is required'),
    addressRegion: z.string().min(1, 'Region is required'),
    postalCode: z.string().min(1, 'Postal code is required'),
    addressCountry: z.string().min(1, 'Country is required'),
  }),
  telephone: z.string().optional(),
  url: z.string().url('Invalid URL format').optional(),
});

// FAQ Page Schema
export const faqPageSchema = baseSchema.extend({
  '@type': z.literal('FAQPage'),
  mainEntity: z.array(z.object({
    '@type': z.literal('Question'),
    name: z.string().min(1, 'Question is required'),
    acceptedAnswer: z.object({
      '@type': z.literal('Answer'),
      text: z.string().min(1, 'Answer is required'),
    }),
  })).min(1, 'At least one FAQ question is required'),
});

// Product Schema
export const productSchema = baseSchema.extend({
  '@type': z.literal('Product'),
  name: z.string().min(1, 'Product name is required'),
  image: z.string().url('Invalid image URL format').optional(),
  description: z.string().optional(),
  offers: z.object({
    '@type': z.literal('Offer'),
    priceCurrency: z.string().min(1, 'Price currency is required'),
    price: z.number().min(0, 'Price must be non-negative'),
    availability: z.string().optional(), // e.g., InStock, OutOfStock
  }).optional(),
  aggregateRating: z.object({
    '@type': z.literal('AggregateRating'),
    ratingValue: z.number().min(1).max(5),
    reviewCount: z.number().min(0),
  }).optional(),
});

// How-to Schema
export const howToSchema = baseSchema.extend({
  '@type': z.literal('HowTo'),
  name: z.string().min(1, 'How-to name is required'),
  step: z.array(z.object({
    '@type': z.literal('HowToStep'),
    text: z.string().min(1, 'Step description is required'),
  })).min(1, 'At least one step is required'),
});

// Breadcrumb List Schema
export const breadcrumbListSchema = baseSchema.extend({
  '@type': z.literal('BreadcrumbList'),
  itemListElement: z.array(z.object({
    '@type': z.literal('ListItem'),
    position: z.number().int().min(1, 'Position must be a positive integer'),
    name: z.string().min(1, 'Item name is required'),
    item: z.string().url('Invalid item URL format').optional(),
  })).min(1, 'At least one breadcrumb item is required'),
});

// Union type for all supported schemas
export const anySchema = z.union([
  articleSchema,
  localBusinessSchema,
  faqPageSchema,
  productSchema,
  howToSchema,
  breadcrumbListSchema,
]);

export type SchemaType = z.infer<typeof anySchema>;

export function validateSchema<T extends z.ZodTypeAny>(schema: T, data: unknown): z.infer<T> {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Schema validation failed: ${error.issues.map(e => e.message).join(', ')}`);
    }
    throw new Error(`Unknown validation error: ${error}`);
  }
}
