#!/usr/bin/env node

/**
 * Test database connection and verify tables exist
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

async function testConnection() {
  console.log('🔍 Testing database connection...\n');

  try {
    // Test basic connection
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (testError) {
      console.error('❌ Database connection failed:', testError.message);
      return false;
    }

    console.log('✅ Database connection successful\n');

    // Check if tables exist
    const tables = ['users', 'projects', 'generated_content', 'serp_analysis', 'competitor_analysis', 'usage_analytics'];
    console.log('📊 Checking table existence:');

    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('count')
        .limit(1);

      if (error) {
        console.log(`❌ Table '${table}' does not exist or has issues`);
        console.log(`   Error: ${error.message}`);
      } else {
        console.log(`✅ Table '${table}' exists and is accessible`);
      }
    }

    return true;
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    return false;
  }
}

if (require.main === module) {
  testConnection().then(success => {
    if (success) {
      console.log('\n🎉 Database setup verification completed!');
    } else {
      console.log('\n❌ Database setup needs attention');
      process.exit(1);
    }
  });
}

module.exports = { testConnection };