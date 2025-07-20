/**
 * Server-Sent Events Manager
 * Implements Quinn's recommendation for SSE-based real-time communication
 * Validates scalability for 100+ concurrent connections
 */

// Types
export interface SSEConnection {
  id: string;
  userId: string;
  contentId: string;
  eventSource: EventSource;
  status: 'connecting' | 'connected' | 'error' | 'closed';
  startTime: number;
  lastActivity: number;
  messageCount: number;
  errors: number;
}

export interface SSEMessage {
  type: 'connected' | 'progress' | 'complete' | 'error' | 'heartbeat';
  data: any;
  timestamp: number;
}

export interface SSEMetrics {
  activeConnections: number;
  totalConnections: number;
  averageLatency: number;
  errorRate: number;
  messagesSent: number;
  connectionFailures: number;
}

// SSE Connection Manager
export class SSEManager {
  private static instance: SSEManager;
  private connections: Map<string, SSEConnection> = new Map();
  private metrics: SSEMetrics = {
    activeConnections: 0,
    totalConnections: 0,
    averageLatency: 0,
    errorRate: 0,
    messagesSent: 0,
    connectionFailures: 0,
  };
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private metricsInterval: NodeJS.Timeout | null = null;

  static getInstance(): SSEManager {
    if (!SSEManager.instance) {
      SSEManager.instance = new SSEManager();
    }
    return SSEManager.instance;
  }

  constructor() {
    this.startHeartbeat();
    this.startMetricsCollection();
  }

  async createConnection(
    userId: string,
    contentId: string,
    onMessage?: (message: SSEMessage) => void,
    onError?: (error: Event) => void
  ): Promise<SSEConnection> {
    const connectionId = `${userId}:${contentId}:${Date.now()}`;
    
    // Check for existing connection
    const existingConnection = this.findExistingConnection(userId, contentId);
    if (existingConnection && existingConnection.status === 'connected') {
      console.log(`🔄 Reusing existing SSE connection for ${userId}:${contentId}`);
      return existingConnection;
    }

    // Create new EventSource
    const url = `/api/content/${contentId}/progress?userId=${userId}&connectionId=${connectionId}`;
    const eventSource = new EventSource(url);

    const connection: SSEConnection = {
      id: connectionId,
      userId,
      contentId,
      eventSource,
      status: 'connecting',
      startTime: Date.now(),
      lastActivity: Date.now(),
      messageCount: 0,
      errors: 0,
    };

    // Set up event handlers
    eventSource.onopen = () => {
      connection.status = 'connected';
      connection.lastActivity = Date.now();
      this.metrics.activeConnections++;
      this.metrics.totalConnections++;
      
      console.log(`✅ SSE connection established: ${connectionId}`);
      
      // Send connection metrics
      this.trackConnectionEvent('connected', connection);
    };

    eventSource.onmessage = (event) => {
      try {
        const message: SSEMessage = JSON.parse(event.data);
        message.timestamp = Date.now();
        
        connection.lastActivity = Date.now();
        connection.messageCount++;
        this.metrics.messagesSent++;
        
        // Calculate latency if timestamp is provided
        if (message.data?.timestamp) {
          const latency = Date.now() - message.data.timestamp;
          this.updateAverageLatency(latency);
        }
        
        // Call user-provided message handler
        if (onMessage) {
          onMessage(message);
        }
        
        // Handle completion
        if (message.type === 'complete') {
          this.closeConnection(connectionId);
        }
        
      } catch (error) {
        console.error('Error parsing SSE message:', error);
        connection.errors++;
      }
    };

    eventSource.onerror = (error) => {
      connection.status = 'error';
      connection.errors++;
      this.metrics.connectionFailures++;
      this.metrics.errorRate = this.metrics.connectionFailures / this.metrics.totalConnections;
      
      console.error(`❌ SSE connection error: ${connectionId}`, error);
      
      // Call user-provided error handler
      if (onError) {
        onError(error);
      }
      
      // Track error event
      this.trackConnectionEvent('error', connection, { error: error.type });
      
      // Attempt reconnection after delay
      setTimeout(() => {
        if (connection.status === 'error') {
          this.attemptReconnection(connection);
        }
      }, 5000);
    };

    // Store connection
    this.connections.set(connectionId, connection);
    
    return connection;
  }

  closeConnection(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    connection.eventSource.close();
    connection.status = 'closed';
    this.metrics.activeConnections = Math.max(0, this.metrics.activeConnections - 1);
    
    this.connections.delete(connectionId);
    
    console.log(`🔌 SSE connection closed: ${connectionId}`);
    this.trackConnectionEvent('closed', connection);
  }

  private findExistingConnection(userId: string, contentId: string): SSEConnection | null {
    for (const connection of this.connections.values()) {
      if (connection.userId === userId && 
          connection.contentId === contentId && 
          connection.status === 'connected') {
        return connection;
      }
    }
    return null;
  }

  private async attemptReconnection(connection: SSEConnection): Promise<void> {
    console.log(`🔄 Attempting to reconnect SSE: ${connection.id}`);
    
    try {
      // Close existing connection
      connection.eventSource.close();
      
      // Create new connection
      const newConnection = await this.createConnection(
        connection.userId,
        connection.contentId
      );
      
      // Update connection reference
      this.connections.delete(connection.id);
      this.connections.set(newConnection.id, newConnection);
      
    } catch (error) {
      console.error('SSE reconnection failed:', error);
    }
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
    }, 30000); // Every 30 seconds
  }

  private sendHeartbeat(): void {
    // Check for stale connections
    const now = Date.now();
    const staleConnections: string[] = [];
    
    this.connections.forEach((connection, id) => {
      if (now - connection.lastActivity > 60000) { // 1 minute
        staleConnections.push(id);
      }
    });
    
    // Close stale connections
    staleConnections.forEach(id => {
      console.log(`🧹 Closing stale SSE connection: ${id}`);
      this.closeConnection(id);
    });
  }

  private startMetricsCollection(): void {
    this.metricsInterval = setInterval(() => {
      this.collectMetrics();
    }, 10000); // Every 10 seconds
  }

  private collectMetrics(): void {
    // Send metrics to monitoring service
    if (typeof window !== 'undefined') {
      fetch('/api/monitoring/sse-metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metrics: this.metrics,
          connections: Array.from(this.connections.values()).map(conn => ({
            id: conn.id,
            userId: conn.userId,
            status: conn.status,
            messageCount: conn.messageCount,
            errors: conn.errors,
            duration: Date.now() - conn.startTime,
          })),
          timestamp: Date.now(),
        }),
      }).catch(error => {
        console.warn('Failed to send SSE metrics:', error);
      });
    }

    // Log metrics in development
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 SSE Metrics:', {
        activeConnections: this.metrics.activeConnections,
        totalConnections: this.metrics.totalConnections,
        errorRate: `${(this.metrics.errorRate * 100).toFixed(2)}%`,
        averageLatency: `${this.metrics.averageLatency.toFixed(0)}ms`,
      });
    }
  }

  private updateAverageLatency(latency: number): void {
    // Simple moving average
    this.metrics.averageLatency = (this.metrics.averageLatency * 0.9) + (latency * 0.1);
  }

  private trackConnectionEvent(
    event: string,
    connection: SSEConnection,
    metadata?: any
  ): void {
    // Send to analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'sse_connection', {
        event_category: 'Real-time',
        event_label: event,
        value: Date.now() - connection.startTime,
        custom_map: {
          connection_id: connection.id,
          user_id: connection.userId,
          content_id: connection.contentId,
          ...metadata,
        },
      });
    }
  }

  // Public API methods
  getMetrics(): SSEMetrics {
    return { ...this.metrics };
  }

  getActiveConnections(): SSEConnection[] {
    return Array.from(this.connections.values());
  }

  getConnectionCount(): number {
    return this.connections.size;
  }

  closeAllConnections(): void {
    const connectionIds = Array.from(this.connections.keys());
    connectionIds.forEach(id => this.closeConnection(id));
    console.log(`🧹 Closed ${connectionIds.length} SSE connections`);
  }

  // Load testing methods
  async runLoadTest(
    concurrentConnections: number,
    testDuration: number = 60000
  ): Promise<any> {
    console.log(`🧪 Starting SSE load test: ${concurrentConnections} connections for ${testDuration}ms`);
    
    const testResults = {
      targetConnections: concurrentConnections,
      actualConnections: 0,
      successfulConnections: 0,
      failedConnections: 0,
      averageLatency: 0,
      maxLatency: 0,
      messagesReceived: 0,
      errors: 0,
      startTime: Date.now(),
      endTime: 0,
    };

    const connections: Promise<SSEConnection>[] = [];
    
    // Create concurrent connections
    for (let i = 0; i < concurrentConnections; i++) {
      const connectionPromise = this.createConnection(
        `test-user-${i}`,
        `test-content-${i}`,
        (message) => {
          testResults.messagesReceived++;
          if (message.data?.latency) {
            testResults.maxLatency = Math.max(testResults.maxLatency, message.data.latency);
          }
        },
        () => {
          testResults.errors++;
        }
      );
      
      connections.push(connectionPromise);
    }

    // Wait for all connections to establish
    const establishedConnections = await Promise.allSettled(connections);
    
    testResults.actualConnections = establishedConnections.length;
    testResults.successfulConnections = establishedConnections.filter(
      result => result.status === 'fulfilled'
    ).length;
    testResults.failedConnections = establishedConnections.filter(
      result => result.status === 'rejected'
    ).length;

    // Run test for specified duration
    await new Promise(resolve => setTimeout(resolve, testDuration));

    // Clean up test connections
    const testConnectionIds = Array.from(this.connections.keys()).filter(
      id => id.includes('test-user-')
    );
    testConnectionIds.forEach(id => this.closeConnection(id));

    testResults.endTime = Date.now();
    testResults.averageLatency = this.metrics.averageLatency;

    console.log('📊 SSE Load Test Results:', testResults);
    return testResults;
  }

  destroy(): void {
    // Clean up intervals
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }
    
    // Close all connections
    this.closeAllConnections();
    
    console.log('🧹 SSE Manager destroyed');
  }
}

// Export singleton instance
export const sseManager = SSEManager.getInstance();

// Auto-cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    sseManager.closeAllConnections();
  });
}

// Global type declarations
declare global {
  interface Window {
    gtag?: (command: string, action: string, parameters: any) => void;
  }
}
