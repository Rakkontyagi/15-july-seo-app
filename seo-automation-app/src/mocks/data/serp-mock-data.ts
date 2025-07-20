/**
 * Serper.dev API Mock Data
 * Realistic mock responses for SERP analysis
 */

export const serpMockData = {
  // Generate search results based on query and location
  getSearchResults: (query: string, location: string = 'us') => ({
    searchParameters: {
      q: query,
      gl: location,
      hl: 'en',
      num: 10,
      autocorrect: true,
      page: 1,
      type: 'search',
    },
    organic: [
      {
        position: 1,
        title: `Ultimate Guide to ${query} - Expert Tips & Strategies`,
        link: 'https://example1.com/ultimate-guide',
        snippet: `Comprehensive guide covering everything you need to know about ${query}. Learn from industry experts with 20+ years of experience.`,
        sitelinks: [
          {
            title: 'Getting Started',
            link: 'https://example1.com/getting-started',
          },
          {
            title: 'Advanced Techniques',
            link: 'https://example1.com/advanced',
          },
        ],
        date: '2 days ago',
      },
      {
        position: 2,
        title: `${query}: Best Practices for 2025`,
        link: 'https://example2.com/best-practices',
        snippet: `Discover the latest best practices and trends in ${query}. Updated for 2025 with real-world case studies and actionable insights.`,
        date: '1 week ago',
      },
      {
        position: 3,
        title: `How to Master ${query} in 30 Days`,
        link: 'https://example3.com/master-guide',
        snippet: `Step-by-step tutorial to help you master ${query} quickly. Includes templates, checklists, and proven strategies.`,
        date: '3 days ago',
      },
      {
        position: 4,
        title: `${query} Tools & Resources - Complete List`,
        link: 'https://example4.com/tools-resources',
        snippet: `Curated list of the best tools and resources for ${query}. Free and premium options reviewed by experts.`,
        date: '5 days ago',
      },
      {
        position: 5,
        title: `Common ${query} Mistakes to Avoid`,
        link: 'https://example5.com/mistakes-avoid',
        snippet: `Learn from common mistakes that beginners make with ${query}. Avoid these pitfalls and accelerate your success.`,
        date: '1 day ago',
      },
    ],
    peopleAlsoAsk: [
      `What is ${query}?`,
      `How does ${query} work?`,
      `What are the benefits of ${query}?`,
      `How to get started with ${query}?`,
      `What are the best ${query} tools?`,
    ],
    relatedSearches: [
      `${query} tutorial`,
      `${query} guide`,
      `${query} tips`,
      `${query} strategies`,
      `${query} best practices`,
      `${query} tools`,
      `${query} examples`,
      `${query} case studies`,
    ],
    searchInformation: {
      totalResults: '2,450,000',
      timeTaken: 0.45,
      originalQuery: query,
      searchLocation: location,
    },
    answerBox: {
      title: `What is ${query}?`,
      snippet: `${query} is a comprehensive approach that involves multiple strategies and techniques to achieve optimal results. It requires careful planning, execution, and continuous optimization.`,
      source: 'https://example1.com/definition',
    },
  }),

  // Generate image search results
  getImageResults: (query: string) => ({
    searchParameters: {
      q: query,
      type: 'images',
      num: 20,
    },
    images: Array.from({ length: 20 }, (_, index) => ({
      title: `${query} Image ${index + 1}`,
      imageUrl: `https://picsum.photos/400/300?random=${index + 1}`,
      imageWidth: 400,
      imageHeight: 300,
      thumbnailUrl: `https://picsum.photos/150/150?random=${index + 1}`,
      thumbnailWidth: 150,
      thumbnailHeight: 150,
      source: `https://example${(index % 5) + 1}.com/image-${index + 1}`,
      domain: `example${(index % 5) + 1}.com`,
      link: `https://example${(index % 5) + 1}.com/page-${index + 1}`,
      position: index + 1,
    })),
  }),

  // Generate news search results
  getNewsResults: (query: string) => ({
    searchParameters: {
      q: query,
      type: 'news',
      num: 10,
    },
    news: [
      {
        title: `Breaking: Major Development in ${query} Industry`,
        link: 'https://news1.com/breaking-news',
        snippet: `Latest developments in the ${query} sector are reshaping the industry landscape. Experts predict significant changes ahead.`,
        date: '2 hours ago',
        source: 'Tech News Daily',
        imageUrl: 'https://picsum.photos/300/200?random=news1',
      },
      {
        title: `${query} Market Analysis: Q4 2024 Report`,
        link: 'https://news2.com/market-analysis',
        snippet: `Comprehensive analysis of the ${query} market shows strong growth trends and emerging opportunities for businesses.`,
        date: '6 hours ago',
        source: 'Business Weekly',
        imageUrl: 'https://picsum.photos/300/200?random=news2',
      },
      {
        title: `New Study Reveals ${query} Impact on Consumer Behavior`,
        link: 'https://news3.com/consumer-study',
        snippet: `Research findings demonstrate how ${query} is influencing consumer decisions and market dynamics across industries.`,
        date: '1 day ago',
        source: 'Research Today',
        imageUrl: 'https://picsum.photos/300/200?random=news3',
      },
    ],
  }),

  // Generate location-specific results
  getLocationResults: (query: string, location: string) => {
    const locationData = {
      us: {
        currency: 'USD',
        language: 'en-US',
        region: 'United States',
      },
      uk: {
        currency: 'GBP',
        language: 'en-GB',
        region: 'United Kingdom',
      },
      ca: {
        currency: 'CAD',
        language: 'en-CA',
        region: 'Canada',
      },
      au: {
        currency: 'AUD',
        language: 'en-AU',
        region: 'Australia',
      },
    };

    const locData = locationData[location as keyof typeof locationData] || locationData.us;

    return {
      ...serpMockData.getSearchResults(query, location),
      locationInfo: locData,
      localResults: [
        {
          title: `Local ${query} Services in ${locData.region}`,
          address: '123 Main Street, City, State',
          phone: '+1-555-0123',
          rating: 4.8,
          reviews: 127,
          hours: 'Open 9 AM - 6 PM',
        },
        {
          title: `${query} Experts Near You`,
          address: '456 Business Ave, City, State',
          phone: '+1-555-0456',
          rating: 4.6,
          reviews: 89,
          hours: 'Open 8 AM - 7 PM',
        },
      ],
    };
  },

  // Generate competitor analysis data
  getCompetitorData: (competitors: string[]) => ({
    competitors: competitors.map((url, index) => ({
      url,
      title: `Competitor ${index + 1} - Industry Leader`,
      description: `Leading provider of solutions with comprehensive expertise and proven track record.`,
      wordCount: 2500 + Math.floor(Math.random() * 1500),
      keywordDensity: 1.5 + Math.random() * 2,
      headings: {
        h1: 1,
        h2: 4 + Math.floor(Math.random() * 6),
        h3: 8 + Math.floor(Math.random() * 12),
        h4: Math.floor(Math.random() * 8),
        h5: Math.floor(Math.random() * 4),
        h6: Math.floor(Math.random() * 2),
      },
      metaTitle: `${60 + Math.floor(Math.random() * 20)} characters`,
      metaDescription: `${150 + Math.floor(Math.random() * 10)} characters`,
      loadTime: 1.2 + Math.random() * 2.8,
      mobileOptimized: Math.random() > 0.2,
      httpsEnabled: Math.random() > 0.1,
      socialShares: Math.floor(Math.random() * 1000),
      backlinks: Math.floor(Math.random() * 500),
      domainAuthority: 40 + Math.floor(Math.random() * 50),
    })),
    analysis: {
      averageWordCount: 2850,
      averageKeywordDensity: 2.3,
      averageHeadings: 15,
      averageLoadTime: 2.1,
      mobileOptimizationRate: 85,
      httpsAdoptionRate: 95,
    },
  }),
};
