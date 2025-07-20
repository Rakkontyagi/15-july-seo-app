import { renderHook, act } from '@testing-library/react';
import { useRealtimeProgress } from '../useRealtimeProgress';

// Mock timers
jest.useFakeTimers();

describe('useRealtimeProgress', () => {
  beforeEach(() => {
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('calls onProgress callback with simulated progress updates', () => {
    const mockOnProgress = jest.fn();
    const contentId = 'test-content-id';

    renderHook(() => useRealtimeProgress(contentId, mockOnProgress));

    // Fast-forward time to trigger progress updates
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(mockOnProgress).toHaveBeenCalledWith(
      expect.objectContaining({
        stage: 'Initializing',
        progress: expect.any(Number),
        message: 'Processing initializing...'
      })
    );
  });

  it('progresses through all stages correctly', () => {
    const mockOnProgress = jest.fn();
    const contentId = 'test-content-id';

    renderHook(() => useRealtimeProgress(contentId, mockOnProgress));

    // Simulate multiple progress updates
    act(() => {
      jest.advanceTimersByTime(10000); // 10 seconds
    });

    const calls = mockOnProgress.mock.calls;
    const stages = calls.map(call => call[0].stage);
    
    expect(stages).toContain('Initializing');
    expect(stages).toContain('Analyzing Content');
    expect(stages).toContain('Optimizing SEO');
    expect(stages).toContain('Validating Quality');
    expect(stages).toContain('Finalizing');
  });

  it('stops updating when progress reaches 100% on final stage', () => {
    const mockOnProgress = jest.fn();
    const contentId = 'test-content-id';

    renderHook(() => useRealtimeProgress(contentId, contentId));

    // Simulate enough time for completion
    act(() => {
      jest.advanceTimersByTime(30000); // 30 seconds
    });

    // Should eventually stop calling the callback
    const initialCallCount = mockOnProgress.mock.calls.length;
    
    act(() => {
      jest.advanceTimersByTime(5000); // Additional 5 seconds
    });

    // Call count should not increase after completion
    expect(mockOnProgress.mock.calls.length).toBe(initialCallCount);
  });

  it('does not start progress updates when contentId is empty', () => {
    const mockOnProgress = jest.fn();

    renderHook(() => useRealtimeProgress('', mockOnProgress));

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(mockOnProgress).not.toHaveBeenCalled();
  });

  it('cleans up interval on unmount', () => {
    const mockOnProgress = jest.fn();
    const contentId = 'test-content-id';

    const { unmount } = renderHook(() => useRealtimeProgress(contentId, mockOnProgress));

    // Start some progress
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(mockOnProgress).toHaveBeenCalled();
    
    // Unmount the hook
    unmount();

    // Clear previous calls
    mockOnProgress.mockClear();

    // Advance time after unmount
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    // Should not be called after unmount
    expect(mockOnProgress).not.toHaveBeenCalled();
  });

  it('restarts progress when contentId changes', () => {
    const mockOnProgress = jest.fn();
    let contentId = 'content-1';

    const { rerender } = renderHook(() => useRealtimeProgress(contentId, mockOnProgress));

    // Initial progress
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    const initialCalls = mockOnProgress.mock.calls.length;
    mockOnProgress.mockClear();

    // Change contentId
    contentId = 'content-2';
    rerender();

    // Should restart progress
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(mockOnProgress).toHaveBeenCalledWith(
      expect.objectContaining({
        stage: 'Initializing',
        progress: expect.any(Number),
        message: 'Processing initializing...'
      })
    );
  });

  it('generates random progress increments', () => {
    const mockOnProgress = jest.fn();
    const contentId = 'test-content-id';

    renderHook(() => useRealtimeProgress(contentId, mockOnProgress));

    // Collect several progress updates
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    const progressValues = mockOnProgress.mock.calls.map(call => call[0].progress);
    
    // Progress should be increasing
    for (let i = 1; i < progressValues.length; i++) {
      if (mockOnProgress.mock.calls[i][0].stage === mockOnProgress.mock.calls[i-1][0].stage) {
        expect(progressValues[i]).toBeGreaterThanOrEqual(progressValues[i-1]);
      }
    }
  });
});