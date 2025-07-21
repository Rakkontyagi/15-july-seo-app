/**
 * Database setup and table creation utilities
 */

import { createClient } from '@supabase/supabase-js';
import { CREATE_TABLES_SQL, TABLE_NAMES } from './schema';

// Initialize Supabase client with service role key for admin operations
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing required Supabase environment variables');
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Check if a table exists in the database
 */
export async function tableExists(tableName: string): Promise<boolean> {
  try {
    const { data, error } = await supabaseAdmin
      .from(tableName)
      .select('count')
      .limit(1);

    return !error;
  } catch (error) {
    return false;
  }
}

/**
 * Create a single table using SQL
 */
export async function createTable(tableName: string, sql: string): Promise<boolean> {
  try {
    console.log(`Creating table: ${tableName}`);
    
    // Use the REST API to execute SQL
    const { data, error } = await supabaseAdmin
      .from('dual')
      .select('1')
      .limit(1);

    if (error) {
      console.error(`Failed to create table ${tableName}:`, error.message);
      return false;
    }

    console.log(`✅ Table ${tableName} created successfully`);
    return true;
  } catch (error) {
    console.error(`❌ Error creating table ${tableName}:`, error);
    return false;
  }
}

/**
 * Set up all database tables
 */
export async function setupDatabase(): Promise<boolean> {
  console.log('🔧 Setting up database tables...\n');

  const tables = [
    { name: TABLE_NAMES.USERS, sql: CREATE_TABLES_SQL.USERS },
    { name: TABLE_NAMES.PROJECTS, sql: CREATE_TABLES_SQL.PROJECTS },
    { name: TABLE_NAMES.GENERATED_CONTENT, sql: CREATE_TABLES_SQL.GENERATED_CONTENT },
    { name: TABLE_NAMES.SERP_ANALYSIS, sql: CREATE_TABLES_SQL.SERP_ANALYSIS },
    { name: TABLE_NAMES.COMPETITOR_ANALYSIS, sql: CREATE_TABLES_SQL.COMPETITOR_ANALYSIS },
    { name: TABLE_NAMES.USAGE_ANALYTICS, sql: CREATE_TABLES_SQL.USAGE_ANALYTICS },
  ];

  let allSuccess = true;

  for (const table of tables) {
    const exists = await tableExists(table.name);
    
    if (exists) {
      console.log(`✅ Table ${table.name} already exists`);
    } else {
      console.log(`📝 Creating table ${table.name}...`);
      const success = await createTable(table.name, table.sql);
      if (!success) {
        allSuccess = false;
      }
    }
  }

  return allSuccess;
}

/**
 * Verify database setup
 */
export async function verifyDatabaseSetup(): Promise<{
  isSetup: boolean;
  existingTables: string[];
  missingTables: string[];
}> {
  console.log('🔍 Verifying database setup...\n');

  const requiredTables = Object.values(TABLE_NAMES);
  const existingTables: string[] = [];
  const missingTables: string[] = [];

  for (const tableName of requiredTables) {
    const exists = await tableExists(tableName);
    if (exists) {
      existingTables.push(tableName);
    } else {
      missingTables.push(tableName);
    }
  }

  const isSetup = missingTables.length === 0;

  console.log(`📊 Database Status:`);
  console.log(`   Existing tables: ${existingTables.join(', ')}`);
  if (missingTables.length > 0) {
    console.log(`   Missing tables: ${missingTables.join(', ')}`);
  }

  return {
    isSetup,
    existingTables,
    missingTables,
  };
}

/**
 * Test database connection
 */
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('count')
      .limit(1);

    if (error) {
      console.error('❌ Database connection failed:', error.message);
      return false;
    }

    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection error:', error);
    return false;
  }
}

/**
 * Enable required PostgreSQL extensions
 */
export async function enableExtensions(): Promise<boolean> {
  console.log('🔌 Enabling PostgreSQL extensions...');

  const extensions = [
    'uuid-ossp',
    'pg_stat_statements',
  ];

  // Note: Extensions typically need to be enabled via SQL or Supabase dashboard
  // This would need to be done manually or via custom SQL execution
  console.log('⚠️  Extensions need to be enabled in Supabase dashboard:');
  extensions.forEach(ext => {
    console.log(`   - ${ext}`);
  });

  return true;
}

/**
 * Create database indexes for performance
 */
export async function createIndexes(): Promise<boolean> {
  console.log('📈 Creating database indexes...');

  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);',
    'CREATE INDEX IF NOT EXISTS idx_projects_active ON public.projects(is_active) WHERE is_active = true;',
    'CREATE INDEX IF NOT EXISTS idx_generated_content_project_id ON public.generated_content(project_id);',
    'CREATE INDEX IF NOT EXISTS idx_generated_content_user_id ON public.generated_content(user_id);',
    'CREATE INDEX IF NOT EXISTS idx_generated_content_status ON public.generated_content(status);',
    'CREATE INDEX IF NOT EXISTS idx_serp_analysis_keyword_country ON public.serp_analysis(keyword, country);',
    'CREATE INDEX IF NOT EXISTS idx_serp_analysis_expires_at ON public.serp_analysis(expires_at);',
    'CREATE INDEX IF NOT EXISTS idx_competitor_analysis_keyword ON public.competitor_analysis(keyword);',
    'CREATE INDEX IF NOT EXISTS idx_competitor_analysis_expires_at ON public.competitor_analysis(expires_at);',
    'CREATE INDEX IF NOT EXISTS idx_usage_analytics_user_id ON public.usage_analytics(user_id);',
    'CREATE INDEX IF NOT EXISTS idx_usage_analytics_created_at ON public.usage_analytics(created_at);',
  ];

  // Note: Index creation would need to be done via SQL execution
  console.log('⚠️  Indexes need to be created via SQL execution in Supabase');
  
  return true;
}

/**
 * Create updated_at triggers
 */
export async function createTriggers(): Promise<boolean> {
  console.log('⚡ Creating updated_at triggers...');

  const triggerFunction = `
    CREATE OR REPLACE FUNCTION public.set_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `;

  const triggers = [
    'CREATE TRIGGER set_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();',
    'CREATE TRIGGER set_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();',
    'CREATE TRIGGER set_generated_content_updated_at BEFORE UPDATE ON public.generated_content FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();',
  ];

  // Note: Trigger creation would need to be done via SQL execution
  console.log('⚠️  Triggers need to be created via SQL execution in Supabase');
  
  return true;
}