import { useState, useEffect } from 'react';

export interface ResponsiveBreakpoints {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLargeDesktop: boolean;
  screenWidth: number;
  screenHeight: number;
  orientation: 'portrait' | 'landscape';
  isTouchDevice: boolean;
  devicePixelRatio: number;
}

// Breakpoint definitions
const BREAKPOINTS = {
  mobile: 640,
  tablet: 1024,
  desktop: 1280,
  largeDesktop: 1536,
} as const;

/**
 * Hook for responsive design detection and mobile optimization
 * Provides comprehensive device and screen information
 */
export function useResponsive(): ResponsiveBreakpoints {
  const [responsive, setResponsive] = useState<ResponsiveBreakpoints>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isLargeDesktop: false,
    screenWidth: 1920,
    screenHeight: 1080,
    orientation: 'landscape',
    isTouchDevice: false,
    devicePixelRatio: 1,
  });

  useEffect(() => {
    function updateResponsive() {
      if (typeof window === 'undefined') return;

      const width = window.innerWidth;
      const height = window.innerHeight;
      const orientation = width > height ? 'landscape' : 'portrait';
      
      // Detect touch device
      const isTouchDevice = 
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        // @ts-ignore - legacy property
        navigator.msMaxTouchPoints > 0;

      // Calculate device pixel ratio
      const devicePixelRatio = window.devicePixelRatio || 1;

      // Determine breakpoints
      const isMobile = width < BREAKPOINTS.mobile;
      const isTablet = width >= BREAKPOINTS.mobile && width < BREAKPOINTS.desktop;
      const isDesktop = width >= BREAKPOINTS.desktop && width < BREAKPOINTS.largeDesktop;
      const isLargeDesktop = width >= BREAKPOINTS.largeDesktop;

      setResponsive({
        isMobile,
        isTablet,
        isDesktop,
        isLargeDesktop,
        screenWidth: width,
        screenHeight: height,
        orientation,
        isTouchDevice,
        devicePixelRatio,
      });
    }

    // Initial check
    updateResponsive();

    // Listen for resize events
    window.addEventListener('resize', updateResponsive);
    window.addEventListener('orientationchange', updateResponsive);

    return () => {
      window.removeEventListener('resize', updateResponsive);
      window.removeEventListener('orientationchange', updateResponsive);
    };
  }, []);

  return responsive;
}

/**
 * Hook for mobile-specific optimizations
 * Returns mobile-optimized class names and configurations
 */
export function useMobileOptimization() {
  const responsive = useResponsive();

  const getResponsiveClasses = (baseClasses: string) => {
    const classes = [baseClasses];

    if (responsive.isMobile) {
      classes.push('mobile-optimized');
    }

    if (responsive.isTablet) {
      classes.push('tablet-optimized');
    }

    if (responsive.isTouchDevice) {
      classes.push('touch-optimized');
    }

    return classes.join(' ');
  };

  const getButtonClasses = (baseClasses: string) => {
    if (responsive.isMobile || responsive.isTouchDevice) {
      return `${baseClasses} btn-mobile min-h-[44px] touch-target`;
    }
    return baseClasses;
  };

  const getInputClasses = (baseClasses: string) => {
    if (responsive.isMobile) {
      return `${baseClasses} form-field-mobile text-base`; // text-base prevents zoom on iOS
    }
    return baseClasses;
  };

  const getCardClasses = (baseClasses: string) => {
    if (responsive.isMobile) {
      return `${baseClasses} card-mobile p-4 mb-4`;
    }
    return baseClasses;
  };

  const getGridClasses = (baseClasses: string) => {
    if (responsive.isMobile) {
      return `${baseClasses} dashboard-grid-mobile grid-cols-1`;
    }
    if (responsive.isTablet) {
      return `${baseClasses} dashboard-grid-tablet grid-cols-2`;
    }
    return baseClasses;
  };

  return {
    ...responsive,
    getResponsiveClasses,
    getButtonClasses,
    getInputClasses,
    getCardClasses,
    getGridClasses,
  };
}

/**
 * Hook for performance-conscious mobile rendering
 * Provides utilities for conditional rendering and optimization
 */
export function useMobilePerformance() {
  const responsive = useResponsive();

  // Determine if expensive components should be rendered
  const shouldRenderHeavyComponent = () => {
    // On mobile, be more conservative with heavy components
    if (responsive.isMobile) {
      return false;
    }
    
    // On tablets, render based on device capabilities
    if (responsive.isTablet) {
      return responsive.devicePixelRatio <= 2; // Avoid on high-DPI tablets
    }
    
    return true;
  };

  // Get optimized image sizes for responsive images
  const getOptimizedImageSizes = () => {
    if (responsive.isMobile) {
      return {
        width: Math.min(responsive.screenWidth, 640),
        height: Math.min(responsive.screenHeight, 480),
        quality: 75,
        format: 'webp',
      };
    }
    
    if (responsive.isTablet) {
      return {
        width: Math.min(responsive.screenWidth, 1024),
        height: Math.min(responsive.screenHeight, 768),
        quality: 85,
        format: 'webp',
      };
    }
    
    return {
      width: responsive.screenWidth,
      height: responsive.screenHeight,
      quality: 90,
      format: 'webp',
    };
  };

  // Determine appropriate virtualization settings
  const getVirtualizationConfig = () => {
    if (responsive.isMobile) {
      return {
        itemHeight: 60,
        overscanCount: 5,
        windowSize: 10,
      };
    }
    
    return {
      itemHeight: 48,
      overscanCount: 10,
      windowSize: 20,
    };
  };

  // Get appropriate animation settings
  const getAnimationConfig = () => {
    // Disable complex animations on mobile for better performance
    if (responsive.isMobile) {
      return {
        enableAnimations: false,
        duration: 150,
        easing: 'ease-out',
      };
    }
    
    return {
      enableAnimations: true,
      duration: 300,
      easing: 'ease-in-out',
    };
  };

  return {
    ...responsive,
    shouldRenderHeavyComponent,
    getOptimizedImageSizes,
    getVirtualizationConfig,
    getAnimationConfig,
  };
}

/**
 * Utility hook for viewport detection
 * Simplified version for basic responsive needs
 */
export function useViewport() {
  const [viewport, setViewport] = useState({
    width: 1920,
    height: 1080,
  });

  useEffect(() => {
    function updateViewport() {
      if (typeof window !== 'undefined') {
        setViewport({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      }
    }

    updateViewport();
    window.addEventListener('resize', updateViewport);
    
    return () => window.removeEventListener('resize', updateViewport);
  }, []);

  return viewport;
}

// Export breakpoint constants for use in components
export { BREAKPOINTS };

// Helper function for CSS-in-JS responsive breakpoints
export const mediaQueries = {
  mobile: `@media (max-width: ${BREAKPOINTS.mobile - 1}px)`,
  tablet: `@media (min-width: ${BREAKPOINTS.mobile}px) and (max-width: ${BREAKPOINTS.desktop - 1}px)`,
  desktop: `@media (min-width: ${BREAKPOINTS.desktop}px)`,
  largeDesktop: `@media (min-width: ${BREAKPOINTS.largeDesktop}px)`,
  touch: '@media (hover: none) and (pointer: coarse)',
  reducedMotion: '@media (prefers-reduced-motion: reduce)',
  darkMode: '@media (prefers-color-scheme: dark)',
} as const;