import '@testing-library/jest-dom';
import React from 'react';

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock scrollTo
Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: jest.fn(),
});

// Mock performance.now for consistent timing in tests
Object.defineProperty(window, 'performance', {
  writable: true,
  value: {
    now: jest.fn(() => Date.now()),
  },
});

// Mock crypto for generateA11yId
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: (arr: any) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    },
  },
});

// Mock DOMPurify
jest.mock('dompurify', () => ({
  __esModule: true,
  default: {
    sanitize: jest.fn((content) => content),
    addHook: jest.fn(),
  },
}));

// Mock content sanitizer
jest.mock('@/lib/security/content-sanitizer', () => ({
  contentSanitizer: {
    getSanitizationReport: jest.fn((content) => ({
      original: content,
      sanitized: content,
      isModified: false,
      removedElements: []
    })),
    sanitize: jest.fn((content) => content),
    sanitizeRichText: jest.fn((content) => content),
    sanitizeStandard: jest.fn((content) => content),
    sanitizeStrict: jest.fn((content) => content),
  },
  SANITIZATION_CONFIGS: {
    RICH: {},
    STANDARD: {},
    STRICT: {}
  }
}));

// Mock accessibility utils
jest.mock('@/lib/accessibility/a11y-utils', () => ({
  generateA11yId: jest.fn((prefix) => `${prefix}-mock-id`),
  ScreenReader: {
    announceChange: jest.fn(),
  },
  AriaAttributes: {
    expandable: jest.fn(() => ({})),
    validation: jest.fn(() => ({})),
    progress: jest.fn(() => ({})),
  },
  KeyboardNavigation: {
    trapFocus: jest.fn(() => jest.fn()),
    handleEscape: jest.fn(() => jest.fn()),
    handleArrowNavigation: jest.fn(() => jest.fn()),
  },
}));

// Mock Supabase
jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
      onAuthStateChange: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
      insert: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    })),
    channel: jest.fn(() => ({
      on: jest.fn(),
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
      send: jest.fn(),
    })),
  },
}));

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    route: '/',
    pathname: '/',
    query: {},
    asPath: '/',
    push: jest.fn(),
    replace: jest.fn(),
    reload: jest.fn(),
    back: jest.fn(),
    prefetch: jest.fn(),
    beforePopState: jest.fn(),
    events: {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
    },
  }),
}));

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock document.execCommand for contentEditable tests
Object.defineProperty(document, 'execCommand', {
  value: jest.fn(() => true),
  writable: true,
});

// Global test utilities
global.testUtils = {
  // Helper to create mock user
  createMockUser: (overrides = {}) => ({
    id: 'test-user-123',
    email: 'test@example.com',
    user_metadata: {
      name: 'Test User',
      avatar_url: null,
    },
    ...overrides,
  }),

  // Helper to create mock content
  createMockContent: (overrides = {}) => ({
    id: 'test-content-123',
    title: 'Test Content',
    content: 'This is test content for SEO analysis.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user_id: 'test-user-123',
    ...overrides,
  }),

  // Helper to create mock suggestions
  createMockSuggestions: () => [
    {
      id: 'suggestion-1',
      type: 'keyword' as const,
      severity: 'medium' as const,
      title: 'Low keyword density',
      description: 'Current density: 0.5%. Recommended: 1-3%',
      suggestion: 'Add the target keyword 2-3 more times naturally.',
      autoFix: false,
      confidence: 85,
    },
    {
      id: 'suggestion-2',
      type: 'readability' as const,
      severity: 'low' as const,
      title: 'Long sentences detected',
      description: 'Average sentence length: 25 words',
      suggestion: 'Break down long sentences for better readability.',
      autoFix: false,
      confidence: 75,
    },
  ],

  // Helper to wait for async operations
  waitForAsync: (ms = 0) => new Promise(resolve => setTimeout(resolve, ms)),

  // Helper to trigger keyboard events
  triggerKeyboardEvent: (element: Element, key: string, options = {}) => {
    const event = new KeyboardEvent('keydown', {
      key,
      bubbles: true,
      cancelable: true,
      ...options,
    });
    element.dispatchEvent(event);
  },
};

// Console error suppression for expected errors in tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render is no longer supported') ||
        args[0].includes('Warning: An invalid form control'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
  
  // Clean up any DOM modifications
  document.body.innerHTML = '';
  
  // Reset any global state
  if (global.testUtils) {
    // Reset any test utilities state if needed
  }
});

// Add custom matchers
expect.extend({
  toHaveAccessibleName(received, expected) {
    const accessibleName = received.getAttribute('aria-label') || 
                          received.getAttribute('aria-labelledby') ||
                          received.textContent;
    
    const pass = accessibleName === expected;
    
    return {
      message: () =>
        `expected element to have accessible name "${expected}" but got "${accessibleName}"`,
      pass,
    };
  },
  
  toBeAccessible(received) {
    const hasAccessibleName = received.getAttribute('aria-label') ||
                             received.getAttribute('aria-labelledby') ||
                             received.textContent;
    
    const hasRole = received.getAttribute('role') || received.tagName.toLowerCase();
    
    const pass = !!(hasAccessibleName && hasRole);
    
    return {
      message: () =>
        `expected element to be accessible (have aria-label/aria-labelledby and role)`,
      pass,
    };
  },
});

// Type declarations for custom matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveAccessibleName(expected: string): R;
      toBeAccessible(): R;
    }
  }
  
  var testUtils: {
    createMockUser: (overrides?: any) => any;
    createMockContent: (overrides?: any) => any;
    createMockSuggestions: () => any[];
    waitForAsync: (ms?: number) => Promise<void>;
    triggerKeyboardEvent: (element: Element, key: string, options?: any) => void;
  };
}
