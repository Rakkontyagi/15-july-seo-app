import React from 'react';
import { render, screen } from '@testing-library/react';
import { RealtimeProgressTracker } from '../RealtimeProgressTracker';

// Mock the useRealtimeProgress hook
jest.mock('@/hooks/useRealtimeProgress', () => ({
  useRealtimeProgress: jest.fn(),
}));

const mockUseRealtimeProgress = require('@/hooks/useRealtimeProgress').useRealtimeProgress;

describe('RealtimeProgressTracker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders initial state correctly', () => {
    mockUseRealtimeProgress.mockImplementation(() => {});
    
    render(<RealtimeProgressTracker contentId="test-content-id" />);
    
    expect(screen.getByText('Content Analysis Progress: 0%')).toBeInTheDocument();
    expect(screen.getByText('Current Stage: Initializing')).toBeInTheDocument();
  });

  it('updates progress when hook provides updates', () => {
    const mockCallback = jest.fn();
    mockUseRealtimeProgress.mockImplementation((contentId, callback) => {
      mockCallback.current = callback;
    });

    render(<RealtimeProgressTracker contentId="test-content-id" />);

    // Simulate progress update
    const progressUpdate = {
      stage: 'Analyzing Content',
      progress: 45,
      message: 'Processing content analysis...'
    };

    if (mockCallback.current) {
      mockCallback.current(progressUpdate);
    }

    expect(screen.getByText(/Content Analysis Progress:/)).toBeInTheDocument();
    expect(screen.getByText(/Current Stage:/)).toBeInTheDocument();
    expect(screen.getByText(/Processing content analysis.../)).toBeInTheDocument();
  });

  it('handles multiple stage updates correctly', () => {
    const mockCallback = jest.fn();
    mockUseRealtimeProgress.mockImplementation((contentId, callback) => {
      mockCallback.current = callback;
    });

    render(<RealtimeProgressTracker contentId="test-content-id" />);

    // First update
    const firstUpdate = {
      stage: 'Initializing',
      progress: 20,
      message: 'Starting analysis...'
    };

    // Second update for different stage
    const secondUpdate = {
      stage: 'Analyzing Content',
      progress: 60,
      message: 'Deep content analysis...'
    };

    if (mockCallback.current) {
      mockCallback.current(firstUpdate);
      mockCallback.current(secondUpdate);
    }

    expect(screen.getByText(/Content Analysis Progress:/)).toBeInTheDocument();
    expect(screen.getByText(/Current Stage:/)).toBeInTheDocument();
    expect(screen.getByText(/Starting analysis.../)).toBeInTheDocument();
    expect(screen.getByText(/Deep content analysis.../)).toBeInTheDocument();
  });

  it('passes correct contentId to hook', () => {
    const testContentId = 'unique-content-id-123';
    
    render(<RealtimeProgressTracker contentId={testContentId} />);
    
    expect(mockUseRealtimeProgress).toHaveBeenCalledWith(
      testContentId,
      expect.any(Function)
    );
  });
});