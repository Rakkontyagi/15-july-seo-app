/**
 * Accessibility utilities for WCAG compliance
 */

/**
 * Generate unique IDs for accessibility attributes
 */
export function generateA11yId(prefix: string = 'a11y'): string {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * ARIA live region announcer for screen readers
 */
export class AriaLiveAnnouncer {
  private static instance: AriaLiveAnnouncer;
  private liveRegion: HTMLElement | null = null;

  private constructor() {
    this.createLiveRegion();
  }

  public static getInstance(): AriaLiveAnnouncer {
    if (!AriaLiveAnnouncer.instance) {
      AriaLiveAnnouncer.instance = new AriaLiveAnnouncer();
    }
    return AriaLiveAnnouncer.instance;
  }

  private createLiveRegion(): void {
    if (typeof window === 'undefined') return;

    this.liveRegion = document.createElement('div');
    this.liveRegion.setAttribute('aria-live', 'polite');
    this.liveRegion.setAttribute('aria-atomic', 'true');
    this.liveRegion.setAttribute('aria-relevant', 'additions text');
    this.liveRegion.style.position = 'absolute';
    this.liveRegion.style.left = '-10000px';
    this.liveRegion.style.width = '1px';
    this.liveRegion.style.height = '1px';
    this.liveRegion.style.overflow = 'hidden';
    
    document.body.appendChild(this.liveRegion);
  }

  public announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    if (!this.liveRegion) return;

    this.liveRegion.setAttribute('aria-live', priority);
    this.liveRegion.textContent = message;

    // Clear after announcement
    setTimeout(() => {
      if (this.liveRegion) {
        this.liveRegion.textContent = '';
      }
    }, 1000);
  }
}

/**
 * Color contrast utilities
 */
export const ColorContrast = {
  /**
   * Calculate relative luminance of a color
   */
  getLuminance(hex: string): number {
    const rgb = this.hexToRgb(hex);
    if (!rgb) return 0;

    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  },

  /**
   * Calculate contrast ratio between two colors
   */
  getContrastRatio(color1: string, color2: string): number {
    const lum1 = this.getLuminance(color1);
    const lum2 = this.getLuminance(color2);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    
    return (brightest + 0.05) / (darkest + 0.05);
  },

  /**
   * Check if color combination meets WCAG AA standards
   */
  meetsWCAG_AA(foreground: string, background: string, isLargeText: boolean = false): boolean {
    const ratio = this.getContrastRatio(foreground, background);
    return isLargeText ? ratio >= 3 : ratio >= 4.5;
  },

  /**
   * Check if color combination meets WCAG AAA standards
   */
  meetsWCAG_AAA(foreground: string, background: string, isLargeText: boolean = false): boolean {
    const ratio = this.getContrastRatio(foreground, background);
    return isLargeText ? ratio >= 4.5 : ratio >= 7;
  },

  /**
   * Convert hex to RGB
   */
  hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }
};

/**
 * Keyboard navigation utilities
 */
export const KeyboardNavigation = {
  /**
   * Trap focus within a container
   */
  trapFocus(container: HTMLElement): () => void {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);

    // Focus first element
    firstElement?.focus();

    // Return cleanup function
    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  },

  /**
   * Handle escape key to close modals/dropdowns
   */
  handleEscape(callback: () => void): (e: KeyboardEvent) => void {
    return (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        callback();
      }
    };
  },

  /**
   * Handle arrow key navigation in lists
   */
  handleArrowNavigation(
    container: HTMLElement,
    itemSelector: string,
    orientation: 'horizontal' | 'vertical' = 'vertical'
  ): () => void {
    const handleArrowKeys = (e: KeyboardEvent) => {
      const items = Array.from(container.querySelectorAll(itemSelector)) as HTMLElement[];
      const currentIndex = items.findIndex(item => item === document.activeElement);
      
      if (currentIndex === -1) return;

      let nextIndex = currentIndex;

      if (orientation === 'vertical') {
        if (e.key === 'ArrowDown') {
          nextIndex = (currentIndex + 1) % items.length;
          e.preventDefault();
        } else if (e.key === 'ArrowUp') {
          nextIndex = (currentIndex - 1 + items.length) % items.length;
          e.preventDefault();
        }
      } else {
        if (e.key === 'ArrowRight') {
          nextIndex = (currentIndex + 1) % items.length;
          e.preventDefault();
        } else if (e.key === 'ArrowLeft') {
          nextIndex = (currentIndex - 1 + items.length) % items.length;
          e.preventDefault();
        }
      }

      if (nextIndex !== currentIndex) {
        items[nextIndex].focus();
      }
    };

    container.addEventListener('keydown', handleArrowKeys);

    return () => {
      container.removeEventListener('keydown', handleArrowKeys);
    };
  }
};

/**
 * Screen reader utilities
 */
export const ScreenReader = {
  /**
   * Create descriptive text for complex UI elements
   */
  createDescription(element: {
    type: string;
    state?: string;
    position?: { current: number; total: number };
    value?: string | number;
  }): string {
    let description = element.type;
    
    if (element.state) {
      description += `, ${element.state}`;
    }
    
    if (element.position) {
      description += `, ${element.position.current} of ${element.position.total}`;
    }
    
    if (element.value !== undefined) {
      description += `, value ${element.value}`;
    }
    
    return description;
  },

  /**
   * Announce dynamic content changes
   */
  announceChange(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    AriaLiveAnnouncer.getInstance().announce(message, priority);
  }
};

/**
 * Focus management utilities
 */
export const FocusManagement = {
  /**
   * Save and restore focus
   */
  saveFocus(): () => void {
    const activeElement = document.activeElement as HTMLElement;
    
    return () => {
      if (activeElement && typeof activeElement.focus === 'function') {
        activeElement.focus();
      }
    };
  },

  /**
   * Move focus to element with announcement
   */
  moveFocusTo(element: HTMLElement, announcement?: string): void {
    element.focus();
    
    if (announcement) {
      ScreenReader.announceChange(announcement);
    }
  },

  /**
   * Check if element is focusable
   */
  isFocusable(element: HTMLElement): boolean {
    const focusableSelectors = [
      'button:not([disabled])',
      '[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])'
    ];
    
    return focusableSelectors.some(selector => element.matches(selector));
  }
};

/**
 * ARIA attributes helper
 */
export const AriaAttributes = {
  /**
   * Create ARIA attributes for expandable content
   */
  expandable(isExpanded: boolean, controlsId?: string) {
    return {
      'aria-expanded': isExpanded.toString(),
      ...(controlsId && { 'aria-controls': controlsId })
    };
  },

  /**
   * Create ARIA attributes for form validation
   */
  validation(hasError: boolean, errorId?: string, describedById?: string) {
    return {
      'aria-invalid': hasError.toString(),
      ...(hasError && errorId && { 'aria-describedby': errorId }),
      ...(describedById && { 'aria-describedby': describedById })
    };
  },

  /**
   * Create ARIA attributes for progress indicators
   */
  progress(current: number, total: number, label?: string) {
    return {
      'role': 'progressbar',
      'aria-valuenow': current,
      'aria-valuemin': 0,
      'aria-valuemax': total,
      ...(label && { 'aria-label': label })
    };
  }
};

// Export singleton instances
export const ariaLiveAnnouncer = AriaLiveAnnouncer.getInstance();
