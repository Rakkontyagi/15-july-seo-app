#!/usr/bin/env node

/**
 * Lighthouse Performance Audit Script
 * Following Quinn's recommendation for automated performance testing
 * 
 * This script runs comprehensive Lighthouse audits and generates reports
 * for performance monitoring and regression testing.
 */

const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const fs = require('fs').promises;
const path = require('path');

// Configuration
const AUDIT_CONFIG = {
  // URLs to audit
  urls: [
    'http://localhost:3000',
    'http://localhost:3000/dashboard',
    'http://localhost:3000/generate',
    'http://localhost:3000/content',
    'http://localhost:3000/analytics',
  ],
  
  // Lighthouse options
  options: {
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    formFactor: 'desktop',
    throttling: {
      rttMs: 40,
      throughputKbps: 10240,
      cpuSlowdownMultiplier: 1,
      requestLatencyMs: 0,
      downloadThroughputKbps: 0,
      uploadThroughputKbps: 0,
    },
    screenEmulation: {
      mobile: false,
      width: 1350,
      height: 940,
      deviceScaleFactor: 1,
      disabled: false,
    },
  },
  
  // Performance thresholds (Quinn's standards)
  thresholds: {
    performance: 90,
    accessibility: 95,
    'best-practices': 90,
    seo: 95,
    // Core Web Vitals
    'first-contentful-paint': 1800,
    'largest-contentful-paint': 2500,
    'cumulative-layout-shift': 0.1,
    'total-blocking-time': 200,
  },
};

// Utility functions
const formatScore = (score) => Math.round(score * 100);

const formatMetric = (value, unit = 'ms') => {
  if (unit === 'ms') {
    return `${Math.round(value)}ms`;
  }
  if (unit === 's') {
    return `${(value / 1000).toFixed(2)}s`;
  }
  return value;
};

const getScoreColor = (score, threshold) => {
  if (score >= threshold) return '🟢';
  if (score >= threshold - 10) return '🟡';
  return '🔴';
};

// Main audit function
async function runLighthouseAudit(url, chrome) {
  console.log(`🔍 Auditing: ${url}`);
  
  try {
    const runnerResult = await lighthouse(url, {
      ...AUDIT_CONFIG.options,
      port: chrome.port,
    });
    
    if (!runnerResult) {
      throw new Error('Lighthouse audit failed to return results');
    }
    
    return runnerResult;
  } catch (error) {
    console.error(`❌ Error auditing ${url}:`, error.message);
    return null;
  }
}

// Generate audit report
function generateReport(results) {
  const timestamp = new Date().toISOString();
  const reportData = {
    timestamp,
    summary: {
      totalUrls: results.length,
      passedUrls: 0,
      failedUrls: 0,
      averageScores: {
        performance: 0,
        accessibility: 0,
        'best-practices': 0,
        seo: 0,
      },
    },
    details: [],
    recommendations: [],
  };
  
  // Process results
  results.forEach((result) => {
    if (!result) return;
    
    const { lhr, artifacts } = result;
    const url = lhr.finalUrl;
    
    // Extract scores
    const scores = {
      performance: formatScore(lhr.categories.performance.score),
      accessibility: formatScore(lhr.categories.accessibility.score),
      'best-practices': formatScore(lhr.categories['best-practices'].score),
      seo: formatScore(lhr.categories.seo.score),
    };
    
    // Extract metrics
    const metrics = {
      'first-contentful-paint': lhr.audits['first-contentful-paint'].numericValue,
      'largest-contentful-paint': lhr.audits['largest-contentful-paint'].numericValue,
      'cumulative-layout-shift': lhr.audits['cumulative-layout-shift'].numericValue,
      'total-blocking-time': lhr.audits['total-blocking-time'].numericValue,
      'speed-index': lhr.audits['speed-index'].numericValue,
    };
    
    // Check if URL passed thresholds
    const passed = Object.entries(scores).every(([category, score]) => 
      score >= AUDIT_CONFIG.thresholds[category]
    );
    
    if (passed) {
      reportData.summary.passedUrls++;
    } else {
      reportData.summary.failedUrls++;
    }
    
    // Add to details
    reportData.details.push({
      url,
      scores,
      metrics,
      passed,
      issues: extractIssues(lhr),
    });
    
    // Update averages
    Object.keys(scores).forEach((category) => {
      reportData.summary.averageScores[category] += scores[category];
    });
  });
  
  // Calculate final averages
  const validResults = results.filter(r => r !== null).length;
  Object.keys(reportData.summary.averageScores).forEach((category) => {
    reportData.summary.averageScores[category] = Math.round(
      reportData.summary.averageScores[category] / validResults
    );
  });
  
  // Generate recommendations
  reportData.recommendations = generateRecommendations(reportData.details);
  
  return reportData;
}

// Extract issues from Lighthouse results
function extractIssues(lhr) {
  const issues = [];
  
  // Performance issues
  if (lhr.categories.performance.score < 0.9) {
    const perfAudits = lhr.categories.performance.auditRefs
      .filter(ref => lhr.audits[ref.id].score < 0.9)
      .map(ref => ({
        id: ref.id,
        title: lhr.audits[ref.id].title,
        description: lhr.audits[ref.id].description,
        score: formatScore(lhr.audits[ref.id].score),
      }));
    
    issues.push(...perfAudits);
  }
  
  return issues;
}

// Generate recommendations based on audit results
function generateRecommendations(details) {
  const recommendations = [];
  
  // Performance recommendations
  const avgPerformance = details.reduce((sum, d) => sum + d.scores.performance, 0) / details.length;
  if (avgPerformance < AUDIT_CONFIG.thresholds.performance) {
    recommendations.push({
      category: 'Performance',
      priority: 'High',
      issue: `Average performance score (${Math.round(avgPerformance)}) below threshold (${AUDIT_CONFIG.thresholds.performance})`,
      solution: 'Optimize images, reduce JavaScript bundle size, implement code splitting',
    });
  }
  
  // Accessibility recommendations
  const avgAccessibility = details.reduce((sum, d) => sum + d.scores.accessibility, 0) / details.length;
  if (avgAccessibility < AUDIT_CONFIG.thresholds.accessibility) {
    recommendations.push({
      category: 'Accessibility',
      priority: 'High',
      issue: `Average accessibility score (${Math.round(avgAccessibility)}) below threshold (${AUDIT_CONFIG.thresholds.accessibility})`,
      solution: 'Add alt text to images, improve color contrast, ensure keyboard navigation',
    });
  }
  
  return recommendations;
}

// Save report to file
async function saveReport(reportData) {
  const reportsDir = path.join(process.cwd(), 'reports', 'lighthouse');
  await fs.mkdir(reportsDir, { recursive: true });
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = path.join(reportsDir, `lighthouse-audit-${timestamp}.json`);
  
  await fs.writeFile(reportPath, JSON.stringify(reportData, null, 2));
  
  // Also save a latest report
  const latestPath = path.join(reportsDir, 'latest.json');
  await fs.writeFile(latestPath, JSON.stringify(reportData, null, 2));
  
  return reportPath;
}

// Print console report
function printConsoleReport(reportData) {
  console.log('\n📊 LIGHTHOUSE AUDIT REPORT');
  console.log('=' .repeat(50));
  console.log(`🕐 Timestamp: ${reportData.timestamp}`);
  console.log(`📈 URLs Audited: ${reportData.summary.totalUrls}`);
  console.log(`✅ Passed: ${reportData.summary.passedUrls}`);
  console.log(`❌ Failed: ${reportData.summary.failedUrls}`);
  
  console.log('\n📊 AVERAGE SCORES:');
  Object.entries(reportData.summary.averageScores).forEach(([category, score]) => {
    const threshold = AUDIT_CONFIG.thresholds[category];
    const color = getScoreColor(score, threshold);
    console.log(`${color} ${category.toUpperCase()}: ${score}/100 (threshold: ${threshold})`);
  });
  
  console.log('\n📋 DETAILED RESULTS:');
  reportData.details.forEach((detail) => {
    const status = detail.passed ? '✅' : '❌';
    console.log(`\n${status} ${detail.url}`);
    Object.entries(detail.scores).forEach(([category, score]) => {
      const threshold = AUDIT_CONFIG.thresholds[category];
      const color = getScoreColor(score, threshold);
      console.log(`  ${color} ${category}: ${score}/100`);
    });
    
    // Show key metrics
    console.log(`  ⚡ FCP: ${formatMetric(detail.metrics['first-contentful-paint'])}`);
    console.log(`  ⚡ LCP: ${formatMetric(detail.metrics['largest-contentful-paint'])}`);
    console.log(`  ⚡ CLS: ${detail.metrics['cumulative-layout-shift'].toFixed(3)}`);
  });
  
  if (reportData.recommendations.length > 0) {
    console.log('\n💡 RECOMMENDATIONS:');
    reportData.recommendations.forEach((rec, index) => {
      console.log(`\n${index + 1}. ${rec.category} (${rec.priority} Priority)`);
      console.log(`   Issue: ${rec.issue}`);
      console.log(`   Solution: ${rec.solution}`);
    });
  }
  
  console.log('\n' + '='.repeat(50));
}

// Main execution function
async function main() {
  console.log('🚀 Starting Lighthouse Performance Audit...');
  
  let chrome;
  try {
    // Launch Chrome
    chrome = await chromeLauncher.launch({
      chromeFlags: ['--headless', '--disable-gpu', '--no-sandbox'],
    });
    
    console.log(`🌐 Chrome launched on port ${chrome.port}`);
    
    // Run audits for all URLs
    const results = [];
    for (const url of AUDIT_CONFIG.urls) {
      const result = await runLighthouseAudit(url, chrome);
      results.push(result);
    }
    
    // Generate and save report
    const reportData = generateReport(results);
    const reportPath = await saveReport(reportData);
    
    // Print console report
    printConsoleReport(reportData);
    
    console.log(`\n💾 Full report saved to: ${reportPath}`);
    
    // Exit with error code if any audits failed
    if (reportData.summary.failedUrls > 0) {
      console.log('\n❌ Some audits failed to meet thresholds');
      process.exit(1);
    } else {
      console.log('\n✅ All audits passed!');
    }
    
  } catch (error) {
    console.error('❌ Audit failed:', error);
    process.exit(1);
  } finally {
    if (chrome) {
      await chrome.kill();
    }
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { main, runLighthouseAudit, generateReport };
