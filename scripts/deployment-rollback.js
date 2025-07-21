#!/usr/bin/env node
/**
 * Deployment Rollback Script
 * Handles immediate reversion of deployments with database and application rollback
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { createClient } = require('@supabase/supabase-js');
const deploymentConfig = require('../deployment.config.js');

class DeploymentRollback {
  constructor(environment = 'staging') {
    this.environment = environment;
    this.config = deploymentConfig.environments[environment];
    this.backupDir = path.join(__dirname, '../backups', environment);
    this.supabase = this.initializeSupabase();
    this.rollbackLog = [];
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
    const logEntry = {
      timestamp,
      level,
      message,
      environment: this.environment,
      ...data
    };
    
    this.rollbackLog.push(logEntry);
    
    const prefix = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : '✅';
    console.log(`[${timestamp}] ${prefix} ${message}`, 
      Object.keys(data).length > 0 ? JSON.stringify(data, null, 2) : '');
  }

  async getAvailableBackups() {
    if (!fs.existsSync(this.backupDir)) {
      return [];
    }

    const backupDirs = fs.readdirSync(this.backupDir)
      .filter(dir => {
        const dirPath = path.join(this.backupDir, dir);
        return fs.statSync(dirPath).isDirectory();
      })
      .map(dir => {
        const dirPath = path.join(this.backupDir, dir);
        const manifestPath = path.join(dirPath, 'backup-manifest.json');
        
        let manifest = null;
        if (fs.existsSync(manifestPath)) {
          try {
            manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
          } catch (error) {
            // Invalid manifest
          }
        }

        return {
          timestamp: dir,
          path: dirPath,
          manifest,
          created: fs.statSync(dirPath).birthtime
        };
      })
      .sort((a, b) => b.created - a.created);

    return backupDirs;
  }

  async getLatestBackup() {
    const backups = await this.getAvailableBackups();
    
    if (backups.length === 0) {
      throw new Error('No backups available for rollback');
    }

    return backups[0];
  }

  async getVercelDeployments() {
    try {
      const command = `vercel ls --token=${process.env.VERCEL_TOKEN}`;
      const output = execSync(command, { encoding: 'utf8' });
      
      // Parse Vercel deployments (simplified)
      const deployments = output.split('\n')
        .filter(line => line.includes('https://'))
        .map(line => {
          const parts = line.trim().split(/\s+/);
          return {
            url: parts[0],
            status: parts[1] || 'unknown',
            created: parts[2] || 'unknown'
          };
        })
        .slice(0, 10); // Get last 10 deployments

      return deployments;
    } catch (error) {
      this.log('error', 'Failed to get Vercel deployments', { error: error.message });
      return [];
    }
  }

  async rollbackDatabase(backupPath) {
    this.log('info', 'Starting database rollback...');
    
    const databaseBackupPath = path.join(backupPath, 'database.sql');
    
    if (!fs.existsSync(databaseBackupPath)) {
      throw new Error('Database backup not found');
    }

    try {
      // Create a backup of current state before rollback
      const currentBackupPath = path.join(backupPath, 'pre-rollback-database.sql');
      const databaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_URL;
      
      this.log('info', 'Creating pre-rollback backup...');
      execSync(`pg_dump "${databaseUrl}" > "${currentBackupPath}"`, { stdio: 'inherit' });
      
      // Restore from backup
      this.log('info', 'Restoring database from backup...');
      execSync(`psql "${databaseUrl}" < "${databaseBackupPath}"`, { stdio: 'inherit' });
      
      this.log('info', 'Database rollback completed successfully');
      return true;
    } catch (error) {
      throw new Error(`Database rollback failed: ${error.message}`);
    }
  }

  async rollbackApplication(targetDeployment) {
    this.log('info', 'Starting application rollback...');
    
    try {
      if (!targetDeployment) {
        // Get previous deployment
        const deployments = await this.getVercelDeployments();
        
        if (deployments.length < 2) {
          throw new Error('No previous deployment found for rollback');
        }
        
        targetDeployment = deployments[1]; // Second deployment (previous)
      }

      // Alias previous deployment to current domain
      const aliasCommand = this.environment === 'production' 
        ? `vercel alias ${targetDeployment.url} ${this.config.url} --token=${process.env.VERCEL_TOKEN}`
        : `vercel alias ${targetDeployment.url} --token=${process.env.VERCEL_TOKEN}`;
      
      this.log('info', 'Switching traffic to previous deployment...', {
        targetUrl: targetDeployment.url
      });
      
      execSync(aliasCommand, { stdio: 'inherit' });
      
      this.log('info', 'Application rollback completed successfully', {
        rolledBackTo: targetDeployment.url
      });
      
      return targetDeployment;
    } catch (error) {
      throw new Error(`Application rollback failed: ${error.message}`);
    }
  }

  async rollbackConfiguration(backupPath) {
    this.log('info', 'Starting configuration rollback...');
    
    const configBackupPath = path.join(backupPath, 'config');
    
    if (!fs.existsSync(configBackupPath)) {
      this.log('warn', 'Configuration backup not found, skipping configuration rollback');
      return;
    }

    try {
      const backupFiles = fs.readdirSync(configBackupPath);
      
      for (const file of backupFiles) {
        const backupFilePath = path.join(configBackupPath, file);
        const originalPath = path.join(__dirname, '..', file.replace('_', '/'));
        
        if (fs.existsSync(originalPath)) {
          // Create backup of current config
          const currentBackupPath = `${originalPath}.rollback-backup`;
          fs.copyFileSync(originalPath, currentBackupPath);
          
          // Restore from backup
          fs.copyFileSync(backupFilePath, originalPath);
          
          this.log('info', `Restored configuration: ${file}`);
        }
      }
      
      this.log('info', 'Configuration rollback completed');
    } catch (error) {
      throw new Error(`Configuration rollback failed: ${error.message}`);
    }
  }

  async validateRollback() {
    this.log('info', 'Validating rollback...');
    
    const validationChecks = {
      applicationHealth: false,
      databaseHealth: false,
      basicFunctionality: false
    };

    try {
      // Check application health
      const healthUrl = `${this.config.url}/api/health`;
      const healthResponse = await fetch(healthUrl, { timeout: 10000 });
      validationChecks.applicationHealth = healthResponse.ok;
      
      // Check database health
      const { data, error } = await this.supabase
        .from('information_schema.tables')
        .select('table_name')
        .limit(1);
      
      validationChecks.databaseHealth = !error;
      
      // Check basic functionality
      const { data: healthData } = await this.supabase
        .from('supabase_migrations')
        .select('version')
        .limit(1);
      
      validationChecks.basicFunctionality = !!healthData;
      
      const allChecksPass = Object.values(validationChecks).every(check => check);
      
      this.log('info', 'Rollback validation results', {
        validationChecks,
        allChecksPass
      });
      
      return allChecksPass;
    } catch (error) {
      this.log('error', 'Rollback validation failed', { error: error.message });
      return false;
    }
  }

  async createRollbackReport() {
    const report = {
      environment: this.environment,
      timestamp: new Date().toISOString(),
      rollbackType: 'full',
      rollbackLog: this.rollbackLog,
      success: true,
      duration: null,
      rollbackTarget: null
    };

    const reportPath = path.join(__dirname, '../rollback-reports', `rollback-${this.environment}-${Date.now()}.json`);
    
    // Ensure report directory exists
    const reportDir = path.dirname(reportPath);
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    return report;
  }

  async sendRollbackNotification(success, error = null) {
    const notification = {
      environment: this.environment,
      status: success ? 'success' : 'failed',
      timestamp: new Date().toISOString(),
      error: error?.message,
      rollbackLog: this.rollbackLog
    };

    this.log('info', 'Sending rollback notification', notification);

    // In a real implementation, send to Slack/email
    console.log('📧 Rollback Notification:', JSON.stringify(notification, null, 2));
  }

  async performFullRollback(targetBackup = null, targetDeployment = null) {
    const startTime = Date.now();
    let rolledBackDeployment = null;
    
    try {
      this.log('info', 'Starting full deployment rollback...');
      
      // Get backup to rollback to
      const backup = targetBackup || await this.getLatestBackup();
      
      this.log('info', 'Using backup for rollback', {
        backupTimestamp: backup.timestamp,
        backupPath: backup.path
      });
      
      // Step 1: Rollback database
      await this.rollbackDatabase(backup.path);
      
      // Step 2: Rollback application
      rolledBackDeployment = await this.rollbackApplication(targetDeployment);
      
      // Step 3: Rollback configuration (optional)
      await this.rollbackConfiguration(backup.path);
      
      // Step 4: Validate rollback
      const validationPassed = await this.validateRollback();
      
      if (!validationPassed) {
        throw new Error('Rollback validation failed');
      }
      
      const duration = Date.now() - startTime;
      
      this.log('info', 'Full deployment rollback completed successfully', {
        duration: `${duration}ms`,
        rolledBackTo: rolledBackDeployment?.url || 'unknown'
      });
      
      await this.sendRollbackNotification(true);
      
      return {
        success: true,
        duration,
        rolledBackDeployment,
        backup: backup.timestamp
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.log('error', 'Full deployment rollback failed', {
        error: error.message,
        duration: `${duration}ms`
      });
      
      await this.sendRollbackNotification(false, error);
      
      return {
        success: false,
        error: error.message,
        duration
      };
    }
  }

  async performDatabaseOnlyRollback(targetBackup = null) {
    const startTime = Date.now();
    
    try {
      this.log('info', 'Starting database-only rollback...');
      
      const backup = targetBackup || await this.getLatestBackup();
      
      await this.rollbackDatabase(backup.path);
      
      const validationPassed = await this.validateRollback();
      
      if (!validationPassed) {
        throw new Error('Database rollback validation failed');
      }
      
      const duration = Date.now() - startTime;
      
      this.log('info', 'Database rollback completed successfully', {
        duration: `${duration}ms`
      });
      
      return {
        success: true,
        duration,
        backup: backup.timestamp
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.log('error', 'Database rollback failed', {
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

  async performApplicationOnlyRollback(targetDeployment = null) {
    const startTime = Date.now();
    
    try {
      this.log('info', 'Starting application-only rollback...');
      
      const rolledBackDeployment = await this.rollbackApplication(targetDeployment);
      
      const duration = Date.now() - startTime;
      
      this.log('info', 'Application rollback completed successfully', {
        duration: `${duration}ms`,
        rolledBackTo: rolledBackDeployment?.url || 'unknown'
      });
      
      return {
        success: true,
        duration,
        rolledBackDeployment
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.log('error', 'Application rollback failed', {
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

  async listAvailableRollbackTargets() {
    const backups = await this.getAvailableBackups();
    const deployments = await this.getVercelDeployments();
    
    return {
      backups: backups.map(backup => ({
        timestamp: backup.timestamp,
        created: backup.created,
        hasDatabase: fs.existsSync(path.join(backup.path, 'database.sql')),
        hasConfig: fs.existsSync(path.join(backup.path, 'config')),
        size: backup.manifest?.metadata?.totalSize || 'unknown'
      })),
      deployments: deployments.map(deployment => ({
        url: deployment.url,
        status: deployment.status,
        created: deployment.created
      }))
    };
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const environment = args.find(arg => arg.startsWith('--env='))?.split('=')[1] || 'staging';
  const rollbackType = args.find(arg => arg.startsWith('--type='))?.split('=')[1] || 'full';
  const listTargets = args.includes('--list');
  
  const rollback = new DeploymentRollback(environment);
  
  try {
    if (listTargets) {
      const targets = await rollback.listAvailableRollbackTargets();
      console.log('\n📋 Available Rollback Targets:');
      console.log(JSON.stringify(targets, null, 2));
      return;
    }
    
    let result;
    
    switch (rollbackType) {
      case 'database':
        result = await rollback.performDatabaseOnlyRollback();
        break;
      case 'application':
        result = await rollback.performApplicationOnlyRollback();
        break;
      case 'full':
      default:
        result = await rollback.performFullRollback();
        break;
    }
    
    if (result.success) {
      console.log('\n✅ Rollback completed successfully');
      console.log(`Duration: ${result.duration}ms`);
    } else {
      console.log('\n❌ Rollback failed');
      console.log(`Error: ${result.error}`);
    }
    
    process.exit(result.success ? 0 : 1);
  } catch (error) {
    console.error('Rollback process failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { DeploymentRollback };