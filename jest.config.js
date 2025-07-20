// Jest Configuration - Enhanced per Quinn's recommendations
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],

  // Test matching patterns
  testMatch: [
    '**/__tests__/**/*.test.{ts,tsx}',
    '**/?(*.)+(spec|test).{ts,tsx}',
  ],

  // Ignore integration tests in unit test runs
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/src/**/*.integration.test.{ts,tsx}',
  ],

  // Transform configuration
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        jsx: 'react-jsx',
      },
    }],
  },

  // Module name mapping
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/src/__mocks__/fileMock.js',
  },

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  // Coverage configuration - Quinn's strict standards
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{ts,tsx}',
    '!src/**/*.config.{ts,tsx}',
    '!src/app/globals.css',
    '!src/app/layout.tsx',
    '!src/middleware.ts',
    '!src/mocks/**/*',
    '!src/__tests__/**/*',
    '!src/test/**/*',
    '!**/node_modules/**',
    '!**/.next/**',
  ],

  // Coverage thresholds - Quinn's 90% requirement
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    // Specific thresholds for critical modules
    'src/lib/content-generation/**/*.{ts,tsx}': {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95,
    },
    'src/lib/seo-analysis/**/*.{ts,tsx}': {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95,
    },
  },

  // Coverage reporting
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
  coverageDirectory: 'coverage',

  // Test timeout and performance
  testTimeout: 30000,
  maxWorkers: '50%',

  // Verbose output for debugging
  verbose: true,

  // Mock configuration
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,

  // Global test configuration
  globals: {
    'ts-jest': {
      isolatedModules: true,
    },
  },

  // Test environment options
  testEnvironmentOptions: {
    url: 'http://localhost:3000',
  },
};