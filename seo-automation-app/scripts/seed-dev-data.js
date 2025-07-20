#!/usr/bin/env node

/**
 * Development Data Seeding Script
 * Following Quinn's recommendation for realistic test data
 * 
 * This script generates comprehensive test data for development including:
 * - User accounts with different subscription levels
 * - Sample projects and content
 * - Analytics data for dashboard testing
 * - Realistic content generation history
 */

const { createClient } = require('@supabase/supabase-js');
const { faker } = require('@faker-js/faker');

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-key';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Sample data generators
const generateUsers = (count = 5) => {
  return Array.from({ length: count }, (_, index) => ({
    id: faker.string.uuid(),
    email: faker.internet.email(),
    name: faker.person.fullName(),
    avatar: faker.image.avatar(),
    subscription: ['free', 'pro', 'enterprise'][index % 3],
    credits: faker.number.int({ min: 0, max: 1000 }),
    created_at: faker.date.past({ years: 1 }),
    updated_at: new Date(),
  }));
};

const generateProjects = (users, count = 15) => {
  const industries = [
    'technology', 'healthcare', 'finance', 'education', 'retail',
    'manufacturing', 'real-estate', 'travel', 'food', 'automotive'
  ];
  
  const audiences = [
    'beginners', 'professionals', 'experts', 'students', 'entrepreneurs',
    'managers', 'developers', 'marketers', 'executives', 'consumers'
  ];

  return Array.from({ length: count }, () => ({
    id: faker.string.uuid(),
    user_id: faker.helpers.arrayElement(users).id,
    name: faker.company.catchPhrase(),
    description: faker.lorem.paragraph(),
    keywords: faker.helpers.arrayElements([
      'SEO', 'content marketing', 'digital strategy', 'optimization',
      'analytics', 'conversion', 'traffic', 'ranking', 'keywords',
      'backlinks', 'SERP', 'organic growth'
    ], { min: 3, max: 8 }),
    target_audience: faker.helpers.arrayElement(audiences),
    industry: faker.helpers.arrayElement(industries),
    status: faker.helpers.arrayElement(['active', 'paused', 'completed']),
    created_at: faker.date.past({ years: 1 }),
    updated_at: faker.date.recent(),
  }));
};

const generateContent = (projects, count = 50) => {
  const contentTypes = ['article', 'blog-post', 'landing-page', 'product-description', 'social-media'];
  const statuses = ['draft', 'published', 'archived', 'scheduled'];

  return Array.from({ length: count }, () => {
    const project = faker.helpers.arrayElement(projects);
    const wordCount = faker.number.int({ min: 500, max: 5000 });
    
    return {
      id: faker.string.uuid(),
      project_id: project.id,
      user_id: project.user_id,
      title: faker.lorem.sentence({ min: 5, max: 12 }),
      content: faker.lorem.paragraphs(faker.number.int({ min: 5, max: 20 }), '\n\n'),
      meta_description: faker.lorem.sentence({ min: 10, max: 20 }),
      slug: faker.lorem.slug(),
      content_type: faker.helpers.arrayElement(contentTypes),
      status: faker.helpers.arrayElement(statuses),
      word_count: wordCount,
      seo_score: faker.number.int({ min: 60, max: 100 }),
      readability_score: faker.number.int({ min: 70, max: 95 }),
      keyword_density: faker.number.float({ min: 1.0, max: 3.5, fractionDigits: 2 }),
      target_keywords: project.keywords.slice(0, faker.number.int({ min: 1, max: 5 })),
      generated_at: faker.date.past({ months: 6 }),
      published_at: faker.helpers.maybe(() => faker.date.recent(), { probability: 0.7 }),
      created_at: faker.date.past({ months: 6 }),
      updated_at: faker.date.recent(),
    };
  });
};

const generateAnalytics = (content, count = 200) => {
  return Array.from({ length: count }, () => {
    const contentItem = faker.helpers.arrayElement(content);
    
    return {
      id: faker.string.uuid(),
      content_id: contentItem.id,
      project_id: contentItem.project_id,
      user_id: contentItem.user_id,
      date: faker.date.past({ months: 3 }),
      page_views: faker.number.int({ min: 0, max: 10000 }),
      unique_visitors: faker.number.int({ min: 0, max: 5000 }),
      bounce_rate: faker.number.float({ min: 0.2, max: 0.8, fractionDigits: 2 }),
      avg_session_duration: faker.number.int({ min: 30, max: 600 }),
      conversion_rate: faker.number.float({ min: 0.01, max: 0.15, fractionDigits: 3 }),
      organic_traffic: faker.number.int({ min: 0, max: 3000 }),
      search_ranking: faker.number.int({ min: 1, max: 100 }),
      click_through_rate: faker.number.float({ min: 0.01, max: 0.25, fractionDigits: 3 }),
      created_at: faker.date.past({ months: 3 }),
    };
  });
};

const generateCompetitorAnalysis = (projects, count = 30) => {
  return Array.from({ length: count }, () => {
    const project = faker.helpers.arrayElement(projects);
    
    return {
      id: faker.string.uuid(),
      project_id: project.id,
      user_id: project.user_id,
      competitor_url: faker.internet.url(),
      competitor_title: faker.company.name(),
      word_count: faker.number.int({ min: 1000, max: 8000 }),
      keyword_density: faker.number.float({ min: 0.5, max: 4.0, fractionDigits: 2 }),
      heading_count: faker.number.int({ min: 5, max: 25 }),
      meta_title_length: faker.number.int({ min: 30, max: 70 }),
      meta_description_length: faker.number.int({ min: 120, max: 160 }),
      load_time: faker.number.float({ min: 0.8, max: 5.0, fractionDigits: 2 }),
      mobile_optimized: faker.datatype.boolean({ probability: 0.8 }),
      https_enabled: faker.datatype.boolean({ probability: 0.9 }),
      domain_authority: faker.number.int({ min: 20, max: 95 }),
      backlink_count: faker.number.int({ min: 10, max: 10000 }),
      social_shares: faker.number.int({ min: 0, max: 5000 }),
      analyzed_at: faker.date.past({ months: 2 }),
      created_at: faker.date.past({ months: 2 }),
    };
  });
};

// Main seeding function
async function seedDatabase() {
  console.log('🌱 Starting development data seeding...');
  
  try {
    // Check if we're in test environment
    const isTest = process.env.NODE_ENV === 'test';
    const tablePrefix = isTest ? 'test_' : '';
    
    console.log(`📊 Environment: ${isTest ? 'TEST' : 'DEVELOPMENT'}`);
    
    // Generate sample data
    console.log('📝 Generating sample data...');
    const users = generateUsers(5);
    const projects = generateProjects(users, 15);
    const content = generateContent(projects, 50);
    const analytics = generateAnalytics(content, 200);
    const competitorAnalysis = generateCompetitorAnalysis(projects, 30);
    
    // Clear existing data (development only)
    if (!isTest) {
      console.log('🧹 Clearing existing development data...');
      await supabase.from('analytics').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('competitor_analysis').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('content').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('projects').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('profiles').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    }
    
    // Insert data
    console.log('👥 Inserting users...');
    const { error: usersError } = await supabase
      .from(`${tablePrefix}profiles`)
      .insert(users);
    
    if (usersError) {
      console.log('ℹ️  Users may already exist, continuing...');
    }
    
    console.log('📁 Inserting projects...');
    const { error: projectsError } = await supabase
      .from(`${tablePrefix}projects`)
      .insert(projects);
    
    if (projectsError) {
      console.error('Error inserting projects:', projectsError);
      throw projectsError;
    }
    
    console.log('📄 Inserting content...');
    const { error: contentError } = await supabase
      .from(`${tablePrefix}content`)
      .insert(content);
    
    if (contentError) {
      console.error('Error inserting content:', contentError);
      throw contentError;
    }
    
    console.log('📈 Inserting analytics...');
    const { error: analyticsError } = await supabase
      .from(`${tablePrefix}analytics`)
      .insert(analytics);
    
    if (analyticsError) {
      console.error('Error inserting analytics:', analyticsError);
      throw analyticsError;
    }
    
    console.log('🔍 Inserting competitor analysis...');
    const { error: competitorError } = await supabase
      .from(`${tablePrefix}competitor_analysis`)
      .insert(competitorAnalysis);
    
    if (competitorError) {
      console.error('Error inserting competitor analysis:', competitorError);
      throw competitorError;
    }
    
    console.log('✅ Development data seeding completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Users: ${users.length}`);
    console.log(`   - Projects: ${projects.length}`);
    console.log(`   - Content: ${content.length}`);
    console.log(`   - Analytics: ${analytics.length}`);
    console.log(`   - Competitor Analysis: ${competitorAnalysis.length}`);
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

// Run seeding if called directly
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
