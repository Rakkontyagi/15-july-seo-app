/**
 * Storybook Configuration for SEO Automation App
 * Provides comprehensive component documentation and visual regression testing
 */

import type { StorybookConfig } from '@storybook/nextjs';
import path from 'path';

const config: StorybookConfig = {
  stories: [
    '../src/components/**/*.stories.@(js|jsx|ts|tsx|mdx)',
    '../src/stories/**/*.stories.@(js|jsx|ts|tsx|mdx)',
  ],
  
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-a11y',
    '@storybook/addon-viewport',
    '@storybook/addon-docs',
    '@storybook/addon-controls',
    '@storybook/addon-actions',
    '@storybook/addon-backgrounds',
    '@chromatic-com/storybook',
    '@storybook/addon-design-tokens',
    'storybook-addon-pseudo-states',
  ],

  framework: {
    name: '@storybook/nextjs',
    options: {
      nextConfigPath: '../next.config.js',
    },
  },

  features: {
    buildStoriesJson: true,
  },

  typescript: {
    check: false,
    reactDocgen: 'react-docgen-typescript',
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      propFilter: (prop) => (prop.parent ? !/node_modules/.test(prop.parent.fileName) : true),
    },
  },

  webpackFinal: async (config) => {
    // Add path aliases
    if (config.resolve) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@': path.resolve(__dirname, '../src'),
        '@/components': path.resolve(__dirname, '../src/components'),
        '@/lib': path.resolve(__dirname, '../src/lib'),
        '@/styles': path.resolve(__dirname, '../src/styles'),
      };
    }

    // Handle CSS modules
    const cssRule = config.module?.rules?.find((rule) => {
      if (typeof rule !== 'object' || !rule) return false;
      if (rule.test && rule.test.toString().includes('.css')) return true;
      return false;
    });

    if (cssRule && typeof cssRule === 'object' && cssRule.use) {
      const cssLoaders = Array.isArray(cssRule.use) ? cssRule.use : [cssRule.use];
      cssLoaders.forEach((loader) => {
        if (typeof loader === 'object' && loader.loader?.includes('css-loader')) {
          loader.options = {
            ...loader.options,
            modules: {
              auto: true,
              localIdentName: '[name]__[local]--[hash:base64:5]',
            },
          };
        }
      });
    }

    return config;
  },

  env: (config) => ({
    ...config,
    STORYBOOK: 'true',
  }),

  docs: {
    autodocs: 'tag',
    defaultName: 'Documentation',
  },

  staticDirs: ['../public'],
};

export default config;
