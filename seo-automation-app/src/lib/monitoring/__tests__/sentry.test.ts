/**
 * @jest-environment jsdom
 */

import { jest } from '@jest/globals';
import { SentryManager, sentryManager } from '../sentry';

// Mock @sentry/nextjs
jest.mock('@sentry/nextjs', () => ({
  init: jest.fn(),
  setContext: jest.fn(),
  setTag: jest.fn(),
  setTags: jest.fn(),
  setUser: jest.fn(),
  addBreadcrumb: jest.fn(),
  captureException: jest.fn(() => 'test-event-id'),
  captureMessage: jest.fn(() => 'test-message-id'),
  withScope: jest.fn((callback) => callback({
    setLevel: jest.fn(),
    setContext: jest.fn(),
  })),
  startTransaction: jest.fn(() => ({
    setStatus: jest.fn(),
    finish: jest.fn(),
  })),
  lastEventId: jest.fn(() => 'test-last-event-id'),
  flush: jest.fn(() => Promise.resolve(true)),
  BrowserTracing: jest.fn(),
  Integrations: {
    Http: jest.fn(),
    OnUncaughtException: jest.fn(),
    OnUnhandledRejection: jest.fn(),
    Breadcrumbs: jest.fn(),
  },
  Replay: jest.fn(),
  nextRouterInstrumentation: jest.fn(),
}));

// Mock logger
jest.mock('@/lib/logging/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('SentryManager', () => {
  let sentryMock: any;
  let loggerMock: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Get mocked modules
    sentryMock = require('@sentry/nextjs');
    loggerMock = require('@/lib/logging/logger').logger;
    
    // Reset environment variables
    process.env.NEXT_PUBLIC_SENTRY_DSN = 'https://test-dsn@sentry.io/123456';
    process.env.NODE_ENV = 'test';
    process.env.NEXT_PUBLIC_APP_VERSION = '1.0.0';
    
    // Reset singleton instance
    (SentryManager as any).instance = undefined;
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = SentryManager.getInstance();
      const instance2 = SentryManager.getInstance();
      
      expect(instance1).toBe(instance2);
      expect(instance1).toBeInstanceOf(SentryManager);
    });
  });

  describe('initialize', () => {
    it('should initialize Sentry with correct configuration', () => {
      const manager = SentryManager.getInstance();
      
      manager.initialize();
      
      expect(sentryMock.init).toHaveBeenCalledWith(
        expect.objectContaining({
          dsn: 'https://test-dsn@sentry.io/123456',
          environment: 'test',
          tracesSampleRate: 1.0,
          enableTracing: true,
          attachStacktrace: true,
          sendDefaultPii: false,
          maxBreadcrumbs: 50,
        })
      );
      
      expect(loggerMock.info).toHaveBeenCalledWith(
        'Sentry initialized successfully',
        expect.objectContaining({
          environment: 'test',
          tracesSampleRate: 1.0,
        })
      );
    });

    it('should not initialize twice', () => {
      const manager = SentryManager.getInstance();
      
      manager.initialize();
      manager.initialize();
      
      expect(sentryMock.init).toHaveBeenCalledTimes(1);
      expect(loggerMock.warn).toHaveBeenCalledWith('Sentry already initialized');
    });

    it('should skip initialization without DSN', () => {
      process.env.NEXT_PUBLIC_SENTRY_DSN = '';
      
      const manager = SentryManager.getInstance();
      manager.initialize();
      
      expect(sentryMock.init).not.toHaveBeenCalled();
      expect(loggerMock.warn).toHaveBeenCalledWith('Sentry DSN not provided, skipping initialization');
    });

    it('should handle initialization errors', () => {
      const error = new Error('Initialization failed');
      sentryMock.init.mockImplementation(() => {
        throw error;
      });
      
      const manager = SentryManager.getInstance();
      manager.initialize();
      
      expect(loggerMock.error).toHaveBeenCalledWith('Failed to initialize Sentry', { error });
    });
  });

  describe('captureError', () => {
    it('should capture error with context', () => {
      const manager = SentryManager.getInstance();
      manager.initialize();
      
      const error = new Error('Test error');
      const context = { component: 'test', userId: '123' };
      
      const eventId = manager.captureError(error, context, 'warning');
      
      expect(eventId).toBe('test-event-id');
      expect(sentryMock.withScope).toHaveBeenCalled();
      expect(sentryMock.captureException).toHaveBeenCalledWith(error);
    });

    it('should return empty string when not initialized', () => {
      const manager = SentryManager.getInstance();
      
      const error = new Error('Test error');
      const eventId = manager.captureError(error);
      
      expect(eventId).toBe('');
      expect(loggerMock.warn).toHaveBeenCalledWith('Sentry not initialized, cannot capture error');
    });
  });

  describe('captureMessage', () => {
    it('should capture message with context', () => {
      const manager = SentryManager.getInstance();
      manager.initialize();
      
      const message = 'Test message';
      const context = { component: 'test' };
      
      const eventId = manager.captureMessage(message, 'info', context);
      
      expect(eventId).toBe('test-message-id');
      expect(sentryMock.withScope).toHaveBeenCalled();
      expect(sentryMock.captureMessage).toHaveBeenCalledWith(message);
    });

    it('should return empty string when not initialized', () => {
      const manager = SentryManager.getInstance();
      
      const eventId = manager.captureMessage('Test message');
      
      expect(eventId).toBe('');
      expect(loggerMock.warn).toHaveBeenCalledWith('Sentry not initialized, cannot capture message');
    });
  });

  describe('setUser', () => {
    it('should set user context', () => {
      const manager = SentryManager.getInstance();
      manager.initialize();
      
      const user = { id: '123', email: 'test@example.com' };
      manager.setUser(user);
      
      expect(sentryMock.setUser).toHaveBeenCalledWith(user);
      expect(loggerMock.debug).toHaveBeenCalledWith('Sentry user context set', { userId: '123' });
    });

    it('should not set user when not initialized', () => {
      const manager = SentryManager.getInstance();
      
      const user = { id: '123', email: 'test@example.com' };
      manager.setUser(user);
      
      expect(sentryMock.setUser).not.toHaveBeenCalled();
    });
  });

  describe('addBreadcrumb', () => {
    it('should add breadcrumb with correct format', () => {
      const manager = SentryManager.getInstance();
      manager.initialize();
      
      const message = 'Test breadcrumb';
      const category = 'test';
      const level = 'info';
      const data = { test: 'value' };
      
      manager.addBreadcrumb(message, category, level, data);
      
      expect(sentryMock.addBreadcrumb).toHaveBeenCalledWith({
        message,
        category,
        level,
        data,
        timestamp: expect.any(Number),
      });
    });

    it('should not add breadcrumb when not initialized', () => {
      const manager = SentryManager.getInstance();
      
      manager.addBreadcrumb('Test breadcrumb');
      
      expect(sentryMock.addBreadcrumb).not.toHaveBeenCalled();
    });
  });

  describe('startTransaction', () => {
    it('should start transaction with correct parameters', () => {
      const manager = SentryManager.getInstance();
      manager.initialize();
      
      const transaction = manager.startTransaction('test-transaction', 'test-op');
      
      expect(sentryMock.startTransaction).toHaveBeenCalledWith({
        name: 'test-transaction',
        op: 'test-op',
      });
      expect(transaction).toBeDefined();
    });

    it('should return undefined when performance monitoring disabled', () => {
      const manager = SentryManager.getInstance();
      manager.initialize({ enablePerformanceMonitoring: false });
      
      const transaction = manager.startTransaction('test-transaction');
      
      expect(transaction).toBeUndefined();
      expect(sentryMock.startTransaction).not.toHaveBeenCalled();
    });
  });

  describe('getStatus', () => {
    it('should return correct status', () => {
      const manager = SentryManager.getInstance();
      manager.initialize();
      
      const status = manager.getStatus();
      
      expect(status).toEqual({
        initialized: true,
        config: expect.objectContaining({
          dsn: 'https://test-dsn@sentry.io/123456',
          environment: 'test',
        }),
        lastEventId: 'test-last-event-id',
      });
    });
  });

  describe('flush', () => {
    it('should flush events successfully', async () => {
      const manager = SentryManager.getInstance();
      manager.initialize();
      
      const result = await manager.flush(2000);
      
      expect(result).toBe(true);
      expect(sentryMock.flush).toHaveBeenCalledWith(2000);
    });

    it('should return false when not initialized', async () => {
      const manager = SentryManager.getInstance();
      
      const result = await manager.flush();
      
      expect(result).toBe(false);
      expect(sentryMock.flush).not.toHaveBeenCalled();
    });

    it('should handle flush errors', async () => {
      const manager = SentryManager.getInstance();
      manager.initialize();
      
      const error = new Error('Flush failed');
      sentryMock.flush.mockRejectedValue(error);
      
      const result = await manager.flush();
      
      expect(result).toBe(false);
      expect(loggerMock.error).toHaveBeenCalledWith('Failed to flush Sentry events', { error });
    });
  });

  describe('beforeSendFilter', () => {
    it('should filter out HMR errors in development', () => {
      process.env.NODE_ENV = 'development';
      
      const manager = SentryManager.getInstance();
      manager.initialize();
      
      // Access the private method for testing
      const beforeSendFilter = (manager as any).beforeSendFilter.bind(manager);
      
      const event = {
        exception: {
          values: [{ value: 'HMR update failed' }],
        },
      };
      
      const result = beforeSendFilter(event);
      
      expect(result).toBeNull();
    });

    it('should modify level for known non-critical errors', () => {
      const manager = SentryManager.getInstance();
      manager.initialize();
      
      const beforeSendFilter = (manager as any).beforeSendFilter.bind(manager);
      
      const event = {
        exception: {
          values: [{ value: 'ResizeObserver loop limit exceeded' }],
        },
      };
      
      const result = beforeSendFilter(event);
      
      expect(result.level).toBe('warning');
    });
  });
});

describe('convenience functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_SENTRY_DSN = 'https://test-dsn@sentry.io/123456';
    (SentryManager as any).instance = undefined;
  });

  it('should provide initializeSentry function', () => {
    const { initializeSentry } = require('../sentry');
    
    initializeSentry({ tracesSampleRate: 0.5 });
    
    expect(sentryManager.getStatus().initialized).toBe(true);
  });

  it('should provide captureError function', () => {
    const { captureError } = require('../sentry');
    
    sentryManager.initialize();
    const error = new Error('Test error');
    const eventId = captureError(error, { test: 'context' });
    
    expect(eventId).toBe('test-event-id');
  });

  it('should provide captureMessage function', () => {
    const { captureMessage } = require('../sentry');
    
    sentryManager.initialize();
    const eventId = captureMessage('Test message', 'info', { test: 'context' });
    
    expect(eventId).toBe('test-message-id');
  });

  it('should provide setSentryUser function', () => {
    const { setSentryUser } = require('../sentry');
    
    sentryManager.initialize();
    const user = { id: '123', email: 'test@example.com' };
    setSentryUser(user);
    
    expect(require('@sentry/nextjs').setUser).toHaveBeenCalledWith(user);
  });

  it('should provide addSentryBreadcrumb function', () => {
    const { addSentryBreadcrumb } = require('../sentry');
    
    sentryManager.initialize();
    addSentryBreadcrumb('Test breadcrumb', 'test', 'info', { test: 'data' });
    
    expect(require('@sentry/nextjs').addBreadcrumb).toHaveBeenCalledWith({
      message: 'Test breadcrumb',
      category: 'test',
      level: 'info',
      data: { test: 'data' },
      timestamp: expect.any(Number),
    });
  });
});