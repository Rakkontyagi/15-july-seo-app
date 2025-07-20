#!/usr/bin/env node

/**
 * Lighthouse Performance Audit Script
 * Implements Quinn's recommendation for automated performance testing
 */

const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const fs = require('fs');
const path = require('path');

// Performance thresholds based on Quinn's requirements
const PERFORMANCE_THRESHOLDS = {
  performance: 90,
  accessibility: 95,
  'best-practices': 90,
  seo: 95,
  pwa: 80,
};

// Core Web Vitals thresholds
const CORE_WEB_VITALS_THRESHOLDS = {
  'largest-contentful-paint': 2500, // 2.5 seconds
  'first-input-delay': 100, // 100ms
  'cumulative-layout-shift': 0.1, // 0.1
  'first-contentful-paint': 1800, // 1.8 seconds
  'speed-index': 3400, // 3.4 seconds
  'total-blocking-time': 200, // 200ms
};

// Pages to audit
const PAGES_TO_AUDIT = [
  { url: 'http://localhost:3000', name: 'Homepage' },
  { url: 'http://localhost:3000/dashboard', name: 'Dashboard' },
  { url: 'http://localhost:3000/generate', name: 'Content Generator' },
  { url: 'http://localhost:3000/analytics', name: 'Analytics' },
  { url: 'http://localhost:3000/auth/login', name: 'Login' },
];

async function runLighthouseAudit() {
  console.log('🔍 Starting Lighthouse performance audit...');
  
  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
  const options = {
    logLevel: 'info',
    output: 'json',
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo', 'pwa'],
    port: chrome.port,
  };

  const results = [];
  let allPassed = true;

  for (const page of PAGES_TO_AUDIT) {
    console.log(`\n📊 Auditing: ${page.name} (${page.url})`);
    
    try {
      const runnerResult = await lighthouse(page.url, options);
      const report = runnerResult.lhr;
      
      // Extract scores
      const scores = {
        performance: Math.round(report.categories.performance.score * 100),
        accessibility: Math.round(report.categories.accessibility.score * 100),
        'best-practices': Math.round(report.categories['best-practices'].score * 100),
        seo: Math.round(report.categories.seo.score * 100),
        pwa: Math.round(report.categories.pwa.score * 100),
      };

      // Extract Core Web Vitals
      const coreWebVitals = {
        'largest-contentful-paint': report.audits['largest-contentful-paint'].numericValue,
        'first-input-delay': report.audits['max-potential-fid']?.numericValue || 0,
        'cumulative-layout-shift': report.audits['cumulative-layout-shift'].numericValue,
        'first-contentful-paint': report.audits['first-contentful-paint'].numericValue,
        'speed-index': report.audits['speed-index'].numericValue,
        'total-blocking-time': report.audits['total-blocking-time'].numericValue,
      };

      // Check thresholds
      const passed = checkThresholds(scores, coreWebVitals, page.name);
      if (!passed) allPassed = false;

      // Store results
      results.push({
        page: page.name,
        url: page.url,
        scores,
        coreWebVitals,
        passed,
        timestamp: new Date().toISOString(),
      });

      // Save detailed report
      const reportPath = path.join('lighthouse-reports', `${page.name.toLowerCase().replace(/\s+/g, '-')}-report.json`);
      fs.mkdirSync('lighthouse-reports', { recursive: true });
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      
      console.log(`✅ Report saved: ${reportPath}`);

    } catch (error) {
      console.error(`❌ Error auditing ${page.name}:`, error.message);
      allPassed = false;
    }
  }

  await chrome.kill();

  // Generate summary report
  generateSummaryReport(results);

  // Exit with appropriate code
  if (allPassed) {
    console.log('\n🎉 All performance audits passed!');
    process.exit(0);
  } else {
    console.log('\n❌ Some performance audits failed. Check the reports for details.');
    process.exit(1);
  }
}

function checkThresholds(scores, coreWebVitals, pageName) {
  let passed = true;
  
  console.log(`\n📈 Performance Scores for ${pageName}:`);
  
  // Check Lighthouse scores
  Object.entries(scores).forEach(([category, score]) => {
    const threshold = PERFORMANCE_THRESHOLDS[category];
    const status = score >= threshold ? '✅' : '❌';
    
    if (score < threshold) passed = false;
    
    console.log(`  ${status} ${category}: ${score}/100 (threshold: ${threshold})`);
  });

  console.log(`\n⚡ Core Web Vitals for ${pageName}:`);
  
  // Check Core Web Vitals
  Object.entries(coreWebVitals).forEach(([metric, value]) => {
    const threshold = CORE_WEB_VITALS_THRESHOLDS[metric];
    const status = value <= threshold ? '✅' : '❌';
    
    if (value > threshold) passed = false;
    
    const unit = metric.includes('shift') ? '' : 'ms';
    console.log(`  ${status} ${metric}: ${Math.round(value)}${unit} (threshold: ${threshold}${unit})`);
  });

  return passed;
}

function generateSummaryReport(results) {
  const summary = {
    timestamp: new Date().toISOString(),
    totalPages: results.length,
    passedPages: results.filter(r => r.passed).length,
    failedPages: results.filter(r => r.passed === false).length,
    averageScores: calculateAverageScores(results),
    results,
  };

  // Save summary
  const summaryPath = 'lighthouse-reports/summary.json';
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

  // Generate HTML report
  generateHTMLReport(summary);

  console.log(`\n📊 Summary Report:`);
  console.log(`  Total Pages: ${summary.totalPages}`);
  console.log(`  Passed: ${summary.passedPages}`);
  console.log(`  Failed: ${summary.failedPages}`);
  console.log(`  Success Rate: ${Math.round((summary.passedPages / summary.totalPages) * 100)}%`);
  console.log(`\n📄 Reports saved to: lighthouse-reports/`);
}

function calculateAverageScores(results) {
  const categories = ['performance', 'accessibility', 'best-practices', 'seo', 'pwa'];
  const averages = {};

  categories.forEach(category => {
    const scores = results.map(r => r.scores[category]).filter(s => s !== undefined);
    averages[category] = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  });

  return averages;
}

function generateHTMLReport(summary) {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Lighthouse Performance Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 30px; }
        .metric { background: white; border: 1px solid #ddd; padding: 15px; border-radius: 8px; text-align: center; }
        .metric h3 { margin: 0 0 10px 0; color: #333; }
        .metric .value { font-size: 24px; font-weight: bold; }
        .passed { color: #28a745; }
        .failed { color: #dc3545; }
        .results { margin-top: 30px; }
        .page-result { background: white; border: 1px solid #ddd; margin-bottom: 15px; padding: 20px; border-radius: 8px; }
        .page-result h3 { margin: 0 0 15px 0; }
        .scores { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px; }
        .score { text-align: center; padding: 10px; border-radius: 4px; }
        .score.good { background: #d4edda; color: #155724; }
        .score.poor { background: #f8d7da; color: #721c24; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔍 Lighthouse Performance Report</h1>
        <p>Generated on: ${summary.timestamp}</p>
    </div>

    <div class="summary">
        <div class="metric">
            <h3>Total Pages</h3>
            <div class="value">${summary.totalPages}</div>
        </div>
        <div class="metric">
            <h3>Passed</h3>
            <div class="value passed">${summary.passedPages}</div>
        </div>
        <div class="metric">
            <h3>Failed</h3>
            <div class="value failed">${summary.failedPages}</div>
        </div>
        <div class="metric">
            <h3>Success Rate</h3>
            <div class="value">${Math.round((summary.passedPages / summary.totalPages) * 100)}%</div>
        </div>
    </div>

    <div class="results">
        <h2>📊 Detailed Results</h2>
        ${summary.results.map(result => `
            <div class="page-result">
                <h3>${result.page} ${result.passed ? '✅' : '❌'}</h3>
                <p><strong>URL:</strong> ${result.url}</p>
                <div class="scores">
                    ${Object.entries(result.scores).map(([category, score]) => `
                        <div class="score ${score >= PERFORMANCE_THRESHOLDS[category] ? 'good' : 'poor'}">
                            <div><strong>${category}</strong></div>
                            <div>${score}/100</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('')}
    </div>
</body>
</html>
  `;

  fs.writeFileSync('lighthouse-reports/report.html', html);
}

// Run the audit
if (require.main === module) {
  runLighthouseAudit().catch(console.error);
}

module.exports = { runLighthouseAudit };
