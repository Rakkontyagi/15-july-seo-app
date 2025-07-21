#!/usr/bin/env node
/**
 * Deployment Backup Script
 * Creates comprehensive backups before deployment
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { createClient } = require('@supabase/supabase-js');

class DeploymentBackup {
  constructor(environment = 'staging') {
    this.environment = environment;
    this.backupDir = path.join(__dirname, '../backups');
    this.timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.supabase = this.initializeSupabase();
    this.backupManifest = {
      timestamp: this.timestamp,
      environment: this.environment,
      backups: {},
      metadata: {}
    };
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

  async ensureBackupDirectory() {
    const envBackupDir = path.join(this.backupDir, this.environment);
    const timestampDir = path.join(envBackupDir, this.timestamp);
    
    if (!fs.existsSync(timestampDir)) {
      fs.mkdirSync(timestampDir, { recursive: true });
    }
    
    this.currentBackupDir = timestampDir;
    return timestampDir;
  }

  async createDatabaseBackup() {
    this.log('info', 'Creating database backup...');
    
    const backupPath = path.join(this.currentBackupDir, 'database.sql');
    
    try {
      const databaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_URL;
      
      if (!databaseUrl) {
        throw new Error('Database URL not found');
      }

      // Create database dump
      const command = `pg_dump "${databaseUrl}" --verbose --clean --no-acl --no-owner > "${backupPath}"`;
      execSync(command, { stdio: 'inherit' });

      // Get database statistics
      const stats = await this.getDatabaseStats();
      
      this.backupManifest.backups.database = {
        path: backupPath,
        size: fs.statSync(backupPath).size,
        created: new Date().toISOString(),
        stats
      };

      this.log('info', 'Database backup completed', {
        path: backupPath,
        size: this.backupManifest.backups.database.size
      });

      return backupPath;
    } catch (error) {
      throw new Error(`Database backup failed: ${error.message}`);
    }
  }

  async getDatabaseStats() {
    try {
      // Get table count
      const { data: tables } = await this.supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public');

      // Get approximate row counts for main tables
      const tableCounts = {};
      const mainTables = ['users', 'projects', 'content', 'serp_results', 'competitor_analysis'];
      
      for (const table of mainTables) {
        try {
          const { count } = await this.supabase
            .from(table)
            .select('*', { count: 'exact', head: true });
          tableCounts[table] = count;
        } catch (error) {
          // Table might not exist
          tableCounts[table] = 0;
        }
      }

      return {
        tableCount: tables ? tables.length : 0,
        tableCounts,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.log('warn', 'Failed to get database stats', { error: error.message });
      return {};
    }
  }

  async createConfigBackup() {
    this.log('info', 'Creating configuration backup...');
    
    const configBackupDir = path.join(this.currentBackupDir, 'config');
    fs.mkdirSync(configBackupDir, { recursive: true });

    const configFiles = [
      'package.json',
      'next.config.ts',
      'vercel.json',
      'vercel.staging.json',
      'deployment.config.js',
      'supabase/config.toml',
      'tsconfig.json',
      'jest.config.js',
      'playwright.config.ts'
    ];

    const backedUpFiles = [];
    
    for (const file of configFiles) {
      const sourcePath = path.join(__dirname, '..', file);
      
      if (fs.existsSync(sourcePath)) {
        const backupPath = path.join(configBackupDir, file.replace('/', '_'));
        fs.copyFileSync(sourcePath, backupPath);
        backedUpFiles.push({
          original: file,
          backup: backupPath,
          size: fs.statSync(backupPath).size
        });
      }
    }

    this.backupManifest.backups.config = {
      path: configBackupDir,
      files: backedUpFiles,
      created: new Date().toISOString()
    };

    this.log('info', 'Configuration backup completed', {
      filesCount: backedUpFiles.length
    });

    return configBackupDir;
  }

  async createMigrationBackup() {
    this.log('info', 'Creating migration backup...');
    
    const migrationBackupDir = path.join(this.currentBackupDir, 'migrations');
    const sourceMigrationDir = path.join(__dirname, '../supabase/migrations');
    
    if (!fs.existsSync(sourceMigrationDir)) {
      this.log('warn', 'Migration directory not found');
      return null;
    }

    fs.mkdirSync(migrationBackupDir, { recursive: true });

    const migrationFiles = fs.readdirSync(sourceMigrationDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    const backedUpMigrations = [];
    
    for (const file of migrationFiles) {
      const sourcePath = path.join(sourceMigrationDir, file);
      const backupPath = path.join(migrationBackupDir, file);
      
      fs.copyFileSync(sourcePath, backupPath);
      backedUpMigrations.push({
        file,
        path: backupPath,
        size: fs.statSync(backupPath).size
      });
    }

    // Get current migration state
    const { data: appliedMigrations } = await this.supabase
      .from('supabase_migrations')
      .select('*')
      .order('executed_at', { ascending: false });

    this.backupManifest.backups.migrations = {
      path: migrationBackupDir,
      files: backedUpMigrations,
      appliedMigrations: appliedMigrations || [],
      created: new Date().toISOString()
    };

    this.log('info', 'Migration backup completed', {
      filesCount: backedUpMigrations.length,
      appliedCount: appliedMigrations ? appliedMigrations.length : 0
    });

    return migrationBackupDir;
  }

  async createEnvironmentBackup() {
    this.log('info', 'Creating environment backup...');
    
    const envBackupDir = path.join(this.currentBackupDir, 'environment');
    fs.mkdirSync(envBackupDir, { recursive: true });

    // Backup environment files (without sensitive data)
    const envFiles = ['.env.example', '.env.local', '.env.staging', '.env.production'];
    const backedUpEnvFiles = [];
    
    for (const file of envFiles) {
      const sourcePath = path.join(__dirname, '..', file);
      
      if (fs.existsSync(sourcePath)) {
        const backupPath = path.join(envBackupDir, file);
        
        // Read and sanitize environment file
        const content = fs.readFileSync(sourcePath, 'utf8');
        const sanitizedContent = this.sanitizeEnvironmentFile(content);
        
        fs.writeFileSync(backupPath, sanitizedContent);
        backedUpEnvFiles.push({
          file,
          path: backupPath,
          size: fs.statSync(backupPath).size
        });
      }
    }

    // Backup current environment variables (sanitized)
    const envVarsPath = path.join(envBackupDir, 'environment-variables.json');
    const envVars = this.getCurrentEnvironmentVars();
    fs.writeFileSync(envVarsPath, JSON.stringify(envVars, null, 2));

    this.backupManifest.backups.environment = {
      path: envBackupDir,
      files: backedUpEnvFiles,
      variablesBackup: envVarsPath,
      created: new Date().toISOString()
    };

    this.log('info', 'Environment backup completed', {
      filesCount: backedUpEnvFiles.length
    });

    return envBackupDir;
  }

  sanitizeEnvironmentFile(content) {
    // Remove sensitive values but keep structure
    const sensitiveKeys = [
      'API_KEY',
      'SECRET',
      'PASSWORD',
      'TOKEN',
      'KEY',
      'PRIVATE'
    ];

    return content.split('\n').map(line => {
      if (line.includes('=')) {
        const [key, value] = line.split('=');
        const isSensitive = sensitiveKeys.some(sensitive => 
          key.toUpperCase().includes(sensitive)
        );
        
        if (isSensitive) {
          return `${key}=***REDACTED***`;
        }
      }
      return line;
    }).join('\n');
  }

  getCurrentEnvironmentVars() {
    const relevantVars = {};
    const envKeys = [
      'NODE_ENV',
      'NEXT_PUBLIC_ENVIRONMENT',
      'NEXT_PUBLIC_APP_URL',
      'NEXT_PUBLIC_SUPABASE_URL',
      'VERCEL_ENV',
      'VERCEL_URL'
    ];

    for (const key of envKeys) {
      if (process.env[key]) {
        relevantVars[key] = process.env[key];
      }
    }

    return relevantVars;
  }

  async createApplicationStateBackup() {
    this.log('info', 'Creating application state backup...');
    
    const stateBackupDir = path.join(this.currentBackupDir, 'state');
    fs.mkdirSync(stateBackupDir, { recursive: true });

    // Backup current application version
    const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));
    const versionInfo = {
      version: packageJson.version,
      name: packageJson.name,
      timestamp: new Date().toISOString(),
      environment: this.environment,
      node_version: process.version,
      dependencies: packageJson.dependencies
    };

    fs.writeFileSync(
      path.join(stateBackupDir, 'version-info.json'),
      JSON.stringify(versionInfo, null, 2)
    );

    // Backup deployment configuration
    const deploymentConfig = require('../deployment.config.js');
    fs.writeFileSync(
      path.join(stateBackupDir, 'deployment-config.json'),
      JSON.stringify(deploymentConfig, null, 2)
    );

    this.backupManifest.backups.state = {
      path: stateBackupDir,
      versionInfo,
      created: new Date().toISOString()
    };

    this.log('info', 'Application state backup completed');
    return stateBackupDir;
  }

  async createBackupManifest() {
    this.log('info', 'Creating backup manifest...');
    
    const manifestPath = path.join(this.currentBackupDir, 'backup-manifest.json');
    
    // Add metadata
    this.backupManifest.metadata = {
      totalSize: this.calculateTotalBackupSize(),
      backupTypes: Object.keys(this.backupManifest.backups),
      environment: this.environment,
      created: new Date().toISOString(),
      creator: 'deployment-backup-script',
      version: '1.0.0'
    };

    fs.writeFileSync(manifestPath, JSON.stringify(this.backupManifest, null, 2));
    
    this.log('info', 'Backup manifest created', {
      path: manifestPath,
      totalSize: this.backupManifest.metadata.totalSize
    });

    return manifestPath;
  }

  calculateTotalBackupSize() {
    let totalSize = 0;
    
    for (const backup of Object.values(this.backupManifest.backups)) {
      if (backup.size) {
        totalSize += backup.size;
      }
      if (backup.files) {
        totalSize += backup.files.reduce((sum, file) => sum + (file.size || 0), 0);
      }
    }
    
    return totalSize;
  }

  async cleanupOldBackups(retentionDays = 30) {
    this.log('info', 'Cleaning up old backups...');
    
    const envBackupDir = path.join(this.backupDir, this.environment);
    
    if (!fs.existsSync(envBackupDir)) {
      return;
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const backupDirs = fs.readdirSync(envBackupDir)
      .filter(dir => {
        const dirPath = path.join(envBackupDir, dir);
        return fs.statSync(dirPath).isDirectory();
      })
      .map(dir => {
        const dirPath = path.join(envBackupDir, dir);
        return {
          name: dir,
          path: dirPath,
          created: fs.statSync(dirPath).birthtime
        };
      })
      .filter(backup => backup.created < cutoffDate)
      .sort((a, b) => a.created - b.created);

    let deletedCount = 0;
    for (const backup of backupDirs) {
      try {
        fs.rmSync(backup.path, { recursive: true, force: true });
        deletedCount++;
        this.log('info', `Deleted old backup: ${backup.name}`);
      } catch (error) {
        this.log('warn', `Failed to delete backup: ${backup.name}`, { error: error.message });
      }
    }

    this.log('info', `Cleanup completed. Deleted ${deletedCount} old backups`);
  }

  async createFullBackup() {
    const startTime = Date.now();
    
    try {
      this.log('info', 'Starting comprehensive deployment backup...');
      
      // Ensure backup directory exists
      await this.ensureBackupDirectory();
      
      // Create all backups
      await this.createDatabaseBackup();
      await this.createConfigBackup();
      await this.createMigrationBackup();
      await this.createEnvironmentBackup();
      await this.createApplicationStateBackup();
      
      // Create manifest
      const manifestPath = await this.createBackupManifest();
      
      // Cleanup old backups
      await this.cleanupOldBackups();
      
      const duration = Date.now() - startTime;
      
      this.log('info', 'Comprehensive backup completed successfully', {
        duration: `${duration}ms`,
        backupDir: this.currentBackupDir,
        totalSize: this.backupManifest.metadata.totalSize,
        manifest: manifestPath
      });

      return {
        success: true,
        backupDir: this.currentBackupDir,
        manifest: this.backupManifest,
        duration
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.log('error', 'Backup failed', {
        error: error.message,
        duration: `${duration}ms`
      });

      return {
        success: false,
        error: error.message,
        duration
      };
    }
  }
}

// CLI interface
async function main() {
  const environment = process.argv[2] || 'staging';
  const backup = new DeploymentBackup(environment);
  
  try {
    const result = await backup.createFullBackup();
    
    if (result.success) {
      console.log('\n✅ Deployment backup completed successfully');
      console.log(`📁 Backup directory: ${result.backupDir}`);
      console.log(`📊 Total size: ${result.manifest.metadata.totalSize} bytes`);
      console.log(`⏱️  Duration: ${result.duration}ms`);
    } else {
      console.log('\n❌ Deployment backup failed');
      console.log(`Error: ${result.error}`);
    }
    
    process.exit(result.success ? 0 : 1);
  } catch (error) {
    console.error('Backup process failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { DeploymentBackup };