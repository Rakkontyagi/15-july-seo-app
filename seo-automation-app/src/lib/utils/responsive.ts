/**
 * Responsive Design Utilities
 * Comprehensive utilities for responsive design, breakpoint management,
 * and adaptive layouts in the SEO Automation App.
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Breakpoint definitions matching Tailwind CSS defaults
export const breakpoints = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

export type BreakpointKey = keyof typeof breakpoints;

// Device categories
export const deviceCategories = {
  mobile: { min: 0, max: 767 },
  tablet: { min: 768, max: 1023 },
  desktop: { min: 1024, max: 1279 },
  largeDesktop: { min: 1280, max: Infinity },
} as const;

export type DeviceCategory = keyof typeof deviceCategories;

/**
 * Get the current breakpoint based on window width
 */
export function getCurrentBreakpoint(width: number = typeof window !== 'undefined' ? window.innerWidth : 1024): BreakpointKey {
  if (width >= breakpoints['2xl']) return '2xl';
  if (width >= breakpoints.xl) return 'xl';
  if (width >= breakpoints.lg) return 'lg';
  if (width >= breakpoints.md) return 'md';
  if (width >= breakpoints.sm) return 'sm';
  return 'xs';
}

/**
 * Get the current device category based on window width
 */
export function getDeviceCategory(width: number = typeof window !== 'undefined' ? window.innerWidth : 1024): DeviceCategory {
  if (width >= deviceCategories.largeDesktop.min) return 'largeDesktop';
  if (width >= deviceCategories.desktop.min) return 'desktop';
  if (width >= deviceCategories.tablet.min) return 'tablet';
  return 'mobile';
}

/**
 * Check if current viewport matches a breakpoint
 */
export function isBreakpoint(breakpoint: BreakpointKey, width?: number): boolean {
  const currentBreakpoint = getCurrentBreakpoint(width);
  return currentBreakpoint === breakpoint;
}

/**
 * Check if current viewport is at or above a breakpoint
 */
export function isBreakpointUp(breakpoint: BreakpointKey, width?: number): boolean {
  const currentWidth = width ?? (typeof window !== 'undefined' ? window.innerWidth : 1024);
  return currentWidth >= breakpoints[breakpoint];
}

/**
 * Check if current viewport is below a breakpoint
 */
export function isBreakpointDown(breakpoint: BreakpointKey, width?: number): boolean {
  const currentWidth = width ?? (typeof window !== 'undefined' ? window.innerWidth : 1024);
  return currentWidth < breakpoints[breakpoint];
}

/**
 * Check if current viewport is between two breakpoints
 */
export function isBreakpointBetween(
  minBreakpoint: BreakpointKey,
  maxBreakpoint: BreakpointKey,
  width?: number
): boolean {
  const currentWidth = width ?? (typeof window !== 'undefined' ? window.innerWidth : 1024);
  return currentWidth >= breakpoints[minBreakpoint] && currentWidth < breakpoints[maxBreakpoint];
}

/**
 * Get responsive value based on current breakpoint
 */
export function getResponsiveValue<T>(
  values: Partial<Record<BreakpointKey, T>>,
  fallback: T,
  width?: number
): T {
  const currentBreakpoint = getCurrentBreakpoint(width);
  
  // Try current breakpoint first
  if (values[currentBreakpoint] !== undefined) {
    return values[currentBreakpoint]!;
  }
  
  // Fallback to smaller breakpoints
  const breakpointOrder: BreakpointKey[] = ['2xl', 'xl', 'lg', 'md', 'sm', 'xs'];
  const currentIndex = breakpointOrder.indexOf(currentBreakpoint);
  
  for (let i = currentIndex + 1; i < breakpointOrder.length; i++) {
    const bp = breakpointOrder[i];
    if (values[bp] !== undefined) {
      return values[bp]!;
    }
  }
  
  return fallback;
}

/**
 * Generate responsive CSS classes
 */
export function responsiveClasses(
  baseClasses: ClassValue,
  responsiveClasses: Partial<Record<BreakpointKey, ClassValue>>
): string {
  const classes = [baseClasses];
  
  Object.entries(responsiveClasses).forEach(([breakpoint, className]) => {
    if (className) {
      if (breakpoint === 'xs') {
        classes.push(className);
      } else {
        const prefixedClasses = clsx(className)
          .split(' ')
          .map(cls => `${breakpoint}:${cls}`)
          .join(' ');
        classes.push(prefixedClasses);
      }
    }
  });
  
  return twMerge(clsx(classes));
}

/**
 * Generate container classes based on breakpoint
 */
export function containerClasses(
  breakpoint?: BreakpointKey,
  customPadding?: Partial<Record<BreakpointKey, string>>
): string {
  const padding = customPadding || {
    xs: 'px-4',
    sm: 'px-6',
    md: 'px-8',
    lg: 'px-8',
    xl: 'px-8',
    '2xl': 'px-8',
  };
  
  const maxWidths = {
    xs: 'max-w-full',
    sm: 'max-w-screen-sm',
    md: 'max-w-screen-md',
    lg: 'max-w-screen-lg',
    xl: 'max-w-screen-xl',
    '2xl': 'max-w-screen-2xl',
  };
  
  const currentBreakpoint = breakpoint || getCurrentBreakpoint();
  
  return twMerge(
    'mx-auto w-full',
    maxWidths[currentBreakpoint],
    responsiveClasses('', padding)
  );
}

/**
 * Generate grid classes based on responsive configuration
 */
export function gridClasses(
  columns: Partial<Record<BreakpointKey, number>>,
  gap?: Partial<Record<BreakpointKey, string>>
): string {
  const gridCols = Object.entries(columns).reduce((acc, [bp, cols]) => {
    const breakpoint = bp as BreakpointKey;
    const colClass = `grid-cols-${cols}`;
    acc[breakpoint] = colClass;
    return acc;
  }, {} as Partial<Record<BreakpointKey, string>>);
  
  const gridGap = gap ? Object.entries(gap).reduce((acc, [bp, gapValue]) => {
    const breakpoint = bp as BreakpointKey;
    acc[breakpoint] = `gap-${gapValue}`;
    return acc;
  }, {} as Partial<Record<BreakpointKey, string>>) : {};
  
  return responsiveClasses(
    'grid',
    { ...gridCols, ...gridGap }
  );
}

/**
 * Generate typography classes based on responsive configuration
 */
export function typographyClasses(
  sizes: Partial<Record<BreakpointKey, string>>,
  weights?: Partial<Record<BreakpointKey, string>>,
  lineHeights?: Partial<Record<BreakpointKey, string>>
): string {
  const textSizes = Object.entries(sizes).reduce((acc, [bp, size]) => {
    const breakpoint = bp as BreakpointKey;
    acc[breakpoint] = `text-${size}`;
    return acc;
  }, {} as Partial<Record<BreakpointKey, string>>);
  
  const fontWeights = weights ? Object.entries(weights).reduce((acc, [bp, weight]) => {
    const breakpoint = bp as BreakpointKey;
    acc[breakpoint] = `font-${weight}`;
    return acc;
  }, {} as Partial<Record<BreakpointKey, string>>) : {};
  
  const leadings = lineHeights ? Object.entries(lineHeights).reduce((acc, [bp, leading]) => {
    const breakpoint = bp as BreakpointKey;
    acc[breakpoint] = `leading-${leading}`;
    return acc;
  }, {} as Partial<Record<BreakpointKey, string>>) : {};
  
  return responsiveClasses('', { ...textSizes, ...fontWeights, ...leadings });
}

/**
 * Generate spacing classes based on responsive configuration
 */
export function spacingClasses(
  type: 'p' | 'm' | 'px' | 'py' | 'pt' | 'pb' | 'pl' | 'pr' | 'mx' | 'my' | 'mt' | 'mb' | 'ml' | 'mr',
  values: Partial<Record<BreakpointKey, string | number>>
): string {
  const spacingValues = Object.entries(values).reduce((acc, [bp, value]) => {
    const breakpoint = bp as BreakpointKey;
    acc[breakpoint] = `${type}-${value}`;
    return acc;
  }, {} as Partial<Record<BreakpointKey, string>>);
  
  return responsiveClasses('', spacingValues);
}

/**
 * Generate flex classes based on responsive configuration
 */
export function flexClasses(
  direction?: Partial<Record<BreakpointKey, 'row' | 'col' | 'row-reverse' | 'col-reverse'>>,
  justify?: Partial<Record<BreakpointKey, string>>,
  align?: Partial<Record<BreakpointKey, string>>,
  wrap?: Partial<Record<BreakpointKey, 'wrap' | 'nowrap' | 'wrap-reverse'>>
): string {
  const flexDirection = direction ? Object.entries(direction).reduce((acc, [bp, dir]) => {
    const breakpoint = bp as BreakpointKey;
    acc[breakpoint] = `flex-${dir}`;
    return acc;
  }, {} as Partial<Record<BreakpointKey, string>>) : {};
  
  const justifyContent = justify ? Object.entries(justify).reduce((acc, [bp, just]) => {
    const breakpoint = bp as BreakpointKey;
    acc[breakpoint] = `justify-${just}`;
    return acc;
  }, {} as Partial<Record<BreakpointKey, string>>) : {};
  
  const alignItems = align ? Object.entries(align).reduce((acc, [bp, al]) => {
    const breakpoint = bp as BreakpointKey;
    acc[breakpoint] = `items-${al}`;
    return acc;
  }, {} as Partial<Record<BreakpointKey, string>>) : {};
  
  const flexWrap = wrap ? Object.entries(wrap).reduce((acc, [bp, wr]) => {
    const breakpoint = bp as BreakpointKey;
    acc[breakpoint] = `flex-${wr}`;
    return acc;
  }, {} as Partial<Record<BreakpointKey, string>>) : {};
  
  return responsiveClasses(
    'flex',
    { ...flexDirection, ...justifyContent, ...alignItems, ...flexWrap }
  );
}

/**
 * Touch-optimized classes for mobile devices
 */
export function touchOptimizedClasses(isMobile: boolean = false): string {
  if (!isMobile) return '';
  
  return clsx(
    'touch-manipulation', // Optimize touch interactions
    'select-none', // Prevent text selection on touch
    'tap-highlight-transparent', // Remove tap highlight
    'min-h-[44px]', // Minimum touch target size
    'min-w-[44px]'
  );
}

/**
 * Accessibility-focused responsive classes
 */
export function accessibilityClasses(
  focusVisible: boolean = true,
  highContrast: boolean = false
): string {
  return clsx(
    focusVisible && [
      'focus:outline-none',
      'focus:ring-2',
      'focus:ring-ring',
      'focus:ring-offset-2'
    ],
    highContrast && [
      'contrast-more:border-2',
      'contrast-more:border-current'
    ]
  );
}

/**
 * Performance-optimized classes for responsive images
 */
export function responsiveImageClasses(): string {
  return clsx(
    'w-full',
    'h-auto',
    'object-cover',
    'transition-opacity',
    'duration-300'
  );
}

/**
 * Utility to create media query strings
 */
export function createMediaQuery(
  breakpoint: BreakpointKey,
  type: 'min' | 'max' = 'min'
): string {
  const width = breakpoints[breakpoint];
  return `(${type}-width: ${width}px)`;
}

/**
 * Utility to check if device supports hover
 */
export function supportsHover(): boolean {
  if (typeof window === 'undefined') return true;
  return window.matchMedia('(hover: hover)').matches;
}

/**
 * Utility to check if device has fine pointer (mouse)
 */
export function hasFinePointer(): boolean {
  if (typeof window === 'undefined') return true;
  return window.matchMedia('(pointer: fine)').matches;
}
