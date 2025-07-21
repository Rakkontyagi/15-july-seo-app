#!/usr/bin/env node

/**
 * Enhanced Migration runner for Supabase database
 * Supports different environments and zero-downtime migrations
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { ZeroDowntimeMigrator } = require('./zero-downtime-migration.js');

class MigrationRunner {
  constructor(environment = 'development') {
    this.environment = environment;
    this.loadEnvironmentConfig();
    this.supabase = createClient(this.supabaseUrl, this.supabaseServiceKey);
    this.migrationsDir = path.join(__dirname, '../supabase/migrations');
  }

  loadEnvironmentConfig() {
    // Load environment-specific configuration
    const envFiles = [
      '.env.local',
      `.env.${this.environment}`,
      '.env'
    ];

    for (const envFile of envFiles) {
      const envPath = path.join(__dirname, '..', envFile);
      if (fs.existsSync(envPath)) {
        require('dotenv').config({ path: envPath });
        break;
      }
    }

    this.supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    this.supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

    if (!this.supabaseUrl || !this.supabaseServiceKey) {
      console.error('❌ Missing required environment variables:');
      console.error('   - SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL)');
      console.error('   - SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SERVICE_KEY)');
      process.exit(1);
    }
  }

  log(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const prefix = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : '✅';
    console.log(`[${timestamp}] ${prefix} ${message}`, 
      Object.keys(data).length > 0 ? JSON.stringify(data, null, 2) : '');
  }

  async ensureMigrationsTable() {
    const { error } = await this.supabase.rpc('exec_sql', { 
      sql: `
        CREATE TABLE IF NOT EXISTS supabase_migrations (
          version varchar(255) PRIMARY KEY,
          name varchar(255) NOT NULL,
          executed_at timestamp with time zone DEFAULT now()
        );
      `
    });

    if (error) {
      throw new Error(`Failed to create migrations table: ${error.message}`);
    }
  }

  async getAppliedMigrations() {
    const { data, error } = await this.supabase
      .from('supabase_migrations')
      .select('version, name, executed_at')
      .order('executed_at', { ascending: true });

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get applied migrations: ${error.message}`);
    }

    return data || [];
  }

  async getPendingMigrations() {
    const files = fs.readdirSync(this.migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    const appliedMigrations = await this.getAppliedMigrations();
    const appliedVersions = appliedMigrations.map(m => m.version);

    const pendingMigrations = files.filter(file => {
      const version = file.split('_')[0];
      return !appliedVersions.includes(version);
    });

    return pendingMigrations;
  }

  async runStandardMigrations() {
    this.log('info', '🚀 Starting standard database migrations...');

    await this.ensureMigrationsTable();
    const pendingMigrations = await this.getPendingMigrations();

    if (pendingMigrations.length === 0) {
      this.log('info', 'No pending migrations found');
      return { success: true, executed: [] };
    }

    this.log('info', `Found ${pendingMigrations.length} pending migrations`);

    const executed = [];
    for (const file of pendingMigrations) {
      try {
        this.log('info', `📝 Running migration: ${file}`);
        
        const filePath = path.join(this.migrationsDir, file);
        const sql = fs.readFileSync(filePath, 'utf8');
        const version = file.split('_')[0];

        const { error } = await this.supabase.rpc('exec_sql', { sql });

        if (error) {
          throw new Error(`Migration failed: ${error.message}`);
        }

        // Record migration as applied
        await this.supabase
          .from('supabase_migrations')
          .upsert({
            version,
            name: file,
            executed_at: new Date().toISOString()
          });

        executed.push(file);
        this.log('info', `✅ Migration completed: ${file}`);
      } catch (error) {
        this.log('error', `❌ Migration failed: ${file}`, { error: error.message });
        throw error;
      }
    }

    this.log('info', '🎉 All migrations completed successfully!');
    return { success: true, executed };
  }

  async runZeroDowntimeMigrations() {
    this.log('info', '🚀 Starting zero-downtime database migrations...');
    
    const migrator = new ZeroDowntimeMigrator(this.environment);
    const result = await migrator.runZeroDowntimeMigration();
    
    if (result.success) {
      this.log('info', '🎉 Zero-downtime migrations completed successfully!');
    } else {
      this.log('error', '❌ Zero-downtime migrations failed', { error: result.error });
    }
    
    return result;
  }

  async run(useZeroDowntime = false) {
    try {
      await this.setupExecFunction();
      
      if (useZeroDowntime && (this.environment === 'staging' || this.environment === 'production')) {
        return await this.runZeroDowntimeMigrations();
      } else {
        return await this.runStandardMigrations();
      }
    } catch (error) {
      this.log('error', '❌ Migration process failed', { error: error.message });
      throw error;
    }
  }

  async setupExecFunction() {
    const { error } = await this.supabase.rpc('exec_sql', { 
      sql: `
        CREATE OR REPLACE FUNCTION exec_sql(sql text)
        RETURNS void
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        BEGIN
          EXECUTE sql;
        END;
        $$;
      `
    });

    if (error && !error.message.includes('already exists')) {
      throw new Error(`Failed to create exec_sql function: ${error.message}`);
    }
  }
}

// Legacy function for backwards compatibility
async function runMigrations() {
  const runner = new MigrationRunner('development');
  return await runner.run();
}

async function main() {
  try {
    // Parse command line arguments
    const args = process.argv.slice(2);
    const environment = args.find(arg => arg.startsWith('--env='))?.split('=')[1] || 'development';
    const useZeroDowntime = args.includes('--zero-downtime');

    const runner = new MigrationRunner(environment);
    const result = await runner.run(useZeroDowntime);
    
    process.exit(result.success ? 0 : 1);
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { 
  runMigrations, 
  MigrationRunner 
};