/**
 * Custom Jest Matchers for SEO Automation App
 * Provides domain-specific testing utilities and assertions
 */

import { expect } from '@jest/globals';

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidEmail(): R;
      toBeValidUrl(): R;
      toBeValidUuid(): R;
      toHaveValidSeoMetadata(): R;
      toBeAccessible(): R;
      toHaveValidFormData(): R;
      toBeWithinPerformanceBudget(): R;
      toHaveValidApiResponse(): R;
      toBeValidMarkdown(): R;
      toHaveValidContentStructure(): R;
    }
  }
}

// Email validation matcher
expect.extend({
  toBeValidEmail(received: string) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const pass = emailRegex.test(received);
    
    return {
      message: () =>
        pass
          ? `Expected ${received} not to be a valid email`
          : `Expected ${received} to be a valid email`,
      pass,
    };
  },
});

// URL validation matcher
expect.extend({
  toBeValidUrl(received: string) {
    try {
      new URL(received);
      return {
        message: () => `Expected ${received} not to be a valid URL`,
        pass: true,
      };
    } catch {
      return {
        message: () => `Expected ${received} to be a valid URL`,
        pass: false,
      };
    }
  },
});

// UUID validation matcher
expect.extend({
  toBeValidUuid(received: string) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const pass = uuidRegex.test(received);
    
    return {
      message: () =>
        pass
          ? `Expected ${received} not to be a valid UUID`
          : `Expected ${received} to be a valid UUID`,
      pass,
    };
  },
});

// SEO metadata validation matcher
expect.extend({
  toHaveValidSeoMetadata(received: any) {
    const requiredFields = ['title', 'description'];
    const optionalFields = ['keywords', 'author', 'canonical', 'ogTitle', 'ogDescription', 'ogImage'];
    
    const missingFields = requiredFields.filter(field => !received[field]);
    const hasValidTitle = received.title && received.title.length >= 10 && received.title.length <= 60;
    const hasValidDescription = received.description && received.description.length >= 120 && received.description.length <= 160;
    
    const pass = missingFields.length === 0 && hasValidTitle && hasValidDescription;
    
    let message = '';
    if (missingFields.length > 0) {
      message += `Missing required SEO fields: ${missingFields.join(', ')}. `;
    }
    if (!hasValidTitle) {
      message += `Title should be 10-60 characters (current: ${received.title?.length || 0}). `;
    }
    if (!hasValidDescription) {
      message += `Description should be 120-160 characters (current: ${received.description?.length || 0}). `;
    }
    
    return {
      message: () => pass ? 'SEO metadata is valid' : message.trim(),
      pass,
    };
  },
});

// Accessibility validation matcher
expect.extend({
  toBeAccessible(received: HTMLElement) {
    const issues: string[] = [];
    
    // Check for alt text on images
    const images = received.querySelectorAll('img');
    images.forEach((img, index) => {
      if (!img.alt && !img.getAttribute('aria-label')) {
        issues.push(`Image ${index + 1} missing alt text`);
      }
    });
    
    // Check for form labels
    const inputs = received.querySelectorAll('input, select, textarea');
    inputs.forEach((input, index) => {
      const hasLabel = 
        input.getAttribute('aria-label') ||
        input.getAttribute('aria-labelledby') ||
        received.querySelector(`label[for="${input.id}"]`);
      
      if (!hasLabel) {
        issues.push(`Form input ${index + 1} missing label`);
      }
    });
    
    // Check for heading hierarchy
    const headings = received.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let previousLevel = 0;
    headings.forEach((heading, index) => {
      const level = parseInt(heading.tagName.charAt(1));
      if (index === 0 && level !== 1) {
        issues.push('First heading should be h1');
      }
      if (level > previousLevel + 1) {
        issues.push(`Heading level skipped: h${previousLevel} to h${level}`);
      }
      previousLevel = level;
    });
    
    // Check for interactive elements without proper roles
    const interactiveElements = received.querySelectorAll('[onclick], [onkeydown]');
    interactiveElements.forEach((element, index) => {
      if (!element.getAttribute('role') && !['button', 'a', 'input'].includes(element.tagName.toLowerCase())) {
        issues.push(`Interactive element ${index + 1} missing role attribute`);
      }
    });
    
    const pass = issues.length === 0;
    
    return {
      message: () =>
        pass
          ? 'Element is accessible'
          : `Accessibility issues found: ${issues.join(', ')}`,
      pass,
    };
  },
});

// Form data validation matcher
expect.extend({
  toHaveValidFormData(received: FormData) {
    const entries = Array.from(received.entries());
    const hasEntries = entries.length > 0;
    const hasValidEntries = entries.every(([key, value]) => 
      key && key.trim() !== '' && value !== null && value !== undefined
    );
    
    const pass = hasEntries && hasValidEntries;
    
    return {
      message: () =>
        pass
          ? 'FormData is valid'
          : hasEntries
          ? 'FormData contains invalid entries'
          : 'FormData is empty',
      pass,
    };
  },
});

// Performance budget validation matcher
expect.extend({
  toBeWithinPerformanceBudget(received: { loadTime: number; bundleSize: number; }) {
    const { loadTime, bundleSize } = received;
    const maxLoadTime = 3000; // 3 seconds
    const maxBundleSize = 500 * 1024; // 500KB
    
    const loadTimePass = loadTime <= maxLoadTime;
    const bundleSizePass = bundleSize <= maxBundleSize;
    const pass = loadTimePass && bundleSizePass;
    
    let message = '';
    if (!loadTimePass) {
      message += `Load time ${loadTime}ms exceeds budget of ${maxLoadTime}ms. `;
    }
    if (!bundleSizePass) {
      message += `Bundle size ${bundleSize} bytes exceeds budget of ${maxBundleSize} bytes. `;
    }
    
    return {
      message: () =>
        pass
          ? 'Performance is within budget'
          : message.trim(),
      pass,
    };
  },
});

// API response validation matcher
expect.extend({
  toHaveValidApiResponse(received: any) {
    const hasStatus = typeof received.status === 'number';
    const hasData = received.data !== undefined;
    const hasValidStatus = received.status >= 200 && received.status < 300;
    
    const pass = hasStatus && hasData && hasValidStatus;
    
    let message = '';
    if (!hasStatus) {
      message += 'Missing status field. ';
    }
    if (!hasData) {
      message += 'Missing data field. ';
    }
    if (!hasValidStatus) {
      message += `Invalid status code: ${received.status}. `;
    }
    
    return {
      message: () =>
        pass
          ? 'API response is valid'
          : message.trim(),
      pass,
    };
  },
});

// Markdown validation matcher
expect.extend({
  toBeValidMarkdown(received: string) {
    const hasHeadings = /^#{1,6}\s+.+$/m.test(received);
    const hasContent = received.trim().length > 0;
    const hasValidLinks = !/\[([^\]]*)\]\(\s*\)/.test(received); // No empty links
    const hasValidImages = !/!\[([^\]]*)\]\(\s*\)/.test(received); // No empty image sources
    
    const pass = hasHeadings && hasContent && hasValidLinks && hasValidImages;
    
    let message = '';
    if (!hasHeadings) {
      message += 'Markdown should contain headings. ';
    }
    if (!hasContent) {
      message += 'Markdown content is empty. ';
    }
    if (!hasValidLinks) {
      message += 'Markdown contains empty links. ';
    }
    if (!hasValidImages) {
      message += 'Markdown contains empty image sources. ';
    }
    
    return {
      message: () =>
        pass
          ? 'Markdown is valid'
          : message.trim(),
      pass,
    };
  },
});

// Content structure validation matcher
expect.extend({
  toHaveValidContentStructure(received: any) {
    const requiredFields = ['title', 'content', 'created_at'];
    const missingFields = requiredFields.filter(field => !received[field]);
    
    const hasValidTitle = received.title && received.title.length >= 5;
    const hasValidContent = received.content && received.content.length >= 100;
    const hasValidDate = received.created_at && !isNaN(Date.parse(received.created_at));
    
    const pass = missingFields.length === 0 && hasValidTitle && hasValidContent && hasValidDate;
    
    let message = '';
    if (missingFields.length > 0) {
      message += `Missing required fields: ${missingFields.join(', ')}. `;
    }
    if (!hasValidTitle) {
      message += 'Title should be at least 5 characters. ';
    }
    if (!hasValidContent) {
      message += 'Content should be at least 100 characters. ';
    }
    if (!hasValidDate) {
      message += 'Invalid created_at date. ';
    }
    
    return {
      message: () =>
        pass
          ? 'Content structure is valid'
          : message.trim(),
      pass,
    };
  },
});

export {};
