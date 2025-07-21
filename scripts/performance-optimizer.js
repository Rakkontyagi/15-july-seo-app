#!/usr/bin/env node

/**
 * Performance Optimization Script
 * Analyzes and optimizes application performance
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class PerformanceOptimizer {
  constructor() {
    this.rootDir = path.join(__dirname, '..');
    this.results = {
      bundleAnalysis: {},
      memoryUsage: {},
      optimizations: [],
      recommendations: []
    };
  }

  async runOptimization() {
    console.log('🚀 Starting performance optimization...\n');

    try {
      // 1. Clean build environment
      await this.cleanBuildEnvironment();
      
      // 2. Analyze current bundle size
      await this.analyzeBundleSize();
      
      // 3. Optimize dependencies
      await this.optimizeDependencies();
      
      // 4. Check memory usage patterns
      await this.analyzeMemoryUsage();
      
      // 5. Generate optimization report
      this.generateOptimizationReport();
      
      console.log('\n✅ Performance optimization completed!');
      return 0;
      
    } catch (error) {
      console.error('❌ Performance optimization failed:', error.message);
      return 1;
    }
  }

  async cleanBuildEnvironment() {
    console.log('🧹 Cleaning build environment...');
    
    const dirsToClean = [
      '.next',
      'node_modules/.cache',
      '.turbo'
    ];
    
    dirsToClean.forEach(dir => {
      const dirPath = path.join(this.rootDir, dir);
      if (fs.existsSync(dirPath)) {
        console.log(`  Removing ${dir}...`);
        fs.rmSync(dirPath, { recursive: true, force: true });
      }
    });
    
    console.log('  ✅ Build environment cleaned\n');
  }

  async analyzeBundleSize() {
    console.log('📊 Analyzing bundle size...');
    
    try {
      // Create lightweight build for analysis
      const packageJson = JSON.parse(
        fs.readFileSync(path.join(this.rootDir, 'package.json'), 'utf8')
      );
      
      // Analyze package.json dependencies
      const deps = packageJson.dependencies || {};
      const devDeps = packageJson.devDependencies || {};
      
      // Calculate dependency sizes (rough estimates)
      const heavyDependencies = [
        '@google-cloud/language',
        '@next/bundle-analyzer',
        '@sentry/nextjs',
        '@supabase/supabase-js',
        'openai',
        'natural',
        'cheerio',
        'axios'
      ];
      
      const foundHeavyDeps = heavyDependencies.filter(dep => 
        deps[dep] || devDeps[dep]
      );
      
      console.log(`  📦 Total dependencies: ${Object.keys(deps).length}`);
      console.log(`  🔧 Dev dependencies: ${Object.keys(devDeps).length}`);
      console.log(`  🏋️  Heavy dependencies found: ${foundHeavyDeps.length}`);
      
      if (foundHeavyDeps.length > 0) {
        console.log('  🚨 Heavy dependencies:');
        foundHeavyDeps.forEach(dep => {
          console.log(`    - ${dep}`);
        });
      }
      
      this.results.bundleAnalysis = {
        totalDependencies: Object.keys(deps).length,
        devDependencies: Object.keys(devDeps).length,
        heavyDependencies: foundHeavyDeps
      };
      
      console.log('  ✅ Bundle analysis completed\n');
      
    } catch (error) {
      console.log(`  ⚠️  Bundle analysis failed: ${error.message}\n`);
    }
  }

  async optimizeDependencies() {
    console.log('⚡ Optimizing dependencies...');
    
    const optimizations = [];
    
    // Check for duplicate functionality
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(this.rootDir, 'package.json'), 'utf8')
    );
    
    const deps = packageJson.dependencies || {};
    
    // Look for optimization opportunities
    const optimizationChecks = [
      {
        name: 'Lodash tree-shaking',
        check: () => deps['lodash'],
        suggestion: 'Use lodash-es or specific lodash imports for better tree-shaking'
      },
      {
        name: 'Moment.js replacement',
        check: () => deps['moment'],
        suggestion: 'Replace moment.js with date-fns for smaller bundle size'
      },
      {
        name: 'Bundle analyzer in production',
        check: () => deps['@next/bundle-analyzer'],
        suggestion: 'Move @next/bundle-analyzer to devDependencies'
      },
      {
        name: 'Heavy testing libraries in production',
        check: () => deps['@testing-library/react'] || deps['jest'],
        suggestion: 'Move testing libraries to devDependencies'
      }
    ];
    
    optimizationChecks.forEach(({ name, check, suggestion }) => {
      if (check()) {
        optimizations.push({ name, suggestion });
        console.log(`  ⚠️  ${name}: ${suggestion}`);
      }
    });
    
    if (optimizations.length === 0) {
      console.log('  ✅ No obvious dependency optimizations needed');
    }
    
    this.results.optimizations = optimizations;
    console.log('  ✅ Dependency optimization analysis completed\n');
  }

  async analyzeMemoryUsage() {
    console.log('🧠 Analyzing memory usage patterns...');
    
    try {
      // Get current memory usage
      const memUsage = process.memoryUsage();
      
      console.log('  📈 Current memory usage:');
      console.log(`    RSS: ${Math.round(memUsage.rss / 1024 / 1024)}MB`);
      console.log(`    Heap Used: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`);
      console.log(`    Heap Total: ${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`);
      console.log(`    External: ${Math.round(memUsage.external / 1024 / 1024)}MB`);
      
      // Check for memory-intensive files
      const sourceDir = path.join(this.rootDir, 'src');
      const memoryIntensivePatterns = [
        'import.*from.*lodash',
        'require.*cheerio',
        'new.*Buffer',
        'fs\\.readFileSync.*large',
        'JSON\\.parse.*large'
      ];
      
      // Simple file analysis for memory patterns
      let potentialIssues = 0;
      
      function analyzeDirectory(dir) {
        const files = fs.readdirSync(dir, { withFileTypes: true });
        
        files.forEach(file => {
          if (file.isDirectory() && !file.name.startsWith('.')) {
            analyzeDirectory(path.join(dir, file.name));
          } else if (file.name.endsWith('.ts') || file.name.endsWith('.tsx')) {
            const filePath = path.join(dir, file.name);
            const content = fs.readFileSync(filePath, 'utf8');
            
            // Check for potential memory issues
            if (content.length > 50000) { // Large files
              console.log(`    ⚠️  Large file detected: ${file.name} (${Math.round(content.length / 1024)}KB)`);
              potentialIssues++;
            }
            
            // Check for memory patterns
            memoryIntensivePatterns.forEach(pattern => {
              if (new RegExp(pattern).test(content)) {
                console.log(`    ⚠️  Memory pattern in ${file.name}: ${pattern}`);
                potentialIssues++;
              }
            });
          }
        });
      }
      
      if (fs.existsSync(sourceDir)) {
        analyzeDirectory(sourceDir);
      }
      
      if (potentialIssues === 0) {
        console.log('  ✅ No obvious memory issues detected');
      } else {
        console.log(`  ⚠️  Found ${potentialIssues} potential memory optimization opportunities`);
      }
      
      this.results.memoryUsage = {
        current: memUsage,
        potentialIssues
      };
      
      console.log('  ✅ Memory analysis completed\n');
      
    } catch (error) {
      console.log(`  ⚠️  Memory analysis failed: ${error.message}\n`);
    }
  }

  generateOptimizationReport() {
    console.log('📋 Performance Optimization Report');
    console.log('==================================\n');
    
    // Bundle Analysis Summary
    if (this.results.bundleAnalysis.totalDependencies) {
      console.log('📦 Bundle Analysis:');
      console.log(`   Dependencies: ${this.results.bundleAnalysis.totalDependencies}`);
      console.log(`   Heavy deps: ${this.results.bundleAnalysis.heavyDependencies.length}`);
      
      if (this.results.bundleAnalysis.heavyDependencies.length > 0) {
        console.log('   Consider optimizing:');
        this.results.bundleAnalysis.heavyDependencies.forEach(dep => {
          console.log(`   - ${dep}`);
        });
      }
      console.log('');
    }
    
    // Optimization Opportunities
    if (this.results.optimizations.length > 0) {
      console.log('⚡ Optimization Opportunities:');
      this.results.optimizations.forEach((opt, index) => {
        console.log(`   ${index + 1}. ${opt.name}`);
        console.log(`      ${opt.suggestion}`);
      });
      console.log('');
    }
    
    // Memory Usage
    if (this.results.memoryUsage.current) {
      const mem = this.results.memoryUsage.current;
      console.log('🧠 Memory Usage:');
      console.log(`   Heap Used: ${Math.round(mem.heapUsed / 1024 / 1024)}MB`);
      console.log(`   Total RSS: ${Math.round(mem.rss / 1024 / 1024)}MB`);
      
      if (this.results.memoryUsage.potentialIssues > 0) {
        console.log(`   ⚠️  Potential issues: ${this.results.memoryUsage.potentialIssues}`);
      }
      console.log('');
    }
    
    // General Recommendations
    console.log('💡 General Recommendations:');
    console.log('   1. Enable compression in production');
    console.log('   2. Use dynamic imports for heavy components');
    console.log('   3. Implement proper caching strategies');
    console.log('   4. Optimize images with next/image');
    console.log('   5. Consider code splitting for large bundles');
    console.log('   6. Use React.memo for expensive components');
    console.log('   7. Implement service worker for caching');
    console.log('');
    
    // Performance Budget
    console.log('🎯 Performance Budget Targets:');
    console.log('   - Initial JS bundle: < 200KB (gzipped)');
    console.log('   - Total bundle size: < 1MB (gzipped)');
    console.log('   - First Contentful Paint: < 1.5s');
    console.log('   - Largest Contentful Paint: < 2.5s');
    console.log('   - Time to Interactive: < 3.0s');
    console.log('   - Cumulative Layout Shift: < 0.1');
  }
}

// Performance measurement utilities
function measurePerformance(name, fn) {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  console.log(`⏱️  ${name}: ${(end - start).toFixed(2)}ms`);
  return result;
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log('Performance Optimization Script\n');
    console.log('Usage: node performance-optimizer.js [options]\n');
    console.log('Options:');
    console.log('  --help, -h        Show this help message');
    console.log('  --quick           Run quick analysis only');
    console.log('  --memory-only     Only analyze memory usage');
    console.log('  --deps-only       Only analyze dependencies');
    return 0;
  }

  const optimizer = new PerformanceOptimizer();
  
  if (args.includes('--quick')) {
    console.log('🏃 Running quick performance analysis...\n');
    await optimizer.analyzeMemoryUsage();
    return 0;
  }
  
  if (args.includes('--memory-only')) {
    await optimizer.analyzeMemoryUsage();
    return 0;
  }
  
  if (args.includes('--deps-only')) {
    await optimizer.optimizeDependencies();
    return 0;
  }
  
  return await optimizer.runOptimization();
}

if (require.main === module) {
  main()
    .then(exitCode => process.exit(exitCode))
    .catch(error => {
      console.error('💥 Performance optimization failed:', error);
      process.exit(1);
    });
}

module.exports = { PerformanceOptimizer };