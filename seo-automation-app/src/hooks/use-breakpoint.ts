'use client';

import { useState, useEffect, useCallback } from 'react';
import { useResponsive, type BreakpointKey, type ResponsiveConfig } from './use-responsive';

export interface BreakpointState {
  current: BreakpointKey | 'xs';
  isXs: boolean;
  isSm: boolean;
  isMd: boolean;
  isLg: boolean;
  isXl: boolean;
  is2xl: boolean;
  isSmAndUp: boolean;
  isMdAndUp: boolean;
  isLgAndUp: boolean;
  isXlAndUp: boolean;
  is2xlAndUp: boolean;
  isSmAndDown: boolean;
  isMdAndDown: boolean;
  isLgAndDown: boolean;
  isXlAndDown: boolean;
}

export interface UseBreakpointOptions {
  breakpoints?: Partial<ResponsiveConfig>;
  debounceMs?: number;
}

/**
 * Hook for working with breakpoints in a more granular way.
 * Provides boolean flags for each breakpoint and range queries.
 */
export function useBreakpoint(options: UseBreakpointOptions = {}): BreakpointState {
  const { currentBreakpoint } = useResponsive(options);

  const state: BreakpointState = {
    current: currentBreakpoint,
    
    // Exact breakpoint matches
    isXs: currentBreakpoint === 'xs',
    isSm: currentBreakpoint === 'sm',
    isMd: currentBreakpoint === 'md',
    isLg: currentBreakpoint === 'lg',
    isXl: currentBreakpoint === 'xl',
    is2xl: currentBreakpoint === '2xl',
    
    // "And up" queries (inclusive)
    isSmAndUp: ['sm', 'md', 'lg', 'xl', '2xl'].includes(currentBreakpoint),
    isMdAndUp: ['md', 'lg', 'xl', '2xl'].includes(currentBreakpoint),
    isLgAndUp: ['lg', 'xl', '2xl'].includes(currentBreakpoint),
    isXlAndUp: ['xl', '2xl'].includes(currentBreakpoint),
    is2xlAndUp: currentBreakpoint === '2xl',
    
    // "And down" queries (inclusive)
    isSmAndDown: ['xs', 'sm'].includes(currentBreakpoint),
    isMdAndDown: ['xs', 'sm', 'md'].includes(currentBreakpoint),
    isLgAndDown: ['xs', 'sm', 'md', 'lg'].includes(currentBreakpoint),
    isXlAndDown: ['xs', 'sm', 'md', 'lg', 'xl'].includes(currentBreakpoint),
  };

  return state;
}

/**
 * Hook for conditional rendering based on breakpoints
 */
export function useBreakpointValue<T>(
  values: Partial<Record<BreakpointKey | 'xs', T>>,
  fallback?: T
): T | undefined {
  const { current } = useBreakpoint();
  
  // Try to get value for current breakpoint
  if (values[current] !== undefined) {
    return values[current];
  }
  
  // Fallback to smaller breakpoints
  const breakpointOrder: (BreakpointKey | 'xs')[] = ['2xl', 'xl', 'lg', 'md', 'sm', 'xs'];
  const currentIndex = breakpointOrder.indexOf(current);
  
  for (let i = currentIndex + 1; i < breakpointOrder.length; i++) {
    const breakpoint = breakpointOrder[i];
    if (values[breakpoint] !== undefined) {
      return values[breakpoint];
    }
  }
  
  return fallback;
}

/**
 * Hook for showing/hiding content based on breakpoint ranges
 */
export function useBreakpointVisibility() {
  const breakpoint = useBreakpoint();
  
  return {
    // Show only on specific breakpoints
    showOnXs: breakpoint.isXs,
    showOnSm: breakpoint.isSm,
    showOnMd: breakpoint.isMd,
    showOnLg: breakpoint.isLg,
    showOnXl: breakpoint.isXl,
    showOn2xl: breakpoint.is2xl,
    
    // Show on mobile (xs, sm)
    showOnMobile: breakpoint.isXs || breakpoint.isSm,
    
    // Show on tablet (md)
    showOnTablet: breakpoint.isMd,
    
    // Show on desktop (lg and up)
    showOnDesktop: breakpoint.isLgAndUp,
    
    // Hide on mobile
    hideOnMobile: !breakpoint.isSmAndDown,
    
    // Hide on desktop
    hideOnDesktop: !breakpoint.isLgAndUp,
    
    // Range visibility
    showSmAndUp: breakpoint.isSmAndUp,
    showMdAndUp: breakpoint.isMdAndUp,
    showLgAndUp: breakpoint.isLgAndUp,
    showXlAndUp: breakpoint.isXlAndUp,
    
    showSmAndDown: breakpoint.isSmAndDown,
    showMdAndDown: breakpoint.isMdAndDown,
    showLgAndDown: breakpoint.isLgAndDown,
    showXlAndDown: breakpoint.isXlAndDown,
  };
}

/**
 * Hook for getting responsive grid columns
 */
export function useResponsiveGrid(
  config: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
    '2xl'?: number;
  }
): number {
  const columns = useBreakpointValue(config, 1);
  return columns || 1;
}

/**
 * Hook for responsive spacing
 */
export function useResponsiveSpacing(
  config: {
    xs?: string | number;
    sm?: string | number;
    md?: string | number;
    lg?: string | number;
    xl?: string | number;
    '2xl'?: string | number;
  }
): string | number {
  const spacing = useBreakpointValue(config, '1rem');
  return spacing || '1rem';
}

/**
 * Hook for responsive font sizes
 */
export function useResponsiveFontSize(
  config: {
    xs?: string;
    sm?: string;
    md?: string;
    lg?: string;
    xl?: string;
    '2xl'?: string;
  }
): string {
  const fontSize = useBreakpointValue(config, '1rem');
  return fontSize || '1rem';
}

/**
 * Custom hook for responsive component variants
 */
export function useResponsiveVariant<T extends string>(
  variants: Partial<Record<BreakpointKey | 'xs', T>>,
  defaultVariant: T
): T {
  const variant = useBreakpointValue(variants, defaultVariant);
  return variant || defaultVariant;
}

/**
 * Hook for responsive container widths
 */
export function useResponsiveContainer(): {
  maxWidth: string;
  padding: string;
  className: string;
} {
  const { current } = useBreakpoint();
  
  const containerConfig = {
    xs: { maxWidth: '100%', padding: '1rem', className: 'container-xs' },
    sm: { maxWidth: '640px', padding: '1.5rem', className: 'container-sm' },
    md: { maxWidth: '768px', padding: '2rem', className: 'container-md' },
    lg: { maxWidth: '1024px', padding: '2rem', className: 'container-lg' },
    xl: { maxWidth: '1280px', padding: '2rem', className: 'container-xl' },
    '2xl': { maxWidth: '1536px', padding: '2rem', className: 'container-2xl' },
  };
  
  return containerConfig[current] || containerConfig.lg;
}

/**
 * Hook for responsive navigation behavior
 */
export function useResponsiveNavigation() {
  const { isMobile, isTablet, isDesktop } = useResponsive();
  const visibility = useBreakpointVisibility();
  
  return {
    // Navigation states
    shouldShowMobileMenu: isMobile,
    shouldShowTabletNav: isTablet,
    shouldShowDesktopNav: isDesktop,
    shouldCollapseSidebar: isMobile || isTablet,
    
    // Menu behaviors
    useHamburgerMenu: visibility.showOnMobile,
    useTabNavigation: visibility.showOnTablet,
    useFullNavigation: visibility.showOnDesktop,
    
    // Layout adjustments
    sidebarWidth: isMobile ? '100%' : isTablet ? '240px' : '280px',
    headerHeight: isMobile ? '56px' : '64px',
    
    // Touch optimizations
    touchTargetSize: isMobile ? '44px' : '40px',
    spacing: isMobile ? '0.75rem' : '1rem',
  };
}

/**
 * Utility function to create responsive CSS classes
 */
export function createResponsiveClasses(
  baseClass: string,
  responsiveClasses: Partial<Record<BreakpointKey | 'xs', string>>
): string {
  const classes = [baseClass];
  
  Object.entries(responsiveClasses).forEach(([breakpoint, className]) => {
    if (className) {
      if (breakpoint === 'xs') {
        classes.push(className);
      } else {
        classes.push(`${breakpoint}:${className}`);
      }
    }
  });
  
  return classes.filter(Boolean).join(' ');
}
