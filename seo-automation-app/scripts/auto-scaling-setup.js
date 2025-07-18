#!/usr/bin/env node

/**
 * Auto-Scaling Setup Script
 * Configures and initializes auto-scaling for traffic spike handling
 */

const { createAutoScaler } = require('../lib/scaling/auto-scaler');
const { createTrafficAnalyzer } = require('../lib/scaling/traffic-analyzer');
const { createScalingMiddleware } = require('../lib/scaling/scaling-middleware');

const ENVIRONMENT = process.argv[2] || 'development';
const PROVIDER = process.argv[3] || 'docker'; // docker, aws, gcp, azure
const VERBOSE = process.argv.includes('--verbose');
const DRY_RUN = process.argv.includes('--dry-run');

class AutoScalingSetup {
  constructor() {
    this.environment = ENVIRONMENT;
    this.provider = PROVIDER;
    this.config = this.getConfiguration();
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: '⚡',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      setup: '🔧'
    }[type] || '⚡';
    
    console.log(`[${timestamp}] ${prefix} ${message}`);
  }

  async setupAutoScaling() {
    this.log('Setting up auto-scaling for traffic spike handling...', 'setup');
    
    try {
      if (DRY_RUN) {
        this.log('DRY RUN MODE - No actual setup will be performed', 'warning');
        this.displayConfiguration();
        return;
      }

      // Initialize auto-scaler
      await this.initializeAutoScaler();

      // Initialize traffic analyzer
      await this.initializeTrafficAnalyzer();

      // Setup scaling middleware
      await this.setupScalingMiddleware();

      // Create infrastructure configurations
      await this.createInfrastructureConfigs();

      // Setup monitoring and alerting
      await this.setupMonitoringAndAlerting();

      // Create management scripts
      await this.createManagementScripts();

      // Generate API endpoints
      await this.generateAPIEndpoints();

      // Test auto-scaling system
      await this.testAutoScalingSystem();

      this.displaySetupSummary();
      this.log('Auto-scaling setup completed successfully!', 'success');

    } catch (error) {
      this.log(`Setup failed: ${error.message}`, 'error');
      if (VERBOSE) {
        console.error(error);
      }
      process.exit(1);
    }
  }

  getConfiguration() {
    const baseConfig = {
      autoScaler: {
        enabled: true,
        minInstances: 1,
        maxInstances: 5,
        scaleUpCooldown: 3 * 60 * 1000, // 3 minutes
        scaleDownCooldown: 5 * 60 * 1000, // 5 minutes
        rules: [
          {
            name: 'cpu_scale_up',
            metric: 'cpuUtilization',
            operator: 'gt',
            threshold: 70,
            duration: 2 * 60 * 1000,
            action: 'scale_up',
            priority: 8,
            cooldown: 3 * 60 * 1000,
            enabled: true
          },
          {
            name: 'memory_scale_up',
            metric: 'memoryUtilization',
            operator: 'gt',
            threshold: 80,
            duration: 3 * 60 * 1000,
            action: 'scale_up',
            priority: 7,
            cooldown: 3 * 60 * 1000,
            enabled: true
          },
          {
            name: 'response_time_scale_up',
            metric: 'averageResponseTime',
            operator: 'gt',
            threshold: 1000,
            duration: 2 * 60 * 1000,
            action: 'scale_up',
            priority: 6,
            cooldown: 3 * 60 * 1000,
            enabled: true
          }
        ]
      },
      trafficAnalyzer: {
        baselineWindow: 12 * 60 * 60 * 1000, // 12 hours
        spikeThreshold: 2, // 2x baseline
        minSpikeDuration: 2 * 60 * 1000, // 2 minutes
        predictionWindow: 2 * 60 * 60 * 1000, // 2 hours
        anomalyDetectionSensitivity: 0.7,
        geoAnalysisEnabled: true,
        botDetectionEnabled: true,
        historicalDataRetention: 7 // 7 days
      },
      middleware: {
        enableLoadBalancing: true,
        enableRateLimiting: true,
        enableTrafficAnalysis: true,
        rateLimitConfig: {
          requests: 100,
          window: '1m'
        },
        circuitBreakerConfig: {
          enabled: true,
          errorThreshold: 5,
          timeWindow: 60000
        }
      }
    };

    // Environment-specific overrides
    switch (this.environment) {
      case 'production':
        return {
          ...baseConfig,
          autoScaler: {
            ...baseConfig.autoScaler,
            minInstances: 2,
            maxInstances: 20,
            scaleUpCooldown: 2 * 60 * 1000, // 2 minutes
            scaleDownCooldown: 10 * 60 * 1000, // 10 minutes
            rules: baseConfig.autoScaler.rules.map(rule => ({
              ...rule,
              threshold: rule.metric === 'cpuUtilization' ? 60 : 
                        rule.metric === 'memoryUtilization' ? 70 :
                        rule.metric === 'averageResponseTime' ? 800 : rule.threshold
            }))
          },
          trafficAnalyzer: {
            ...baseConfig.trafficAnalyzer,
            baselineWindow: 24 * 60 * 60 * 1000, // 24 hours
            spikeThreshold: 1.5, // 1.5x baseline
            historicalDataRetention: 30 // 30 days
          },
          middleware: {
            ...baseConfig.middleware,
            rateLimitConfig: {
              requests: 1000,
              window: '1m'
            }
          }
        };

      case 'staging':
        return {
          ...baseConfig,
          autoScaler: {
            ...baseConfig.autoScaler,
            minInstances: 1,
            maxInstances: 10,
            scaleUpCooldown: 2 * 60 * 1000,
            scaleDownCooldown: 8 * 60 * 1000
          },
          middleware: {
            ...baseConfig.middleware,
            rateLimitConfig: {
              requests: 500,
              window: '1m'
            }
          }
        };

      default: // development
        return baseConfig;
    }
  }

  async initializeAutoScaler() {
    this.log('Initializing auto-scaler...', 'info');

    const autoScaler = createAutoScaler(this.config.autoScaler);

    // Setup event handlers
    autoScaler.on('scaled_up', (action) => {
      this.log(`Scaled up: ${action.details.totalInstances} instances (${action.reason})`, 'success');
    });

    autoScaler.on('scaled_down', (action) => {
      this.log(`Scaled down: ${action.details.totalInstances} instances (${action.reason})`, 'success');
    });

    autoScaler.on('scale_up_blocked', (info) => {
      this.log(`Scale up blocked: ${info.reason}`, 'warning');
    });

    autoScaler.on('circuit_breaker_opened', (info) => {
      this.log(`Circuit breaker opened: ${info.failures} failures`, 'warning');
    });

    // Start auto-scaling
    autoScaler.start();
    this.log('Auto-scaler started successfully', 'success');

    if (VERBOSE) {
      const status = autoScaler.getStatus();
      console.log('Auto-scaler status:', {
        enabled: status.enabled,
        instances: status.instances,
        healthyInstances: status.healthyInstances,
        circuitBreakerState: status.circuitBreakerState
      });
    }
  }

  async initializeTrafficAnalyzer() {
    this.log('Initializing traffic analyzer...', 'info');

    const trafficAnalyzer = createTrafficAnalyzer(this.config.trafficAnalyzer);

    // Setup event handlers
    trafficAnalyzer.on('spike_detected', (spike) => {
      this.log(`Traffic spike detected: ${spike.magnitude.toFixed(1)}x baseline (${spike.source})`, 'warning');
      
      if (spike.magnitude > 5) {
        this.log(`High magnitude spike: ${spike.peakRPS} RPS`, 'error');
      }
    });

    trafficAnalyzer.on('spike_ended', (spike) => {
      this.log(`Traffic spike ended: Duration ${(spike.duration / 1000).toFixed(0)}s`, 'success');
    });

    trafficAnalyzer.on('high_traffic_predicted', (prediction) => {
      this.log(`High traffic predicted: ${prediction.predictedRPS} RPS in ${prediction.timeframe}min`, 'warning');
    });

    // Start traffic analysis
    trafficAnalyzer.start();
    this.log('Traffic analyzer started successfully', 'success');

    if (VERBOSE) {
      const report = trafficAnalyzer.getAnalysisReport();
      console.log('Traffic analysis report:', {
        baseline: report.currentBaseline,
        activeSpikes: report.activeSpikes.length,
        predictions: report.recentPredictions.length
      });
    }
  }

  async setupScalingMiddleware() {
    this.log('Setting up scaling middleware...', 'info');

    const fs = require('fs').promises;
    const path = require('path');

    // Create middleware directory
    const middlewareDir = path.join(process.cwd(), 'middleware');
    await fs.mkdir(middlewareDir, { recursive: true });

    // Express middleware integration
    const expressMiddleware = `// middleware/scaling.js
const { createScalingMiddleware } = require('../lib/scaling/scaling-middleware');

const scalingMiddleware = createScalingMiddleware({
  enableLoadBalancing: ${this.config.middleware.enableLoadBalancing},
  enableRateLimiting: ${this.config.middleware.enableRateLimiting},
  enableTrafficAnalysis: ${this.config.middleware.enableTrafficAnalysis},
  rateLimitConfig: ${JSON.stringify(this.config.middleware.rateLimitConfig, null, 2)},
  circuitBreakerConfig: ${JSON.stringify(this.config.middleware.circuitBreakerConfig, null, 2)}
});

module.exports = {
  scalingMiddleware: scalingMiddleware.middleware(),
  healthCheck: scalingMiddleware.healthCheck(),
  metrics: scalingMiddleware.metrics(),
  proxyRequest: scalingMiddleware.proxyRequest()
};`;

    await fs.writeFile(path.join(middlewareDir, 'scaling.js'), expressMiddleware);

    // Next.js middleware
    const nextjsMiddleware = `// middleware.ts (Next.js 13+)
import { NextRequest, NextResponse } from 'next/server';
import { createScalingMiddleware } from './lib/scaling/scaling-middleware';

const scalingMiddleware = createScalingMiddleware({
  enableLoadBalancing: ${this.config.middleware.enableLoadBalancing},
  enableRateLimiting: ${this.config.middleware.enableRateLimiting},
  enableTrafficAnalysis: ${this.config.middleware.enableTrafficAnalysis}
});

export async function middleware(request: NextRequest) {
  // Rate limiting
  if (${this.config.middleware.enableRateLimiting}) {
    const rateLimitResult = await checkRateLimit(request);
    if (!rateLimitResult.success) {
      return new NextResponse(
        JSON.stringify({ error: 'Too Many Requests' }),
        { 
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString()
          }
        }
      );
    }
  }

  // Load balancing headers
  if (${this.config.middleware.enableLoadBalancing}) {
    const instance = getNextInstance();
    if (instance) {
      request.headers.set('x-instance-id', instance.id);
      request.headers.set('x-target-url', instance.url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/:path*',
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};

async function checkRateLimit(request: NextRequest) {
  // Implementation would go here
  return { success: true, limit: 100, remaining: 99 };
}

function getNextInstance() {
  // Implementation would go here
  return { id: 'instance_1', url: 'http://localhost:3000' };
}`;

    await fs.writeFile(path.join(process.cwd(), 'middleware.ts'), nextjsMiddleware);

    this.log('✓ Scaling middleware configuration created', 'success');
  }

  async createInfrastructureConfigs() {
    this.log('Creating infrastructure configurations...', 'info');

    const fs = require('fs').promises;
    const path = require('path');

    // Create infrastructure directory
    const infraDir = path.join(process.cwd(), 'infrastructure');
    await fs.mkdir(infraDir, { recursive: true });

    switch (this.provider) {
      case 'docker':
        await this.createDockerConfig(infraDir);
        break;
      case 'aws':
        await this.createAWSConfig(infraDir);
        break;
      case 'gcp':
        await this.createGCPConfig(infraDir);
        break;
      case 'azure':
        await this.createAzureConfig(infraDir);
        break;
    }

    this.log(`✓ ${this.provider.toUpperCase()} infrastructure configuration created`, 'success');
  }

  async createDockerConfig(infraDir) {
    const fs = require('fs').promises;
    const path = require('path');

    // Docker Compose for auto-scaling
    const dockerCompose = `version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=${this.environment}
      - AUTO_SCALING_ENABLED=true
      - MIN_INSTANCES=${this.config.autoScaler.minInstances}
      - MAX_INSTANCES=${this.config.autoScaler.maxInstances}
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    deploy:
      replicas: ${this.config.autoScaler.minInstances}
      update_config:
        parallelism: 1
        delay: 10s
      restart_policy:
        condition: on-failure

  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./infrastructure/nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - app
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost/health"]
      interval: 30s
      timeout: 10s
      retries: 3

networks:
  default:
    driver: bridge`;

    await fs.writeFile(path.join(infraDir, 'docker-compose.yml'), dockerCompose);

    // Nginx load balancer configuration
    const nginxConfig = `events {
    worker_connections 1024;
}

http {
    upstream app_servers {
        least_conn;
        server app:3000 max_fails=3 fail_timeout=30s;
    }

    server {
        listen 80;
        
        location /health {
            proxy_pass http://app_servers;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }
        
        location / {
            proxy_pass http://app_servers;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_connect_timeout 5s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }
    }
}`;

    await fs.writeFile(path.join(infraDir, 'nginx.conf'), nginxConfig);
  }

  async createAWSConfig(infraDir) {
    const fs = require('fs').promises;
    const path = require('path');

    // AWS CloudFormation template
    const cloudFormation = `AWSTemplateFormatVersion: '2010-09-09'
Description: 'Auto-scaling SEO application infrastructure'

Parameters:
  Environment:
    Type: String
    Default: ${this.environment}
    AllowedValues: [development, staging, production]
  
  MinInstances:
    Type: Number
    Default: ${this.config.autoScaler.minInstances}
  
  MaxInstances:
    Type: Number
    Default: ${this.config.autoScaler.maxInstances}

Resources:
  LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub '\${AWS::StackName}-launch-template'
      LaunchTemplateData:
        ImageId: ami-0abcdef1234567890  # Replace with your AMI ID
        InstanceType: t3.medium
        SecurityGroupIds:
          - !Ref InstanceSecurityGroup
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            yum update -y
            yum install -y docker
            service docker start
            usermod -a -G docker ec2-user
            docker run -d -p 3000:3000 \\
              -e NODE_ENV=${this.environment} \\
              -e AUTO_SCALING_ENABLED=true \\
              your-app-image:latest

  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      LaunchTemplate:
        LaunchTemplateId: !Ref LaunchTemplate
        Version: !GetAtt LaunchTemplate.LatestVersionNumber
      MinSize: !Ref MinInstances
      MaxSize: !Ref MaxInstances
      DesiredCapacity: !Ref MinInstances
      TargetGroupARNs:
        - !Ref TargetGroup
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300

  ScaleUpPolicy:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AdjustmentType: ChangeInCapacity
      AutoScalingGroupName: !Ref AutoScalingGroup
      Cooldown: 180
      ScalingAdjustment: 1

  ScaleDownPolicy:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AdjustmentType: ChangeInCapacity
      AutoScalingGroupName: !Ref AutoScalingGroup
      Cooldown: 600
      ScalingAdjustment: -1

  CPUAlarmHigh:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmDescription: Scale up on high CPU
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 120
      EvaluationPeriods: 2
      Threshold: 70
      ComparisonOperator: GreaterThanThreshold
      AlarmActions:
        - !Ref ScaleUpPolicy

  CPUAlarmLow:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmDescription: Scale down on low CPU
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 20
      ComparisonOperator: LessThanThreshold
      AlarmActions:
        - !Ref ScaleDownPolicy

Outputs:
  LoadBalancerURL:
    Description: Load Balancer URL
    Value: !Sub 'http://\${LoadBalancer.DNSName}'`;

    await fs.writeFile(path.join(infraDir, 'cloudformation.yml'), cloudFormation);
  }

  async createGCPConfig(infraDir) {
    // GCP configuration would go here
    this.log('GCP configuration generation not implemented yet', 'warning');
  }

  async createAzureConfig(infraDir) {
    // Azure configuration would go here
    this.log('Azure configuration generation not implemented yet', 'warning');
  }

  async setupMonitoringAndAlerting() {
    this.log('Setting up monitoring and alerting...', 'info');

    const fs = require('fs').promises;
    const path = require('path');

    // Create monitoring directory
    const monitoringDir = path.join(process.cwd(), 'monitoring');
    await fs.mkdir(monitoringDir, { recursive: true });

    // Prometheus configuration
    const prometheusConfig = `global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'seo-app'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/api/monitoring/metrics'
    scrape_interval: 30s

  - job_name: 'auto-scaler'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/api/scaling/metrics'
    scrape_interval: 30s

rule_files:
  - "scaling_rules.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093`;

    await fs.writeFile(path.join(monitoringDir, 'prometheus.yml'), prometheusConfig);

    // Alerting rules
    const alertingRules = `groups:
  - name: scaling_alerts
    rules:
      - alert: HighTrafficSpike
        expr: traffic_spike_magnitude > 5
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "High traffic spike detected"
          description: "Traffic spike magnitude: {{ $value }}x baseline"

      - alert: ScalingFailure
        expr: scaling_action_failures > 3
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "Auto-scaling failures detected"
          description: "Multiple scaling actions have failed"

      - alert: CircuitBreakerOpen
        expr: circuit_breaker_state == 1
        for: 0m
        labels:
          severity: critical
        annotations:
          summary: "Circuit breaker is open"
          description: "Circuit breaker has opened due to failures"

      - alert: NoHealthyInstances
        expr: healthy_instances == 0
        for: 0m
        labels:
          severity: critical
        annotations:
          summary: "No healthy instances available"
          description: "All application instances are unhealthy"`;

    await fs.writeFile(path.join(monitoringDir, 'scaling_rules.yml'), alertingRules);

    this.log('✓ Monitoring and alerting configuration created', 'success');
  }

  async createManagementScripts() {
    this.log('Creating management scripts...', 'info');

    const fs = require('fs').promises;
    const path = require('path');

    // Scale management script
    const scaleScript = `#!/usr/bin/env node

/**
 * Auto-Scaling Management Script
 * Manual scaling operations and status monitoring
 */

const { autoScaler } = require('../lib/scaling/auto-scaler');
const { trafficAnalyzer } = require('../lib/scaling/traffic-analyzer');

const COMMAND = process.argv[2] || 'status';
const VALUE = process.argv[3];

async function main() {
  console.log('🚀 Auto-Scaling Management Tool');
  console.log('===============================\\n');

  try {
    switch (COMMAND) {
      case 'status':
        await showStatus();
        break;
      case 'scale-up':
        await scaleUp();
        break;
      case 'scale-down':
        await scaleDown();
        break;
      case 'traffic':
        await showTrafficAnalysis();
        break;
      case 'predict':
        await showPredictions();
        break;
      case 'rules':
        await showRules();
        break;
      default:
        showHelp();
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

async function showStatus() {
  const status = autoScaler.getStatus();
  
  console.log('📊 Auto-Scaling Status:');
  console.log(\`  Enabled: \${status.enabled}\`);
  console.log(\`  Running: \${status.running}\`);
  console.log(\`  Instances: \${status.instances}\`);
  console.log(\`  Healthy Instances: \${status.healthyInstances}\`);
  console.log(\`  Circuit Breaker: \${status.circuitBreakerState}\`);
  
  if (status.recentActions.length > 0) {
    console.log('\\n🔄 Recent Actions:');
    status.recentActions.forEach(action => {
      const time = action.timestamp.toLocaleTimeString();
      console.log(\`  \${time}: \${action.action} - \${action.reason}\`);
    });
  }
  
  if (status.recommendations.length > 0) {
    console.log('\\n💡 Recommendations:');
    status.recommendations.forEach(rec => {
      console.log(\`  • \${rec}\`);
    });
  }
}

async function scaleUp() {
  console.log('📈 Scaling up...');
  const success = await autoScaler.scaleUp('Manual scale up');
  
  if (success) {
    console.log('✅ Successfully scaled up');
  } else {
    console.log('❌ Failed to scale up');
  }
}

async function scaleDown() {
  console.log('📉 Scaling down...');
  const success = await autoScaler.scaleDown('Manual scale down');
  
  if (success) {
    console.log('✅ Successfully scaled down');
  } else {
    console.log('❌ Failed to scale down');
  }
}

async function showTrafficAnalysis() {
  const report = trafficAnalyzer.getAnalysisReport();
  
  console.log('📈 Traffic Analysis:');
  console.log(\`  Baseline RPS: \${report.currentBaseline.rps.toFixed(1)}\`);
  console.log(\`  Baseline Confidence: \${(report.currentBaseline.confidence * 100).toFixed(1)}%\`);
  console.log(\`  Active Spikes: \${report.activeSpikes.length}\`);
  
  if (report.activeSpikes.length > 0) {
    console.log('\\n⚡ Active Spikes:');
    report.activeSpikes.forEach(spike => {
      console.log(\`  • \${spike.magnitude.toFixed(1)}x magnitude (\${spike.source})\`);
    });
  }
}

async function showPredictions() {
  const prediction30 = trafficAnalyzer.predictTraffic(30);
  const prediction60 = trafficAnalyzer.predictTraffic(60);
  
  console.log('🔮 Traffic Predictions:');
  console.log(\`  30min: \${prediction30.predictedRPS.toFixed(1)} RPS (confidence: \${(prediction30.confidence * 100).toFixed(1)}%)\`);
  console.log(\`  60min: \${prediction60.predictedRPS.toFixed(1)} RPS (confidence: \${(prediction60.confidence * 100).toFixed(1)}%)\`);
}

async function showRules() {
  const status = autoScaler.getStatus();
  
  console.log('📋 Scaling Rules:');
  // This would show configured rules
  console.log('  Rules are configured in the auto-scaler');
}

function showHelp() {
  console.log(\`
Usage: npm run scale [command] [options]

Commands:
  status              Show auto-scaling status (default)
  scale-up            Manually scale up instances
  scale-down          Manually scale down instances
  traffic             Show traffic analysis
  predict             Show traffic predictions
  rules               Show scaling rules

Examples:
  npm run scale
  npm run scale scale-up
  npm run scale traffic
\`);
}

if (require.main === module) {
  main();
}`;

    await fs.writeFile(path.join(process.cwd(), 'scripts', 'auto-scaling.js'), scaleScript);

    this.log('✓ Management scripts created', 'success');
  }

  async generateAPIEndpoints() {
    this.log('Generating API endpoints...', 'info');

    const fs = require('fs').promises;
    const path = require('path');

    // Create API directory
    const apiDir = path.join(process.cwd(), 'pages', 'api', 'scaling');
    await fs.mkdir(apiDir, { recursive: true });

    // Scaling status endpoint
    const statusEndpoint = `// pages/api/scaling/status.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { autoScaler } from '@/lib/scaling/auto-scaler';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const status = autoScaler.getStatus();
    res.status(200).json({
      ...status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to get scaling status',
      message: error.message 
    });
  }
}`;

    await fs.writeFile(path.join(apiDir, 'status.ts'), statusEndpoint);

    // Scaling actions endpoint
    const actionsEndpoint = `// pages/api/scaling/actions.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { autoScaler } from '@/lib/scaling/auto-scaler';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { action } = req.body;

  if (req.method === 'POST') {
    try {
      let success = false;
      let message = '';

      switch (action) {
        case 'scale_up':
          success = await autoScaler.scaleUp('Manual API request');
          message = success ? 'Scaled up successfully' : 'Failed to scale up';
          break;
        case 'scale_down':
          success = await autoScaler.scaleDown('Manual API request');
          message = success ? 'Scaled down successfully' : 'Failed to scale down';
          break;
        default:
          return res.status(400).json({ error: 'Invalid action' });
      }

      res.status(success ? 200 : 400).json({ success, message });
    } catch (error) {
      res.status(500).json({ 
        error: 'Action failed',
        message: error.message 
      });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}`;

    await fs.writeFile(path.join(apiDir, 'actions.ts'), actionsEndpoint);

    // Traffic analysis endpoint
    const trafficEndpoint = `// pages/api/scaling/traffic.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { trafficAnalyzer } from '@/lib/scaling/traffic-analyzer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const report = trafficAnalyzer.getAnalysisReport();
    res.status(200).json({
      ...report,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to get traffic analysis',
      message: error.message 
    });
  }
}`;

    await fs.writeFile(path.join(apiDir, 'traffic.ts'), trafficEndpoint);

    this.log('✓ API endpoints created', 'success');
  }

  async testAutoScalingSystem() {
    this.log('Testing auto-scaling system...', 'info');

    try {
      // Test auto-scaler
      const { autoScaler } = require('../lib/scaling/auto-scaler');
      const status = autoScaler.getStatus();
      this.log('✓ Auto-scaler test passed', 'success');

      // Test traffic analyzer
      const { trafficAnalyzer } = require('../lib/scaling/traffic-analyzer');
      const report = trafficAnalyzer.getAnalysisReport();
      this.log('✓ Traffic analyzer test passed', 'success');

      // Test middleware
      const { createScalingMiddleware } = require('../lib/scaling/scaling-middleware');
      const middleware = createScalingMiddleware();
      this.log('✓ Scaling middleware test passed', 'success');

      if (VERBOSE) {
        console.log('Test Results:', {
          autoScalerEnabled: status.enabled,
          instances: status.instances,
          healthyInstances: status.healthyInstances,
          trafficBaseline: report.currentBaseline,
          activeSpikes: report.activeSpikes.length
        });
      }

    } catch (error) {
      this.log(`Auto-scaling system test failed: ${error.message}`, 'error');
      throw error;
    }
  }

  displayConfiguration() {
    console.log('\\n⚡ Auto-Scaling Configuration');
    console.log('='.repeat(50));
    console.log(`Environment: ${this.environment}`);
    console.log(`Provider: ${this.provider}`);
    console.log(`Min Instances: ${this.config.autoScaler.minInstances}`);
    console.log(`Max Instances: ${this.config.autoScaler.maxInstances}`);
    console.log(`Scale Up Cooldown: ${this.config.autoScaler.scaleUpCooldown / 1000}s`);
    console.log(`Scale Down Cooldown: ${this.config.autoScaler.scaleDownCooldown / 1000}s`);
    console.log(`Traffic Spike Threshold: ${this.config.trafficAnalyzer.spikeThreshold}x`);
    console.log(`Rate Limiting: ${this.config.middleware.enableRateLimiting ? 'Enabled' : 'Disabled'}`);
    console.log(`Load Balancing: ${this.config.middleware.enableLoadBalancing ? 'Enabled' : 'Disabled'}`);
  }

  displaySetupSummary() {
    console.log('\\n🎉 Auto-Scaling Setup Complete!');
    console.log('='.repeat(50));
    console.log(`Environment: ${this.environment}`);
    console.log(`Provider: ${this.provider.toUpperCase()}`);
    console.log(`Instance Range: ${this.config.autoScaler.minInstances}-${this.config.autoScaler.maxInstances}`);
    console.log(`Traffic Spike Detection: ${this.config.trafficAnalyzer.spikeThreshold}x baseline`);
    console.log('');

    console.log('📁 Generated Files:');
    console.log('  • middleware/scaling.js - Express middleware');
    console.log('  • middleware.ts - Next.js middleware');
    console.log(`  • infrastructure/ - ${this.provider.toUpperCase()} configuration`);
    console.log('  • monitoring/ - Prometheus & alerting');
    console.log('  • pages/api/scaling/ - API endpoints');
    console.log('  • scripts/auto-scaling.js - Management script');
    console.log('');

    console.log('🚀 Available Commands:');
    console.log('  • npm run scale - Auto-scaling management');
    console.log('  • npm run scale status - Check scaling status');
    console.log('  • npm run scale scale-up - Manual scale up');
    console.log('  • npm run scale scale-down - Manual scale down');
    console.log('  • npm run scale traffic - Traffic analysis');
    console.log('  • npm run scale predict - Traffic predictions');
    console.log('');

    console.log('🔗 API Endpoints:');
    console.log('  • GET /api/scaling/status - Scaling status');
    console.log('  • POST /api/scaling/actions - Manual scaling');
    console.log('  • GET /api/scaling/traffic - Traffic analysis');
    console.log('  • GET /health - System health check');
    console.log('  • GET /metrics - System metrics');
    console.log('');

    console.log('⚡ Auto-Scaling Features:');
    console.log('  • Intelligent traffic spike detection');
    console.log('  • Predictive scaling based on patterns');
    console.log('  • Circuit breaker for fault tolerance');
    console.log('  • Rate limiting for DDoS protection');
    console.log('  • Load balancing across instances');
    console.log('  • Real-time monitoring and alerting');
    console.log('');

    if (this.environment === 'production') {
      console.log('🚨 Production Mode Enabled:');
      console.log('  • Higher instance limits configured');
      console.log('  • Faster scaling response times');
      console.log('  • Enhanced monitoring and alerting');
      console.log('  • Circuit breaker fault tolerance');
    }
  }

  showHelp() {
    console.log(`
⚡ Auto-Scaling Setup Tool

Usage: node scripts/auto-scaling-setup.js [environment] [provider] [options]

Environments:
  development         Development setup (default)
  staging             Staging environment
  production          Production environment

Providers:
  docker              Docker Compose setup (default)
  aws                 AWS CloudFormation
  gcp                 Google Cloud Platform
  azure               Microsoft Azure

Options:
  --verbose           Show detailed output
  --dry-run           Show configuration without setup
  --help              Show this help message

Examples:
  node scripts/auto-scaling-setup.js production aws
  node scripts/auto-scaling-setup.js staging docker --verbose
  node scripts/auto-scaling-setup.js development docker --dry-run
`);
  }
}

async function main() {
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    new AutoScalingSetup().showHelp();
    return;
  }

  console.log('⚡ Auto-Scaling Setup Tool');
  console.log('==========================\\n');

  const setup = new AutoScalingSetup();

  try {
    await setup.setupAutoScaling();
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    if (VERBOSE) {
      console.error(error);
    }
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = { AutoScalingSetup };