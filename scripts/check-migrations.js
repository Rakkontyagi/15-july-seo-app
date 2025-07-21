#!/usr/bin/env node
/**
 * Database Migration Check Script
 * Validates migration scripts before deployment
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

class MigrationChecker {
  constructor(environment = 'staging') {
    this.environment = environment;
    this.migrationsDir = path.join(__dirname, '../supabase/migrations');
    this.supabase = this.initializeSupabase();
    this.results = [];
  }

  initializeSupabase() {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials');
    }

    return createClient(supabaseUrl, supabaseKey);
  }

  log(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`, 
      Object.keys(data).length > 0 ? JSON.stringify(data, null, 2) : '');
  }

  async getMigrationFiles() {
    try {
      if (!fs.existsSync(this.migrationsDir)) {
        throw new Error(`Migrations directory not found: ${this.migrationsDir}`);
      }

      const files = fs.readdirSync(this.migrationsDir)
        .filter(file => file.endsWith('.sql'))
        .sort();

      this.log('info', `Found ${files.length} migration files`);
      return files;
    } catch (error) {
      throw new Error(`Failed to read migration files: ${error.message}`);
    }
  }

  async getAppliedMigrations() {
    try {
      // Check if migrations table exists
      const { data, error } = await this.supabase
        .from('supabase_migrations')
        .select('version')
        .order('version', { ascending: true });

      if (error && error.code !== 'PGRST116') { // Table doesn't exist
        throw new Error(`Failed to query migrations: ${error.message}`);
      }

      return data ? data.map(row => row.version) : [];
    } catch (error) {
      // If table doesn't exist, return empty array
      this.log('warn', 'Migrations table not found, assuming no migrations applied');
      return [];
    }
  }

  validateMigrationFile(fileName) {
    const filePath = path.join(this.migrationsDir, fileName);
    const content = fs.readFileSync(filePath, 'utf8');

    const checks = {
      hasContent: content.trim().length > 0,
      hasTransactions: content.includes('BEGIN') && content.includes('COMMIT'),
      hasRollbackSafety: content.includes('IF NOT EXISTS') || content.includes('IF EXISTS'),
      hasProperNaming: /^\d{14,}_/.test(fileName),
      isValidSQL: this.basicSQLValidation(content),
      hasDangerousOperations: this.checkDangerousOperations(content)
    };

    return {
      fileName,
      filePath,
      checks,
      valid: checks.hasContent && checks.hasProperNaming && checks.isValidSQL && !checks.hasDangerousOperations,
      content: content.length
    };
  }

  basicSQLValidation(content) {
    // Basic SQL syntax validation
    const dangerousPatterns = [
      /DROP\s+DATABASE/i,
      /TRUNCATE\s+TABLE/i,
      /DELETE\s+FROM\s+\w+\s*;/i, // DELETE without WHERE
      /UPDATE\s+\w+\s+SET\s+.*\s*;/i // UPDATE without WHERE
    ];

    const hasUnsafeSql = dangerousPatterns.some(pattern => pattern.test(content));
    const hasValidStructure = /CREATE|ALTER|INSERT|UPDATE|DELETE|DROP/i.test(content);

    return hasValidStructure && !hasUnsafeSql;
  }

  checkDangerousOperations(content) {
    const dangerousOperations = [
      { pattern: /DROP\s+TABLE/i, type: 'DROP_TABLE' },
      { pattern: /DROP\s+COLUMN/i, type: 'DROP_COLUMN' },
      { pattern: /ALTER\s+TABLE\s+\w+\s+DROP/i, type: 'ALTER_DROP' },
      { pattern: /DELETE\s+FROM\s+(?!.*WHERE)/i, type: 'DELETE_ALL' },
      { pattern: /TRUNCATE/i, type: 'TRUNCATE' },
      { pattern: /DROP\s+INDEX/i, type: 'DROP_INDEX' }
    ];

    return dangerousOperations.some(op => op.pattern.test(content));
  }

  async checkMigrationOrder() {
    const migrationFiles = await this.getMigrationFiles();
    const appliedMigrations = await this.getAppliedMigrations();

    const orderChecks = {
      hasGaps: false,
      hasConflicts: false,
      pendingMigrations: [],
      appliedCount: appliedMigrations.length,
      totalCount: migrationFiles.length
    };

    // Check for pending migrations
    for (const file of migrationFiles) {
      const version = file.split('_')[0];
      if (!appliedMigrations.includes(version)) {
        orderChecks.pendingMigrations.push(file);
      }
    }

    // Check for conflicts (applied migrations not in files)
    for (const version of appliedMigrations) {
      const fileExists = migrationFiles.some(file => file.startsWith(version));
      if (!fileExists) {
        orderChecks.hasConflicts = true;
      }
    }

    return orderChecks;
  }

  async checkDatabaseConnection() {
    try {
      const { data, error } = await this.supabase
        .from('information_schema.tables')
        .select('table_name')
        .limit(1);

      if (error) {
        throw new Error(`Database connection failed: ${error.message}`);
      }

      return { connected: true, message: 'Database connection successful' };
    } catch (error) {
      return { connected: false, message: error.message };
    }
  }

  async simulateMigration(fileName) {
    const filePath = path.join(this.migrationsDir, fileName);
    const content = fs.readFileSync(filePath, 'utf8');

    try {
      // Start a transaction and rollback to simulate
      await this.supabase.rpc('exec_sql', { 
        sql: 'BEGIN; ' + content + '; ROLLBACK;' 
      });

      return { success: true, message: 'Migration simulation successful' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async runChecks() {
    this.log('info', 'Starting migration checks...');
    
    const results = {
      database: await this.checkDatabaseConnection(),
      migrations: [],
      order: null,
      summary: {
        totalFiles: 0,
        validFiles: 0,
        invalidFiles: 0,
        pendingMigrations: 0,
        hasErrors: false
      }
    };

    if (!results.database.connected) {
      results.summary.hasErrors = true;
      this.log('error', 'Database connection failed', results.database);
      return results;
    }

    try {
      // Check migration files
      const migrationFiles = await this.getMigrationFiles();
      results.summary.totalFiles = migrationFiles.length;

      for (const file of migrationFiles) {
        const validation = this.validateMigrationFile(file);
        results.migrations.push(validation);
        
        if (validation.valid) {
          results.summary.validFiles++;
        } else {
          results.summary.invalidFiles++;
          results.summary.hasErrors = true;
        }
      }

      // Check migration order
      results.order = await this.checkMigrationOrder();
      results.summary.pendingMigrations = results.order.pendingMigrations.length;

      if (results.order.hasConflicts) {
        results.summary.hasErrors = true;
      }

      // Simulate pending migrations
      for (const pendingFile of results.order.pendingMigrations) {
        this.log('info', `Simulating migration: ${pendingFile}`);
        const simulation = await this.simulateMigration(pendingFile);
        
        if (!simulation.success) {
          results.summary.hasErrors = true;
          this.log('error', `Migration simulation failed: ${pendingFile}`, simulation);
        }
      }

    } catch (error) {
      results.summary.hasErrors = true;
      this.log('error', 'Migration check failed', { error: error.message });
    }

    return results;
  }

  displayResults(results) {
    console.log('\n📊 Migration Check Report');
    console.log('='.repeat(50));
    console.log(`Environment: ${this.environment}`);
    console.log(`Database Connected: ${results.database.connected ? '✅' : '❌'}`);
    console.log(`Total Migration Files: ${results.summary.totalFiles}`);
    console.log(`Valid Files: ${results.summary.validFiles}`);
    console.log(`Invalid Files: ${results.summary.invalidFiles}`);
    console.log(`Pending Migrations: ${results.summary.pendingMigrations}`);
    console.log();

    if (results.order) {
      console.log('📋 Migration Order Status:');
      console.log(`Applied Migrations: ${results.order.appliedCount}`);
      console.log(`Total Migrations: ${results.order.totalCount}`);
      console.log(`Has Conflicts: ${results.order.hasConflicts ? '❌' : '✅'}`);
      console.log();

      if (results.order.pendingMigrations.length > 0) {
        console.log('📝 Pending Migrations:');
        results.order.pendingMigrations.forEach(file => {
          console.log(`  • ${file}`);
        });
        console.log();
      }
    }

    if (results.summary.invalidFiles > 0) {
      console.log('❌ Invalid Migration Files:');
      results.migrations
        .filter(m => !m.valid)
        .forEach(migration => {
          console.log(`  • ${migration.fileName}`);
          Object.entries(migration.checks).forEach(([check, passed]) => {
            if (!passed && check !== 'hasDangerousOperations') {
              console.log(`    ❌ ${check}`);
            }
            if (passed && check === 'hasDangerousOperations') {
              console.log(`    ⚠️  Contains dangerous operations`);
            }
          });
        });
      console.log();
    }

    const status = results.summary.hasErrors ? 'FAILED' : 'PASSED';
    const icon = results.summary.hasErrors ? '❌' : '✅';
    console.log(`${icon} Migration Check Status: ${status}`);
    
    return results;
  }
}

// CLI interface
async function main() {
  const environment = process.argv[2] || 'staging';
  const checker = new MigrationChecker(environment);
  
  try {
    const results = await checker.runChecks();
    checker.displayResults(results);
    
    process.exit(results.summary.hasErrors ? 1 : 0);
  } catch (error) {
    console.error('Migration check failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { MigrationChecker };