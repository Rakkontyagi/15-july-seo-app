/**
 * OpenAI API Mock Data
 * Realistic mock responses for OpenAI API endpoints
 */

export const openaiMockData = {
  // Content generation response
  contentGenerationResponse: {
    id: 'chatcmpl-mock-' + Date.now(),
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model: 'gpt-4-turbo-preview',
    choices: [
      {
        index: 0,
        message: {
          role: 'assistant',
          content: `# Advanced Digital Marketing Strategies for 2025: A Comprehensive Guide

With over 25 years of experience in digital marketing strategy, I've witnessed the evolution of this dynamic industry firsthand. The landscape has transformed dramatically, and businesses that fail to adapt to the latest trends and technologies risk being left behind.

## The Current State of Digital Marketing

Digital marketing in 2025 is characterized by unprecedented sophistication in targeting, personalization, and automation. The integration of artificial intelligence, machine learning, and advanced analytics has revolutionized how we approach customer acquisition and retention.

### Key Industry Statistics

- 73% of businesses report that AI-driven marketing campaigns outperform traditional methods
- Customer acquisition costs have decreased by 38% for companies using advanced automation
- Personalized content generates 6x higher conversion rates than generic messaging

## Core Strategy Framework

### 1. Data-Driven Decision Making

The foundation of any successful digital marketing strategy lies in comprehensive data analysis. Modern marketers must leverage multiple data sources to create a holistic view of their target audience.

**Essential Data Points:**
- Customer lifetime value (CLV)
- Attribution modeling across touchpoints
- Behavioral segmentation patterns
- Predictive analytics for churn prevention

### 2. Omnichannel Integration

Today's consumers interact with brands across multiple touchpoints. A seamless omnichannel experience is no longer optional—it's essential for competitive advantage.

**Channel Optimization Priorities:**
- Social media engagement strategies
- Email marketing automation sequences
- Content marketing distribution
- Paid advertising optimization

### 3. Advanced SEO Techniques

Search engine optimization has evolved beyond keyword stuffing and basic on-page optimization. Modern SEO requires a sophisticated understanding of search intent, entity relationships, and technical performance.

**2025 SEO Essentials:**
- Core Web Vitals optimization
- Entity-based content strategy
- Voice search optimization
- AI-generated content detection avoidance

## Implementation Roadmap

### Phase 1: Foundation Building (Months 1-2)
- Audit existing digital assets
- Implement comprehensive analytics tracking
- Establish baseline performance metrics
- Create customer persona documentation

### Phase 2: Strategy Development (Months 3-4)
- Develop content calendar and distribution strategy
- Implement marketing automation workflows
- Launch A/B testing protocols
- Optimize conversion funnels

### Phase 3: Advanced Optimization (Months 5-6)
- Deploy AI-powered personalization
- Implement predictive analytics
- Launch advanced retargeting campaigns
- Optimize for emerging platforms

## Measuring Success

Key performance indicators must align with business objectives and provide actionable insights for continuous improvement.

**Primary Metrics:**
- Return on advertising spend (ROAS)
- Customer acquisition cost (CAC)
- Marketing qualified leads (MQLs)
- Revenue attribution by channel

**Secondary Metrics:**
- Brand awareness and sentiment
- Content engagement rates
- Email deliverability and open rates
- Social media reach and engagement

## Future Considerations

The digital marketing landscape will continue evolving rapidly. Successful organizations must remain agile and prepared to adapt to emerging technologies and changing consumer behaviors.

**Emerging Trends to Monitor:**
- Augmented reality marketing experiences
- Blockchain-based customer loyalty programs
- Advanced AI chatbot implementations
- Privacy-first marketing strategies

## Conclusion

Digital marketing success in 2025 requires a sophisticated blend of technology, creativity, and strategic thinking. Organizations that invest in comprehensive data analytics, omnichannel integration, and advanced automation will achieve sustainable competitive advantages.

The key to long-term success lies in maintaining a customer-centric approach while leveraging cutting-edge technologies to deliver personalized, valuable experiences at scale.`,
        },
        finish_reason: 'stop',
      },
    ],
    usage: {
      prompt_tokens: 150,
      completion_tokens: 650,
      total_tokens: 800,
    },
  },

  // Default chat response
  defaultChatResponse: {
    id: 'chatcmpl-mock-' + Date.now(),
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model: 'gpt-4-turbo-preview',
    choices: [
      {
        index: 0,
        message: {
          role: 'assistant',
          content: 'This is a mock response from the OpenAI API. In a real implementation, this would contain the actual AI-generated content based on the user\'s prompt.',
        },
        finish_reason: 'stop',
      },
    ],
    usage: {
      prompt_tokens: 50,
      completion_tokens: 30,
      total_tokens: 80,
    },
  },

  // Embeddings response
  embeddingsResponse: {
    object: 'list',
    data: [
      {
        object: 'embedding',
        embedding: Array.from({ length: 1536 }, () => Math.random() * 2 - 1),
        index: 0,
      },
    ],
    model: 'text-embedding-ada-002',
    usage: {
      prompt_tokens: 10,
      total_tokens: 10,
    },
  },

  // Models list response
  modelsResponse: {
    object: 'list',
    data: [
      {
        id: 'gpt-4-turbo-preview',
        object: 'model',
        created: 1677610602,
        owned_by: 'openai',
      },
      {
        id: 'gpt-4',
        object: 'model',
        created: 1677610602,
        owned_by: 'openai',
      },
      {
        id: 'gpt-3.5-turbo',
        object: 'model',
        created: 1677610602,
        owned_by: 'openai',
      },
    ],
  },

  // Error responses for testing
  rateLimitError: {
    error: {
      message: 'Rate limit reached for requests',
      type: 'rate_limit_error',
      param: null,
      code: 'rate_limit_exceeded',
    },
  },

  invalidApiKeyError: {
    error: {
      message: 'Invalid API key provided',
      type: 'invalid_request_error',
      param: null,
      code: 'invalid_api_key',
    },
  },

  // Streaming response simulation
  streamingResponse: {
    id: 'chatcmpl-mock-stream-' + Date.now(),
    object: 'chat.completion.chunk',
    created: Math.floor(Date.now() / 1000),
    model: 'gpt-4-turbo-preview',
    choices: [
      {
        index: 0,
        delta: {
          role: 'assistant',
          content: 'This is a simulated streaming response. ',
        },
        finish_reason: null,
      },
    ],
  },
};
