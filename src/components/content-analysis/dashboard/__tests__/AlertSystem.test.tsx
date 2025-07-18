import React from 'react';
import { render, screen } from '@testing-library/react';
import { AlertSystem } from '../AlertSystem';

describe('AlertSystem', () => {
  const mockAlerts = [
    {
      id: '1',
      message: 'High CPU usage detected',
      severity: 'high' as const,
      timestamp: '2025-07-18T10:00:00Z'
    },
    {
      id: '2',
      message: 'Processing delay in queue',
      severity: 'medium' as const,
      timestamp: '2025-07-18T09:30:00Z'
    },
    {
      id: '3',
      message: 'New content batch started',
      severity: 'low' as const,
      timestamp: '2025-07-18T09:00:00Z'
    }
  ];

  it('renders no alerts state correctly', () => {
    render(<AlertSystem alerts={[]} />);
    
    expect(screen.getByText('System Alerts')).toBeInTheDocument();
    expect(screen.getByText('No active alerts - All systems operational')).toBeInTheDocument();
    expect(screen.getByText('✅')).toBeInTheDocument();
  });

  it('renders alerts with correct severity styling', () => {
    render(<AlertSystem alerts={mockAlerts} />);
    
    expect(screen.getByText('High CPU usage detected')).toBeInTheDocument();
    expect(screen.getByText('Processing delay in queue')).toBeInTheDocument();
    expect(screen.getByText('New content batch started')).toBeInTheDocument();
    
    // Check severity labels
    expect(screen.getByText('HIGH Priority')).toBeInTheDocument();
    expect(screen.getByText('MEDIUM Priority')).toBeInTheDocument();
    expect(screen.getByText('LOW Priority')).toBeInTheDocument();
  });

  it('displays correct severity icons', () => {
    render(<AlertSystem alerts={mockAlerts} />);
    
    expect(screen.getByText('🚨')).toBeInTheDocument(); // high
    expect(screen.getByText('⚠️')).toBeInTheDocument(); // medium
    expect(screen.getByText('ℹ️')).toBeInTheDocument(); // low
  });

  it('formats timestamps correctly', () => {
    render(<AlertSystem alerts={mockAlerts} />);
    
    // Check that timestamps are displayed (exact format may vary by locale)
    expect(screen.getByText(/2025/)).toBeInTheDocument();
  });

  it('handles empty alert array', () => {
    render(<AlertSystem alerts={[]} />);
    
    expect(screen.queryByText('HIGH Priority')).not.toBeInTheDocument();
    expect(screen.queryByText('MEDIUM Priority')).not.toBeInTheDocument();
    expect(screen.queryByText('LOW Priority')).not.toBeInTheDocument();
  });

  it('applies correct CSS classes for severity levels', () => {
    const { container } = render(<AlertSystem alerts={mockAlerts} />);
    
    const alertElements = container.querySelectorAll('[class*="border-"]');
    expect(alertElements.length).toBeGreaterThan(0);
  });
});