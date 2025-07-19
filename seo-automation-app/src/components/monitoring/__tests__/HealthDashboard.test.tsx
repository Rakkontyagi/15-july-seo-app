import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import { HealthDashboard } from '../HealthDashboard';

// Mock the health API
const mockHealthData = {
  system: {
    overallStatus: 'healthy',
    healthyServices: 2,
    unhealthyServices: 0,
    totalServices: 2,
    lastUpdated: Date.now()
  },
  services: {
    serper: {
      status: 'healthy',
      responseTime: 245,
      uptime: 99.5,
      lastCheck: Date.now() - 30000,
      errorRate: 0.5
    },
    serpapi: {
      status: 'healthy',
      responseTime: 312,
      uptime: 98.8,
      lastCheck: Date.now() - 45000,
      errorRate: 1.2
    }
  }
};

const mockDegradedHealthData = {
  system: {
    overallStatus: 'degraded',
    healthyServices: 1,
    unhealthyServices: 1,
    totalServices: 2,
    lastUpdated: Date.now()
  },
  services: {
    serper: {
      status: 'healthy',
      responseTime: 245,
      uptime: 99.5,
      lastCheck: Date.now() - 30000,
      errorRate: 0.5
    },
    serpapi: {
      status: 'unhealthy',
      responseTime: 0,
      uptime: 85.2,
      lastCheck: Date.now() - 120000,
      errorRate: 15.8,
      lastError: 'Connection timeout'
    }
  }
};

// Mock fetch
global.fetch = jest.fn();

describe('HealthDashboard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockHealthData),
    } as Response);
  });

  describe('Rendering and Layout', () => {
    it('should render dashboard with system overview', async () => {
      render(<HealthDashboard />);

      await waitFor(() => {
        expect(screen.getByText('API Health Dashboard')).toBeInTheDocument();
        expect(screen.getByText('System Overview')).toBeInTheDocument();
      });
    });

    it('should display overall system status', async () => {
      render(<HealthDashboard />);

      await waitFor(() => {
        expect(screen.getByText('healthy')).toBeInTheDocument();
        expect(screen.getByText('2 / 2 services healthy')).toBeInTheDocument();
      });
    });

    it('should render service status cards', async () => {
      render(<HealthDashboard />);

      await waitFor(() => {
        expect(screen.getByText('serper')).toBeInTheDocument();
        expect(screen.getByText('serpapi')).toBeInTheDocument();
      });
    });

    it('should display service metrics', async () => {
      render(<HealthDashboard />);

      await waitFor(() => {
        expect(screen.getByText('245ms')).toBeInTheDocument(); // serper response time
        expect(screen.getByText('312ms')).toBeInTheDocument(); // serpapi response time
        expect(screen.getByText('99.5%')).toBeInTheDocument(); // serper uptime
        expect(screen.getByText('98.8%')).toBeInTheDocument(); // serpapi uptime
      });
    });
  });

  describe('Status Indicators', () => {
    it('should show healthy status with green indicator', async () => {
      render(<HealthDashboard />);

      await waitFor(() => {
        const healthyIndicators = screen.getAllByTestId('status-healthy');
        expect(healthyIndicators.length).toBeGreaterThan(0);
      });
    });

    it('should show unhealthy status with red indicator', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockDegradedHealthData),
      } as Response);

      render(<HealthDashboard />);

      await waitFor(() => {
        expect(screen.getByTestId('status-unhealthy')).toBeInTheDocument();
        expect(screen.getByText('degraded')).toBeInTheDocument();
        expect(screen.getByText('1 / 2 services healthy')).toBeInTheDocument();
      });
    });

    it('should display error messages for unhealthy services', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockDegradedHealthData),
      } as Response);

      render(<HealthDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Connection timeout')).toBeInTheDocument();
      });
    });
  });

  describe('Real-time Updates', () => {
    it('should auto-refresh health data', async () => {
      jest.useFakeTimers();
      
      render(<HealthDashboard refreshInterval={5000} />);

      // Initial load
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1);
      });

      // Fast-forward 5 seconds
      jest.advanceTimersByTime(5000);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(2);
      });

      jest.useRealTimers();
    });

    it('should update last refresh timestamp', async () => {
      render(<HealthDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
      });
    });

    it('should handle real-time status changes', async () => {
      const { rerender } = render(<HealthDashboard />);

      // Initial healthy state
      await waitFor(() => {
        expect(screen.getByText('healthy')).toBeInTheDocument();
      });

      // Change to degraded state
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockDegradedHealthData),
      } as Response);

      // Trigger refresh
      fireEvent.click(screen.getByText('Refresh'));

      await waitFor(() => {
        expect(screen.getByText('degraded')).toBeInTheDocument();
      });
    });
  });

  describe('Interactive Features', () => {
    it('should refresh data when refresh button is clicked', async () => {
      render(<HealthDashboard />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1);
      });

      fireEvent.click(screen.getByText('Refresh'));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(2);
      });
    });

    it('should show loading state during refresh', async () => {
      // Mock slow response
      (global.fetch as jest.MockedFunction<typeof fetch>).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve(mockHealthData),
        } as Response), 1000))
      );

      render(<HealthDashboard />);

      fireEvent.click(screen.getByText('Refresh'));

      expect(screen.getByText('Refreshing...')).toBeInTheDocument();
    });

    it('should expand service details on click', async () => {
      render(<HealthDashboard />);

      await waitFor(() => {
        expect(screen.getByText('serper')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('serper'));

      await waitFor(() => {
        expect(screen.getByText('Service Details')).toBeInTheDocument();
        expect(screen.getByText('Error Rate: 0.5%')).toBeInTheDocument();
      });
    });

    it('should filter services by status', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockDegradedHealthData),
      } as Response);

      render(<HealthDashboard />);

      await waitFor(() => {
        expect(screen.getByText('serper')).toBeInTheDocument();
        expect(screen.getByText('serpapi')).toBeInTheDocument();
      });

      // Filter to show only unhealthy services
      fireEvent.click(screen.getByText('Show Unhealthy Only'));

      await waitFor(() => {
        expect(screen.queryByText('serper')).not.toBeInTheDocument();
        expect(screen.getByText('serpapi')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockRejectedValue(
        new Error('API Error')
      );

      render(<HealthDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load health data')).toBeInTheDocument();
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });
    });

    it('should retry after error', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>)
        .mockRejectedValueOnce(new Error('API Error'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockHealthData),
        } as Response);

      render(<HealthDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Retry'));

      await waitFor(() => {
        expect(screen.getByText('API Health Dashboard')).toBeInTheDocument();
        expect(screen.queryByText('Failed to load health data')).not.toBeInTheDocument();
      });
    });

    it('should handle malformed API responses', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ invalid: 'data' }),
      } as Response);

      render(<HealthDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Invalid health data format')).toBeInTheDocument();
      });
    });
  });

  describe('Performance and Optimization', () => {
    it('should not re-render unnecessarily', async () => {
      const renderSpy = jest.fn();
      
      const TestComponent = () => {
        renderSpy();
        return <HealthDashboard />;
      };

      render(<TestComponent />);

      await waitFor(() => {
        expect(renderSpy).toHaveBeenCalledTimes(1);
      });

      // Same data should not trigger re-render
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockHealthData),
      } as Response);

      fireEvent.click(screen.getByText('Refresh'));

      await waitFor(() => {
        // Should only re-render once more for the refresh action
        expect(renderSpy).toHaveBeenCalledTimes(2);
      });
    });

    it('should cleanup intervals on unmount', () => {
      jest.useFakeTimers();
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

      const { unmount } = render(<HealthDashboard refreshInterval={5000} />);

      unmount();

      expect(clearIntervalSpy).toHaveBeenCalled();

      jest.useRealTimers();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', async () => {
      render(<HealthDashboard />);

      await waitFor(() => {
        expect(screen.getByRole('main')).toHaveAttribute('aria-label', 'API Health Dashboard');
        expect(screen.getByRole('button', { name: 'Refresh health data' })).toBeInTheDocument();
      });
    });

    it('should support keyboard navigation', async () => {
      render(<HealthDashboard />);

      await waitFor(() => {
        const refreshButton = screen.getByRole('button', { name: 'Refresh health data' });
        refreshButton.focus();
        expect(document.activeElement).toBe(refreshButton);
      });
    });

    it('should announce status changes to screen readers', async () => {
      render(<HealthDashboard />);

      await waitFor(() => {
        expect(screen.getByRole('status')).toHaveTextContent('System status: healthy');
      });
    });
  });

  describe('Responsive Design', () => {
    it('should adapt to mobile viewport', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(<HealthDashboard />);

      await waitFor(() => {
        const dashboard = screen.getByTestId('health-dashboard');
        expect(dashboard).toHaveClass('mobile-layout');
      });
    });

    it('should stack service cards on small screens', async () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 480,
      });

      render(<HealthDashboard />);

      await waitFor(() => {
        const serviceGrid = screen.getByTestId('service-grid');
        expect(serviceGrid).toHaveClass('grid-cols-1');
      });
    });
  });
});
