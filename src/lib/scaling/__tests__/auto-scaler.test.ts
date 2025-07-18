import { AutoScaler } from '../auto-scaler';
import os from 'os';

// Mock os module
jest.mock('os', () => ({
  cpus: jest.fn(),
  totalmem: jest.fn(),
  freemem: jest.fn()
}));

describe('AutoScaler', () => {
  let autoScaler: AutoScaler;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock CPU data
    (os.cpus as jest.Mock).mockReturnValue([
      {
        model: 'Intel(R) Core(TM) i7-9750H CPU @ 2.60GHz',
        speed: 2600,
        times: {
          user: 9000,
          nice: 0,
          sys: 5000,
          idle: 86000,
          irq: 0
        }
      }
    ]);
    
    // Mock memory data
    (os.totalmem as jest.Mock).mockReturnValue(16 * 1024 * 1024 * 1024); // 16GB
    (os.freemem as jest.Mock).mockReturnValue(8 * 1024 * 1024 * 1024); // 8GB
    
    // Create auto scaler with mocked interval to prevent actual scheduling
    autoScaler = new AutoScaler();
    
    // Mock the startMonitoring method to prevent actual interval scheduling
    jest.spyOn(autoScaler, 'startMonitoring').mockImplementation(() => {
      return autoScaler;
    });
    
    // Mock the stopMonitoring method
    jest.spyOn(autoScaler, 'stopMonitoring').mockImplementation(() => {
      return autoScaler;
    });
  });
  
  afterEach(() => {
    autoScaler.stopMonitoring();
  });
  
  describe('initialization', () => {
    it('should initialize with default values', () => {
      expect(autoScaler).toBeDefined();
    });
    
    it('should start monitoring when created', () => {
      expect(autoScaler.startMonitoring).toHaveBeenCalled();
    });
  });
  
  describe('collectMetrics', () => {
    it('should collect system metrics', () => {
      // Access the private method using any type assertion
      const metrics = (autoScaler as any).collectMetrics();
      
      expect(metrics).toHaveProperty('cpuUsage');
      expect(metrics).toHaveProperty('memoryUsage');
      expect(metrics).toHaveProperty('requestRate');
      expect(metrics).toHaveProperty('errorRate');
      
      // CPU usage should be calculated correctly (100 - idle percentage)
      expect(metrics.cpuUsage).toBeCloseTo(10, 0); // 10% CPU usage based on our mock
      
      // Memory usage should be calculated correctly
      expect(metrics.memoryUsage).toBeCloseTo(50, 0); // 50% memory usage based on our mock
    });
  });
  
  describe('evaluateScalingRules', () => {
    it('should scale up when CPU usage is above threshold', () => {
      // Mock the scaleUp method
      const scaleUpSpy = jest.spyOn(autoScaler as any, 'scaleUp').mockImplementation(() => {});
      
      // Set up metrics with high CPU usage
      const metrics = {
        cpuUsage: 80, // Above the default threshold of 70%
        memoryUsage: 50,
        requestRate: 0,
        errorRate: 0
      };
      
      // Reset the last scale action to allow immediate scaling
      (autoScaler as any).lastScaleAction = 0;
      
      // Call the private method
      (autoScaler as any).evaluateScalingRules(metrics);
      
      // Verify scaleUp was called
      expect(scaleUpSpy).toHaveBeenCalled();
    });
    
    it('should scale down when CPU usage is below threshold', () => {
      // Mock the scaleDown method
      const scaleDownSpy = jest.spyOn(autoScaler as any, 'scaleDown').mockImplementation(() => {});
      
      // Set up metrics with low CPU usage
      const metrics = {
        cpuUsage: 20, // Below the default threshold of 70/2 = 35%
        memoryUsage: 30,
        requestRate: 0,
        errorRate: 0
      };
      
      // Reset the last scale action to allow immediate scaling
      (autoScaler as any).lastScaleAction = 0;
      
      // Call the private method
      (autoScaler as any).evaluateScalingRules(metrics);
      
      // Verify scaleDown was called
      expect(scaleDownSpy).toHaveBeenCalled();
    });
    
    it('should not scale during cooldown period', () => {
      // Mock the scale methods
      const scaleUpSpy = jest.spyOn(autoScaler as any, 'scaleUp').mockImplementation(() => {});
      const scaleDownSpy = jest.spyOn(autoScaler as any, 'scaleDown').mockImplementation(() => {});
      
      // Set up metrics with high CPU usage
      const metrics = {
        cpuUsage: 80, // Above threshold
        memoryUsage: 50,
        requestRate: 0,
        errorRate: 0
      };
      
      // Set last scale action to recent time (within cooldown period)
      (autoScaler as any).lastScaleAction = Date.now();
      
      // Call the private method
      (autoScaler as any).evaluateScalingRules(metrics);
      
      // Verify neither scale method was called
      expect(scaleUpSpy).not.toHaveBeenCalled();
      expect(scaleDownSpy).not.toHaveBeenCalled();
    });
  });
  
  describe('scaleUp and scaleDown', () => {
    it('should not scale up beyond max instances', () => {
      // Set current instances to max
      (autoScaler as any).currentInstances = (autoScaler as any).maxInstances;
      
      // Mock console.log to verify the message
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      
      // Call scaleUp
      (autoScaler as any).scaleUp();
      
      // Verify instance count didn't change
      expect((autoScaler as any).currentInstances).toBe((autoScaler as any).maxInstances);
      
      // Verify the appropriate message was logged
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Already at maximum instances'));
      
      consoleLogSpy.mockRestore();
    });
    
    it('should not scale down below min instances', () => {
      // Set current instances to min
      (autoScaler as any).currentInstances = (autoScaler as any).minInstances;
      
      // Mock console.log to verify the message
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      
      // Call scaleDown
      (autoScaler as any).scaleDown();
      
      // Verify instance count didn't change
      expect((autoScaler as any).currentInstances).toBe((autoScaler as any).minInstances);
      
      // Verify the appropriate message was logged
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Already at minimum instances'));
      
      consoleLogSpy.mockRestore();
    });
    
    it('should increment instance count when scaling up', () => {
      // Set current instances to a value less than max
      (autoScaler as any).currentInstances = (autoScaler as any).minInstances;
      
      // Call scaleUp
      (autoScaler as any).scaleUp();
      
      // Verify instance count increased
      expect((autoScaler as any).currentInstances).toBe((autoScaler as any).minInstances + 1);
    });
    
    it('should decrement instance count when scaling down', () => {
      // Set current instances to a value greater than min
      (autoScaler as any).currentInstances = (autoScaler as any).minInstances + 2;
      
      // Call scaleDown
      (autoScaler as any).scaleDown();
      
      // Verify instance count decreased
      expect((autoScaler as any).currentInstances).toBe((autoScaler as any).minInstances + 1);
    });
  });
});