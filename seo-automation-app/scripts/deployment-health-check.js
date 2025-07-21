#!/usr/bin/env node

/**
 * Deployment Health Check Script
 * Validates deployment success and service availability
 */

const https = require('https');
const http = require('http');

const CONFIG = {
  // Production URL
  productionUrl: 'https://seo-automation-app.vercel.app',
  
  // Health check endpoints
  endpoints: [
    '/api/health',
    '/api/docs',
    '/'
  ],
  
  // Timeout settings
  timeout: 30000,
  retries: 3,
  retryDelay: 5000,
  
  // Performance thresholds
  thresholds: {
    responseTime: 5000,
    availability: 99.0
  }
};

class DeploymentHealthChecker {
  constructor(config) {
    this.config = config;
    this.results = [];
    this.startTime = Date.now();
  }

  async runHealthCheck() {
    console.log('🏥 Starting deployment health check...\n');
    console.log(`Target: ${this.config.productionUrl}`);
    console.log(`Endpoints: ${this.config.endpoints.length}`);
    console.log(`Timeout: ${this.config.timeout}ms\n`);

    // Check each endpoint
    for (const endpoint of this.config.endpoints) {
      await this.checkEndpoint(endpoint);
    }

    // Generate summary report
    this.generateReport();
    
    // Return exit code based on results
    const hasFailures = this.results.some(result => !result.success);
    return hasFailures ? 1 : 0;
  }

  async checkEndpoint(endpoint) {
    const url = `${this.config.productionUrl}${endpoint}`;
    console.log(`🔍 Checking ${endpoint}...`);

    for (let attempt = 1; attempt <= this.config.retries; attempt++) {
      try {
        const result = await this.makeRequest(url);
        
        if (result.success) {
          console.log(`  ✅ ${endpoint} - ${result.statusCode} (${result.responseTime}ms)`);
          this.results.push({
            endpoint,
            success: true,
            statusCode: result.statusCode,
            responseTime: result.responseTime,
            attempt
          });
          return;
        } else {
          console.log(`  ❌ ${endpoint} - ${result.statusCode} (attempt ${attempt}/${this.config.retries})`);
          
          if (attempt === this.config.retries) {
            this.results.push({
              endpoint,
              success: false,
              statusCode: result.statusCode,
              error: result.error,
              attempt
            });
          }
        }
      } catch (error) {
        console.log(`  ❌ ${endpoint} - Error: ${error.message} (attempt ${attempt}/${this.config.retries})`);
        
        if (attempt === this.config.retries) {
          this.results.push({
            endpoint,
            success: false,
            error: error.message,
            attempt
          });
        }
      }

      // Wait before retry
      if (attempt < this.config.retries) {
        console.log(`    ⏳ Retrying in ${this.config.retryDelay}ms...`);
        await this.sleep(this.config.retryDelay);
      }
    }
  }

  makeRequest(url) {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const urlObj = new URL(url);
      const isHttps = urlObj.protocol === 'https:';
      const client = isHttps ? https : http;
      
      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || (isHttps ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: 'GET',
        timeout: this.config.timeout,
        headers: {
          'User-Agent': 'Deployment-Health-Check/1.0',
          'Accept': 'application/json,text/html,*/*'
        }
      };

      const req = client.request(options, (res) => {
        const responseTime = Date.now() - startTime;
        
        // Collect response data
        let data = '';
        res.on('data', chunk => {
          data += chunk;
        });
        
        res.on('end', () => {
          const success = res.statusCode >= 200 && res.statusCode < 400;
          resolve({
            success,
            statusCode: res.statusCode,
            responseTime,
            data: data.substring(0, 200) // First 200 chars for debugging
          });
        });
      });

      req.on('error', (error) => {
        const responseTime = Date.now() - startTime;
        resolve({
          success: false,
          error: error.message,
          responseTime
        });
      });

      req.on('timeout', () => {
        req.destroy();
        const responseTime = Date.now() - startTime;
        resolve({
          success: false,
          error: 'Request timeout',
          responseTime
        });
      });

      req.end();
    });
  }

  generateReport() {
    const totalTime = Date.now() - this.startTime;
    const successCount = this.results.filter(r => r.success).length;
    const totalCount = this.results.length;
    const successRate = (successCount / totalCount * 100).toFixed(1);
    
    console.log('\n📊 Health Check Summary');
    console.log('========================');
    console.log(`Total endpoints checked: ${totalCount}`);
    console.log(`Successful checks: ${successCount}`);
    console.log(`Failed checks: ${totalCount - successCount}`);
    console.log(`Success rate: ${successRate}%`);
    console.log(`Total time: ${totalTime}ms\n`);

    // Detailed results
    console.log('📋 Detailed Results');
    console.log('===================');
    this.results.forEach((result, index) => {
      const status = result.success ? '✅' : '❌';
      const timing = result.responseTime ? `${result.responseTime}ms` : 'N/A';
      const code = result.statusCode ? `(${result.statusCode})` : '';
      const error = result.error ? ` - ${result.error}` : '';
      
      console.log(`${index + 1}. ${status} ${result.endpoint} ${timing} ${code}${error}`);
    });

    // Performance analysis
    const successfulResults = this.results.filter(r => r.success && r.responseTime);
    if (successfulResults.length > 0) {
      const avgResponseTime = successfulResults.reduce((sum, r) => sum + r.responseTime, 0) / successfulResults.length;
      const maxResponseTime = Math.max(...successfulResults.map(r => r.responseTime));
      
      console.log('\n⚡ Performance Metrics');
      console.log('======================');
      console.log(`Average response time: ${avgResponseTime.toFixed(0)}ms`);
      console.log(`Maximum response time: ${maxResponseTime}ms`);
      console.log(`Performance threshold: ${this.config.thresholds.responseTime}ms`);
      
      if (maxResponseTime > this.config.thresholds.responseTime) {
        console.log(`⚠️  Warning: Response time exceeds threshold`);
      } else {
        console.log(`✅ Response times within acceptable range`);
      }
    }

    // Overall status
    console.log('\n🎯 Overall Status');
    console.log('=================');
    if (successRate >= this.config.thresholds.availability) {
      console.log(`✅ Deployment healthy (${successRate}% success rate)`);
    } else {
      console.log(`❌ Deployment issues detected (${successRate}% success rate)`);
      console.log(`   Required: ${this.config.thresholds.availability}% minimum`);
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Additional environment checks
async function checkEnvironmentConfiguration() {
  console.log('\n🔧 Environment Configuration Check');
  console.log('===================================');
  
  // Check if we can access environment info
  try {
    const healthUrl = `${CONFIG.productionUrl}/api/health`;
    const checker = new DeploymentHealthChecker(CONFIG);
    const response = await checker.makeRequest(healthUrl);
    
    if (response.success && response.data) {
      try {
        const healthData = JSON.parse(response.data);
        console.log(`✅ Environment: ${healthData.environment || 'production'}`);
        console.log(`✅ Version: ${healthData.version || 'unknown'}`);
        console.log(`✅ Timestamp: ${healthData.timestamp || 'unknown'}`);
        
        if (healthData.services) {
          console.log('📊 Service Status:');
          Object.entries(healthData.services).forEach(([service, status]) => {
            const icon = status ? '✅' : '❌';
            console.log(`   ${icon} ${service}: ${status ? 'healthy' : 'unhealthy'}`);
          });
        }
      } catch (parseError) {
        console.log('⚠️  Could not parse health response as JSON');
      }
    } else {
      console.log('❌ Could not retrieve environment information');
    }
  } catch (error) {
    console.log(`❌ Environment check failed: ${error.message}`);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  // Parse command line arguments
  if (args.includes('--help') || args.includes('-h')) {
    console.log('Deployment Health Check Script\n');
    console.log('Usage: node deployment-health-check.js [options]\n');
    console.log('Options:');
    console.log('  --url <url>       Custom URL to check (default: production)');
    console.log('  --timeout <ms>    Request timeout in milliseconds (default: 30000)');
    console.log('  --retries <n>     Number of retries per endpoint (default: 3)');
    console.log('  --env-only        Only check environment configuration');
    console.log('  --help, -h        Show this help message');
    return 0;
  }

  // Override configuration from command line
  const urlIndex = args.indexOf('--url');
  if (urlIndex !== -1 && args[urlIndex + 1]) {
    CONFIG.productionUrl = args[urlIndex + 1];
  }

  const timeoutIndex = args.indexOf('--timeout');
  if (timeoutIndex !== -1 && args[timeoutIndex + 1]) {
    CONFIG.timeout = parseInt(args[timeoutIndex + 1]);
  }

  const retriesIndex = args.indexOf('--retries');
  if (retriesIndex !== -1 && args[retriesIndex + 1]) {
    CONFIG.retries = parseInt(args[retriesIndex + 1]);
  }

  if (args.includes('--env-only')) {
    await checkEnvironmentConfiguration();
    return 0;
  }

  // Run full health check
  const checker = new DeploymentHealthChecker(CONFIG);
  const exitCode = await checker.runHealthCheck();
  
  // Also check environment
  await checkEnvironmentConfiguration();
  
  console.log(`\n🏁 Health check completed in ${Date.now() - checker.startTime}ms`);
  return exitCode;
}

if (require.main === module) {
  main()
    .then(exitCode => process.exit(exitCode))
    .catch(error => {
      console.error('💥 Health check failed:', error);
      process.exit(1);
    });
}

module.exports = { DeploymentHealthChecker, CONFIG };