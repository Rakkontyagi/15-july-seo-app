/**
 * Touch and Mobile Optimization Utilities for SEO Automation App
 * Provides comprehensive mobile interaction optimization and testing
 */

export interface TouchTarget {
  element: HTMLElement;
  rect: DOMRect;
  isInteractive: boolean;
  hasProperSize: boolean;
  hasProperSpacing: boolean;
  touchArea: number;
}

export interface TouchOptimizationResult {
  passed: boolean;
  issues: TouchIssue[];
  recommendations: string[];
  touchTargets: TouchTarget[];
  summary: {
    totalTargets: number;
    properSizeTargets: number;
    properSpacingTargets: number;
    averageTouchArea: number;
    complianceScore: number;
  };
}

export interface TouchIssue {
  type: 'size' | 'spacing' | 'overlap' | 'accessibility';
  severity: 'low' | 'medium' | 'high' | 'critical';
  element: string;
  description: string;
  recommendation: string;
}

export interface MobileOptimizationConfig {
  minTouchTargetSize: number; // Default: 44px
  minTouchSpacing: number; // Default: 8px
  maxTouchTargetDensity: number; // Max targets per 100px²
  checkAccessibility: boolean;
  checkPerformance: boolean;
}

const DEFAULT_CONFIG: MobileOptimizationConfig = {
  minTouchTargetSize: 44,
  minTouchSpacing: 8,
  maxTouchTargetDensity: 0.5,
  checkAccessibility: true,
  checkPerformance: true
};

export class TouchOptimizer {
  private config: MobileOptimizationConfig;

  constructor(config: Partial<MobileOptimizationConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Analyze touch targets on the page
   */
  analyzeTouchTargets(container: HTMLElement = document.body): TouchOptimizationResult {
    const touchTargets = this.findTouchTargets(container);
    const issues: TouchIssue[] = [];
    
    // Analyze each touch target
    touchTargets.forEach(target => {
      this.analyzeTarget(target, issues);
    });

    // Check for overlapping targets
    this.checkOverlappingTargets(touchTargets, issues);

    // Check touch target density
    this.checkTouchTargetDensity(touchTargets, container, issues);

    // Calculate summary
    const summary = this.calculateSummary(touchTargets);

    // Generate recommendations
    const recommendations = this.generateRecommendations(issues, summary);

    return {
      passed: issues.filter(i => i.severity === 'high' || i.severity === 'critical').length === 0,
      issues,
      recommendations,
      touchTargets,
      summary
    };
  }

  /**
   * Find all interactive touch targets
   */
  private findTouchTargets(container: HTMLElement): TouchTarget[] {
    const interactiveSelectors = [
      'button',
      'a',
      'input',
      'select',
      'textarea',
      '[role="button"]',
      '[role="link"]',
      '[role="menuitem"]',
      '[role="tab"]',
      '[tabindex]:not([tabindex="-1"])',
      '[onclick]',
      '.clickable',
      '.touchable'
    ];

    const elements = container.querySelectorAll(interactiveSelectors.join(', '));
    const touchTargets: TouchTarget[] = [];

    elements.forEach((element) => {
      const htmlElement = element as HTMLElement;
      const rect = htmlElement.getBoundingClientRect();
      
      // Skip hidden or zero-size elements
      if (rect.width === 0 || rect.height === 0 || 
          getComputedStyle(htmlElement).display === 'none') {
        return;
      }

      const touchArea = rect.width * rect.height;
      const minSize = this.config.minTouchTargetSize;

      touchTargets.push({
        element: htmlElement,
        rect,
        isInteractive: true,
        hasProperSize: rect.width >= minSize && rect.height >= minSize,
        hasProperSpacing: true, // Will be calculated later
        touchArea
      });
    });

    // Calculate spacing for each target
    this.calculateSpacing(touchTargets);

    return touchTargets;
  }

  /**
   * Calculate spacing between touch targets
   */
  private calculateSpacing(touchTargets: TouchTarget[]): void {
    const minSpacing = this.config.minTouchSpacing;

    touchTargets.forEach((target, index) => {
      let hasProperSpacing = true;

      for (let i = 0; i < touchTargets.length; i++) {
        if (i === index) continue;

        const other = touchTargets[i];
        const distance = this.calculateDistance(target.rect, other.rect);

        if (distance < minSpacing) {
          hasProperSpacing = false;
          break;
        }
      }

      target.hasProperSpacing = hasProperSpacing;
    });
  }

  /**
   * Calculate distance between two rectangles
   */
  private calculateDistance(rect1: DOMRect, rect2: DOMRect): number {
    const dx = Math.max(0, Math.max(rect1.left - rect2.right, rect2.left - rect1.right));
    const dy = Math.max(0, Math.max(rect1.top - rect2.bottom, rect2.top - rect1.bottom));
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Analyze individual touch target
   */
  private analyzeTarget(target: TouchTarget, issues: TouchIssue[]): void {
    const element = target.element;
    const rect = target.rect;
    const minSize = this.config.minTouchTargetSize;

    // Check size
    if (!target.hasProperSize) {
      issues.push({
        type: 'size',
        severity: rect.width < minSize * 0.7 || rect.height < minSize * 0.7 ? 'high' : 'medium',
        element: this.getElementSelector(element),
        description: `Touch target too small: ${Math.round(rect.width)}x${Math.round(rect.height)}px`,
        recommendation: `Increase size to at least ${minSize}x${minSize}px`
      });
    }

    // Check spacing
    if (!target.hasProperSpacing) {
      issues.push({
        type: 'spacing',
        severity: 'medium',
        element: this.getElementSelector(element),
        description: 'Touch target too close to other interactive elements',
        recommendation: `Add at least ${this.config.minTouchSpacing}px spacing around touch targets`
      });
    }

    // Check accessibility
    if (this.config.checkAccessibility) {
      this.checkTargetAccessibility(target, issues);
    }
  }

  /**
   * Check accessibility of touch target
   */
  private checkTargetAccessibility(target: TouchTarget, issues: TouchIssue[]): void {
    const element = target.element;

    // Check for accessible name
    const hasAccessibleName = 
      element.getAttribute('aria-label') ||
      element.getAttribute('aria-labelledby') ||
      element.textContent?.trim() ||
      element.getAttribute('title') ||
      (element.tagName === 'INPUT' && element.getAttribute('placeholder'));

    if (!hasAccessibleName) {
      issues.push({
        type: 'accessibility',
        severity: 'high',
        element: this.getElementSelector(element),
        description: 'Touch target missing accessible name',
        recommendation: 'Add aria-label, visible text, or other accessible name'
      });
    }

    // Check for proper role
    const tagName = element.tagName.toLowerCase();
    const role = element.getAttribute('role');
    
    if (tagName === 'div' && !role) {
      issues.push({
        type: 'accessibility',
        severity: 'medium',
        element: this.getElementSelector(element),
        description: 'Interactive div missing role attribute',
        recommendation: 'Add appropriate role (button, link, etc.) or use semantic HTML'
      });
    }

    // Check for keyboard accessibility
    const isKeyboardAccessible = 
      element.tabIndex >= 0 ||
      ['button', 'a', 'input', 'select', 'textarea'].includes(tagName);

    if (!isKeyboardAccessible) {
      issues.push({
        type: 'accessibility',
        severity: 'high',
        element: this.getElementSelector(element),
        description: 'Touch target not keyboard accessible',
        recommendation: 'Add tabindex="0" or use focusable HTML element'
      });
    }
  }

  /**
   * Check for overlapping touch targets
   */
  private checkOverlappingTargets(touchTargets: TouchTarget[], issues: TouchIssue[]): void {
    for (let i = 0; i < touchTargets.length; i++) {
      for (let j = i + 1; j < touchTargets.length; j++) {
        const target1 = touchTargets[i];
        const target2 = touchTargets[j];

        if (this.rectsOverlap(target1.rect, target2.rect)) {
          issues.push({
            type: 'overlap',
            severity: 'critical',
            element: `${this.getElementSelector(target1.element)} and ${this.getElementSelector(target2.element)}`,
            description: 'Touch targets overlap',
            recommendation: 'Separate overlapping touch targets or combine into single target'
          });
        }
      }
    }
  }

  /**
   * Check if two rectangles overlap
   */
  private rectsOverlap(rect1: DOMRect, rect2: DOMRect): boolean {
    return !(rect1.right < rect2.left || 
             rect2.right < rect1.left || 
             rect1.bottom < rect2.top || 
             rect2.bottom < rect1.top);
  }

  /**
   * Check touch target density
   */
  private checkTouchTargetDensity(
    touchTargets: TouchTarget[], 
    container: HTMLElement, 
    issues: TouchIssue[]
  ): void {
    const containerRect = container.getBoundingClientRect();
    const containerArea = containerRect.width * containerRect.height;
    const density = touchTargets.length / (containerArea / 10000); // Per 100px²

    if (density > this.config.maxTouchTargetDensity) {
      issues.push({
        type: 'spacing',
        severity: 'medium',
        element: 'page',
        description: `High touch target density: ${density.toFixed(2)} targets per 100px²`,
        recommendation: 'Reduce number of touch targets or increase page area'
      });
    }
  }

  /**
   * Calculate summary statistics
   */
  private calculateSummary(touchTargets: TouchTarget[]) {
    const totalTargets = touchTargets.length;
    const properSizeTargets = touchTargets.filter(t => t.hasProperSize).length;
    const properSpacingTargets = touchTargets.filter(t => t.hasProperSpacing).length;
    const averageTouchArea = touchTargets.reduce((sum, t) => sum + t.touchArea, 0) / totalTargets;

    // Calculate compliance score (0-100)
    const sizeScore = (properSizeTargets / totalTargets) * 50;
    const spacingScore = (properSpacingTargets / totalTargets) * 50;
    const complianceScore = Math.round(sizeScore + spacingScore);

    return {
      totalTargets,
      properSizeTargets,
      properSpacingTargets,
      averageTouchArea: Math.round(averageTouchArea),
      complianceScore
    };
  }

  /**
   * Generate recommendations based on issues
   */
  private generateRecommendations(issues: TouchIssue[], summary: any): string[] {
    const recommendations: string[] = [];

    const criticalIssues = issues.filter(i => i.severity === 'critical').length;
    const highIssues = issues.filter(i => i.severity === 'high').length;

    if (criticalIssues > 0) {
      recommendations.push(`Fix ${criticalIssues} critical touch issues immediately`);
    }

    if (highIssues > 0) {
      recommendations.push(`Address ${highIssues} high-priority touch issues`);
    }

    if (summary.complianceScore < 70) {
      recommendations.push('Overall touch compliance is low - focus on increasing touch target sizes');
    }

    const sizeIssues = issues.filter(i => i.type === 'size').length;
    if (sizeIssues > 0) {
      recommendations.push(`${sizeIssues} touch targets are too small - increase to minimum ${this.config.minTouchTargetSize}px`);
    }

    const spacingIssues = issues.filter(i => i.type === 'spacing').length;
    if (spacingIssues > 0) {
      recommendations.push(`${spacingIssues} touch targets need better spacing - add minimum ${this.config.minTouchSpacing}px gaps`);
    }

    const accessibilityIssues = issues.filter(i => i.type === 'accessibility').length;
    if (accessibilityIssues > 0) {
      recommendations.push(`${accessibilityIssues} touch targets have accessibility issues - add labels and keyboard support`);
    }

    return recommendations;
  }

  /**
   * Get CSS selector for element
   */
  private getElementSelector(element: HTMLElement): string {
    if (element.id) {
      return `#${element.id}`;
    }
    
    let selector = element.tagName.toLowerCase();
    
    if (element.className) {
      selector += `.${element.className.split(' ').join('.')}`;
    }
    
    return selector;
  }

  /**
   * Optimize touch targets automatically
   */
  optimizeTouchTargets(container: HTMLElement = document.body): {
    optimized: number;
    changes: Array<{
      element: string;
      change: string;
      before: string;
      after: string;
    }>;
  } {
    const result = this.analyzeTouchTargets(container);
    const changes: Array<{
      element: string;
      change: string;
      before: string;
      after: string;
    }> = [];
    let optimized = 0;

    result.touchTargets.forEach(target => {
      const element = target.element;
      const rect = target.rect;
      const minSize = this.config.minTouchTargetSize;

      // Optimize size
      if (!target.hasProperSize) {
        const currentSize = `${Math.round(rect.width)}x${Math.round(rect.height)}px`;
        
        if (rect.width < minSize) {
          element.style.minWidth = `${minSize}px`;
        }
        if (rect.height < minSize) {
          element.style.minHeight = `${minSize}px`;
        }
        
        element.style.padding = element.style.padding || '8px 12px';
        
        changes.push({
          element: this.getElementSelector(element),
          change: 'Increased touch target size',
          before: currentSize,
          after: `${minSize}x${minSize}px (minimum)`
        });
        
        optimized++;
      }

      // Add touch-friendly styles
      if (!element.style.cursor) {
        element.style.cursor = 'pointer';
      }
      
      // Add touch feedback
      if (!element.classList.contains('touch-optimized')) {
        element.classList.add('touch-optimized');
        element.style.transition = 'background-color 0.15s ease, transform 0.15s ease';
      }
    });

    return { optimized, changes };
  }
}

// Touch event utilities
export class TouchEventManager {
  private touchStartTime: number = 0;
  private touchStartPosition: { x: number; y: number } = { x: 0, y: 0 };

  /**
   * Add touch-friendly event listeners
   */
  addTouchSupport(element: HTMLElement, options: {
    onTap?: (event: TouchEvent) => void;
    onLongPress?: (event: TouchEvent) => void;
    onSwipe?: (direction: 'left' | 'right' | 'up' | 'down', event: TouchEvent) => void;
    longPressDelay?: number;
    swipeThreshold?: number;
  } = {}): () => void {
    const {
      onTap,
      onLongPress,
      onSwipe,
      longPressDelay = 500,
      swipeThreshold = 50
    } = options;

    let longPressTimer: NodeJS.Timeout;

    const handleTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0];
      this.touchStartTime = Date.now();
      this.touchStartPosition = { x: touch.clientX, y: touch.clientY };

      if (onLongPress) {
        longPressTimer = setTimeout(() => {
          onLongPress(event);
        }, longPressDelay);
      }
    };

    const handleTouchEnd = (event: TouchEvent) => {
      clearTimeout(longPressTimer);
      
      const touchEndTime = Date.now();
      const touchDuration = touchEndTime - this.touchStartTime;
      
      if (touchDuration < longPressDelay && onTap) {
        onTap(event);
      }
    };

    const handleTouchMove = (event: TouchEvent) => {
      clearTimeout(longPressTimer);
      
      if (onSwipe) {
        const touch = event.touches[0];
        const deltaX = touch.clientX - this.touchStartPosition.x;
        const deltaY = touch.clientY - this.touchStartPosition.y;
        
        if (Math.abs(deltaX) > swipeThreshold || Math.abs(deltaY) > swipeThreshold) {
          let direction: 'left' | 'right' | 'up' | 'down';
          
          if (Math.abs(deltaX) > Math.abs(deltaY)) {
            direction = deltaX > 0 ? 'right' : 'left';
          } else {
            direction = deltaY > 0 ? 'down' : 'up';
          }
          
          onSwipe(direction, event);
        }
      }
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });

    // Return cleanup function
    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchmove', handleTouchMove);
      clearTimeout(longPressTimer);
    };
  }

  /**
   * Prevent default touch behaviors
   */
  preventDefaultTouchBehaviors(element: HTMLElement): () => void {
    const preventDefault = (event: TouchEvent) => {
      event.preventDefault();
    };

    // Prevent zoom on double tap
    element.addEventListener('touchstart', preventDefault, { passive: false });
    
    // Prevent context menu on long press
    element.addEventListener('contextmenu', preventDefault);

    return () => {
      element.removeEventListener('touchstart', preventDefault);
      element.removeEventListener('contextmenu', preventDefault);
    };
  }
}

// Utility functions
export const createTouchOptimizer = (config?: Partial<MobileOptimizationConfig>) => 
  new TouchOptimizer(config);

export const createTouchEventManager = () => new TouchEventManager();

export const isTouchDevice = (): boolean => {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

export const getTouchCapabilities = () => ({
  hasTouch: isTouchDevice(),
  maxTouchPoints: navigator.maxTouchPoints || 0,
  touchSupport: 'ontouchstart' in window,
  pointerSupport: 'onpointerdown' in window,
  gestureSupport: 'ongesturestart' in window
});
