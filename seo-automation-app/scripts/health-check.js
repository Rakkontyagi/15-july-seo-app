#!/usr/bin/env node
/**
 * Health Check Script for Deployment Validation
 * Validates application health across multiple endpoints
 */

const https = require('https');
const http = require('http');
const url = require('url');
const deploymentConfig = require('../deployment.config.js');

class HealthChecker {
  constructor(baseUrl, environment = 'staging') {
    this.baseUrl = baseUrl || deploymentConfig.environments[environment].url;
    this.environment = environment;
    this.config = deploymentConfig.healthChecks;
    this.results = [];
  }

  log(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`, 
      Object.keys(data).length > 0 ? JSON.stringify(data, null, 2) : '');
  }

  async checkEndpoint(endpoint) {
    return new Promise((resolve, reject) => {
      const fullUrl = `${this.baseUrl}${endpoint}`;
      const parsedUrl = url.parse(fullUrl);
      const isHttps = parsedUrl.protocol === 'https:';
      const client = isHttps ? https : http;
      
      const startTime = Date.now();
      
      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (isHttps ? 443 : 80),
        path: parsedUrl.path,
        method: 'GET',
        timeout: this.config.timeout || 5000,
        headers: {
          'User-Agent': 'SEO-Automation-Health-Check/1.0',
          'Accept': 'application/json'
        }
      };

      const req = client.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          const duration = Date.now() - startTime;
          const result = {
            endpoint,
            fullUrl,
            status: res.statusCode,
            statusText: res.statusMessage,
            duration,
            timestamp: new Date().toISOString(),
            success: res.statusCode >= 200 && res.statusCode < 400,
            headers: res.headers,
            responseSize: data.length
          };

          // Try to parse JSON response
          try {
            result.data = JSON.parse(data);
          } catch (e) {
            result.data = data;
          }

          resolve(result);
        });
      });

      req.on('error', (error) => {
        const duration = Date.now() - startTime;
        const result = {
          endpoint,
          fullUrl,
          status: 0,
          statusText: 'Connection Error',
          duration,
          timestamp: new Date().toISOString(),
          success: false,
          error: error.message
        };
        
        resolve(result);
      });

      req.on('timeout', () => {
        req.destroy();
        const duration = Date.now() - startTime;
        const result = {
          endpoint,
          fullUrl,
          status: 0,
          statusText: 'Timeout',
          duration,
          timestamp: new Date().toISOString(),
          success: false,
          error: 'Request timeout'
        };
        
        resolve(result);
      });

      req.end();
    });
  }

  async checkAllEndpoints() {
    this.log('info', 'Starting health checks', {
      baseUrl: this.baseUrl,
      environment: this.environment,
      endpoints: this.config.endpoints
    });

    const promises = this.config.endpoints.map(endpoint => 
      this.checkEndpoint(endpoint)
    );

    this.results = await Promise.all(promises);
    
    return this.results;
  }

  async runWithRetries() {
    const maxRetries = this.config.retries || 3;
    let lastResults = [];
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      this.log('info', `Health check attempt ${attempt}/${maxRetries}`);
      
      const results = await this.checkAllEndpoints();
      const failedChecks = results.filter(r => !r.success);
      
      if (failedChecks.length === 0) {
        this.log('info', 'All health checks passed');
        return { success: true, results };
      }
      
      lastResults = results;
      this.log('warn', `${failedChecks.length} health checks failed`, {
        failedEndpoints: failedChecks.map(r => r.endpoint)
      });
      
      if (attempt < maxRetries) {
        const delay = 2000 * attempt; // Exponential backoff
        this.log('info', `Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    return { success: false, results: lastResults };
  }

  generateReport() {
    const successCount = this.results.filter(r => r.success).length;
    const totalCount = this.results.length;
    const successRate = (successCount / totalCount) * 100;
    
    const report = {
      summary: {
        baseUrl: this.baseUrl,
        environment: this.environment,
        totalEndpoints: totalCount,
        successfulEndpoints: successCount,
        failedEndpoints: totalCount - successCount,
        successRate: Math.round(successRate * 100) / 100,
        timestamp: new Date().toISOString()
      },
      details: this.results.map(r => ({
        endpoint: r.endpoint,
        status: r.status,
        success: r.success,
        duration: r.duration,
        error: r.error || null
      })),
      performance: {
        averageResponseTime: Math.round(
          this.results.reduce((sum, r) => sum + r.duration, 0) / totalCount
        ),
        slowestEndpoint: this.results.reduce((slowest, current) => 
          current.duration > slowest.duration ? current : slowest
        ),
        fastestEndpoint: this.results.reduce((fastest, current) => 
          current.duration < fastest.duration ? current : fastest
        )
      }
    };

    return report;
  }

  displayReport() {
    const report = this.generateReport();
    
    console.log('\n📊 Health Check Report');
    console.log('='.repeat(50));
    console.log(`Environment: ${report.summary.environment}`);
    console.log(`Base URL: ${report.summary.baseUrl}`);
    console.log(`Success Rate: ${report.summary.successRate}%`);
    console.log(`Total Endpoints: ${report.summary.totalEndpoints}`);
    console.log(`Successful: ${report.summary.successfulEndpoints}`);
    console.log(`Failed: ${report.summary.failedEndpoints}`);
    console.log(`Average Response Time: ${report.performance.averageResponseTime}ms`);
    console.log();

    console.log('📋 Endpoint Details:');
    report.details.forEach(detail => {
      const status = detail.success ? '✅' : '❌';
      const statusText = detail.success ? 'PASS' : 'FAIL';
      console.log(`${status} ${detail.endpoint} (${detail.status}) - ${detail.duration}ms - ${statusText}`);
      if (detail.error) {
        console.log(`   Error: ${detail.error}`);
      }
    });

    console.log('\n⚡ Performance:');
    console.log(`Fastest: ${report.performance.fastestEndpoint.endpoint} (${report.performance.fastestEndpoint.duration}ms)`);
    console.log(`Slowest: ${report.performance.slowestEndpoint.endpoint} (${report.performance.slowestEndpoint.duration}ms)`);
    
    return report;
  }

  async run() {
    try {
      const result = await this.runWithRetries();
      const report = this.displayReport();
      
      if (result.success) {
        this.log('info', 'Health checks completed successfully');
        return { success: true, report };
      } else {
        this.log('error', 'Health checks failed');
        return { success: false, report };
      }
    } catch (error) {
      this.log('error', 'Health check execution failed', { error: error.message });
      return { success: false, error: error.message };
    }
  }
}

// Advanced health check with specific validations
class AdvancedHealthChecker extends HealthChecker {
  async checkAPIHealth() {
    const apiEndpoints = [
      { endpoint: '/api/health', expectedStatus: 200 },
      { endpoint: '/api/serp/health', expectedStatus: 200 },
      { endpoint: '/api/metrics', expectedStatus: 200 }
    ];

    for (const { endpoint, expectedStatus } of apiEndpoints) {
      const result = await this.checkEndpoint(endpoint);
      
      if (result.status !== expectedStatus) {
        this.log('error', `API health check failed: ${endpoint}`, {
          expected: expectedStatus,
          actual: result.status
        });
        return false;
      }

      // Validate response structure for health endpoints
      if (endpoint.includes('/health')) {
        if (!result.data || typeof result.data !== 'object') {
          this.log('error', `Invalid health response format: ${endpoint}`);
          return false;
        }

        if (!result.data.status || result.data.status !== 'healthy') {
          this.log('error', `Service reported unhealthy: ${endpoint}`, {
            response: result.data
          });
          return false;
        }
      }
    }

    return true;
  }

  async checkDatabaseConnectivity() {
    try {
      const result = await this.checkEndpoint('/api/health');
      
      if (result.data && result.data.database) {
        return result.data.database.status === 'connected';
      }
      
      return false;
    } catch (error) {
      this.log('error', 'Database connectivity check failed', { error: error.message });
      return false;
    }
  }

  async checkExternalServicesHealth() {
    const services = ['openai', 'supabase', 'serper', 'firecrawl'];
    const results = {};

    try {
      const healthResult = await this.checkEndpoint('/api/health');
      
      if (healthResult.data && healthResult.data.services) {
        for (const service of services) {
          results[service] = healthResult.data.services[service] === 'healthy';
        }
      }
      
      return results;
    } catch (error) {
      this.log('error', 'External services health check failed', { error: error.message });
      return {};
    }
  }

  async runAdvancedChecks() {
    this.log('info', 'Running advanced health checks...');
    
    const checks = {
      api: await this.checkAPIHealth(),
      database: await this.checkDatabaseConnectivity(),
      externalServices: await this.checkExternalServicesHealth()
    };

    const allPassed = checks.api && checks.database && 
      Object.values(checks.externalServices).every(status => status);

    return {
      success: allPassed,
      checks
    };
  }
}

// CLI interface
async function main() {
  const baseUrl = process.argv[2];
  const environment = process.argv[3] || 'staging';
  const advanced = process.argv.includes('--advanced');
  
  const CheckerClass = advanced ? AdvancedHealthChecker : HealthChecker;
  const checker = new CheckerClass(baseUrl, environment);
  
  try {
    let result;
    
    if (advanced) {
      result = await checker.runAdvancedChecks();
      console.log('\n🔍 Advanced Health Check Results:');
      console.log('='.repeat(40));
      console.log('API Health:', result.checks.api ? '✅ PASS' : '❌ FAIL');
      console.log('Database:', result.checks.database ? '✅ PASS' : '❌ FAIL');
      console.log('External Services:');
      
      Object.entries(result.checks.externalServices).forEach(([service, status]) => {
        console.log(`  ${service}: ${status ? '✅ PASS' : '❌ FAIL'}`);
      });
    } else {
      result = await checker.run();
    }
    
    process.exit(result.success ? 0 : 1);
  } catch (error) {
    console.error('Health check failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { HealthChecker, AdvancedHealthChecker };