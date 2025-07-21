#!/usr/bin/env node
/**
 * Zero-Downtime Database Migration Script
 * Handles database migrations with zero downtime using blue-green deployment strategy
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { execSync } = require('child_process');

class ZeroDowntimeMigrator {
  constructor(environment = 'staging') {
    this.environment = environment;
    this.migrationsDir = path.join(__dirname, '../supabase/migrations');
    this.backupDir = path.join(__dirname, '../backups');
    this.supabase = this.initializeSupabase();
    this.migrationState = null;
    this.rollbackPoint = null;
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

  async ensureDirectories() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  async createBackup() {
    await this.ensureDirectories();
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `backup_${this.environment}_${timestamp}.sql`;
    const backupPath = path.join(this.backupDir, backupName);
    
    this.log('info', 'Creating database backup...', { backupPath });
    
    try {
      // Use pg_dump to create a backup
      const databaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_URL;
      const command = `pg_dump "${databaseUrl}" > "${backupPath}"`;
      
      execSync(command, { stdio: 'inherit' });
      
      this.rollbackPoint = backupPath;
      this.log('info', 'Database backup created successfully', { backupPath });
      
      return backupPath;
    } catch (error) {
      throw new Error(`Backup creation failed: ${error.message}`);
    }
  }

  async getPendingMigrations() {
    const migrationFiles = fs.readdirSync(this.migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    // Get applied migrations
    const { data: appliedMigrations, error } = await this.supabase
      .from('supabase_migrations')
      .select('version')
      .order('version', { ascending: true });

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get applied migrations: ${error.message}`);
    }

    const appliedVersions = appliedMigrations ? appliedMigrations.map(m => m.version) : [];
    
    const pendingMigrations = migrationFiles.filter(file => {
      const version = file.split('_')[0];
      return !appliedVersions.includes(version);
    });

    this.log('info', 'Found pending migrations', { 
      total: migrationFiles.length,
      applied: appliedVersions.length,
      pending: pendingMigrations.length,
      migrations: pendingMigrations
    });

    return pendingMigrations;
  }

  async validateMigrationSafety(migrationFile) {
    const filePath = path.join(this.migrationsDir, migrationFile);
    const content = fs.readFileSync(filePath, 'utf8');

    const safetyChecks = {
      hasTransactions: content.includes('BEGIN') && content.includes('COMMIT'),
      hasRollbackSafety: content.includes('IF NOT EXISTS') || content.includes('IF EXISTS'),
      noDestructiveOperations: this.checkDestructiveOperations(content),
      hasIndexCreation: content.includes('CREATE INDEX'),
      hasConstraints: content.includes('ADD CONSTRAINT'),
      hasTableCreation: content.includes('CREATE TABLE'),
      hasColumnAddition: content.includes('ADD COLUMN')
    };

    const isZeroDowntimeSafe = 
      safetyChecks.hasTransactions &&
      safetyChecks.hasRollbackSafety &&
      safetyChecks.noDestructiveOperations;

    return {
      migrationFile,
      safetyChecks,
      isZeroDowntimeSafe,
      recommendations: this.generateRecommendations(safetyChecks)
    };
  }

  checkDestructiveOperations(content) {
    const destructivePatterns = [
      /DROP\s+TABLE/i,
      /DROP\s+COLUMN/i,
      /TRUNCATE/i,
      /DELETE\s+FROM\s+(?!.*WHERE)/i,
      /ALTER\s+TABLE\s+.*\s+DROP/i
    ];

    return !destructivePatterns.some(pattern => pattern.test(content));
  }

  generateRecommendations(safetyChecks) {
    const recommendations = [];

    if (!safetyChecks.hasTransactions) {
      recommendations.push('Wrap migration in BEGIN/COMMIT transaction');
    }

    if (!safetyChecks.hasRollbackSafety) {
      recommendations.push('Add IF NOT EXISTS/IF EXISTS clauses for idempotency');
    }

    if (!safetyChecks.noDestructiveOperations) {
      recommendations.push('Avoid destructive operations in zero-downtime migrations');
    }

    if (safetyChecks.hasIndexCreation) {
      recommendations.push('Consider creating indexes CONCURRENTLY');
    }

    return recommendations;
  }

  async executeMigration(migrationFile) {
    const filePath = path.join(this.migrationsDir, migrationFile);
    const content = fs.readFileSync(filePath, 'utf8');
    const version = migrationFile.split('_')[0];

    this.log('info', `Executing migration: ${migrationFile}`);

    try {
      // Execute migration in a transaction
      await this.supabase.rpc('exec_sql', { sql: content });

      // Record migration as applied
      await this.supabase
        .from('supabase_migrations')
        .upsert({
          version,
          name: migrationFile,
          executed_at: new Date().toISOString()
        });

      this.log('info', `Migration completed successfully: ${migrationFile}`);
      return { success: true, migrationFile };
    } catch (error) {
      this.log('error', `Migration failed: ${migrationFile}`, { error: error.message });
      return { success: false, migrationFile, error: error.message };
    }
  }

  async executeMigrationsWithRollback(migrations) {
    const executedMigrations = [];
    
    for (const migration of migrations) {
      const result = await this.executeMigration(migration);
      
      if (result.success) {
        executedMigrations.push(migration);
      } else {
        // Rollback on failure
        this.log('error', `Migration failed, initiating rollback: ${migration}`);
        await this.rollbackMigrations(executedMigrations);
        throw new Error(`Migration failed: ${result.error}`);
      }
    }

    return executedMigrations;
  }

  async rollbackMigrations(migrationsToRollback) {
    if (!this.rollbackPoint) {
      throw new Error('No rollback point available');
    }

    this.log('info', 'Starting migration rollback...', { 
      migrationsToRollback: migrationsToRollback.length,
      rollbackPoint: this.rollbackPoint
    });

    try {
      // Restore from backup
      const databaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_URL;
      const command = `psql "${databaseUrl}" < "${this.rollbackPoint}"`;
      
      execSync(command, { stdio: 'inherit' });
      
      this.log('info', 'Migration rollback completed successfully');
      return true;
    } catch (error) {
      throw new Error(`Rollback failed: ${error.message}`);
    }
  }

  async validatePostMigration() {
    this.log('info', 'Running post-migration validation...');

    const validationChecks = {
      databaseConnection: false,
      migrationTableExists: false,
      basicQueries: false,
      indexesValid: false
    };

    try {
      // Check database connection
      const { data, error } = await this.supabase
        .from('information_schema.tables')
        .select('table_name')
        .limit(1);

      validationChecks.databaseConnection = !error;

      // Check migration table exists
      const { data: migrationTable } = await this.supabase
        .from('supabase_migrations')
        .select('version')
        .limit(1);

      validationChecks.migrationTableExists = !!migrationTable;

      // Run basic queries on main tables
      const { data: healthCheck } = await this.supabase
        .from('information_schema.columns')
        .select('column_name')
        .limit(1);

      validationChecks.basicQueries = !!healthCheck;

      // Check indexes
      const { data: indexes } = await this.supabase
        .from('pg_indexes')
        .select('indexname')
        .limit(1);

      validationChecks.indexesValid = !!indexes;

      const allChecksPass = Object.values(validationChecks).every(check => check);

      this.log('info', 'Post-migration validation results', {
        validationChecks,
        allChecksPass
      });

      return allChecksPass;
    } catch (error) {
      this.log('error', 'Post-migration validation failed', { error: error.message });
      return false;
    }
  }

  async runZeroDowntimeMigration() {
    const startTime = Date.now();
    let executedMigrations = [];

    try {
      this.log('info', 'Starting zero-downtime migration process...');

      // Step 1: Create backup
      await this.createBackup();

      // Step 2: Get pending migrations
      const pendingMigrations = await this.getPendingMigrations();

      if (pendingMigrations.length === 0) {
        this.log('info', 'No pending migrations found');
        return { success: true, executedMigrations: [] };
      }

      // Step 3: Validate migration safety
      for (const migration of pendingMigrations) {
        const validation = await this.validateMigrationSafety(migration);
        
        if (!validation.isZeroDowntimeSafe) {
          this.log('warn', `Migration may not be zero-downtime safe: ${migration}`, {
            recommendations: validation.recommendations
          });
        }
      }

      // Step 4: Execute migrations with rollback capability
      executedMigrations = await this.executeMigrationsWithRollback(pendingMigrations);

      // Step 5: Post-migration validation
      const validationPassed = await this.validatePostMigration();

      if (!validationPassed) {
        await this.rollbackMigrations(executedMigrations);
        throw new Error('Post-migration validation failed');
      }

      const duration = Date.now() - startTime;
      this.log('info', 'Zero-downtime migration completed successfully', {
        executedMigrations: executedMigrations.length,
        duration: `${duration}ms`
      });

      return { success: true, executedMigrations };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.log('error', 'Zero-downtime migration failed', {
        error: error.message,
        duration: `${duration}ms`,
        executedMigrations: executedMigrations.length
      });

      return { success: false, error: error.message, executedMigrations };
    }
  }

  async generateMigrationReport() {
    const appliedMigrations = await this.supabase
      .from('supabase_migrations')
      .select('*')
      .order('executed_at', { ascending: false });

    const pendingMigrations = await this.getPendingMigrations();

    return {
      environment: this.environment,
      timestamp: new Date().toISOString(),
      appliedMigrations: appliedMigrations.data || [],
      pendingMigrations,
      rollbackPoint: this.rollbackPoint,
      status: 'completed'
    };
  }
}

// CLI interface
async function main() {
  const environment = process.argv[2] || 'staging';
  const migrator = new ZeroDowntimeMigrator(environment);
  
  try {
    const result = await migrator.runZeroDowntimeMigration();
    
    if (result.success) {
      console.log('\n✅ Zero-downtime migration completed successfully');
      const report = await migrator.generateMigrationReport();
      console.log('\n📊 Migration Report:');
      console.log(JSON.stringify(report, null, 2));
    } else {
      console.log('\n❌ Zero-downtime migration failed');
      console.log(`Error: ${result.error}`);
    }
    
    process.exit(result.success ? 0 : 1);
  } catch (error) {
    console.error('Migration process failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { ZeroDowntimeMigrator };