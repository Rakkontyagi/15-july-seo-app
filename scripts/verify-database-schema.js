#!/usr/bin/env node

/**
 * Verify database schema and table setup
 * This script verifies that all required tables exist and are properly configured
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Required tables
const REQUIRED_TABLES = [
  'users',
  'projects', 
  'generated_content',
  'serp_analysis',
  'competitor_analysis',
  'usage_analytics'
];

/**
 * Check if a table exists
 */
async function tableExists(tableName) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('count')
      .limit(1);

    return !error;
  } catch (error) {
    return false;
  }
}

/**
 * Get table schema information
 */
async function getTableInfo(tableName) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);

    if (error) {
      return { exists: false, error: error.message };
    }

    return { exists: true, columns: data ? Object.keys(data[0] || {}) : [] };
  } catch (error) {
    return { exists: false, error: error.message };
  }
}

/**
 * Verify database setup
 */
async function verifyDatabaseSetup() {
  console.log('🔍 Verifying database schema setup...\n');

  const results = {
    connection: false,
    tables: {},
    existingTables: [],
    missingTables: [],
    isComplete: false
  };

  // Test connection
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (!error) {
      results.connection = true;
      console.log('✅ Database connection successful');
    } else {
      console.log('❌ Database connection failed:', error.message);
      return results;
    }
  } catch (error) {
    console.log('❌ Database connection error:', error.message);
    return results;
  }

  console.log('\n📊 Checking table existence:\n');

  // Check each required table
  for (const tableName of REQUIRED_TABLES) {
    const exists = await tableExists(tableName);
    
    if (exists) {
      results.existingTables.push(tableName);
      console.log(`✅ ${tableName} - exists`);
    } else {
      results.missingTables.push(tableName);
      console.log(`❌ ${tableName} - missing`);
    }
    
    results.tables[tableName] = exists;
  }

  results.isComplete = results.missingTables.length === 0;

  console.log('\n📈 Database Setup Summary:');
  console.log(`   Connection: ${results.connection ? '✅ Connected' : '❌ Failed'}`);
  console.log(`   Tables: ${results.existingTables.length}/${REQUIRED_TABLES.length} exist`);
  console.log(`   Existing: ${results.existingTables.join(', ') || 'None'}`);
  
  if (results.missingTables.length > 0) {
    console.log(`   Missing: ${results.missingTables.join(', ')}`);
  }

  console.log(`   Status: ${results.isComplete ? '✅ Complete' : '⚠️  Incomplete'}`);

  return results;
}

/**
 * Detailed table analysis
 */
async function analyzeTableStructure() {
  console.log('\n🔬 Analyzing table structure...\n');

  for (const tableName of REQUIRED_TABLES) {
    const info = await getTableInfo(tableName);
    
    if (info.exists) {
      console.log(`📋 ${tableName}:`);
      console.log(`   Status: ✅ Exists`);
      console.log(`   Columns: ${info.columns.length > 0 ? info.columns.join(', ') : 'Unable to determine'}`);
    } else {
      console.log(`📋 ${tableName}:`);
      console.log(`   Status: ❌ Missing`);
      if (info.error) {
        console.log(`   Error: ${info.error}`);
      }
    }
    console.log('');
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    const results = await verifyDatabaseSetup();
    
    if (results.connection) {
      await analyzeTableStructure();
    }

    if (results.isComplete) {
      console.log('\n🎉 Database schema verification completed successfully!');
      console.log('All required tables exist and are accessible.');
    } else {
      console.log('\n⚠️  Database schema verification incomplete.');
      console.log('Some tables are missing and need to be created.');
      
      if (results.missingTables.length > 0) {
        console.log('\nTo create missing tables:');
        console.log('1. Use the Supabase dashboard SQL editor');
        console.log('2. Run the SQL from supabase/migrations/ files');
        console.log('3. Or use the manual table creation process');
      }
    }

  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { verifyDatabaseSetup, analyzeTableStructure, tableExists };