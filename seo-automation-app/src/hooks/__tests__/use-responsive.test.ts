import { renderHook, act } from '@testing-library/react';
import { useResponsive, useResponsiveValue, useMediaQuery, usePrefersReducedMotion } from '../use-responsive';

// Mock window.matchMedia
const mockMatchMedia = (matches: boolean) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({
      matches,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
};

// Mock window dimensions
const mockWindowDimensions = (width: number, height: number) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  });
};

// Mock device pixel ratio
const mockDevicePixelRatio = (ratio: number) => {
  Object.defineProperty(window, 'devicePixelRatio', {
    writable: true,
    configurable: true,
    value: ratio,
  });
};

// Mock touch support
const mockTouchSupport = (hasTouch: boolean) => {
  if (hasTouch) {
    Object.defineProperty(window, 'ontouchstart', {
      writable: true,
      configurable: true,
      value: () => {},
    });
    Object.defineProperty(navigator, 'maxTouchPoints', {
      writable: true,
      configurable: true,
      value: 1,
    });
  } else {
    delete (window as any).ontouchstart;
    Object.defineProperty(navigator, 'maxTouchPoints', {
      writable: true,
      configurable: true,
      value: 0,
    });
  }
};

describe('useResponsive', () => {
  beforeEach(() => {
    // Reset to default values
    mockWindowDimensions(1024, 768);
    mockDevicePixelRatio(1);
    mockTouchSupport(false);
    mockMatchMedia(false);
  });

  describe('Basic Functionality', () => {
    it('returns correct initial state for desktop', () => {
      mockWindowDimensions(1024, 768);
      
      const { result } = renderHook(() => useResponsive());
      
      expect(result.current).toEqual({
        width: 1024,
        height: 768,
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isLargeDesktop: false,
        currentBreakpoint: 'lg',
        orientation: 'landscape',
        isTouch: false,
        pixelRatio: 1,
      });
    });

    it('returns correct state for mobile', () => {
      mockWindowDimensions(375, 667);
      mockTouchSupport(true);
      
      const { result } = renderHook(() => useResponsive());
      
      expect(result.current).toEqual({
        width: 375,
        height: 667,
        isMobile: true,
        isTablet: false,
        isDesktop: false,
        isLargeDesktop: false,
        currentBreakpoint: 'xs',
        orientation: 'portrait',
        isTouch: true,
        pixelRatio: 1,
      });
    });

    it('returns correct state for tablet', () => {
      mockWindowDimensions(768, 1024);
      
      const { result } = renderHook(() => useResponsive());
      
      expect(result.current).toEqual({
        width: 768,
        height: 1024,
        isMobile: false,
        isTablet: true,
        isDesktop: false,
        isLargeDesktop: false,
        currentBreakpoint: 'md',
        orientation: 'portrait',
        isTouch: false,
        pixelRatio: 1,
      });
    });

    it('returns correct state for large desktop', () => {
      mockWindowDimensions(1920, 1080);
      
      const { result } = renderHook(() => useResponsive());
      
      expect(result.current).toEqual({
        width: 1920,
        height: 1080,
        isMobile: false,
        isTablet: false,
        isDesktop: false,
        isLargeDesktop: true,
        currentBreakpoint: '2xl',
        orientation: 'landscape',
        isTouch: false,
        pixelRatio: 1,
      });
    });
  });

  describe('Breakpoint Detection', () => {
    it('correctly identifies xs breakpoint', () => {
      mockWindowDimensions(320, 568);
      
      const { result } = renderHook(() => useResponsive());
      
      expect(result.current.currentBreakpoint).toBe('xs');
      expect(result.current.isMobile).toBe(true);
    });

    it('correctly identifies sm breakpoint', () => {
      mockWindowDimensions(640, 480);
      
      const { result } = renderHook(() => useResponsive());
      
      expect(result.current.currentBreakpoint).toBe('sm');
      expect(result.current.isMobile).toBe(true);
    });

    it('correctly identifies md breakpoint', () => {
      mockWindowDimensions(768, 1024);
      
      const { result } = renderHook(() => useResponsive());
      
      expect(result.current.currentBreakpoint).toBe('md');
      expect(result.current.isTablet).toBe(true);
    });

    it('correctly identifies lg breakpoint', () => {
      mockWindowDimensions(1024, 768);
      
      const { result } = renderHook(() => useResponsive());
      
      expect(result.current.currentBreakpoint).toBe('lg');
      expect(result.current.isDesktop).toBe(true);
    });

    it('correctly identifies xl breakpoint', () => {
      mockWindowDimensions(1280, 720);
      
      const { result } = renderHook(() => useResponsive());
      
      expect(result.current.currentBreakpoint).toBe('xl');
      expect(result.current.isDesktop).toBe(true);
    });

    it('correctly identifies 2xl breakpoint', () => {
      mockWindowDimensions(1536, 864);
      
      const { result } = renderHook(() => useResponsive());
      
      expect(result.current.currentBreakpoint).toBe('2xl');
      expect(result.current.isLargeDesktop).toBe(true);
    });
  });

  describe('Custom Breakpoints', () => {
    it('uses custom breakpoints when provided', () => {
      mockWindowDimensions(800, 600);
      
      const customBreakpoints = {
        sm: 500,
        md: 800,
        lg: 1200,
      };
      
      const { result } = renderHook(() => useResponsive({ breakpoints: customBreakpoints }));
      
      expect(result.current.currentBreakpoint).toBe('md');
    });
  });

  describe('Orientation Detection', () => {
    it('detects portrait orientation', () => {
      mockWindowDimensions(375, 667);
      
      const { result } = renderHook(() => useResponsive());
      
      expect(result.current.orientation).toBe('portrait');
    });

    it('detects landscape orientation', () => {
      mockWindowDimensions(667, 375);
      
      const { result } = renderHook(() => useResponsive());
      
      expect(result.current.orientation).toBe('landscape');
    });

    it('can disable orientation detection', () => {
      mockWindowDimensions(375, 667);
      
      const { result } = renderHook(() => useResponsive({ enableOrientation: false }));
      
      expect(result.current.orientation).toBe('landscape');
    });
  });

  describe('Touch Detection', () => {
    it('detects touch support', () => {
      mockTouchSupport(true);
      
      const { result } = renderHook(() => useResponsive());
      
      expect(result.current.isTouch).toBe(true);
    });

    it('detects no touch support', () => {
      mockTouchSupport(false);
      
      const { result } = renderHook(() => useResponsive());
      
      expect(result.current.isTouch).toBe(false);
    });

    it('can disable touch detection', () => {
      mockTouchSupport(true);
      
      const { result } = renderHook(() => useResponsive({ enableTouch: false }));
      
      expect(result.current.isTouch).toBe(false);
    });
  });

  describe('Pixel Ratio Detection', () => {
    it('detects standard pixel ratio', () => {
      mockDevicePixelRatio(1);
      
      const { result } = renderHook(() => useResponsive());
      
      expect(result.current.pixelRatio).toBe(1);
    });

    it('detects high pixel ratio', () => {
      mockDevicePixelRatio(2);
      
      const { result } = renderHook(() => useResponsive());
      
      expect(result.current.pixelRatio).toBe(2);
    });

    it('handles missing devicePixelRatio', () => {
      delete (window as any).devicePixelRatio;
      
      const { result } = renderHook(() => useResponsive());
      
      expect(result.current.pixelRatio).toBe(1);
    });
  });

  describe('SSR Support', () => {
    it('provides safe defaults for SSR', () => {
      // Simulate SSR environment
      const originalWindow = global.window;
      delete (global as any).window;
      
      const { result } = renderHook(() => useResponsive());
      
      expect(result.current).toEqual({
        width: 1024,
        height: 768,
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isLargeDesktop: false,
        currentBreakpoint: 'lg',
        orientation: 'landscape',
        isTouch: false,
        pixelRatio: 1,
      });
      
      // Restore window
      global.window = originalWindow;
    });
  });
});

describe('useResponsiveValue', () => {
  beforeEach(() => {
    mockWindowDimensions(1024, 768);
  });

  it('returns value for current breakpoint', () => {
    const values = {
      xs: 'mobile',
      sm: 'small',
      md: 'medium',
      lg: 'large',
      xl: 'extra-large',
      '2xl': 'huge',
    };
    
    const { result } = renderHook(() => useResponsiveValue(values));
    
    expect(result.current).toBe('large');
  });

  it('falls back to smaller breakpoints when current is not defined', () => {
    const values = {
      xs: 'mobile',
      md: 'medium',
    };
    
    const { result } = renderHook(() => useResponsiveValue(values));
    
    expect(result.current).toBe('medium');
  });

  it('returns undefined when no matching value found', () => {
    const values = {
      '2xl': 'huge',
    };
    
    const { result } = renderHook(() => useResponsiveValue(values));
    
    expect(result.current).toBeUndefined();
  });
});

describe('useMediaQuery', () => {
  it('returns true when media query matches', () => {
    mockMatchMedia(true);
    
    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));
    
    expect(result.current).toBe(true);
  });

  it('returns false when media query does not match', () => {
    mockMatchMedia(false);
    
    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));
    
    expect(result.current).toBe(false);
  });
});

describe('usePrefersReducedMotion', () => {
  it('returns true when user prefers reduced motion', () => {
    mockMatchMedia(true);
    
    const { result } = renderHook(() => usePrefersReducedMotion());
    
    expect(result.current).toBe(true);
  });

  it('returns false when user does not prefer reduced motion', () => {
    mockMatchMedia(false);
    
    const { result } = renderHook(() => usePrefersReducedMotion());
    
    expect(result.current).toBe(false);
  });
});
