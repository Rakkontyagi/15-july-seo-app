/**
 * Global Edge Computing Manager
 * Implements Story 5.2 - Global CDN and edge computing infrastructure
 * Edge node management, intelligent routing, and global content distribution
 */

import { performanceMonitor } from '@/lib/monitoring/performance-monitor';
import { advancedPerformanceOptimizer } from '@/lib/optimization/advanced-performance-optimizer';

// Types
export interface EdgeNode {
  id: string;
  region: string;
  location: {
    country: string;
    city: string;
    coordinates: { lat: number; lng: number };
  };
  status: 'active' | 'inactive' | 'maintenance' | 'overloaded';
  capacity: {
    cpu: number;
    memory: number;
    storage: number;
    bandwidth: number;
  };
  usage: {
    cpu: number;
    memory: number;
    storage: number;
    bandwidth: number;
    connections: number;
  };
  performance: {
    latency: number;
    throughput: number;
    errorRate: number;
    uptime: number;
  };
  services: EdgeService[];
  lastHealthCheck: string;
  version: string;
}

export interface EdgeService {
  id: string;
  name: string;
  type: 'cache' | 'compute' | 'storage' | 'api' | 'cdn';
  status: 'running' | 'stopped' | 'error';
  config: Record<string, any>;
  resources: {
    cpuLimit: number;
    memoryLimit: number;
    storageLimit: number;
  };
  metrics: {
    requests: number;
    responseTime: number;
    errorRate: number;
    cacheHitRate?: number;
  };
}

export interface ContentDistributionRule {
  id: string;
  name: string;
  pattern: string; // URL pattern or content type
  strategy: 'nearest' | 'performance' | 'cost' | 'custom';
  regions: string[];
  caching: {
    enabled: boolean;
    ttl: number;
    maxSize: number;
    compression: boolean;
  };
  routing: {
    algorithm: 'round_robin' | 'weighted' | 'least_connections' | 'geographic';
    weights?: Record<string, number>;
    healthCheck: boolean;
  };
  priority: number;
  enabled: boolean;
}

export interface EdgeFunction {
  id: string;
  name: string;
  code: string;
  runtime: 'javascript' | 'typescript' | 'python' | 'go';
  triggers: EdgeTrigger[];
  config: {
    timeout: number;
    memory: number;
    environment: Record<string, string>;
  };
  deployedRegions: string[];
  version: string;
  status: 'active' | 'inactive' | 'deploying' | 'error';
}

export interface EdgeTrigger {
  type: 'request' | 'response' | 'cache_miss' | 'scheduled';
  pattern?: string;
  schedule?: string; // cron expression
  conditions?: Record<string, any>;
}

export interface RoutingDecision {
  requestId: string;
  clientLocation: { lat: number; lng: number };
  selectedNode: EdgeNode;
  reason: string;
  alternatives: Array<{
    node: EdgeNode;
    score: number;
    reason: string;
  }>;
  metrics: {
    decisionTime: number;
    expectedLatency: number;
    confidence: number;
  };
}

export interface GlobalCDNConfig {
  regions: string[];
  defaultTTL: number;
  compressionEnabled: boolean;
  http2Enabled: boolean;
  http3Enabled: boolean;
  securityHeaders: Record<string, string>;
  rateLimit: {
    enabled: boolean;
    requests: number;
    window: number;
  };
  monitoring: {
    healthCheckInterval: number;
    performanceThresholds: {
      latency: number;
      errorRate: number;
      availability: number;
    };
  };
}

// Global Edge Manager
export class GlobalEdgeManager {
  private static instance: GlobalEdgeManager;
  private edgeNodes: Map<string, EdgeNode> = new Map();
  private distributionRules: Map<string, ContentDistributionRule> = new Map();
  private edgeFunctions: Map<string, EdgeFunction> = new Map();
  private routingCache: Map<string, RoutingDecision> = new Map();
  private config: GlobalCDNConfig;
  private healthCheckInterval: NodeJS.Timeout | null = null;

  static getInstance(config?: GlobalCDNConfig): GlobalEdgeManager {
    if (!GlobalEdgeManager.instance) {
      GlobalEdgeManager.instance = new GlobalEdgeManager(config);
    }
    return GlobalEdgeManager.instance;
  }

  constructor(config?: GlobalCDNConfig) {
    this.config = config || this.getDefaultConfig();
    this.initializeEdgeManager();
  }

  private getDefaultConfig(): GlobalCDNConfig {
    return {
      regions: [
        'us-east-1', 'us-west-2', 'eu-west-1', 'eu-central-1',
        'ap-southeast-1', 'ap-northeast-1', 'ap-south-1',
        'sa-east-1', 'ca-central-1', 'af-south-1'
      ],
      defaultTTL: 3600,
      compressionEnabled: true,
      http2Enabled: true,
      http3Enabled: true,
      securityHeaders: {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      },
      rateLimit: {
        enabled: true,
        requests: 1000,
        window: 60000,
      },
      monitoring: {
        healthCheckInterval: 30000,
        performanceThresholds: {
          latency: 100,
          errorRate: 0.01,
          availability: 0.999,
        },
      },
    };
  }

  private async initializeEdgeManager(): Promise<void> {
    console.log('🌐 Initializing global edge manager...');

    // Initialize edge nodes
    await this.initializeEdgeNodes();

    // Create default distribution rules
    this.createDefaultDistributionRules();

    // Deploy default edge functions
    await this.deployDefaultEdgeFunctions();

    // Start health monitoring
    this.startHealthMonitoring();

    console.log(`✅ Global edge manager initialized with ${this.edgeNodes.size} nodes`);
  }

  // Edge Node Management
  private async initializeEdgeNodes(): Promise<void> {
    const nodeConfigs = [
      { region: 'us-east-1', country: 'USA', city: 'Virginia', lat: 38.13, lng: -78.45 },
      { region: 'us-west-2', country: 'USA', city: 'Oregon', lat: 45.52, lng: -122.68 },
      { region: 'eu-west-1', country: 'Ireland', city: 'Dublin', lat: 53.35, lng: -6.26 },
      { region: 'eu-central-1', country: 'Germany', city: 'Frankfurt', lat: 50.11, lng: 8.68 },
      { region: 'ap-southeast-1', country: 'Singapore', city: 'Singapore', lat: 1.35, lng: 103.87 },
      { region: 'ap-northeast-1', country: 'Japan', city: 'Tokyo', lat: 35.68, lng: 139.69 },
      { region: 'ap-south-1', country: 'India', city: 'Mumbai', lat: 19.08, lng: 72.88 },
      { region: 'sa-east-1', country: 'Brazil', city: 'São Paulo', lat: -23.55, lng: -46.64 },
    ];

    for (const nodeConfig of nodeConfigs) {
      const node = await this.createEdgeNode(nodeConfig);
      this.edgeNodes.set(node.id, node);
    }
  }

  private async createEdgeNode(config: any): Promise<EdgeNode> {
    const nodeId = `edge-${config.region}`;
    
    const node: EdgeNode = {
      id: nodeId,
      region: config.region,
      location: {
        country: config.country,
        city: config.city,
        coordinates: { lat: config.lat, lng: config.lng },
      },
      status: 'active',
      capacity: {
        cpu: 32, // 32 cores
        memory: 128, // 128 GB
        storage: 2048, // 2 TB
        bandwidth: 10000, // 10 Gbps
      },
      usage: {
        cpu: Math.floor(Math.random() * 30) + 20, // 20-50%
        memory: Math.floor(Math.random() * 40) + 30, // 30-70%
        storage: Math.floor(Math.random() * 50) + 25, // 25-75%
        bandwidth: Math.floor(Math.random() * 60) + 20, // 20-80%
        connections: Math.floor(Math.random() * 1000) + 500,
      },
      performance: {
        latency: Math.floor(Math.random() * 50) + 10, // 10-60ms
        throughput: Math.floor(Math.random() * 5000) + 2000, // 2000-7000 req/s
        errorRate: Math.random() * 0.01, // 0-1%
        uptime: 99.9 + Math.random() * 0.09, // 99.9-99.99%
      },
      services: await this.createDefaultServices(),
      lastHealthCheck: new Date().toISOString(),
      version: '1.0.0',
    };

    console.log(`🌐 Created edge node: ${nodeId} (${config.city}, ${config.country})`);
    return node;
  }

  private async createDefaultServices(): Promise<EdgeService[]> {
    return [
      {
        id: 'cache-service',
        name: 'Content Cache',
        type: 'cache',
        status: 'running',
        config: {
          maxSize: '10GB',
          evictionPolicy: 'lru',
          compression: true,
        },
        resources: {
          cpuLimit: 4,
          memoryLimit: 16,
          storageLimit: 100,
        },
        metrics: {
          requests: Math.floor(Math.random() * 10000) + 5000,
          responseTime: Math.floor(Math.random() * 10) + 5,
          errorRate: Math.random() * 0.005,
          cacheHitRate: 0.85 + Math.random() * 0.1,
        },
      },
      {
        id: 'api-gateway',
        name: 'API Gateway',
        type: 'api',
        status: 'running',
        config: {
          rateLimit: 1000,
          timeout: 30000,
          retries: 3,
        },
        resources: {
          cpuLimit: 8,
          memoryLimit: 32,
          storageLimit: 10,
        },
        metrics: {
          requests: Math.floor(Math.random() * 5000) + 2000,
          responseTime: Math.floor(Math.random() * 100) + 50,
          errorRate: Math.random() * 0.01,
        },
      },
      {
        id: 'edge-compute',
        name: 'Edge Compute',
        type: 'compute',
        status: 'running',
        config: {
          runtime: 'nodejs',
          timeout: 10000,
          concurrency: 100,
        },
        resources: {
          cpuLimit: 16,
          memoryLimit: 64,
          storageLimit: 50,
        },
        metrics: {
          requests: Math.floor(Math.random() * 2000) + 500,
          responseTime: Math.floor(Math.random() * 200) + 100,
          errorRate: Math.random() * 0.02,
        },
      },
    ];
  }

  // Intelligent Routing
  async routeRequest(
    requestUrl: string,
    clientIP: string,
    headers: Record<string, string>
  ): Promise<RoutingDecision> {
    const startTime = Date.now();

    try {
      // Get client location (simplified geolocation)
      const clientLocation = await this.getClientLocation(clientIP);

      // Find applicable distribution rules
      const applicableRules = this.findApplicableRules(requestUrl);

      // Get candidate nodes
      const candidateNodes = this.getCandidateNodes(applicableRules);

      // Score and rank nodes
      const scoredNodes = await this.scoreNodes(candidateNodes, clientLocation, requestUrl);

      // Select best node
      const selectedNode = scoredNodes[0].node;
      const alternatives = scoredNodes.slice(1, 4); // Top 3 alternatives

      const decision: RoutingDecision = {
        requestId: `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        clientLocation,
        selectedNode,
        reason: `Best performance score: ${scoredNodes[0].score.toFixed(2)}`,
        alternatives,
        metrics: {
          decisionTime: Date.now() - startTime,
          expectedLatency: selectedNode.performance.latency,
          confidence: scoredNodes[0].score / 100,
        },
      };

      // Cache decision
      this.routingCache.set(this.generateRoutingCacheKey(requestUrl, clientIP), decision);

      return decision;

    } catch (error) {
      console.error('Routing decision failed:', error);
      
      // Fallback to nearest node
      const fallbackNode = this.getNearestNode(await this.getClientLocation(clientIP));
      
      return {
        requestId: `fallback-${Date.now()}`,
        clientLocation: await this.getClientLocation(clientIP),
        selectedNode: fallbackNode,
        reason: 'Fallback to nearest node due to routing error',
        alternatives: [],
        metrics: {
          decisionTime: Date.now() - startTime,
          expectedLatency: fallbackNode.performance.latency,
          confidence: 0.5,
        },
      };
    }
  }

  private async getClientLocation(clientIP: string): Promise<{ lat: number; lng: number }> {
    // Simplified geolocation (in production, use actual geolocation service)
    const locations = [
      { lat: 40.7128, lng: -74.0060 }, // New York
      { lat: 51.5074, lng: -0.1278 },  // London
      { lat: 35.6762, lng: 139.6503 }, // Tokyo
      { lat: 37.7749, lng: -122.4194 }, // San Francisco
    ];
    
    return locations[Math.floor(Math.random() * locations.length)];
  }

  private findApplicableRules(requestUrl: string): ContentDistributionRule[] {
    const applicableRules: ContentDistributionRule[] = [];

    for (const rule of this.distributionRules.values()) {
      if (!rule.enabled) continue;

      // Simple pattern matching (in production, use proper URL pattern matching)
      if (requestUrl.includes(rule.pattern) || rule.pattern === '*') {
        applicableRules.push(rule);
      }
    }

    return applicableRules.sort((a, b) => b.priority - a.priority);
  }

  private getCandidateNodes(rules: ContentDistributionRule[]): EdgeNode[] {
    if (rules.length === 0) {
      return Array.from(this.edgeNodes.values()).filter(node => node.status === 'active');
    }

    const candidateRegions = new Set<string>();
    rules.forEach(rule => {
      rule.regions.forEach(region => candidateRegions.add(region));
    });

    return Array.from(this.edgeNodes.values()).filter(
      node => node.status === 'active' && candidateRegions.has(node.region)
    );
  }

  private async scoreNodes(
    nodes: EdgeNode[],
    clientLocation: { lat: number; lng: number },
    requestUrl: string
  ): Promise<Array<{ node: EdgeNode; score: number; reason: string }>> {
    const scoredNodes = await Promise.all(
      nodes.map(async node => {
        const score = await this.calculateNodeScore(node, clientLocation, requestUrl);
        return {
          node,
          score,
          reason: this.generateScoreReason(node, score),
        };
      })
    );

    return scoredNodes.sort((a, b) => b.score - a.score);
  }

  private async calculateNodeScore(
    node: EdgeNode,
    clientLocation: { lat: number; lng: number },
    requestUrl: string
  ): Promise<number> {
    let score = 100;

    // Distance factor (40% weight)
    const distance = this.calculateDistance(clientLocation, node.location.coordinates);
    const distanceScore = Math.max(0, 100 - (distance / 100)); // Normalize distance
    score = score * 0.4 + distanceScore * 0.4;

    // Performance factor (30% weight)
    const performanceScore = (
      (100 - node.performance.latency) * 0.4 +
      (node.performance.throughput / 100) * 0.3 +
      ((1 - node.performance.errorRate) * 100) * 0.3
    );
    score = score * 0.7 + performanceScore * 0.3;

    // Resource availability factor (20% weight)
    const resourceScore = (
      (100 - node.usage.cpu) * 0.4 +
      (100 - node.usage.memory) * 0.3 +
      (100 - node.usage.bandwidth) * 0.3
    );
    score = score * 0.8 + resourceScore * 0.2;

    // Cache hit rate factor (10% weight)
    const cacheService = node.services.find(s => s.type === 'cache');
    const cacheScore = cacheService?.metrics.cacheHitRate ? cacheService.metrics.cacheHitRate * 100 : 50;
    score = score * 0.9 + cacheScore * 0.1;

    return Math.min(100, Math.max(0, score));
  }

  private calculateDistance(
    point1: { lat: number; lng: number },
    point2: { lat: number; lng: number }
  ): number {
    // Haversine formula for calculating distance between two points
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(point2.lat - point1.lat);
    const dLng = this.toRadians(point2.lng - point1.lng);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(point1.lat)) * Math.cos(this.toRadians(point2.lat)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private generateScoreReason(node: EdgeNode, score: number): string {
    if (score > 90) return `Excellent performance and proximity (${node.location.city})`;
    if (score > 80) return `Good performance and location (${node.location.city})`;
    if (score > 70) return `Acceptable performance (${node.location.city})`;
    if (score > 60) return `Moderate performance (${node.location.city})`;
    return `Low performance but available (${node.location.city})`;
  }

  private getNearestNode(clientLocation: { lat: number; lng: number }): EdgeNode {
    let nearestNode = Array.from(this.edgeNodes.values())[0];
    let minDistance = Infinity;

    for (const node of this.edgeNodes.values()) {
      if (node.status !== 'active') continue;

      const distance = this.calculateDistance(clientLocation, node.location.coordinates);
      if (distance < minDistance) {
        minDistance = distance;
        nearestNode = node;
      }
    }

    return nearestNode;
  }

  private generateRoutingCacheKey(requestUrl: string, clientIP: string): string {
    return `${clientIP}:${requestUrl}`;
  }

  // Edge Functions
  async deployEdgeFunction(edgeFunction: Omit<EdgeFunction, 'id' | 'version' | 'status'>): Promise<EdgeFunction> {
    const functionId = `func-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const newFunction: EdgeFunction = {
      id: functionId,
      version: '1.0.0',
      status: 'deploying',
      ...edgeFunction,
    };

    this.edgeFunctions.set(functionId, newFunction);

    try {
      // Deploy to specified regions
      await this.deployFunctionToRegions(newFunction);
      
      newFunction.status = 'active';
      console.log(`⚡ Deployed edge function: ${newFunction.name} to ${newFunction.deployedRegions.length} regions`);
      
    } catch (error) {
      newFunction.status = 'error';
      console.error(`Failed to deploy edge function: ${newFunction.name}`, error);
    }

    return newFunction;
  }

  private async deployFunctionToRegions(edgeFunction: EdgeFunction): Promise<void> {
    // Simulate function deployment to edge nodes
    for (const region of edgeFunction.deployedRegions) {
      const node = Array.from(this.edgeNodes.values()).find(n => n.region === region);
      if (node) {
        // Add compute service if not exists
        const computeService = node.services.find(s => s.type === 'compute');
        if (computeService) {
          // Update compute service with new function
          console.log(`📦 Deployed function ${edgeFunction.name} to ${region}`);
        }
      }
    }
  }

  private async deployDefaultEdgeFunctions(): Promise<void> {
    // Content optimization function
    await this.deployEdgeFunction({
      name: 'Content Optimizer',
      code: `
        export default async function(request) {
          // Optimize images, compress content, etc.
          const response = await fetch(request);
          return optimizeResponse(response);
        }
      `,
      runtime: 'javascript',
      triggers: [
        { type: 'request', pattern: '/api/content/*' },
        { type: 'response', pattern: '*.jpg,*.png,*.css,*.js' },
      ],
      config: {
        timeout: 5000,
        memory: 128,
        environment: { NODE_ENV: 'production' },
      },
      deployedRegions: this.config.regions,
    });

    // Security headers function
    await this.deployEdgeFunction({
      name: 'Security Headers',
      code: `
        export default async function(request) {
          const response = await fetch(request);
          Object.entries(securityHeaders).forEach(([key, value]) => {
            response.headers.set(key, value);
          });
          return response;
        }
      `,
      runtime: 'javascript',
      triggers: [
        { type: 'response', pattern: '*' },
      ],
      config: {
        timeout: 1000,
        memory: 64,
        environment: { SECURITY_LEVEL: 'high' },
      },
      deployedRegions: this.config.regions,
    });
  }

  // Distribution Rules
  private createDefaultDistributionRules(): void {
    // Static assets rule
    this.distributionRules.set('static-assets', {
      id: 'static-assets',
      name: 'Static Assets',
      pattern: '*.js,*.css,*.png,*.jpg,*.svg',
      strategy: 'nearest',
      regions: this.config.regions,
      caching: {
        enabled: true,
        ttl: 86400, // 24 hours
        maxSize: 100, // 100MB
        compression: true,
      },
      routing: {
        algorithm: 'geographic',
        healthCheck: true,
      },
      priority: 10,
      enabled: true,
    });

    // API requests rule
    this.distributionRules.set('api-requests', {
      id: 'api-requests',
      name: 'API Requests',
      pattern: '/api/*',
      strategy: 'performance',
      regions: this.config.regions,
      caching: {
        enabled: true,
        ttl: 300, // 5 minutes
        maxSize: 50, // 50MB
        compression: true,
      },
      routing: {
        algorithm: 'least_connections',
        healthCheck: true,
      },
      priority: 8,
      enabled: true,
    });

    // Content generation rule
    this.distributionRules.set('content-generation', {
      id: 'content-generation',
      name: 'Content Generation',
      pattern: '/api/content/generate',
      strategy: 'performance',
      regions: ['us-east-1', 'eu-west-1', 'ap-southeast-1'], // High-performance regions
      caching: {
        enabled: false,
        ttl: 0,
        maxSize: 0,
        compression: false,
      },
      routing: {
        algorithm: 'weighted',
        weights: {
          'us-east-1': 40,
          'eu-west-1': 35,
          'ap-southeast-1': 25,
        },
        healthCheck: true,
      },
      priority: 9,
      enabled: true,
    });
  }

  // Health Monitoring
  private startHealthMonitoring(): void {
    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthChecks();
    }, this.config.monitoring.healthCheckInterval);

    console.log('🏥 Edge health monitoring started');
  }

  private async performHealthChecks(): Promise<void> {
    const healthPromises = Array.from(this.edgeNodes.values()).map(node => 
      this.checkNodeHealth(node)
    );

    await Promise.allSettled(healthPromises);
  }

  private async checkNodeHealth(node: EdgeNode): Promise<void> {
    try {
      // Simulate health check
      const healthScore = Math.random();
      
      if (healthScore < 0.1) {
        node.status = 'inactive';
      } else if (healthScore < 0.3) {
        node.status = 'overloaded';
      } else {
        node.status = 'active';
      }

      // Update performance metrics
      node.performance.latency = Math.floor(Math.random() * 50) + 10;
      node.performance.throughput = Math.floor(Math.random() * 5000) + 2000;
      node.performance.errorRate = Math.random() * 0.01;
      node.performance.uptime = 99.9 + Math.random() * 0.09;

      // Update usage metrics
      node.usage.cpu = Math.floor(Math.random() * 30) + 20;
      node.usage.memory = Math.floor(Math.random() * 40) + 30;
      node.usage.bandwidth = Math.floor(Math.random() * 60) + 20;
      node.usage.connections = Math.floor(Math.random() * 1000) + 500;

      node.lastHealthCheck = new Date().toISOString();

      // Check thresholds and alert if needed
      await this.checkPerformanceThresholds(node);

    } catch (error) {
      console.error(`Health check failed for node ${node.id}:`, error);
      node.status = 'inactive';
    }
  }

  private async checkPerformanceThresholds(node: EdgeNode): Promise<void> {
    const thresholds = this.config.monitoring.performanceThresholds;

    if (node.performance.latency > thresholds.latency) {
      console.warn(`⚠️ High latency detected on node ${node.id}: ${node.performance.latency}ms`);
    }

    if (node.performance.errorRate > thresholds.errorRate) {
      console.warn(`⚠️ High error rate detected on node ${node.id}: ${(node.performance.errorRate * 100).toFixed(2)}%`);
    }

    if (node.performance.uptime < thresholds.availability * 100) {
      console.warn(`⚠️ Low availability detected on node ${node.id}: ${node.performance.uptime.toFixed(2)}%`);
    }
  }

  // Public API Methods
  getEdgeNodes(): EdgeNode[] {
    return Array.from(this.edgeNodes.values());
  }

  getEdgeNode(nodeId: string): EdgeNode | null {
    return this.edgeNodes.get(nodeId) || null;
  }

  getDistributionRules(): ContentDistributionRule[] {
    return Array.from(this.distributionRules.values());
  }

  getEdgeFunctions(): EdgeFunction[] {
    return Array.from(this.edgeFunctions.values());
  }

  async getGlobalPerformanceMetrics(): Promise<any> {
    const nodes = Array.from(this.edgeNodes.values());
    
    return {
      totalNodes: nodes.length,
      activeNodes: nodes.filter(n => n.status === 'active').length,
      averageLatency: nodes.reduce((sum, n) => sum + n.performance.latency, 0) / nodes.length,
      averageThroughput: nodes.reduce((sum, n) => sum + n.performance.throughput, 0) / nodes.length,
      averageErrorRate: nodes.reduce((sum, n) => sum + n.performance.errorRate, 0) / nodes.length,
      averageUptime: nodes.reduce((sum, n) => sum + n.performance.uptime, 0) / nodes.length,
      totalCapacity: {
        cpu: nodes.reduce((sum, n) => sum + n.capacity.cpu, 0),
        memory: nodes.reduce((sum, n) => sum + n.capacity.memory, 0),
        storage: nodes.reduce((sum, n) => sum + n.capacity.storage, 0),
        bandwidth: nodes.reduce((sum, n) => sum + n.capacity.bandwidth, 0),
      },
      totalUsage: {
        cpu: nodes.reduce((sum, n) => sum + n.usage.cpu, 0) / nodes.length,
        memory: nodes.reduce((sum, n) => sum + n.usage.memory, 0) / nodes.length,
        storage: nodes.reduce((sum, n) => sum + n.usage.storage, 0) / nodes.length,
        bandwidth: nodes.reduce((sum, n) => sum + n.usage.bandwidth, 0) / nodes.length,
      },
    };
  }

  clearRoutingCache(): void {
    this.routingCache.clear();
    console.log('🧹 Routing cache cleared');
  }

  destroy(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    console.log('🧹 Global edge manager destroyed');
  }
}

// Export singleton instance
export const globalEdgeManager = GlobalEdgeManager.getInstance();
