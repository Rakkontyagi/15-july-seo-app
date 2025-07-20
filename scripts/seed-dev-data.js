#!/usr/bin/env node

/**
 * Development Data Seeding Script
 * Seeds the database with realistic test data for development
 * Implements Quinn's recommendation for realistic test data generation
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('🌱 Seeding development database...');

// Test users data
const testUsers = [
  {
    id: 'dev-user-1',
    email: 'admin@example.com',
    role: 'admin',
    subscription_tier: 'enterprise',
    subscription_status: 'active',
    usage_count: 15,
    usage_limit: 1000,
  },
  {
    id: 'dev-user-2',
    email: 'pro@example.com',
    role: 'user',
    subscription_tier: 'professional',
    subscription_status: 'active',
    usage_count: 45,
    usage_limit: 100,
  },
  {
    id: 'dev-user-3',
    email: 'free@example.com',
    role: 'user',
    subscription_tier: 'free',
    subscription_status: 'active',
    usage_count: 8,
    usage_limit: 10,
  },
  {
    id: 'dev-user-4',
    email: 'trial@example.com',
    role: 'user',
    subscription_tier: 'trial',
    subscription_status: 'trialing',
    usage_count: 3,
    usage_limit: 5,
  },
];

// Sample content generation requests
const sampleContent = [
  {
    id: 'content-1',
    user_id: 'dev-user-1',
    keyword: 'best SEO tools 2024',
    location: 'United States',
    content_type: 'blog-post',
    status: 'completed',
    title: 'The Ultimate Guide to SEO Tools in 2024',
    content: generateSampleContent('SEO tools'),
    seo_score: 92,
    quality_score: 88,
    word_count: 2150,
    created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
  },
  {
    id: 'content-2',
    user_id: 'dev-user-2',
    keyword: 'digital marketing strategies',
    location: 'United Kingdom',
    content_type: 'service-page',
    status: 'completed',
    title: 'Proven Digital Marketing Strategies for 2024',
    content: generateSampleContent('digital marketing'),
    seo_score: 85,
    quality_score: 91,
    word_count: 1850,
    created_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
  },
  {
    id: 'content-3',
    user_id: 'dev-user-1',
    keyword: 'content marketing tips',
    location: 'Canada',
    content_type: 'blog-post',
    status: 'in_progress',
    title: null,
    content: null,
    seo_score: null,
    quality_score: null,
    word_count: null,
    created_at: new Date().toISOString(),
  },
  {
    id: 'content-4',
    user_id: 'dev-user-3',
    keyword: 'social media marketing',
    location: 'Australia',
    content_type: 'product-description',
    status: 'failed',
    title: null,
    content: null,
    seo_score: null,
    quality_score: null,
    word_count: null,
    error_message: 'API rate limit exceeded',
    created_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
  },
];

// Sample projects for collaboration testing
const sampleProjects = [
  {
    id: 'project-1',
    name: 'E-commerce SEO Campaign',
    description: 'Complete SEO content strategy for online store',
    owner_id: 'dev-user-1',
    status: 'active',
    created_at: new Date(Date.now() - 604800000).toISOString(), // 1 week ago
  },
  {
    id: 'project-2',
    name: 'Blog Content Series',
    description: 'Monthly blog content for tech startup',
    owner_id: 'dev-user-2',
    status: 'active',
    created_at: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
  },
];

// Sample comments for collaboration
const sampleComments = [
  {
    id: 'comment-1',
    project_id: 'project-1',
    user_id: 'dev-user-2',
    content: 'Great work on the keyword research! I think we should also target long-tail keywords.',
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'comment-2',
    project_id: 'project-1',
    user_id: 'dev-user-1',
    content: 'Thanks for the feedback! I\'ll add those to the next iteration.',
    created_at: new Date(Date.now() - 82800000).toISOString(),
  },
];

// Sample analytics data
const sampleAnalytics = [
  {
    id: 'analytics-1',
    user_id: 'dev-user-1',
    event_type: 'content_generated',
    event_data: { keyword: 'best SEO tools 2024', duration: 245000 },
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'analytics-2',
    user_id: 'dev-user-2',
    event_type: 'content_exported',
    event_data: { content_id: 'content-2', format: 'html' },
    created_at: new Date(Date.now() - 172800000).toISOString(),
  },
];

function generateSampleContent(topic) {
  return `# The Complete Guide to ${topic}

## Introduction

Welcome to the ultimate guide on ${topic}. In this comprehensive article, we'll explore everything you need to know to master ${topic} and achieve outstanding results.

## What is ${topic}?

${topic} is a crucial aspect of modern digital strategy that can significantly impact your online success. Understanding the fundamentals is essential for anyone looking to excel in this field.

### Key Benefits

1. **Improved Performance**: Implementing ${topic} strategies leads to measurable improvements
2. **Cost Effectiveness**: Optimized approaches reduce unnecessary expenses
3. **Competitive Advantage**: Stay ahead of competitors with advanced techniques
4. **Long-term Growth**: Build sustainable success with proven methodologies

## Best Practices for ${topic}

### 1. Strategic Planning

Before diving into implementation, it's crucial to develop a comprehensive strategy that aligns with your business objectives.

### 2. Implementation Guidelines

Follow these step-by-step guidelines to ensure successful implementation:

- **Phase 1**: Research and analysis
- **Phase 2**: Strategy development
- **Phase 3**: Implementation and testing
- **Phase 4**: Optimization and scaling

### 3. Monitoring and Optimization

Continuous monitoring is essential for maintaining peak performance and identifying optimization opportunities.

## Common Mistakes to Avoid

1. **Lack of Planning**: Jumping into implementation without proper strategy
2. **Ignoring Analytics**: Failing to track and measure performance
3. **Inconsistent Execution**: Not maintaining consistent efforts over time
4. **Outdated Techniques**: Using obsolete methods instead of current best practices

## Advanced Techniques

For those ready to take their ${topic} efforts to the next level, consider these advanced techniques:

### Automation and AI

Leverage automation tools and artificial intelligence to streamline processes and improve efficiency.

### Data-Driven Decision Making

Use analytics and data insights to guide your strategy and optimize performance.

## Tools and Resources

Here are some recommended tools and resources for ${topic}:

- **Analytics Platforms**: Track performance and gather insights
- **Automation Tools**: Streamline repetitive tasks
- **Educational Resources**: Stay updated with latest trends and techniques

## Conclusion

Mastering ${topic} requires dedication, continuous learning, and strategic implementation. By following the guidelines and best practices outlined in this guide, you'll be well-equipped to achieve success in your ${topic} endeavors.

Remember that success in ${topic} is a journey, not a destination. Stay committed to continuous improvement and adaptation to changing trends and technologies.

## Next Steps

1. Assess your current ${topic} strategy
2. Identify areas for improvement
3. Implement the techniques discussed in this guide
4. Monitor progress and optimize continuously

Start your ${topic} journey today and unlock the potential for exceptional results!`;
}

async function seedDatabase() {
  try {
    console.log('🗑️  Cleaning existing development data...');
    
    // Clean existing data (in reverse order due to foreign keys)
    await supabase.from('analytics_events').delete().neq('id', '');
    await supabase.from('project_comments').delete().neq('id', '');
    await supabase.from('projects').delete().neq('id', '');
    await supabase.from('content_generations').delete().neq('id', '');
    await supabase.from('user_profiles').delete().neq('id', '');

    console.log('👥 Seeding users...');
    const { error: usersError } = await supabase
      .from('user_profiles')
      .insert(testUsers);
    
    if (usersError) {
      console.error('Error seeding users:', usersError);
      return;
    }

    console.log('📝 Seeding content...');
    const { error: contentError } = await supabase
      .from('content_generations')
      .insert(sampleContent);
    
    if (contentError) {
      console.error('Error seeding content:', contentError);
      return;
    }

    console.log('📁 Seeding projects...');
    const { error: projectsError } = await supabase
      .from('projects')
      .insert(sampleProjects);
    
    if (projectsError) {
      console.error('Error seeding projects:', projectsError);
      return;
    }

    console.log('💬 Seeding comments...');
    const { error: commentsError } = await supabase
      .from('project_comments')
      .insert(sampleComments);
    
    if (commentsError) {
      console.error('Error seeding comments:', commentsError);
      return;
    }

    console.log('📊 Seeding analytics...');
    const { error: analyticsError } = await supabase
      .from('analytics_events')
      .insert(sampleAnalytics);
    
    if (analyticsError) {
      console.error('Error seeding analytics:', analyticsError);
      return;
    }

    console.log('');
    console.log('🎉 Development database seeded successfully!');
    console.log('');
    console.log('Test accounts created:');
    console.log('  📧 admin@example.com (Enterprise)');
    console.log('  📧 pro@example.com (Professional)');
    console.log('  📧 free@example.com (Free tier)');
    console.log('  📧 trial@example.com (Trial)');
    console.log('');
    console.log('Sample content and projects are now available for testing.');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seeding
seedDatabase();
