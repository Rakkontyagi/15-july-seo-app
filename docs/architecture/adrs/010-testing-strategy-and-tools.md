# ADR-010: Testing Strategy and Tools

## Status
Accepted

## Context
The SEO automation application requires comprehensive testing to ensure enterprise-grade quality:
- Unit testing for business logic and utilities
- Integration testing for API endpoints and services
- End-to-end testing for critical user workflows
- Performance testing for scalability validation
- Security testing for vulnerability assessment

We need a systematic testing approach that provides confidence in deployments while maintaining development velocity.

## Decision
We will implement a **comprehensive testing pyramid** with automated testing at all levels and clear quality gates.

### Testing Pyramid Structure
```
    /\
   /  \    E2E Tests (10%)
  /____\   - Critical user workflows
 /      \  - Cross-browser testing
/________\ Integration Tests (20%)
          - API endpoint testing
          - Service integration
          - Database operations
          
          Unit Tests (70%)
          - Business logic
          - Utilities and helpers
          - Component logic
```

### Testing Tools Stack
- **Unit Testing**: Jest + Testing Library
- **Integration Testing**: Jest + MSW (Mock Service Worker)
- **E2E Testing**: Playwright
- **Performance Testing**: Lighthouse + K6
- **Security Testing**: OWASP ZAP + Snyk

## Implementation Details

### Unit Testing Strategy
```typescript
// Jest Configuration (jest.config.js)
const config = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/__tests__/**',
    '!src/**/__mocks__/**',
  ],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{js,jsx,ts,tsx}',
  ],
};

// Unit Test Example - Business Logic
describe('ContentGenerationService', () => {
  let service: ContentGenerationService;
  let mockSerpService: jest.Mocked<SerpService>;
  let mockOpenAIService: jest.Mocked<OpenAIService>;
  
  beforeEach(() => {
    mockSerpService = createMockSerpService();
    mockOpenAIService = createMockOpenAIService();
    service = new ContentGenerationService(mockSerpService, mockOpenAIService);
  });
  
  describe('generateContent', () => {
    it('should generate content successfully with valid input', async () => {
      // Arrange
      const request: ContentGenerationRequest = {
        keyword: 'test keyword',
        location: 'United States',
        contentType: 'blog-post',
      };
      
      const mockSerpData = createMockSerpData();
      const mockContent = createMockGeneratedContent();
      
      mockSerpService.analyze.mockResolvedValue(mockSerpData);
      mockOpenAIService.generateContent.mockResolvedValue(mockContent);
      
      // Act
      const result = await service.generateContent(request);
      
      // Assert
      expect(result).toBeDefined();
      expect(result.content).toBe(mockContent.content);
      expect(result.quality).toBeGreaterThan(0.7);
      expect(mockSerpService.analyze).toHaveBeenCalledWith(request.keyword);
      expect(mockOpenAIService.generateContent).toHaveBeenCalledWith(
        request,
        expect.any(Array)
      );
    });
    
    it('should handle SERP analysis failure gracefully', async () => {
      // Arrange
      const request = createValidRequest();
      mockSerpService.analyze.mockRejectedValue(new Error('SERP API failed'));
      
      // Act & Assert
      await expect(service.generateContent(request)).rejects.toThrow(
        'Content generation failed: SERP analysis error'
      );
    });
    
    it('should retry on transient failures', async () => {
      // Arrange
      const request = createValidRequest();
      mockSerpService.analyze
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValue(createMockSerpData());
      
      // Act
      const result = await service.generateContent(request);
      
      // Assert
      expect(result).toBeDefined();
      expect(mockSerpService.analyze).toHaveBeenCalledTimes(2);
    });
  });
});

// Component Testing Example
describe('ContentGenerationForm', () => {
  it('should submit form with valid data', async () => {
    const mockOnSubmit = jest.fn();
    
    render(
      <ContentGenerationForm onSubmit={mockOnSubmit} />
    );
    
    // Fill form
    await user.type(screen.getByLabelText(/keyword/i), 'test keyword');
    await user.selectOptions(screen.getByLabelText(/location/i), 'US');
    await user.selectOptions(screen.getByLabelText(/content type/i), 'blog-post');
    
    // Submit
    await user.click(screen.getByRole('button', { name: /generate/i }));
    
    // Assert
    expect(mockOnSubmit).toHaveBeenCalledWith({
      keyword: 'test keyword',
      location: 'US',
      contentType: 'blog-post',
    });
  });
  
  it('should show validation errors for invalid input', async () => {
    render(<ContentGenerationForm onSubmit={jest.fn()} />);
    
    // Submit without filling required fields
    await user.click(screen.getByRole('button', { name: /generate/i }));
    
    // Assert validation errors
    expect(screen.getByText(/keyword is required/i)).toBeInTheDocument();
    expect(screen.getByText(/location is required/i)).toBeInTheDocument();
  });
});
```

### Integration Testing Strategy
```typescript
// MSW Setup for API Mocking
// src/mocks/handlers.ts
export const handlers = [
  rest.post('/api/content/generate', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        id: 'test-content-id',
        content: 'Generated test content',
        status: 'completed',
      })
    );
  }),
  
  rest.get('/api/serp/analyze', (req, res, ctx) => {
    const keyword = req.url.searchParams.get('keyword');
    return res(
      ctx.status(200),
      ctx.json({
        keyword,
        organicResults: [
          { url: 'https://example1.com', title: 'Test Result 1' },
          { url: 'https://example2.com', title: 'Test Result 2' },
        ],
      })
    );
  }),
  
  rest.post('/api/auth/login', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        user: { id: 'test-user', email: 'test@example.com' },
        token: 'test-jwt-token',
      })
    );
  }),
];

// Integration Test Example
describe('Content Generation API Integration', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());
  
  it('should complete full content generation workflow', async () => {
    // Arrange
    const request = {
      keyword: 'test keyword',
      location: 'US',
      contentType: 'blog-post',
    };
    
    // Act
    const response = await fetch('/api/content/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    
    const result = await response.json();
    
    // Assert
    expect(response.status).toBe(200);
    expect(result.id).toBeDefined();
    expect(result.content).toBeDefined();
    expect(result.status).toBe('completed');
  });
  
  it('should handle authentication errors', async () => {
    // Mock authentication failure
    server.use(
      rest.post('/api/content/generate', (req, res, ctx) => {
        return res(ctx.status(401), ctx.json({ error: 'Unauthorized' }));
      })
    );
    
    const response = await fetch('/api/content/generate', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    
    expect(response.status).toBe(401);
  });
});
```

### End-to-End Testing Strategy
```typescript
// Playwright Configuration (playwright.config.ts)
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});

// E2E Test Example
import { test, expect } from '@playwright/test';

test.describe('Content Generation Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/auth/login');
    await page.fill('[data-testid=email]', 'test@example.com');
    await page.fill('[data-testid=password]', 'password123');
    await page.click('[data-testid=login-button]');
    await expect(page).toHaveURL('/dashboard');
  });
  
  test('should generate content successfully', async ({ page }) => {
    // Navigate to content generator
    await page.click('[data-testid=generate-content-link]');
    await expect(page).toHaveURL('/generate');
    
    // Fill content generation form
    await page.fill('[data-testid=keyword-input]', 'best SEO tools');
    await page.selectOption('[data-testid=location-select]', 'US');
    await page.selectOption('[data-testid=content-type-select]', 'blog-post');
    
    // Start generation
    await page.click('[data-testid=generate-button]');
    
    // Wait for progress tracking to appear
    await expect(page.locator('[data-testid=progress-tracker]')).toBeVisible();
    
    // Wait for completion (with timeout)
    await expect(page.locator('[data-testid=content-result]')).toBeVisible({
      timeout: 300000, // 5 minutes
    });
    
    // Verify content was generated
    const content = await page.textContent('[data-testid=generated-content]');
    expect(content).toBeTruthy();
    expect(content!.length).toBeGreaterThan(500);
    
    // Verify SEO score is displayed
    await expect(page.locator('[data-testid=seo-score]')).toBeVisible();
    
    // Test content editing
    await page.click('[data-testid=edit-content-button]');
    await expect(page.locator('[data-testid=content-editor]')).toBeVisible();
    
    // Test export functionality
    await page.click('[data-testid=export-button]');
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid=export-html]');
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('.html');
  });
  
  test('should handle subscription limits', async ({ page }) => {
    // Mock user with exceeded limits
    await page.route('/api/user/subscription', route => {
      route.fulfill({
        json: {
          tier: 'free',
          usageCount: 10,
          usageLimit: 10,
        },
      });
    });
    
    await page.goto('/generate');
    
    // Try to generate content
    await page.fill('[data-testid=keyword-input]', 'test keyword');
    await page.click('[data-testid=generate-button]');
    
    // Should show upgrade prompt
    await expect(page.locator('[data-testid=upgrade-prompt]')).toBeVisible();
    await expect(page.locator('text=Usage limit reached')).toBeVisible();
  });
});
```

### Performance Testing Strategy
```typescript
// K6 Performance Test Script
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

export let errorRate = new Rate('errors');

export let options = {
  stages: [
    { duration: '2m', target: 10 }, // Ramp up to 10 users
    { duration: '5m', target: 10 }, // Stay at 10 users
    { duration: '2m', target: 50 }, // Ramp up to 50 users
    { duration: '5m', target: 50 }, // Stay at 50 users
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 0 }, // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests under 2s
    http_req_failed: ['rate<0.1'], // Error rate under 10%
    errors: ['rate<0.1'],
  },
};

export default function () {
  // Test login
  let loginResponse = http.post('http://localhost:3000/api/auth/login', {
    email: 'test@example.com',
    password: 'password123',
  });
  
  check(loginResponse, {
    'login successful': (r) => r.status === 200,
    'login response time OK': (r) => r.timings.duration < 1000,
  }) || errorRate.add(1);
  
  let authToken = loginResponse.json('token');
  
  // Test content generation
  let generateResponse = http.post(
    'http://localhost:3000/api/content/generate',
    JSON.stringify({
      keyword: 'test keyword',
      location: 'US',
      contentType: 'blog-post',
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
    }
  );
  
  check(generateResponse, {
    'generation started': (r) => r.status === 200,
    'generation response time OK': (r) => r.timings.duration < 5000,
  }) || errorRate.add(1);
  
  sleep(1);
}
```

### Security Testing Integration
```typescript
// Security Test Configuration
// security-tests/zap-baseline.conf
{
  "spider": {
    "maxDuration": 10,
    "maxDepth": 5
  },
  "activeScan": {
    "maxDuration": 30,
    "maxRuleDuration": 5
  },
  "authentication": {
    "method": "form",
    "loginUrl": "http://localhost:3000/auth/login",
    "usernameField": "email",
    "passwordField": "password",
    "username": "test@example.com",
    "password": "password123"
  },
  "excludeUrls": [
    "http://localhost:3000/api/webhooks/.*",
    "http://localhost:3000/admin/.*"
  ]
}

// Automated Security Testing Script
#!/bin/bash
# security-test.sh

echo "Starting security tests..."

# Start application
npm run build
npm run start &
APP_PID=$!

# Wait for app to start
sleep 30

# Run OWASP ZAP baseline scan
docker run -t owasp/zap2docker-stable zap-baseline.py \
  -t http://host.docker.internal:3000 \
  -c security-tests/zap-baseline.conf \
  -r security-report.html

# Run Snyk security scan
npx snyk test --severity-threshold=high

# Cleanup
kill $APP_PID

echo "Security tests completed"
```

## Consequences

### Positive
- **Quality Assurance**: High confidence in code quality and functionality
- **Regression Prevention**: Automated detection of breaking changes
- **Performance Validation**: Ensures application meets performance requirements
- **Security Assurance**: Proactive identification of security vulnerabilities
- **Development Velocity**: Fast feedback loop for developers

### Negative
- **Initial Setup Time**: Significant time investment to set up comprehensive testing
- **Maintenance Overhead**: Tests need to be maintained alongside code changes
- **CI/CD Duration**: Comprehensive test suite increases build times

## Implementation Plan

1. **Phase 1**: Set up unit testing framework and achieve 90% coverage
2. **Phase 2**: Implement integration testing with MSW
3. **Phase 3**: Add E2E testing for critical user workflows
4. **Phase 4**: Set up performance testing and monitoring
5. **Phase 5**: Integrate security testing into CI/CD pipeline

## Monitoring and Success Criteria

- **Unit Test Coverage**: >90% for all business logic
- **Integration Test Coverage**: >80% for all API endpoints
- **E2E Test Coverage**: 100% of critical user workflows
- **Performance Tests**: Pass under 100 concurrent users
- **Security Tests**: Zero high-severity vulnerabilities

## References
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Library](https://testing-library.com/docs/)
- [Playwright Documentation](https://playwright.dev/)
- [K6 Performance Testing](https://k6.io/docs/)
- [OWASP ZAP](https://owasp.org/www-project-zap/)
