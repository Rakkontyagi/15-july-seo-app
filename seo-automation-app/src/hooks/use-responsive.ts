'use client';

import { useState, useEffect, useCallback } from 'react';

export interface ResponsiveConfig {
  sm: number;
  md: number;
  lg: number;
  xl: number;
  '2xl': number;
}

export const defaultBreakpoints: ResponsiveConfig = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

export type BreakpointKey = keyof ResponsiveConfig;

export interface ResponsiveState {
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLargeDesktop: boolean;
  currentBreakpoint: BreakpointKey | 'xs';
  orientation: 'portrait' | 'landscape';
  isTouch: boolean;
  pixelRatio: number;
}

export interface UseResponsiveOptions {
  breakpoints?: Partial<ResponsiveConfig>;
  debounceMs?: number;
  enableTouch?: boolean;
  enableOrientation?: boolean;
}

/**
 * Advanced responsive hook that provides comprehensive viewport information
 * and responsive utilities for React components.
 */
export function useResponsive(options: UseResponsiveOptions = {}): ResponsiveState {
  const {
    breakpoints = defaultBreakpoints,
    debounceMs = 150,
    enableTouch = true,
    enableOrientation = true,
  } = options;

  const mergedBreakpoints = { ...defaultBreakpoints, ...breakpoints };

  const [state, setState] = useState<ResponsiveState>(() => {
    // Initialize with safe defaults for SSR
    if (typeof window === 'undefined') {
      return {
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
      };
    }

    return getResponsiveState(mergedBreakpoints, enableTouch, enableOrientation);
  });

  const updateState = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    const newState = getResponsiveState(mergedBreakpoints, enableTouch, enableOrientation);
    setState(prevState => {
      // Only update if state has actually changed
      if (JSON.stringify(prevState) !== JSON.stringify(newState)) {
        return newState;
      }
      return prevState;
    });
  }, [mergedBreakpoints, enableTouch, enableOrientation]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Update state immediately on mount
    updateState();

    let timeoutId: NodeJS.Timeout;
    
    const debouncedUpdate = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateState, debounceMs);
    };

    // Listen for resize events
    window.addEventListener('resize', debouncedUpdate);
    
    // Listen for orientation change events if enabled
    if (enableOrientation) {
      window.addEventListener('orientationchange', debouncedUpdate);
    }

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', debouncedUpdate);
      if (enableOrientation) {
        window.removeEventListener('orientationchange', debouncedUpdate);
      }
    };
  }, [updateState, debounceMs, enableOrientation]);

  return state;
}

/**
 * Get current responsive state based on window dimensions
 */
function getResponsiveState(
  breakpoints: ResponsiveConfig,
  enableTouch: boolean,
  enableOrientation: boolean
): ResponsiveState {
  const width = window.innerWidth;
  const height = window.innerHeight;
  
  // Determine current breakpoint
  let currentBreakpoint: BreakpointKey | 'xs' = 'xs';
  if (width >= breakpoints['2xl']) {
    currentBreakpoint = '2xl';
  } else if (width >= breakpoints.xl) {
    currentBreakpoint = 'xl';
  } else if (width >= breakpoints.lg) {
    currentBreakpoint = 'lg';
  } else if (width >= breakpoints.md) {
    currentBreakpoint = 'md';
  } else if (width >= breakpoints.sm) {
    currentBreakpoint = 'sm';
  }

  // Determine device categories
  const isMobile = width < breakpoints.md;
  const isTablet = width >= breakpoints.md && width < breakpoints.lg;
  const isDesktop = width >= breakpoints.lg && width < breakpoints['2xl'];
  const isLargeDesktop = width >= breakpoints['2xl'];

  // Determine orientation
  const orientation: 'portrait' | 'landscape' = enableOrientation 
    ? (height > width ? 'portrait' : 'landscape')
    : 'landscape';

  // Detect touch capability
  const isTouch = enableTouch 
    ? ('ontouchstart' in window || navigator.maxTouchPoints > 0)
    : false;

  // Get pixel ratio
  const pixelRatio = window.devicePixelRatio || 1;

  return {
    width,
    height,
    isMobile,
    isTablet,
    isDesktop,
    isLargeDesktop,
    currentBreakpoint,
    orientation,
    isTouch,
    pixelRatio,
  };
}

/**
 * Hook for getting responsive values based on current breakpoint
 */
export function useResponsiveValue<T>(values: {
  xs?: T;
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
  '2xl'?: T;
}): T | undefined {
  const { currentBreakpoint } = useResponsive();
  
  // Return value for current breakpoint or fallback to smaller breakpoints
  const breakpointOrder: (BreakpointKey | 'xs')[] = ['2xl', 'xl', 'lg', 'md', 'sm', 'xs'];
  const currentIndex = breakpointOrder.indexOf(currentBreakpoint);
  
  for (let i = currentIndex; i < breakpointOrder.length; i++) {
    const breakpoint = breakpointOrder[i];
    if (values[breakpoint] !== undefined) {
      return values[breakpoint];
    }
  }
  
  return undefined;
}

/**
 * Hook for media query matching
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

/**
 * Hook for detecting if user prefers reduced motion
 */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}

/**
 * Hook for detecting dark mode preference
 */
export function usePrefersDarkMode(): boolean {
  return useMediaQuery('(prefers-color-scheme: dark)');
}

/**
 * Hook for detecting high contrast preference
 */
export function usePrefersHighContrast(): boolean {
  return useMediaQuery('(prefers-contrast: high)');
}

/**
 * Utility function to get responsive classes
 */
export function getResponsiveClasses(
  baseClasses: string,
  responsiveClasses: Partial<Record<BreakpointKey | 'xs', string>>
): string {
  const classes = [baseClasses];
  
  Object.entries(responsiveClasses).forEach(([breakpoint, className]) => {
    if (className) {
      if (breakpoint === 'xs') {
        classes.push(className);
      } else {
        classes.push(`${breakpoint}:${className}`);
      }
    }
  });
  
  return classes.join(' ');
}
