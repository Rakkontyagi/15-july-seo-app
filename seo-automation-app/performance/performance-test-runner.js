#!/usr/bin/env node
/**
 * Performance Test Runner
 * Orchestrates different types of performance tests and generates reports
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class PerformanceTestRunner {
  constructor() {
    this.testResults = [];
    this.config = {
      k6Binary: 'k6',
      reportDir: path.join(__dirname, '../performance-reports'),
      testDir: path.join(__dirname),
      thresholds: {
        errorRate: 0.01,        // 1% error rate
        responseTime: 1000,     // 1s response time
        availability: 0.99      // 99% availability
      }
    };
    
    this.ensureDirectories();
  }

  ensureDirectories() {
    if (!fs.existsSync(this.config.reportDir)) {
      fs.mkdirSync(this.config.reportDir, { recursive: true });
    }
  }

  log(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...data
    };
    
    console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`, 
      Object.keys(data).length > 0 ? JSON.stringify(data, null, 2) : '');
    
    return logEntry;
  }

  async runTest(testType, environment = 'staging', options = {}) {
    this.log('info', `Starting ${testType} test against ${environment}`, options);
    
    const testFile = this.getTestFile(testType);
    const outputFile = this.getOutputFile(testType, environment);
    
    try {
      const result = await this.executeK6Test(testFile, environment, outputFile, options);
      
      this.log('info', `${testType} test completed`, {
        duration: result.duration,
        success: result.success,
        outputFile
      });
      
      return result;
    } catch (error) {
      this.log('error', `${testType} test failed`, { error: error.message });
      throw error;
    }
  }

  getTestFile(testType) {
    const testFiles = {
      'load': 'load-test.js',
      'stress': 'stress-test.js',
      'spike': 'spike-test.js',
      'endurance': 'endurance-test.js',
      'baseline': 'baseline-test.js'
    };
    
    const fileName = testFiles[testType];
    if (!fileName) {
      throw new Error(`Unknown test type: ${testType}`);
    }
    
    const filePath = path.join(this.config.testDir, fileName);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Test file not found: ${filePath}`);
    }
    
    return filePath;
  }

  getOutputFile(testType, environment) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return path.join(this.config.reportDir, `${testType}-${environment}-${timestamp}.json`);
  }

  async executeK6Test(testFile, environment, outputFile, options = {}) {
    const startTime = Date.now();
    
    // Build K6 command
    const k6Args = [
      'run',
      '--out', `json=${outputFile}`,
      '--summary-export', outputFile.replace('.json', '-summary.json')
    ];
    
    // Add environment variables
    const env = {
      ...process.env,
      BASE_URL: this.getBaseUrl(environment),
      K6_ENVIRONMENT: environment,
      ...options.env
    };
    
    // Add test-specific options
    if (options.vus) k6Args.push('--vus', options.vus.toString());
    if (options.duration) k6Args.push('--duration', options.duration);
    if (options.stages) k6Args.push('--stage', options.stages);
    
    k6Args.push(testFile);
    
    return new Promise((resolve, reject) => {
      this.log('info', 'Executing K6 test', {
        command: `${this.config.k6Binary} ${k6Args.join(' ')}`,
        environment,
        testFile
      });
      
      const k6Process = spawn(this.config.k6Binary, k6Args, {
        env,
        stdio: ['ignore', 'pipe', 'pipe']
      });
      
      let stdout = '';
      let stderr = '';
      
      k6Process.stdout.on('data', (data) => {
        stdout += data.toString();
        process.stdout.write(data); // Real-time output
      });
      
      k6Process.stderr.on('data', (data) => {
        stderr += data.toString();
        process.stderr.write(data); // Real-time error output
      });
      
      k6Process.on('close', (code) => {
        const duration = Date.now() - startTime;
        
        try {
          const result = this.parseTestResults(outputFile, stdout, stderr, code, duration);
          resolve(result);
        } catch (error) {
          reject(new Error(`Failed to parse test results: ${error.message}`));
        }
      });
      
      k6Process.on('error', (error) => {
        reject(new Error(`K6 execution failed: ${error.message}`));
      });
    });
  }

  getBaseUrl(environment) {
    const urls = {
      local: 'http://localhost:3000',
      staging: 'https://seo-automation-app-staging.vercel.app',
      production: 'https://seo-automation-app.vercel.app'
    };
    
    return urls[environment] || urls.staging;
  }

  parseTestResults(outputFile, stdout, stderr, exitCode, duration) {
    let metrics = {};
    let summary = {};
    
    // Parse JSON output if available
    if (fs.existsSync(outputFile)) {
      try {
        const rawData = fs.readFileSync(outputFile, 'utf8');
        const lines = rawData.trim().split('\n').filter(line => line.trim());
        
        // Parse individual metric lines
        lines.forEach(line => {
          try {
            const data = JSON.parse(line);
            if (data.type === 'Point' && data.metric) {
              if (!metrics[data.metric]) {
                metrics[data.metric] = [];
              }
              metrics[data.metric].push(data.data);
            }
          } catch (e) {
            // Skip invalid JSON lines
          }
        });
        
      } catch (error) {
        this.log('warn', 'Failed to parse test output', { error: error.message });
      }
    }
    
    // Parse summary if available
    const summaryFile = outputFile.replace('.json', '-summary.json');
    if (fs.existsSync(summaryFile)) {
      try {
        summary = JSON.parse(fs.readFileSync(summaryFile, 'utf8'));
      } catch (error) {
        this.log('warn', 'Failed to parse test summary', { error: error.message });
      }
    }
    
    // Calculate aggregated metrics
    const aggregatedMetrics = this.aggregateMetrics(metrics);
    
    const result = {
      success: exitCode === 0,
      exitCode,
      duration,
      metrics: aggregatedMetrics,
      summary,
      stdout: stdout.substring(0, 5000), // Limit output size
      stderr: stderr.substring(0, 2000),
      outputFile,
      timestamp: new Date().toISOString()
    };
    
    // Evaluate against thresholds
    result.evaluation = this.evaluateResults(result);
    
    return result;
  }

  aggregateMetrics(metrics) {
    const aggregated = {};
    
    Object.keys(metrics).forEach(metricName => {
      const values = metrics[metricName].map(point => point.value).filter(v => v !== null);
      
      if (values.length > 0) {
        aggregated[metricName] = {
          count: values.length,
          min: Math.min(...values),
          max: Math.max(...values),
          avg: values.reduce((a, b) => a + b, 0) / values.length,
          p50: this.percentile(values, 50),
          p90: this.percentile(values, 90),
          p95: this.percentile(values, 95),
          p99: this.percentile(values, 99)
        };
      }
    });
    
    return aggregated;
  }

  percentile(values, p) {
    const sorted = values.slice().sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[index] || 0;
  }

  evaluateResults(result) {
    const evaluation = {
      passed: true,
      failures: [],
      score: 100
    };
    
    // Check error rate
    const errorRate = this.getMetricValue(result, 'http_req_failed', 'avg') || 0;
    if (errorRate > this.config.thresholds.errorRate) {
      evaluation.passed = false;
      evaluation.failures.push(`Error rate ${(errorRate * 100).toFixed(2)}% exceeds threshold ${(this.config.thresholds.errorRate * 100)}%`);
      evaluation.score -= 20;
    }
    
    // Check response time
    const responseTime = this.getMetricValue(result, 'http_req_duration', 'p95') || 0;
    if (responseTime > this.config.thresholds.responseTime) {
      evaluation.passed = false;
      evaluation.failures.push(`95th percentile response time ${responseTime}ms exceeds threshold ${this.config.thresholds.responseTime}ms`);
      evaluation.score -= 15;
    }
    
    // Check if test completed successfully
    if (!result.success) {
      evaluation.passed = false;
      evaluation.failures.push('Test execution failed');
      evaluation.score -= 30;
    }
    
    evaluation.score = Math.max(0, evaluation.score);
    
    return evaluation;
  }

  getMetricValue(result, metricName, statistic) {
    if (result.metrics && result.metrics[metricName]) {
      return result.metrics[metricName][statistic];
    }
    return null;
  }

  async runTestSuite(environment = 'staging', testTypes = ['load', 'stress']) {
    this.log('info', `Starting performance test suite for ${environment}`, { testTypes });
    
    const suiteResults = {
      environment,
      startTime: new Date().toISOString(),
      tests: {},
      summary: {
        total: testTypes.length,
        passed: 0,
        failed: 0,
        score: 0
      }
    };
    
    for (const testType of testTypes) {
      try {
        const testResult = await this.runTest(testType, environment);
        suiteResults.tests[testType] = testResult;
        
        if (testResult.evaluation.passed) {
          suiteResults.summary.passed++;
        } else {
          suiteResults.summary.failed++;
        }
        
        suiteResults.summary.score += testResult.evaluation.score;
        
      } catch (error) {
        suiteResults.tests[testType] = {
          success: false,
          error: error.message,
          evaluation: { passed: false, score: 0, failures: [error.message] }
        };
        suiteResults.summary.failed++;
      }
    }
    
    suiteResults.endTime = new Date().toISOString();
    suiteResults.summary.averageScore = suiteResults.summary.score / testTypes.length;
    
    // Generate suite report
    await this.generateSuiteReport(suiteResults);
    
    this.log('info', 'Performance test suite completed', {
      environment,
      passed: suiteResults.summary.passed,
      failed: suiteResults.summary.failed,
      averageScore: suiteResults.summary.averageScore
    });
    
    return suiteResults;
  }

  async generateSuiteReport(suiteResults) {
    const reportFile = path.join(this.config.reportDir, 
      `performance-suite-${suiteResults.environment}-${Date.now()}.json`);
    
    fs.writeFileSync(reportFile, JSON.stringify(suiteResults, null, 2));
    
    // Generate HTML report
    const htmlReport = this.generateHtmlReport(suiteResults);
    const htmlFile = reportFile.replace('.json', '.html');
    fs.writeFileSync(htmlFile, htmlReport);
    
    this.log('info', 'Performance reports generated', {
      jsonReport: reportFile,
      htmlReport: htmlFile
    });
  }

  generateHtmlReport(suiteResults) {
    const { environment, tests, summary } = suiteResults;
    
    let testRows = '';
    Object.keys(tests).forEach(testType => {
      const test = tests[testType];
      const status = test.evaluation?.passed ? '✅ PASS' : '❌ FAIL';
      const score = test.evaluation?.score || 0;
      const errorRate = this.getMetricValue(test, 'http_req_failed', 'avg') * 100 || 0;
      const responseTime = this.getMetricValue(test, 'http_req_duration', 'p95') || 0;
      
      testRows += `
        <tr>
          <td>${testType}</td>
          <td>${status}</td>
          <td>${score}/100</td>
          <td>${errorRate.toFixed(2)}%</td>
          <td>${responseTime.toFixed(0)}ms</td>
        </tr>
      `;
    });
    
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Performance Test Report - ${environment}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 5px; }
        .summary { display: flex; gap: 20px; margin: 20px 0; }
        .metric { background: #e9f7ef; padding: 15px; border-radius: 5px; text-align: center; }
        .metric.fail { background: #fadbd8; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background: #f2f2f2; }
        .pass { color: green; }
        .fail { color: red; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Performance Test Report</h1>
        <p><strong>Environment:</strong> ${environment}</p>
        <p><strong>Generated:</strong> ${new Date().toISOString()}</p>
    </div>
    
    <div class="summary">
        <div class="metric">
            <h3>Total Tests</h3>
            <div>${summary.total}</div>
        </div>
        <div class="metric">
            <h3>Passed</h3>
            <div>${summary.passed}</div>
        </div>
        <div class="metric ${summary.failed > 0 ? 'fail' : ''}">
            <h3>Failed</h3>
            <div>${summary.failed}</div>
        </div>
        <div class="metric">
            <h3>Average Score</h3>
            <div>${summary.averageScore.toFixed(1)}/100</div>
        </div>
    </div>
    
    <h2>Test Results</h2>
    <table>
        <tr>
            <th>Test Type</th>
            <th>Status</th>
            <th>Score</th>
            <th>Error Rate</th>
            <th>P95 Response Time</th>
        </tr>
        ${testRows}
    </table>
</body>
</html>
    `;
  }

  async checkK6Installation() {
    try {
      execSync(`${this.config.k6Binary} version`, { stdio: 'ignore' });
      this.log('info', 'K6 installation verified');
      return true;
    } catch (error) {
      this.log('error', 'K6 not found. Please install K6: https://k6.io/docs/getting-started/installation/');
      return false;
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const environment = args.find(arg => arg.startsWith('--env='))?.split('=')[1] || 'staging';
  const testType = args.find(arg => arg.startsWith('--test='))?.split('=')[1] || 'load';
  const suite = args.includes('--suite');
  
  const runner = new PerformanceTestRunner();
  
  try {
    // Check K6 installation
    const k6Available = await runner.checkK6Installation();
    if (!k6Available) {
      process.exit(1);
    }
    
    if (suite) {
      const testTypes = ['load', 'stress'];
      const results = await runner.runTestSuite(environment, testTypes);
      
      if (results.summary.failed > 0) {
        console.log('\n❌ Some performance tests failed');
        process.exit(1);
      } else {
        console.log('\n✅ All performance tests passed');
        process.exit(0);
      }
    } else {
      const result = await runner.runTest(testType, environment);
      
      if (result.evaluation.passed) {
        console.log(`\n✅ Performance test passed (Score: ${result.evaluation.score}/100)`);
        process.exit(0);
      } else {
        console.log(`\n❌ Performance test failed (Score: ${result.evaluation.score}/100)`);
        console.log('Failures:', result.evaluation.failures);
        process.exit(1);
      }
    }
  } catch (error) {
    console.error('Performance test execution failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { PerformanceTestRunner };