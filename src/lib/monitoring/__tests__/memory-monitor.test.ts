import { MemoryMonitor } from '../memory-monitor';
import EventEmitter from 'events';

// Mock process.memoryUsage
const mockMemoryUsage = jest.spyOn(process, 'memoryUsage').mockImplementation(() => ({
  rss: 100 * 1024 * 1024, // 100 MB
  heapTotal: 50 * 1024 * 1024, // 50 MB
  heapUsed: 30 * 1024 * 1024, // 30 MB
  external: 10 * 1024 * 1024, // 10 MB
  arrayBuffers: 5 * 1024 * 1024 // 5 MB
}));

describe('MemoryMonitor', () => {
  let memoryMonitor: MemoryMonitor;
  
  beforeEach(() => {
    jest.useFakeTimers();
    memoryMonitor = new MemoryMonitor();
  });
  
  afterEach(() => {
    memoryMonitor.stop();
    jest.clearAllTimers();
    jest.clearAllMocks();
  });
  
  describe('initialization', () => {
    it('should be an instance of EventEmitter', () => {
      expect(memoryMonitor).toBeInstanceOf(EventEmitter);
    });
    
    it('should initialize with default thresholds', () => {
      expect((memoryMonitor as any).thresholds).toBeDefined();
      expect((memoryMonitor as any).thresholds.heapUsedWarning).toBeDefined();
      expect((memoryMonitor as any).thresholds.heapUsedCritical).toBeDefined();
    });
    
    it('should accept custom thresholds', () => {
      const customThresholds = {
        heapUsedWarning: 400,
        heapUsedCritical: 800
      };
      
      const customMonitor = new MemoryMonitor(customThresholds);
      expect((customMonitor as any).thresholds.heapUsedWarning).toBe(400);
      expect((customMonitor as any).thresholds.heapUsedCritical).toBe(800);
    });
  });
  
  describe('start and stop', () => {
    it('should start monitoring with default interval', () => {
      const setIntervalSpy = jest.spyOn(global, 'setInterval');
      memoryMonitor.start();
      
      expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 5000);
      expect((memoryMonitor as any).interval).toBeDefined();
    });
    
    it('should start monitoring with custom interval', () => {
      const setIntervalSpy = jest.spyOn(global, 'setInterval');
      memoryMonitor.start(10000);
      
      expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 10000);
    });
    
    it('should stop monitoring', () => {
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
      memoryMonitor.start();
      memoryMonitor.stop();
      
      expect(clearIntervalSpy).toHaveBeenCalled();
      expect((memoryMonitor as any).interval).toBeNull();
    });
    
    it('should be chainable', () => {
      expect(memoryMonitor.start()).toBe(memoryMonitor);
      expect(memoryMonitor.stop()).toBe(memoryMonitor);
    });
  });
  
  describe('takeSnapshot', () => {
    it('should take a memory snapshot', () => {
      const snapshot = (memoryMonitor as any).takeSnapshot();
      
      expect(snapshot).toBeDefined();
      expect(snapshot.timestamp).toBeDefined();
      expect(snapshot.rss).toBeCloseTo(100, 0); // ~100 MB
      expect(snapshot.heapTotal).toBeCloseTo(50, 0); // ~50 MB
      expect(snapshot.heapUsed).toBeCloseTo(30, 0); // ~30 MB
      expect(snapshot.external).toBeCloseTo(10, 0); // ~10 MB
      expect(snapshot.arrayBuffers).toBeCloseTo(5, 0); // ~5 MB
    });
    
    it('should add snapshot to snapshots array', () => {
      (memoryMonitor as any).takeSnapshot();
      
      expect((memoryMonitor as any).snapshots.length).toBe(1);
    });
    
    it('should limit snapshots to maxSnapshots', () => {
      // Set maxSnapshots to a small number for testing
      (memoryMonitor as any).maxSnapshots = 3;
      
      // Take more snapshots than the limit
      for (let i = 0; i < 5; i++) {
        (memoryMonitor as any).takeSnapshot();
      }
      
      // Should only keep the most recent 3
      expect((memoryMonitor as any).snapshots.length).toBe(3);
    });
  });
  
  describe('detectLeaks', () => {
    it('should return null if not enough snapshots', () => {
      const result = (memoryMonitor as any).detectLeaks();
      expect(result).toBeNull();
    });
    
    it('should detect leaks with increasing memory usage', () => {
      // Mock snapshots with increasing heap usage
      (memoryMonitor as any).snapshots = Array(10).fill(0).map((_, i) => ({
        timestamp: Date.now() - (10 - i) * 60000, // 1 minute apart
        heapUsed: 30 + i * 5, // Increasing by 5MB each time
        rss: 100,
        heapTotal: 50,
        external: 10
      }));
      
      const result = (memoryMonitor as any).detectLeaks();
      
      expect(result).toBeDefined();
      expect(result.detected).toBe(true);
      expect(result.growthRate).toBeGreaterThan(0);
      expect(result.confidence).toBeGreaterThan(0.9); // High confidence
    });
    
    it('should not detect leaks with stable memory usage', () => {
      // Mock snapshots with stable heap usage
      (memoryMonitor as any).snapshots = Array(10).fill(0).map((_, i) => ({
        timestamp: Date.now() - (10 - i) * 60000, // 1 minute apart
        heapUsed: 30, // Stable
        rss: 100,
        heapTotal: 50,
        external: 10
      }));
      
      const result = (memoryMonitor as any).detectLeaks();
      
      expect(result).toBeDefined();
      expect(result.detected).toBe(false);
    });
  });
  
  describe('linearRegression', () => {
    it('should calculate slope and r² correctly', () => {
      // Perfect linear relationship: y = 2x + 1
      const x = [1, 2, 3, 4, 5];
      const y = [3, 5, 7, 9, 11];
      
      const result = (memoryMonitor as any).linearRegression(x, y);
      
      expect(result.slope).toBeCloseTo(2, 5);
      expect(result.intercept).toBeCloseTo(1, 5);
      expect(result.r2).toBeCloseTo(1, 5); // Perfect correlation
    });
    
    it('should handle no correlation', () => {
      // No correlation
      const x = [1, 2, 3, 4, 5];
      const y = [5, 2, 7, 1, 9];
      
      const result = (memoryMonitor as any).linearRegression(x, y);
      
      expect(result.r2).toBeLessThan(0.5); // Low correlation
    });
  });
  
  describe('checkThresholds', () => {
    it('should emit warning alert when heap usage exceeds warning threshold', () => {
      // Set up a snapshot that exceeds warning threshold
      (memoryMonitor as any).snapshots = [{
        timestamp: Date.now(),
        heapUsed: (memoryMonitor as any).thresholds.heapUsedWarning + 10,
        rss: 100,
        heapTotal: 50,
        external: 10
      }];
      
      // Set up event listener
      const alertHandler = jest.fn();
      memoryMonitor.on('alert', alertHandler);
      
      // Check thresholds
      (memoryMonitor as any).checkThresholds();
      
      // Verify alert was emitted
      expect(alertHandler).toHaveBeenCalledWith(expect.objectContaining({
        level: 'warning',
        metric: 'heapUsed'
      }));
    });
    
    it('should emit critical alert when heap usage exceeds critical threshold', () => {
      // Set up a snapshot that exceeds critical threshold
      (memoryMonitor as any).snapshots = [{
        timestamp: Date.now(),
        heapUsed: (memoryMonitor as any).thresholds.heapUsedCritical + 10,
        rss: 100,
        heapTotal: 50,
        external: 10
      }];
      
      // Set up event listener
      const alertHandler = jest.fn();
      memoryMonitor.on('alert', alertHandler);
      
      // Check thresholds
      (memoryMonitor as any).checkThresholds();
      
      // Verify alert was emitted
      expect(alertHandler).toHaveBeenCalledWith(expect.objectContaining({
        level: 'critical',
        metric: 'heapUsed'
      }));
    });
  });
  
  describe('resource tracking', () => {
    it('should track resources', () => {
      const id = 'test-resource-1';
      const type = 'connection';
      const details = { url: 'https://example.com' };
      
      memoryMonitor.trackResource(type, id, details);
      
      const resources = (memoryMonitor as any).resources;
      expect(resources.has(type)).toBe(true);
      expect(resources.get(type).count).toBe(1);
      expect(resources.get(type).details[0].id).toBe(id);
      expect(resources.get(type).details[0].url).toBe('https://example.com');
    });
    
    it('should release resources', () => {
      const id = 'test-resource-1';
      const type = 'connection';
      
      memoryMonitor.trackResource(type, id);
      expect(memoryMonitor.releaseResource(type, id)).toBe(true);
      
      const resources = (memoryMonitor as any).resources;
      expect(resources.get(type).count).toBe(0);
      expect(resources.get(type).details.length).toBe(0);
    });
    
    it('should identify resource leaks', () => {
      memoryMonitor.trackResource('connection', 'conn-1');
      memoryMonitor.trackResource('timer', 'timer-1');
      memoryMonitor.releaseResource('timer', 'timer-1');
      
      const leaks = memoryMonitor.getResourceLeaks();
      
      expect(leaks.length).toBe(1);
      expect(leaks[0].type).toBe('connection');
      expect(leaks[0].count).toBe(1);
    });
  });
  
  describe('utility methods', () => {
    it('should get latest snapshot', () => {
      const snapshot = { timestamp: Date.now(), heapUsed: 30, rss: 100, heapTotal: 50, external: 10 };
      (memoryMonitor as any).snapshots = [snapshot];
      
      expect(memoryMonitor.getLatestSnapshot()).toBe(snapshot);
    });
    
    it('should get all snapshots', () => {
      const snapshots = [
        { timestamp: Date.now() - 2000, heapUsed: 28, rss: 100, heapTotal: 50, external: 10 },
        { timestamp: Date.now() - 1000, heapUsed: 29, rss: 100, heapTotal: 50, external: 10 },
        { timestamp: Date.now(), heapUsed: 30, rss: 100, heapTotal: 50, external: 10 }
      ];
      
      (memoryMonitor as any).snapshots = snapshots;
      
      expect(memoryMonitor.getSnapshots()).toEqual(snapshots);
      expect(memoryMonitor.getSnapshots()).not.toBe(snapshots); // Should be a copy
    });
    
    it('should get memory trend', () => {
      // Mock snapshots with increasing heap usage
      (memoryMonitor as any).snapshots = [
        { timestamp: Date.now() - 300000, heapUsed: 25, rss: 100, heapTotal: 50, external: 10 }, // 5 minutes ago
        { timestamp: Date.now() - 180000, heapUsed: 27, rss: 100, heapTotal: 50, external: 10 }, // 3 minutes ago
        { timestamp: Date.now() - 60000, heapUsed: 29, rss: 100, heapTotal: 50, external: 10 },  // 1 minute ago
        { timestamp: Date.now(), heapUsed: 30, rss: 100, heapTotal: 50, external: 10 }           // now
      ];
      
      const trend = memoryMonitor.getMemoryTrend(5);
      
      expect(trend.trend).toBe('increasing');
      expect(trend.rate).toBeGreaterThan(0);
    });
    
    it('should set thresholds', () => {
      const newThresholds = {
        heapUsedWarning: 600,
        heapUsedCritical: 900
      };
      
      memoryMonitor.setThresholds(newThresholds);
      
      expect((memoryMonitor as any).thresholds.heapUsedWarning).toBe(600);
      expect((memoryMonitor as any).thresholds.heapUsedCritical).toBe(900);
      expect((memoryMonitor as any).thresholds.rssWarning).toBeDefined(); // Original values preserved
    });
  });
});