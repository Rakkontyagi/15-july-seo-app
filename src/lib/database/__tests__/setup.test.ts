/**
 * Database setup tests
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import { 
  testDatabaseConnection, 
  verifyDatabaseSetup, 
  tableExists,
  setupDatabase
} from '../setup';
import { TABLE_NAMES } from '../schema';

describe('Database Setup', () => {
  beforeAll(async () => {
    // Ensure environment variables are set for testing
    if (!process.env.SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL) {
      throw new Error('Missing SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL environment variable');
    }
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
    }
  });

  describe('Database Connection', () => {
    it('should connect to the database successfully', async () => {
      const connected = await testDatabaseConnection();
      expect(connected).toBe(true);
    });
  });

  describe('Table Existence', () => {
    it('should check if users table exists', async () => {
      const exists = await tableExists(TABLE_NAMES.USERS);
      expect(typeof exists).toBe('boolean');
    });

    it('should check if projects table exists', async () => {
      const exists = await tableExists(TABLE_NAMES.PROJECTS);
      expect(typeof exists).toBe('boolean');
    });

    it('should check if generated_content table exists', async () => {
      const exists = await tableExists(TABLE_NAMES.GENERATED_CONTENT);
      expect(typeof exists).toBe('boolean');
    });

    it('should check if serp_analysis table exists', async () => {
      const exists = await tableExists(TABLE_NAMES.SERP_ANALYSIS);
      expect(typeof exists).toBe('boolean');
    });

    it('should check if competitor_analysis table exists', async () => {
      const exists = await tableExists(TABLE_NAMES.COMPETITOR_ANALYSIS);
      expect(typeof exists).toBe('boolean');
    });

    it('should check if usage_analytics table exists', async () => {
      const exists = await tableExists(TABLE_NAMES.USAGE_ANALYTICS);
      expect(typeof exists).toBe('boolean');
    });
  });

  describe('Database Verification', () => {
    it('should verify database setup status', async () => {
      const verification = await verifyDatabaseSetup();
      
      expect(verification).toHaveProperty('isSetup');
      expect(verification).toHaveProperty('existingTables');
      expect(verification).toHaveProperty('missingTables');
      expect(Array.isArray(verification.existingTables)).toBe(true);
      expect(Array.isArray(verification.missingTables)).toBe(true);
      expect(typeof verification.isSetup).toBe('boolean');
    });

    it('should have required tables defined', () => {
      const requiredTables = Object.values(TABLE_NAMES);
      expect(requiredTables).toContain('users');
      expect(requiredTables).toContain('projects');
      expect(requiredTables).toContain('generated_content');
      expect(requiredTables).toContain('serp_analysis');
      expect(requiredTables).toContain('competitor_analysis');
      expect(requiredTables).toContain('usage_analytics');
    });
  });

  describe('Database Setup Process', () => {
    it('should run database setup without errors', async () => {
      // This test verifies the setup process runs without throwing errors
      await expect(setupDatabase()).resolves.toBeDefined();
    });
  });
});

describe('Schema Validation', () => {
  it('should have all required table names defined', () => {
    expect(TABLE_NAMES.USERS).toBe('users');
    expect(TABLE_NAMES.PROJECTS).toBe('projects');
    expect(TABLE_NAMES.GENERATED_CONTENT).toBe('generated_content');
    expect(TABLE_NAMES.SERP_ANALYSIS).toBe('serp_analysis');
    expect(TABLE_NAMES.COMPETITOR_ANALYSIS).toBe('competitor_analysis');
    expect(TABLE_NAMES.USAGE_ANALYTICS).toBe('usage_analytics');
  });
});