/**
 * Storybook Preview Configuration for SEO Automation App
 * Configures global settings, decorators, and parameters for all stories
 */

import type { Preview } from '@storybook/react';
import { INITIAL_VIEWPORTS, MINIMAL_VIEWPORTS } from '@storybook/addon-viewport';
import '../src/styles/globals.css';

// Custom viewports for responsive testing
const customViewports = {
  mobile320: {
    name: 'Mobile 320px',
    styles: {
      width: '320px',
      height: '568px',
    },
  },
  mobile375: {
    name: 'Mobile 375px',
    styles: {
      width: '375px',
      height: '667px',
    },
  },
  mobile414: {
    name: 'Mobile 414px',
    styles: {
      width: '414px',
      height: '896px',
    },
  },
  tablet768: {
    name: 'Tablet 768px',
    styles: {
      width: '768px',
      height: '1024px',
    },
  },
  tablet1024: {
    name: 'Tablet 1024px',
    styles: {
      width: '1024px',
      height: '768px',
    },
  },
  desktop1280: {
    name: 'Desktop 1280px',
    styles: {
      width: '1280px',
      height: '720px',
    },
  },
  desktop1440: {
    name: 'Desktop 1440px',
    styles: {
      width: '1440px',
      height: '900px',
    },
  },
  desktop1920: {
    name: 'Desktop 1920px',
    styles: {
      width: '1920px',
      height: '1080px',
    },
  },
  desktop4k: {
    name: '4K Desktop',
    styles: {
      width: '3840px',
      height: '2160px',
    },
  },
};

// Background options for testing
const backgrounds = {
  default: 'light',
  values: [
    {
      name: 'light',
      value: '#ffffff',
    },
    {
      name: 'dark',
      value: '#1a1a1a',
    },
    {
      name: 'gray',
      value: '#f5f5f5',
    },
    {
      name: 'blue',
      value: '#e6f3ff',
    },
  ],
};

const preview: Preview = {
  parameters: {
    // Actions configuration
    actions: { 
      argTypesRegex: '^on[A-Z].*' 
    },

    // Controls configuration
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
      expanded: true,
      sort: 'requiredFirst',
    },

    // Viewport configuration
    viewport: {
      viewports: {
        ...INITIAL_VIEWPORTS,
        ...MINIMAL_VIEWPORTS,
        ...customViewports,
      },
      defaultViewport: 'responsive',
    },

    // Background configuration
    backgrounds,

    // Layout configuration
    layout: 'centered',

    // Docs configuration
    docs: {
      toc: true,
      source: {
        state: 'open',
      },
    },

    // Accessibility configuration
    a11y: {
      config: {
        rules: [
          {
            id: 'color-contrast',
            enabled: true,
          },
          {
            id: 'focus-trap',
            enabled: true,
          },
          {
            id: 'keyboard-navigation',
            enabled: true,
          },
        ],
      },
      options: {
        checks: { 'color-contrast': { options: { noScroll: true } } },
        restoreScroll: true,
      },
    },

    // Chromatic configuration for visual regression testing
    chromatic: {
      // Delay capture to ensure animations complete
      delay: 300,
      
      // Pause animations for consistent screenshots
      pauseAnimationAtEnd: true,
      
      // Configure viewports for visual regression testing
      viewports: [320, 768, 1024, 1280, 1920],
      
      // Disable for stories that shouldn't be tested
      disable: false,
      
      // Force re-capture even if no changes detected
      forcedColors: 'active',
    },

    // Design tokens documentation
    designTokens: {
      defaultTab: 'Colors',
    },
  },

  // Global decorators
  decorators: [
    // Theme provider decorator
    (Story, context) => {
      const theme = context.globals.theme || 'light';
      
      return (
        <div 
          className={`storybook-wrapper theme-${theme}`}
          style={{
            minHeight: '100vh',
            padding: '1rem',
            backgroundColor: theme === 'dark' ? '#1a1a1a' : '#ffffff',
            color: theme === 'dark' ? '#ffffff' : '#1a1a1a',
          }}
        >
          <Story />
        </div>
      );
    },

    // Responsive wrapper decorator
    (Story, context) => {
      const viewport = context.globals.viewport;
      const isMobile = viewport && (viewport.includes('mobile') || viewport.includes('320') || viewport.includes('375'));
      
      return (
        <div 
          className={`responsive-wrapper ${isMobile ? 'mobile' : 'desktop'}`}
          style={{
            width: '100%',
            maxWidth: isMobile ? '100%' : 'none',
          }}
        >
          <Story />
        </div>
      );
    },

    // Accessibility testing decorator
    (Story, context) => {
      // Add focus management for keyboard navigation testing
      return (
        <div 
          role="main"
          aria-label="Storybook component preview"
          tabIndex={-1}
        >
          <Story />
        </div>
      );
    },
  ],

  // Global types for toolbar controls
  globalTypes: {
    theme: {
      description: 'Global theme for components',
      defaultValue: 'light',
      toolbar: {
        title: 'Theme',
        icon: 'paintbrush',
        items: [
          { value: 'light', title: 'Light', icon: 'sun' },
          { value: 'dark', title: 'Dark', icon: 'moon' },
        ],
        dynamicTitle: true,
      },
    },
    locale: {
      description: 'Internationalization locale',
      defaultValue: 'en',
      toolbar: {
        title: 'Locale',
        icon: 'globe',
        items: [
          { value: 'en', title: 'English', right: '🇺🇸' },
          { value: 'es', title: 'Español', right: '🇪🇸' },
          { value: 'fr', title: 'Français', right: '🇫🇷' },
          { value: 'de', title: 'Deutsch', right: '🇩🇪' },
        ],
        dynamicTitle: true,
      },
    },
    motion: {
      description: 'Motion preferences',
      defaultValue: 'normal',
      toolbar: {
        title: 'Motion',
        icon: 'play',
        items: [
          { value: 'normal', title: 'Normal motion' },
          { value: 'reduced', title: 'Reduced motion' },
        ],
        dynamicTitle: true,
      },
    },
  },

  // Initial global values
  initialGlobals: {
    theme: 'light',
    locale: 'en',
    motion: 'normal',
  },

  // Tags for organizing stories
  tags: ['autodocs'],
};

export default preview;
