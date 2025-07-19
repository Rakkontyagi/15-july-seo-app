export interface ArticleSchema {
  "@context": "https://schema.org";
  "@type": "Article";
  headline: string;
  image?: string[];
  datePublished: string;
  dateModified?: string;
  author?: {
    "@type": "Person";
    name: string;
  };
  publisher?: {
    "@type": "Organization";
    name: string;
    logo?: {
      "@type": "ImageObject";
      url: string;
    };
  };
  description?: string;
  articleBody?: string; // Main content of the article
  mainEntityOfPage?: {
    "@type": "WebPage";
    "@id": string;
  };
}

export interface LocalBusinessSchema {
  "@context": "https://schema.org";
  "@type": string; // e.g., 'LocalBusiness', 'Restaurant', 'Store'
  name: string;
  address: {
    "@type": "PostalAddress";
    streetAddress: string;
    addressLocality: string;
    addressRegion?: string;
    postalCode: string;
    addressCountry: string;
  };
  telephone?: string;
  priceRange?: string;
  url?: string;
  image?: string[];
  geo?: {
    "@type": "GeoCoordinates";
    latitude: number;
    longitude: number;
  };
  openingHoursSpecification?: Array<{
    "@type": "OpeningHoursSpecification";
    dayOfWeek: string | string[];
    opens: string;
    closes: string;
  }>;
}

export interface FaqSchema {
  "@context": "https://schema.org";
  "@type": "FAQPage";
  mainEntity: Array<{
    "@type": "Question";
    name: string;
    acceptedAnswer: {
      "@type": "Answer";
      text: string;
    };
  }>;
}

export interface ProductSchema {
  "@context": "https://schema.org";
  "@type": "Product";
  name: string;
  image?: string[];
  description?: string;
  sku?: string;
  mpn?: string;
  brand?: {
    "@type": "Brand";
    name: string;
  };
  offers?: {
    "@type": "Offer";
    url?: string;
    priceCurrency: string;
    price: string;
    itemCondition?: string;
    availability?: string;
    seller?: {
      "@type": "Organization";
      name: string;
    };
  };
  aggregateRating?: {
    "@type": "AggregateRating";
    ratingValue: string;
    reviewCount: string;
  };
  review?: Array<{
    "@type": "Review";
    reviewRating: {
      "@type": "Rating";
      ratingValue: string;
    };
    author: {
      "@type": "Person";
      name: string;
    };
    reviewBody?: string;
    datePublished?: string;
  }>;
}

export interface HowToSchema {
  "@context": "https://schema.org";
  "@type": "HowTo";
  name: string;
  step: Array<{
    "@type": "HowToStep";
    text: string;
    name?: string;
    url?: string;
    image?: string;
    itemListElement?: Array<{
      "@type": "HowToDirection" | "HowToTip";
      text: string;
    }>;
  }>;
  supply?: Array<{
    "@type": "HowToSupply";
    name: string;
  }>;
  tool?: Array<{
    "@type": "HowToTool";
    name: string;
  }>;
  totalTime?: string; // ISO 8601 duration format (e.g., "PT30M" for 30 minutes)
}

export interface BreadcrumbSchema {
  "@context": "https://schema.org";
  "@type": "BreadcrumbList";
  itemListElement: Array<{
    "@type": "ListItem";
    position: number;
    name: string;
    item?: string; // URL
  }>;
}

export class SchemaGenerator {
  /**
   * Generates Article Schema JSON-LD.
   * @param options Options for generating the Article schema.
   * @returns The ArticleSchema object.
   */
  generateArticleSchema(options: {
    headline: string;
    datePublished: Date;
    dateModified?: Date;
    authorName?: string;
    publisherName?: string;
    publisherLogoUrl?: string;
    description?: string;
    articleBody?: string;
    imageUrl?: string;
    pageUrl: string;
  }): ArticleSchema {
    const schema: ArticleSchema = {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: options.headline,
      datePublished: options.datePublished.toISOString(),
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": options.pageUrl,
      },
    };

    if (options.dateModified) {
      schema.dateModified = options.dateModified.toISOString();
    }
    if (options.authorName) {
      schema.author = {
        "@type": "Person",
        name: options.authorName,
      };
    }
    if (options.publisherName) {
      schema.publisher = {
        "@type": "Organization",
        name: options.publisherName,
      };
      if (options.publisherLogoUrl) {
        schema.publisher.logo = {
          "@type": "ImageObject",
          url: options.publisherLogoUrl,
        };
      }
    }
    if (options.description) {
      schema.description = options.description;
    }
    if (options.articleBody) {
      schema.articleBody = options.articleBody;
    }
    if (options.imageUrl) {
      schema.image = [options.imageUrl];
    }

    return schema;
  }

  /**
   * Generates Local Business Schema JSON-LD.
   * @param options Options for generating the Local Business schema.
   * @returns The LocalBusinessSchema object.
   */
  generateLocalBusinessSchema(options: {
    type: string; // e.g., 'LocalBusiness', 'Restaurant', 'Store'
    name: string;
    streetAddress: string;
    addressLocality: string;
    postalCode: string;
    addressCountry: string;
    addressRegion?: string;
    telephone?: string;
    priceRange?: string;
    url?: string;
    imageUrl?: string[];
    latitude?: number;
    longitude?: number;
    openingHours?: Array<{
      dayOfWeek: string | string[];
      opens: string;
      closes: string;
    }>;
  }): LocalBusinessSchema {
    const schema: LocalBusinessSchema = {
      "@context": "https://schema.org",
      "@type": options.type,
      name: options.name,
      address: {
        "@type": "PostalAddress",
        streetAddress: options.streetAddress,
        addressLocality: options.addressLocality,
        postalCode: options.postalCode,
        addressCountry: options.addressCountry,
      },
    };

    if (options.addressRegion) {
      schema.address.addressRegion = options.addressRegion;
    }
    if (options.telephone) {
      schema.telephone = options.telephone;
    }
    if (options.priceRange) {
      schema.priceRange = options.priceRange;
    }
    if (options.url) {
      schema.url = options.url;
    }
    if (options.imageUrl) {
      schema.image = options.imageUrl;
    }
    if (options.latitude && options.longitude) {
      schema.geo = {
        "@type": "GeoCoordinates",
        latitude: options.latitude,
        longitude: options.longitude,
      };
    }
    if (options.openingHours && options.openingHours.length > 0) {
      schema.openingHoursSpecification = options.openingHours.map(oh => ({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: oh.dayOfWeek,
        opens: oh.opens,
        closes: oh.closes,
      }));
    }

    return schema;
  }

  /**
   * Extracts FAQ (Frequently Asked Questions) from content and generates FAQPage Schema JSON-LD.
   * Assumes questions are in <h3> tags and answers are in <p> tags immediately following.
   * @param htmlContent The HTML content to extract FAQs from.
   * @returns The FaqSchema object.
   */
  generateFaqSchema(htmlContent: string): FaqSchema {
    // Simple regex-based extraction for better test compatibility
    const mainEntity: FaqSchema['mainEntity'] = [];

    // Extract h3 questions and following p answers
    const h3Regex = /<h3[^>]*>(.*?)<\/h3>\s*<p[^>]*>(.*?)<\/p>/gi;
    let match;

    while ((match = h3Regex.exec(htmlContent)) !== null) {
      const question = match[1].replace(/<[^>]*>/g, '').trim();
      const answer = match[2].replace(/<[^>]*>/g, '').trim();

      if (question && answer) {
        mainEntity.push({
          "@type": "Question",
          name: question,
          acceptedAnswer: {
            "@type": "Answer",
            text: answer,
          },
        });
      }
    }

    return {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity,
    };
  }

  /**
   * Generates Product Schema JSON-LD.
   * @param options Options for generating the Product schema.
   * @returns The ProductSchema object.
   */
  generateProductSchema(options: {
    name: string;
    description?: string;
    imageUrl?: string[];
    sku?: string;
    mpn?: string;
    brandName?: string;
    offerUrl?: string;
    priceCurrency: string;
    price: string;
    itemCondition?: 'NewCondition' | 'UsedCondition' | 'DamagedCondition' | 'RefurbishedCondition';
    availability?: 'InStock' | 'OutOfStock' | 'PreOrder' | 'Discontinued';
    sellerName?: string;
    ratingValue?: string;
    reviewCount?: string;
    reviews?: Array<{
      ratingValue: string;
      authorName: string;
      reviewBody?: string;
      datePublished?: Date;
    }>;
  }): ProductSchema {
    const schema: ProductSchema = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: options.name,
    };

    if (options.description) schema.description = options.description;
    if (options.imageUrl) schema.image = options.imageUrl;
    if (options.sku) schema.sku = options.sku;
    if (options.mpn) schema.mpn = options.mpn;
    if (options.brandName) {
      schema.brand = {
        "@type": "Brand",
        name: options.brandName,
      };
    }

    if (options.price && options.priceCurrency) {
      schema.offers = {
        "@type": "Offer",
        priceCurrency: options.priceCurrency,
        price: options.price,
      };
      if (options.offerUrl) schema.offers.url = options.offerUrl;
      if (options.itemCondition) schema.offers.itemCondition = `https://schema.org/${options.itemCondition}`;
      if (options.availability) schema.offers.availability = `https://schema.org/${options.availability}`;
      if (options.sellerName) {
        schema.offers.seller = {
          "@type": "Organization",
          name: options.sellerName,
        };
      }
    }

    if (options.ratingValue && options.reviewCount) {
      schema.aggregateRating = {
        "@type": "AggregateRating",
        ratingValue: options.ratingValue,
        reviewCount: options.reviewCount,
      };
    }

    if (options.reviews && options.reviews.length > 0) {
      schema.review = options.reviews.map(review => ({
        "@type": "Review",
        reviewRating: {
          "@type": "Rating",
          ratingValue: review.ratingValue,
        },
        author: {
          "@type": "Person",
          name: review.authorName,
        },
        ...(review.reviewBody && { reviewBody: review.reviewBody }),
        ...(review.datePublished && { datePublished: review.datePublished.toISOString() }),
      }));
    }

    return schema;
  }

  /**
   * Extracts HowTo steps from content and generates HowTo Schema JSON-LD.
   * Assumes steps are identified by ordered lists (<ol><li>) or headings (e.g., <h3>Step 1: ...</h3>).
   * @param htmlContent The HTML content to extract HowTo steps from.
   * @param howToName The name of the HowTo guide.
   * @returns The HowToSchema object.
   */
  generateHowToSchema(htmlContent: string, howToName: string): HowToSchema {
    const steps: HowToSchema['step'] = [];

    // Try to extract from ordered lists first
    const olRegex = /<ol[^>]*>(.*?)<\/ol>/gis;
    const liRegex = /<li[^>]*>(.*?)<\/li>/gi;

    const olMatch = olRegex.exec(htmlContent);
    if (olMatch) {
      let liMatch;
      while ((liMatch = liRegex.exec(olMatch[1])) !== null) {
        const stepText = liMatch[1].replace(/<[^>]*>/g, '').trim();
        if (stepText) {
          steps.push({
            "@type": "HowToStep",
            text: stepText,
          });
        }
      }
    }

    // If no ordered list, try to extract from headings (e.g., H3, H4) followed by paragraphs
    if (steps.length === 0) {
      const headingRegex = /<(h3|h4)[^>]*>(.*?)<\/\1>\s*<p[^>]*>(.*?)<\/p>/gi;
      let match;

      while ((match = headingRegex.exec(htmlContent)) !== null) {
        const stepName = match[2].replace(/<[^>]*>/g, '').trim();
        const stepText = match[3].replace(/<[^>]*>/g, '').trim();
        if (stepName && stepText) {
          steps.push({
            "@type": "HowToStep",
            name: stepName,
            text: stepText,
          });
        }
      }
    }

    return {
      "@context": "https://schema.org",
      "@type": "HowTo",
      name: howToName,
      step: steps,
    };
  }

  /**
   * Generates BreadcrumbList Schema JSON-LD.
   * @param items An array of breadcrumb items (name and URL).
   * @returns The BreadcrumbSchema object.
   */
  generateBreadcrumbSchema(items: Array<{ name: string; item?: string }>): BreadcrumbSchema {
    return {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: items.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        ...(item.item && { item: item.item }),
      })),
    };
  }

  /**
   * Converts a schema object to a JSON-LD script tag.
   * @param schema The schema object.
   * @returns A string containing the <script type="application/ld+json"> tag.
   */
  toScriptTag(schema: any): string {
    return `<script type="application/ld+json">${JSON.stringify(schema, null, 2)}</script>`;
  }
}