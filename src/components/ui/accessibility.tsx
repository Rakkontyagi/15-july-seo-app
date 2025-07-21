'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils/cn';
import { Button } from './button';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';
import { Badge } from './badge';
import { Separator } from './separator';
import { 
  Eye, 
  EyeOff, 
  Volume2, 
  VolumeX, 
  Type, 
  Contrast, 
  MousePointer,
  Keyboard,
  Focus,
  Zap,
  Settings,
  Monitor,
  Accessibility
} from 'lucide-react';

// Accessibility settings context
interface AccessibilitySettings {
  highContrast: boolean;
  largeText: boolean;
  reducedMotion: boolean;
  focusVisible: boolean;
  screenReader: boolean;
  keyboardNav: boolean;
  fontSize: 'small' | 'medium' | 'large' | 'xl';
  colorScheme: 'light' | 'dark' | 'auto';
}

interface AccessibilityPanelProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export function AccessibilityPanel({ isOpen, onClose, className }: AccessibilityPanelProps) {
  const [settings, setSettings] = useState<AccessibilitySettings>({
    highContrast: false,
    largeText: false,
    reducedMotion: false,
    focusVisible: true,
    screenReader: false,
    keyboardNav: true,
    fontSize: 'medium',
    colorScheme: 'auto'
  });

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('accessibility-settings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  useEffect(() => {
    // Save settings to localStorage
    localStorage.setItem('accessibility-settings', JSON.stringify(settings));

    // Apply settings to document
    applyAccessibilitySettings(settings);
  }, [settings]);

  useEffect(() => {
    // Handle escape key to close panel
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  const updateSetting = <K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const resetSettings = () => {
    const defaultSettings: AccessibilitySettings = {
      highContrast: false,
      largeText: false,
      reducedMotion: false,
      focusVisible: true,
      screenReader: false,
      keyboardNav: true,
      fontSize: 'medium',
      colorScheme: 'auto'
    };
    setSettings(defaultSettings);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="fixed right-4 top-4 bottom-4 w-96 max-w-full">
        <Card className="h-full flex flex-col">
          <CardHeader className="flex-shrink-0">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Accessibility className="h-5 w-5" />
                Accessibility Settings
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <EyeOff className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="flex-1 overflow-y-auto">
            <Tabs defaultValue="display" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="display">Display</TabsTrigger>
                <TabsTrigger value="navigation">Navigation</TabsTrigger>
                <TabsTrigger value="audio">Audio</TabsTrigger>
              </TabsList>

              <TabsContent value="display" className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Contrast className="h-4 w-4" />
                      <span className="text-sm font-medium">High Contrast</span>
                    </div>
                    <Button
                      variant={settings.highContrast ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateSetting('highContrast', !settings.highContrast)}
                    >
                      {settings.highContrast ? 'On' : 'Off'}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Type className="h-4 w-4" />
                      <span className="text-sm font-medium">Large Text</span>
                    </div>
                    <Button
                      variant={settings.largeText ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateSetting('largeText', !settings.largeText)}
                    >
                      {settings.largeText ? 'On' : 'Off'}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Zap className="h-4 w-4" />
                      <span className="text-sm font-medium">Reduced Motion</span>
                    </div>
                    <Button
                      variant={settings.reducedMotion ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateSetting('reducedMotion', !settings.reducedMotion)}
                    >
                      {settings.reducedMotion ? 'On' : 'Off'}
                    </Button>
                  </div>

                  <Separator />

                  <div>
                    <label className="text-sm font-medium mb-2 block">Font Size</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['small', 'medium', 'large', 'xl'] as const).map(size => (
                        <Button
                          key={size}
                          variant={settings.fontSize === size ? "default" : "outline"}
                          size="sm"
                          onClick={() => updateSetting('fontSize', size)}
                          className="capitalize"
                        >
                          {size}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Color Scheme</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['light', 'dark', 'auto'] as const).map(scheme => (
                        <Button
                          key={scheme}
                          variant={settings.colorScheme === scheme ? "default" : "outline"}
                          size="sm"
                          onClick={() => updateSetting('colorScheme', scheme)}
                          className="capitalize"
                        >
                          {scheme}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="navigation" className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Focus className="h-4 w-4" />
                      <span className="text-sm font-medium">Focus Indicators</span>
                    </div>
                    <Button
                      variant={settings.focusVisible ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateSetting('focusVisible', !settings.focusVisible)}
                    >
                      {settings.focusVisible ? 'On' : 'Off'}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Keyboard className="h-4 w-4" />
                      <span className="text-sm font-medium">Keyboard Navigation</span>
                    </div>
                    <Button
                      variant={settings.keyboardNav ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateSetting('keyboardNav', !settings.keyboardNav)}
                    >
                      {settings.keyboardNav ? 'On' : 'Off'}
                    </Button>
                  </div>

                  <Separator />

                  <div className="bg-muted p-3 rounded-lg">
                    <h4 className="text-sm font-medium mb-2">Keyboard Shortcuts</h4>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <div>Tab - Navigate forward</div>
                      <div>Shift + Tab - Navigate backward</div>
                      <div>Enter/Space - Activate</div>
                      <div>Escape - Close modals</div>
                      <div>Arrow keys - Navigate lists</div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="audio" className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Volume2 className="h-4 w-4" />
                      <span className="text-sm font-medium">Screen Reader Support</span>
                    </div>
                    <Button
                      variant={settings.screenReader ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateSetting('screenReader', !settings.screenReader)}
                    >
                      {settings.screenReader ? 'On' : 'Off'}
                    </Button>
                  </div>

                  <div className="bg-muted p-3 rounded-lg">
                    <h4 className="text-sm font-medium mb-2">Screen Reader Features</h4>
                    <div className="space-y-2 text-xs text-muted-foreground">
                      <div>• ARIA labels for all interactive elements</div>
                      <div>• Semantic HTML structure</div>
                      <div>• Progress announcements</div>
                      <div>• Error notifications</div>
                      <div>• Live region updates</div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <Separator className="my-4" />

            <div className="flex justify-between items-center">
              <Button variant="outline" size="sm" onClick={resetSettings}>
                Reset to Default
              </Button>
              <Badge variant="secondary" className="text-xs">
                WCAG AA Compliant
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Accessibility toggle button
export function AccessibilityToggle() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-40 shadow-lg"
        aria-label="Open accessibility settings"
      >
        <Accessibility className="h-4 w-4" />
      </Button>
      
      <AccessibilityPanel isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}

// Skip to main content link
export function SkipToMain() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
    >
      Skip to main content
    </a>
  );
}

// Apply accessibility settings to document
function applyAccessibilitySettings(settings: AccessibilitySettings) {
  const root = document.documentElement;

  // High contrast
  if (settings.highContrast) {
    root.classList.add('high-contrast');
    root.setAttribute('data-high-contrast', 'true');
  } else {
    root.classList.remove('high-contrast');
    root.removeAttribute('data-high-contrast');
  }

  // Large text
  if (settings.largeText) {
    root.classList.add('large-text');
    root.setAttribute('data-large-text', 'true');
  } else {
    root.classList.remove('large-text');
    root.removeAttribute('data-large-text');
  }

  // Reduced motion
  if (settings.reducedMotion) {
    root.classList.add('reduced-motion');
    root.setAttribute('data-reduced-motion', 'true');
    // Also set CSS custom property for animations
    root.style.setProperty('--animation-duration', '0.01ms');
    root.style.setProperty('--transition-duration', '0.01ms');
  } else {
    root.classList.remove('reduced-motion');
    root.removeAttribute('data-reduced-motion');
    root.style.removeProperty('--animation-duration');
    root.style.removeProperty('--transition-duration');
  }

  // Focus visible
  if (settings.focusVisible) {
    root.classList.add('focus-visible');
    root.setAttribute('data-focus-visible', 'true');
  } else {
    root.classList.remove('focus-visible');
    root.removeAttribute('data-focus-visible');
  }

  // Keyboard navigation
  if (settings.keyboardNav) {
    root.classList.add('keyboard-nav');
    root.setAttribute('data-keyboard-nav', 'true');
    // Enable keyboard navigation for all interactive elements
    enableKeyboardNavigation();
  } else {
    root.classList.remove('keyboard-nav');
    root.removeAttribute('data-keyboard-nav');
  }

  // Screen reader support
  if (settings.screenReader) {
    root.setAttribute('data-screen-reader', 'true');
    // Enhance ARIA labels and descriptions
    enhanceScreenReaderSupport();
  } else {
    root.removeAttribute('data-screen-reader');
  }

  // Font size
  root.classList.remove('text-small', 'text-medium', 'text-large', 'text-xl');
  root.classList.add(`text-${settings.fontSize}`);
  root.setAttribute('data-font-size', settings.fontSize);

  // Color scheme
  if (settings.colorScheme === 'dark') {
    root.classList.add('dark');
    root.setAttribute('data-theme', 'dark');
  } else if (settings.colorScheme === 'light') {
    root.classList.remove('dark');
    root.setAttribute('data-theme', 'light');
  } else {
    // Auto mode - use system preference
    const prefersDark = safeMatchMedia('(prefers-color-scheme: dark)');
    if (prefersDark) {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
    }
  }

  // Announce changes to screen readers
  announceSettingsChange(settings);
}

// Enhanced keyboard navigation support
function enableKeyboardNavigation() {
  // Add keyboard event listeners for better navigation
  document.addEventListener('keydown', handleKeyboardNavigation);

  // Ensure all interactive elements are focusable
  const interactiveElements = document.querySelectorAll(
    'button, [role="button"], a, input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );

  interactiveElements.forEach(element => {
    if (!element.hasAttribute('tabindex')) {
      element.setAttribute('tabindex', '0');
    }
  });
}

// Enhanced screen reader support
function enhanceScreenReaderSupport() {
  // Add missing ARIA labels
  const elementsNeedingLabels = document.querySelectorAll(
    'button:not([aria-label]):not([aria-labelledby]), [role="button"]:not([aria-label]):not([aria-labelledby])'
  );

  elementsNeedingLabels.forEach(element => {
    const text = element.textContent?.trim();
    if (text) {
      element.setAttribute('aria-label', text);
    }
  });

  // Add live regions for dynamic content
  if (!document.querySelector('[aria-live="polite"]')) {
    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    liveRegion.id = 'accessibility-live-region';
    document.body.appendChild(liveRegion);
  }
}

// Keyboard navigation handler
function handleKeyboardNavigation(event: KeyboardEvent) {
  // Handle Escape key to close modals/dropdowns
  if (event.key === 'Escape') {
    const openModals = document.querySelectorAll('[role="dialog"][aria-hidden="false"]');
    openModals.forEach(modal => {
      const closeButton = modal.querySelector('[aria-label*="close"], [aria-label*="Close"]');
      if (closeButton instanceof HTMLElement) {
        closeButton.click();
      }
    });
  }

  // Handle Tab navigation improvements
  if (event.key === 'Tab') {
    // Ensure focus is visible
    document.body.classList.add('keyboard-navigation');
  }
}

// Announce settings changes to screen readers
function announceSettingsChange(settings: AccessibilitySettings) {
  const liveRegion = document.getElementById('accessibility-live-region');
  if (liveRegion) {
    const changes = [];
    if (settings.highContrast) changes.push('High contrast enabled');
    if (settings.largeText) changes.push('Large text enabled');
    if (settings.reducedMotion) changes.push('Reduced motion enabled');

    if (changes.length > 0) {
      liveRegion.textContent = `Accessibility settings updated: ${changes.join(', ')}`;

      // Clear the announcement after a delay
      setTimeout(() => {
        liveRegion.textContent = '';
      }, 3000);
    }
  }
}

// Safe matchMedia check for testing environments
function safeMatchMedia(query: string): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return false;
  }
  try {
    return window.matchMedia(query).matches;
  } catch (error) {
    return false;
  }
}

// Hook for screen reader announcements
export function useScreenReader() {
  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  };

  return { announce };
}