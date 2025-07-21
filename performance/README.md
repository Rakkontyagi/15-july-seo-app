# Performance Testing Framework

This directory contains the comprehensive performance testing framework for the SEO Automation App, designed to validate system behavior under 10x expected user load and ensure optimal performance across all environments.

## Overview

The performance testing framework uses K6 to conduct various types of performance tests including baseline, load, stress, spike, and endurance testing. It validates system performance against predefined thresholds and generates detailed reports for analysis.

## Test Types

### 1. Baseline Tests (`baseline-test.js`)
- **Purpose**: Establish performance baselines under optimal conditions
- **Load**: Single user to 10 concurrent users
- **Duration**: 2-5 minutes
- **Thresholds**: 95% of requests under 500ms, error rate < 0.1%
- **Use Case**: Performance validation and baseline establishment

### 2. Load Tests (`load-test.js`)
- **Purpose**: Test system under expected production load
- **Load**: Up to 500 concurrent users (10x expected)
- **Duration**: 40+ minutes with gradual ramp-up
- **Thresholds**: 95% of requests under 1s, error rate < 1%
- **Use Case**: Production readiness validation

### 3. Stress Tests (`stress-test.js`)
- **Purpose**: Test system behavior beyond normal capacity
- **Load**: Up to 2000 concurrent users with spikes
- **Duration**: 30+ minutes with extreme load phases
- **Thresholds**: 99% of requests under 5s, error rate < 5%
- **Use Case**: System breaking point and recovery testing

### 4. Spike Tests (`spike-test.js`)
- **Purpose**: Test system behavior during sudden traffic spikes
- **Load**: Sudden jumps to 1200+ concurrent users
- **Duration**: 10+ minutes with spike patterns
- **Thresholds**: 90% of requests under 3s, system recovery < 60s
- **Use Case**: Traffic surge handling validation

### 5. Endurance Tests (`endurance-test.js`)
- **Purpose**: Test system stability over extended periods
- **Load**: 200-300 concurrent users sustained
- **Duration**: 30-70 minutes continuous load
- **Thresholds**: Performance drift < 30%, memory leaks < 50%
- **Use Case**: Long-term stability and memory leak detection

## Configuration

### K6 Configuration (`k6-config.js`)
Central configuration file containing:
- **Load scenarios** for each test type
- **Performance thresholds** and acceptance criteria
- **Environment configurations** (local, staging, production)
- **Test data sets** (keywords, locations, content types)

### Test Runner (`performance-test-runner.js`)
Orchestrates test execution with features:
- **Test suite management** and execution coordination
- **Report generation** in JSON and HTML formats
- **Threshold evaluation** and pass/fail determination
- **Multi-environment support** with automatic configuration

## Usage

### Prerequisites
1. **Install K6**: Follow [K6 installation guide](https://k6.io/docs/getting-started/installation/)
2. **Install Dependencies**: `npm install`
3. **Environment Setup**: Configure environment variables for target environment

### Running Individual Tests

```bash
# Baseline performance validation
npm run performance:baseline

# Load testing (recommended for regular validation)
npm run performance:load

# Stress testing (validate system limits)
npm run performance:stress

# Spike testing (validate traffic surge handling)
npm run performance:spike

# Endurance testing (validate long-term stability)
npm run performance:endurance
```

### Running Test Suites

```bash
# Full performance test suite (staging)
npm run performance:suite

# Production performance validation
npm run performance:suite:production

# Local development testing
npm run performance:local

# Quick performance validation
npm run performance:validate
```

### Custom Test Execution

```bash
# Run specific test with custom environment
node performance/performance-test-runner.js --test=load --env=staging

# Run test suite with custom environment
node performance/performance-test-runner.js --suite --env=production

# Direct K6 execution
k6 run --env BASE_URL=https://staging.example.com performance/load-test.js
```

## Test Scenarios

### Content Generation Workflow (30% of load)
1. **SERP Analysis**: Keyword ranking analysis
2. **Content Scraping**: Competitor content extraction
3. **SEO Analysis**: Content optimization scoring
4. **Intelligence Analysis**: Comprehensive competitor insights

### SERP Analysis Workflow (30% of load)
1. **Keyword Analysis**: Search result analysis
2. **Competitor Discovery**: Top-ranking competitor identification
3. **Related Keywords**: LSI and semantic keyword extraction

### SEO Analysis Workflow (20% of load)
1. **Content Scoring**: SEO optimization metrics
2. **Competitor Comparison**: Comparative SEO analysis
3. **Recommendation Generation**: Improvement suggestions

### CMS Integration Workflow (20% of load)
1. **Content Publishing**: WordPress/Shopify content creation
2. **Sync Status Monitoring**: Integration status tracking
3. **Platform-specific Operations**: CMS-specific functionality

## Thresholds and Acceptance Criteria

### Response Time Requirements
- **Health Checks**: < 500ms (95th percentile)
- **API Endpoints**: < 1000ms (95th percentile)
- **Content Generation**: < 5000ms (95th percentile)
- **SERP Analysis**: < 2000ms (95th percentile)
- **CMS Publishing**: < 3000ms (95th percentile)

### Error Rate Requirements
- **Baseline Tests**: < 0.1% error rate
- **Load Tests**: < 1% error rate
- **Stress Tests**: < 5% error rate
- **Spike Tests**: < 10% error rate during spikes
- **Endurance Tests**: < 2% error rate over duration

### System Resource Requirements
- **Memory Usage**: < 2GB maximum consumption
- **CPU Usage**: < 30% baseline, < 80% under stress
- **Recovery Time**: < 60s after spike events
- **Performance Drift**: < 30% degradation during endurance

## Report Generation

### Automated Reports
- **JSON Reports**: Detailed metrics and test results
- **HTML Reports**: Visual performance summaries with charts
- **Summary Reports**: High-level performance indicators
- **Trend Analysis**: Performance comparison over time

### Report Locations
- **JSON Reports**: `performance-reports/*.json`
- **HTML Reports**: `performance-reports/*.html`
- **Summary Files**: `performance-reports/*-summary.json`
- **Artifacts**: Uploaded to CI/CD pipeline artifacts

### Key Metrics Tracked
- **Response Times**: Average, P50, P90, P95, P99
- **Error Rates**: HTTP errors, timeouts, failures
- **Throughput**: Requests per second, concurrent users
- **System Health**: Memory usage, CPU utilization
- **Business Metrics**: Content generation success, SERP analysis completion

## CI/CD Integration

### Automated Execution
Performance tests are automatically executed in the CI/CD pipeline:
1. **Staging Deployment**: Triggers performance validation
2. **Performance Testing**: Runs baseline, load, and stress tests
3. **Threshold Evaluation**: Validates results against acceptance criteria
4. **Production Gate**: Blocks production deployment if tests fail

### Pipeline Configuration
```yaml
# GitHub Actions workflow integration
performance-testing:
  runs-on: ubuntu-latest
  needs: deploy-staging
  name: Performance Testing
  steps:
    - name: Install K6
    - name: Run performance tests
    - name: Generate reports
    - name: Validate thresholds
```

### Quality Gates
- **Minimum Score**: 75/100 average performance score
- **Maximum Failures**: ≤ 1 failed test per suite
- **Threshold Compliance**: All defined thresholds must pass
- **System Recovery**: System must recover within 60s after stress

## Environment-Specific Configurations

### Local Development
- **Base URL**: `http://localhost:3000`
- **Reduced Load**: 10x lower concurrent users
- **Shorter Duration**: 50% reduced test duration
- **Relaxed Thresholds**: Development-appropriate limits

### Staging Environment
- **Base URL**: `https://seo-automation-app-staging.vercel.app`
- **Full Load**: Complete 10x load testing
- **Standard Duration**: Full test duration as specified
- **Production Thresholds**: Production-equivalent requirements

### Production Environment
- **Base URL**: `https://seo-automation-app.vercel.app`
- **Conservative Load**: Reduced load to avoid impact
- **Smoke Testing**: Critical path validation only
- **Strict Thresholds**: Enhanced performance requirements

## Troubleshooting

### Common Issues

#### K6 Installation Problems
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install k6

# macOS
brew install k6

# Windows
choco install k6
```

#### Environment Variable Issues
```bash
# Verify environment variables
echo $BASE_URL
echo $K6_ENVIRONMENT

# Set environment variables
export BASE_URL=https://staging.example.com
export K6_ENVIRONMENT=staging
```

#### Test Execution Failures
```bash
# Check K6 version
k6 version

# Validate test configuration
node -e "console.log(require('./performance/k6-config.js'))"

# Debug test execution
k6 run --verbose performance/baseline-test.js
```

### Performance Issues

#### High Response Times
1. **Check System Health**: Verify target environment status
2. **Reduce Load**: Lower concurrent users for debugging
3. **Analyze Bottlenecks**: Review application logs and metrics
4. **Database Performance**: Check query execution times

#### High Error Rates
1. **Verify Endpoints**: Ensure all tested endpoints are available
2. **Check Rate Limits**: Validate API rate limiting configuration
3. **Review Logs**: Analyze application error logs
4. **Network Issues**: Check connectivity and DNS resolution

### Support and Maintenance

#### Regular Maintenance
- **Weekly**: Review performance trends and baselines
- **Monthly**: Update test scenarios and thresholds
- **Quarterly**: Comprehensive performance analysis and optimization

#### Performance Monitoring
- **Real-time**: Monitor performance metrics during tests
- **Historical**: Track performance trends over time
- **Alerting**: Set up alerts for performance degradation

## Best Practices

### Test Design
1. **Realistic Scenarios**: Use actual user workflows and data
2. **Gradual Ramp-up**: Avoid sudden load increases
3. **Proper Teardown**: Ensure clean test completion
4. **Resource Cleanup**: Prevent resource leaks during testing

### Test Execution
1. **Environment Stability**: Ensure stable test environment
2. **Baseline Establishment**: Always run baseline tests first
3. **Consistent Data**: Use same test data for comparison
4. **Regular Execution**: Run tests consistently for trend analysis

### Result Analysis
1. **Threshold Validation**: Always validate against defined thresholds
2. **Trend Analysis**: Compare results with historical data
3. **Root Cause Analysis**: Investigate performance issues promptly
4. **Continuous Improvement**: Update tests based on findings

## Conclusion

This performance testing framework provides comprehensive validation of the SEO Automation App's performance characteristics under various load conditions. Regular execution and analysis of these tests ensures optimal user experience and system reliability across all deployment environments.

For questions or support, refer to the project documentation or contact the development team.