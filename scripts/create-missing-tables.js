#!/usr/bin/env node

/**
 * Create missing database tables
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createMissingTables() {
  console.log('🔧 Creating missing database tables...\n');

  // Create projects table
  console.log('📝 Creating projects table...');
  const { error: projectsError } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS public.projects (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        target_keywords TEXT[],
        target_country TEXT DEFAULT 'US',
        target_language TEXT DEFAULT 'en',
        domain_url TEXT,
        settings JSONB DEFAULT '{}',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `
  });

  if (projectsError) {
    console.error('❌ Failed to create projects table:', projectsError.message);
  } else {
    console.log('✅ Projects table created successfully');
  }

  // Test if we can create tables by trying a simple query first
  console.log('\n🔍 Testing table creation capability...');
  
  const { data: testData, error: testError } = await supabase
    .from('users')
    .select('id')
    .limit(1);

  if (testError) {
    console.error('❌ Cannot access database:', testError.message);
    return false;
  }

  console.log('✅ Database access confirmed');
  return true;
}

if (require.main === module) {
  createMissingTables().then(success => {
    if (success) {
      console.log('\n🎉 Table creation process completed!');
    } else {
      console.log('\n❌ Table creation failed');
      process.exit(1);
    }
  });
}

module.exports = { createMissingTables };