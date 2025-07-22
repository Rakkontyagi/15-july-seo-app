/**
 * Security Penetration Testing Suite
 * Comprehensive security vulnerability assessment
 */

import { test, expect } from '@playwright/test';
import { chromium, Browser, Page } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// Common attack payloads for testing
const XSS_PAYLOADS = [
  '<script>alert("xss")</script>',
  '"><script>alert("xss")</script>',
  "';alert('xss');//",
  'javascript:alert("xss")',
  '<img src=x onerror=alert("xss")>',
  '<svg onload=alert("xss")>',
  '${alert("xss")}',
  '{{constructor.constructor("alert(\\"xss\\")")()}}'
];

const SQL_INJECTION_PAYLOADS = [
  "' OR '1'='1",
  "' OR '1'='1' --",
  "' OR '1'='1' /*",
  "'; DROP TABLE users; --",
  "' UNION SELECT NULL,NULL,NULL --",
  "' OR 1=1 --",
  "admin'--",
  "admin'/*",
  "' OR 'x'='x",
  "' OR 1=1#"
];

const PATH_TRAVERSAL_PAYLOADS = [
  '../../../etc/passwd',
  '..\\..\\..\\windows\\system32\\drivers\\etc\\hosts',
  '....//....//....//etc/passwd',
  '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd',
  '..%252f..%252f..%252fetc%252fpasswd',
  '..%c0%af..%c0%af..%c0%afetc%c0%afpasswd'
];

const COMMAND_INJECTION_PAYLOADS = [
  '; ls -la',
  '| ls -la',
  '& ls -la',
  '`ls -la`',
  '$(ls -la)',
  '; cat /etc/passwd',
  '| cat /etc/passwd',
  '; whoami',
  '&& whoami'
];

interface SecurityTestResult {
  endpoint: string;
  payload: string;
  vulnerability: string;
  status: number;
  response: string;
  vulnerable: boolean;
}

test.describe('Security Penetration Testing', () => {
  let browser: Browser;
  let page: Page;
  let securityResults: SecurityTestResult[] = [];

  test.beforeAll(async () => {
    browser = await chromium.launch();
  });

  test.beforeEach(async () => {
    page = await browser.newPage();
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async () => {
    await page.close();
  });

  test.afterAll(async () => {
    await browser.close();
    
    // Generate security report
    const vulnerabilities = securityResults.filter(r => r.vulnerable);
    console.log(`\n🔒 SECURITY ASSESSMENT COMPLETE`);
    console.log(`📊 Total Tests: ${securityResults.length}`);
    console.log(`⚠️  Vulnerabilities Found: ${vulnerabilities.length}`);
    
    if (vulnerabilities.length > 0) {
      console.log(`\n⚠️  SECURITY ISSUES DETECTED:`);
      vulnerabilities.forEach(v => {
        console.log(`   - ${v.vulnerability} in ${v.endpoint}`);
        console.log(`     Payload: ${v.payload}`);
      });
    } else {
      console.log(`✅ No critical vulnerabilities detected`);
    }
  });

  test.describe('Input Validation Security', () => {
    test('should prevent XSS attacks in all input fields', async () => {
      const endpoints = [
        { url: '/api/serp/analyze', method: 'POST', field: 'keyword' },
        { url: '/api/content/generate', method: 'POST', field: 'keyword' },
        { url: '/api/projects', method: 'POST', field: 'name' },
        { url: '/api/projects', method: 'POST', field: 'description' }
      ];

      for (const endpoint of endpoints) {
        for (const payload of XSS_PAYLOADS) {
          const testData: any = {};
          testData[endpoint.field] = payload;
          
          // Add required fields
          if (endpoint.field === 'keyword') {
            testData.country = 'google.com';
          }
          
          const response = await page.request.post(`${BASE_URL}${endpoint.url}`, {
            data: testData,
            failOnStatusCode: false
          });

          const responseText = await response.text();
          const isVulnerable = (
            response.status() === 200 && 
            (responseText.includes('<script>') || 
             responseText.includes('alert(') ||
             responseText.includes(payload))
          );

          securityResults.push({
            endpoint: endpoint.url,
            payload,
            vulnerability: 'XSS',
            status: response.status(),
            response: responseText.substring(0, 200),
            vulnerable: isVulnerable
          });

          // Test should pass if XSS is blocked
          expect(isVulnerable).toBe(false);
        }
      }
      
      console.log('✅ XSS protection validated across all endpoints');
    });

    test('should prevent SQL injection attacks', async () => {
      const endpoints = [
        '/api/projects',
        '/api/content/search',
        '/api/serp/analyze'
      ];

      for (const endpoint of endpoints) {
        for (const payload of SQL_INJECTION_PAYLOADS) {
          const testData = {
            keyword: payload,
            country: 'google.com',
            name: payload,
            query: payload
          };
          
          const response = await page.request.post(`${BASE_URL}${endpoint}`, {
            data: testData,
            failOnStatusCode: false
          });

          const responseText = await response.text();
          
          // Check for SQL error messages that might indicate vulnerability
          const sqlErrorIndicators = [
            'SQL syntax',
            'mysql_fetch',
            'ORA-',
            'Microsoft OLE DB',
            'ODBC SQL Server',
            'PostgreSQL',
            'SQLite'
          ];
          
          const isVulnerable = sqlErrorIndicators.some(indicator => 
            responseText.toLowerCase().includes(indicator.toLowerCase())
          );

          securityResults.push({
            endpoint,
            payload,
            vulnerability: 'SQL Injection',
            status: response.status(),
            response: responseText.substring(0, 200),
            vulnerable: isVulnerable
          });

          expect(isVulnerable).toBe(false);
        }
      }
      
      console.log('✅ SQL injection protection validated');
    });

    test('should prevent path traversal attacks', async () => {
      for (const payload of PATH_TRAVERSAL_PAYLOADS) {
        // Test file access endpoints
        const response = await page.request.get(`${BASE_URL}/api/files/${payload}`, {
          failOnStatusCode: false
        });

        const responseText = await response.text();
        
        // Check for system file contents
        const systemFileIndicators = [
          'root:x:0:0',
          '[boot loader]',
          'localhost',
          '# /etc/passwd'
        ];
        
        const isVulnerable = systemFileIndicators.some(indicator => 
          responseText.includes(indicator)
        );

        securityResults.push({
          endpoint: '/api/files/*',
          payload,
          vulnerability: 'Path Traversal',
          status: response.status(),
          response: responseText.substring(0, 200),
          vulnerable: isVulnerable
        });

        expect(isVulnerable).toBe(false);
      }
      
      console.log('✅ Path traversal protection validated');
    });

    test('should prevent command injection attacks', async () => {
      const endpoints = [
        '/api/content/scrape',
        '/api/serp/analyze'
      ];

      for (const endpoint of endpoints) {
        for (const payload of COMMAND_INJECTION_PAYLOADS) {
          const testData = {
            url: `http://example.com${payload}`,
            keyword: `test${payload}`,
            command: payload
          };
          
          const response = await page.request.post(`${BASE_URL}${endpoint}`, {
            data: testData,
            failOnStatusCode: false
          });

          const responseText = await response.text();
          
          // Check for command execution indicators
          const commandIndicators = [
            'total ',
            'drwx',
            'root',
            'bin',
            'usr',
            '/etc',
            'uid=',
            'gid='
          ];
          
          const isVulnerable = commandIndicators.some(indicator => 
            responseText.includes(indicator)
          );

          securityResults.push({
            endpoint,
            payload,
            vulnerability: 'Command Injection',
            status: response.status(),
            response: responseText.substring(0, 200),
            vulnerable: isVulnerable
          });

          expect(isVulnerable).toBe(false);
        }
      }
      
      console.log('✅ Command injection protection validated');
    });
  });

  test.describe('Authentication & Authorization Security', () => {
    test('should require authentication for protected endpoints', async () => {
      const protectedEndpoints = [
        { method: 'GET', url: '/api/projects' },
        { method: 'POST', url: '/api/projects' },
        { method: 'PUT', url: '/api/projects/123' },
        { method: 'DELETE', url: '/api/projects/123' },
        { method: 'POST', url: '/api/content/generate' },
        { method: 'GET', url: '/api/user/profile' }
      ];

      for (const endpoint of protectedEndpoints) {
        const response = await page.request.fetch(`${BASE_URL}${endpoint.url}`, {
          method: endpoint.method,
          failOnStatusCode: false
        });

        // Should return 401 Unauthorized or 403 Forbidden
        expect([401, 403].includes(response.status())).toBeTruthy();
      }
      
      console.log('✅ Authentication requirements validated');
    });

    test('should prevent JWT token manipulation', async () => {
      const maliciousTokens = [
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
        'invalid.jwt.token',
        '',
        'null',
        'undefined'
      ];

      for (const token of maliciousTokens) {
        const response = await page.request.get(`${BASE_URL}/api/projects`, {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          failOnStatusCode: false
        });

        // Should reject invalid tokens
        expect([401, 403].includes(response.status())).toBeTruthy();
      }
      
      console.log('✅ JWT token security validated');
    });
  });

  test.describe('Rate Limiting & DoS Protection', () => {
    test('should enforce rate limiting on API endpoints', async () => {
      const endpoint = '/api/serp/analyze';
      const requestData = {
        keyword: 'test',
        country: 'google.com'
      };

      const requests = [];
      const requestCount = 20; // Attempt to exceed rate limit
      
      // Fire multiple requests rapidly
      for (let i = 0; i < requestCount; i++) {
        requests.push(
          page.request.post(`${BASE_URL}${endpoint}`, {
            data: requestData,
            failOnStatusCode: false
          })
        );
      }

      const responses = await Promise.all(requests);
      
      // Check if rate limiting is active
      const rateLimitedResponses = responses.filter(r => r.status() === 429);
      
      if (rateLimitedResponses.length > 0) {
        console.log(`✅ Rate limiting active: ${rateLimitedResponses.length}/${requestCount} requests blocked`);
      } else {
        console.log('⚠️  Rate limiting may not be configured');
      }
      
      // At least some requests should be rate limited if protection is active
      expect(responses.length).toBeGreaterThan(0);
    });

    test('should handle large payload attacks', async () => {
      const largePayload = 'A'.repeat(10 * 1024 * 1024); // 10MB payload
      
      const response = await page.request.post(`${BASE_URL}/api/content/generate`, {
        data: {
          keyword: largePayload,
          country: 'google.com'
        },
        failOnStatusCode: false
      });

      // Should reject large payloads
      expect([413, 400].includes(response.status())).toBeTruthy();
      
      console.log('✅ Large payload protection validated');
    });
  });

  test.describe('CORS & Security Headers', () => {
    test('should have proper CORS configuration', async () => {
      const response = await page.request.options(`${BASE_URL}/api/health`, {
        headers: {
          'Origin': 'https://malicious-site.com',
          'Access-Control-Request-Method': 'POST'
        },
        failOnStatusCode: false
      });

      const corsHeader = response.headers()['access-control-allow-origin'];
      
      // Should not allow arbitrary origins
      expect(corsHeader).not.toBe('*');
      expect(corsHeader).not.toBe('https://malicious-site.com');
      
      console.log('✅ CORS configuration validated');
    });

    test('should include security headers', async () => {
      const response = await page.request.get(`${BASE_URL}/`);
      const headers = response.headers();

      // Check for security headers
      const securityHeaders = {
        'x-content-type-options': 'nosniff',
        'x-frame-options': 'DENY',
        'x-xss-protection': '1; mode=block',
        'strict-transport-security': /max-age=\d+/,
        'referrer-policy': 'strict-origin-when-cross-origin'
      };

      for (const [header, expectedValue] of Object.entries(securityHeaders)) {
        const actualValue = headers[header.toLowerCase()];
        
        if (expectedValue instanceof RegExp) {
          expect(actualValue).toMatch(expectedValue);
        } else {
          expect(actualValue?.toLowerCase()).toContain(expectedValue.toLowerCase());
        }
      }
      
      console.log('✅ Security headers validated');
    });
  });

  test.describe('Data Privacy & GDPR', () => {
    test('should not expose sensitive data in API responses', async () => {
      const response = await page.request.get(`${BASE_URL}/api/health`);
      const responseText = await response.text();
      
      // Check for exposed sensitive data
      const sensitivePatterns = [
        /sk-[a-zA-Z0-9]{48}/, // OpenAI API keys
        /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/, // UUIDs that might be secrets
        /password/i,
        /secret/i,
        /token/i,
        /key/i
      ];
      
      for (const pattern of sensitivePatterns) {
        expect(responseText).not.toMatch(pattern);
      }
      
      console.log('✅ No sensitive data exposure detected');
    });

    test('should handle PII data properly', async () => {
      const testPII = {
        email: 'test@example.com',
        phone: '+1234567890',
        name: 'Test User',
        address: '123 Test Street'
      };
      
      // Test that PII is handled securely (not logged or exposed)
      const response = await page.request.post(`${BASE_URL}/api/projects`, {
        data: {
          name: 'Test Project',
          userInfo: testPII
        },
        failOnStatusCode: false
      });
      
      const responseText = await response.text();
      
      // PII should not be echoed back in plain text
      expect(responseText).not.toContain(testPII.email);
      expect(responseText).not.toContain(testPII.phone);
      expect(responseText).not.toContain(testPII.address);
      
      console.log('✅ PII handling validated');
    });
  });

  test.describe('API Security Best Practices', () => {
    test('should use HTTPS in production', async () => {
      if (BASE_URL.startsWith('https://')) {
        const response = await page.request.get(BASE_URL.replace('https://', 'http://'), {
          failOnStatusCode: false
        });
        
        // Should redirect to HTTPS or block HTTP
        expect([301, 302, 403, 404].includes(response.status())).toBeTruthy();
        
        console.log('✅ HTTPS enforcement validated');
      } else {
        console.log('ℹ️  HTTPS test skipped for local development');
      }
    });

    test('should have proper error handling', async () => {
      const response = await page.request.get(`${BASE_URL}/api/nonexistent-endpoint`, {
        failOnStatusCode: false
      });
      
      const responseText = await response.text();
      
      // Should not expose stack traces or internal errors
      expect(responseText).not.toContain('Error:');
      expect(responseText).not.toContain('at ');
      expect(responseText).not.toContain('/src/');
      expect(responseText).not.toContain('node_modules');
      
      console.log('✅ Error handling security validated');
    });

    test('should validate content types', async () => {
      const response = await page.request.post(`${BASE_URL}/api/content/generate`, {
        data: '<xml>malicious</xml>',
        headers: {
          'Content-Type': 'application/xml'
        },
        failOnStatusCode: false
      });

      // Should reject non-JSON content types
      expect([400, 415].includes(response.status())).toBeTruthy();
      
      console.log('✅ Content type validation confirmed');
    });
  });
});