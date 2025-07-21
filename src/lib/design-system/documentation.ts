/**
 * Design System Documentation Generator for SEO Automation App
 * Provides comprehensive documentation generation for design tokens and components
 */

import { designTokens } from './tokens';

export interface ComponentDocumentation {
  name: string;
  description: string;
  category: 'layout' | 'form' | 'navigation' | 'feedback' | 'data-display' | 'overlay';
  props: ComponentProp[];
  variants: ComponentVariant[];
  examples: ComponentExample[];
  accessibility: AccessibilityInfo;
  responsive: ResponsiveInfo;
  designTokens: string[];
  relatedComponents: string[];
}

export interface ComponentProp {
  name: string;
  type: string;
  required: boolean;
  defaultValue?: any;
  description: string;
  options?: string[];
}

export interface ComponentVariant {
  name: string;
  description: string;
  props: Record<string, any>;
  preview: string; // HTML or component code
}

export interface ComponentExample {
  title: string;
  description: string;
  code: string;
  preview: string;
  responsive?: boolean;
}

export interface AccessibilityInfo {
  wcagLevel: 'A' | 'AA' | 'AAA';
  keyboardSupport: boolean;
  screenReaderSupport: boolean;
  colorContrastCompliant: boolean;
  ariaAttributes: string[];
  guidelines: string[];
}

export interface ResponsiveInfo {
  breakpoints: string[];
  behavior: Record<string, string>;
  considerations: string[];
}

export interface DesignTokenDocumentation {
  category: string;
  tokens: TokenInfo[];
  usage: TokenUsage[];
  examples: TokenExample[];
}

export interface TokenInfo {
  name: string;
  value: string;
  description: string;
  type: 'color' | 'spacing' | 'typography' | 'shadow' | 'border' | 'animation';
  cssVariable?: string;
}

export interface TokenUsage {
  context: string;
  recommendation: string;
  examples: string[];
}

export interface TokenExample {
  title: string;
  description: string;
  code: string;
  preview: string;
}

export class DesignSystemDocumentationGenerator {
  private components: Map<string, ComponentDocumentation> = new Map();
  private tokenDocs: Map<string, DesignTokenDocumentation> = new Map();

  constructor() {
    this.generateTokenDocumentation();
  }

  /**
   * Generate documentation for design tokens
   */
  private generateTokenDocumentation(): void {
    // Color tokens documentation
    this.tokenDocs.set('colors', {
      category: 'Colors',
      tokens: this.generateColorTokens(),
      usage: [
        {
          context: 'Primary Actions',
          recommendation: 'Use primary-500 for main actions, primary-600 for hover states',
          examples: ['bg-primary-500', 'hover:bg-primary-600', 'text-primary-500']
        },
        {
          context: 'Text Colors',
          recommendation: 'Use gray-900 for headings, gray-700 for body text, gray-500 for secondary text',
          examples: ['text-gray-900', 'text-gray-700', 'text-gray-500']
        },
        {
          context: 'Status Colors',
          recommendation: 'Use semantic colors for status indicators',
          examples: ['text-success-600', 'bg-error-50', 'border-warning-300']
        }
      ],
      examples: [
        {
          title: 'Color Palette',
          description: 'Complete color palette with all shades',
          code: `<div className="bg-primary-500 text-white p-4 rounded">
  Primary Color
</div>`,
          preview: '<div style="background: #3b82f6; color: white; padding: 1rem; border-radius: 0.5rem;">Primary Color</div>'
        }
      ]
    });

    // Typography tokens documentation
    this.tokenDocs.set('typography', {
      category: 'Typography',
      tokens: this.generateTypographyTokens(),
      usage: [
        {
          context: 'Headings',
          recommendation: 'Use text-4xl for main headings, text-2xl for section headings',
          examples: ['text-4xl font-bold', 'text-2xl font-semibold', 'text-xl font-medium']
        },
        {
          context: 'Body Text',
          recommendation: 'Use text-base for body text, text-sm for secondary text',
          examples: ['text-base', 'text-sm text-gray-600', 'text-xs text-gray-500']
        }
      ],
      examples: [
        {
          title: 'Typography Scale',
          description: 'Complete typography scale from xs to 9xl',
          code: `<h1 className="text-4xl font-bold">Main Heading</h1>
<p className="text-base">Body text content</p>`,
          preview: '<h1 style="font-size: 2.25rem; font-weight: 700;">Main Heading</h1><p style="font-size: 1rem;">Body text content</p>'
        }
      ]
    });

    // Spacing tokens documentation
    this.tokenDocs.set('spacing', {
      category: 'Spacing',
      tokens: this.generateSpacingTokens(),
      usage: [
        {
          context: 'Component Spacing',
          recommendation: 'Use consistent spacing scale for margins and padding',
          examples: ['p-4', 'm-6', 'space-y-4', 'gap-2']
        },
        {
          context: 'Layout Spacing',
          recommendation: 'Use larger spacing values for layout containers',
          examples: ['px-8', 'py-12', 'mx-auto', 'max-w-7xl']
        }
      ],
      examples: [
        {
          title: 'Spacing Scale',
          description: 'Visual representation of spacing scale',
          code: `<div className="space-y-4">
  <div className="p-2 bg-gray-100">Small padding</div>
  <div className="p-4 bg-gray-100">Medium padding</div>
  <div className="p-8 bg-gray-100">Large padding</div>
</div>`,
          preview: '<div style="display: flex; flex-direction: column; gap: 1rem;"><div style="padding: 0.5rem; background: #f3f4f6;">Small padding</div><div style="padding: 1rem; background: #f3f4f6;">Medium padding</div><div style="padding: 2rem; background: #f3f4f6;">Large padding</div></div>'
        }
      ]
    });
  }

  /**
   * Generate color token information
   */
  private generateColorTokens(): TokenInfo[] {
    const tokens: TokenInfo[] = [];
    
    Object.entries(designTokens.colors).forEach(([colorName, colorScale]) => {
      if (typeof colorScale === 'object') {
        Object.entries(colorScale).forEach(([shade, value]) => {
          tokens.push({
            name: `${colorName}-${shade}`,
            value: value as string,
            description: `${colorName} color shade ${shade}`,
            type: 'color',
            cssVariable: `--color-${colorName}-${shade}`
          });
        });
      }
    });

    return tokens;
  }

  /**
   * Generate typography token information
   */
  private generateTypographyTokens(): TokenInfo[] {
    const tokens: TokenInfo[] = [];
    
    // Font sizes
    Object.entries(designTokens.typography.fontSize).forEach(([size, value]) => {
      const [fontSize, lineHeight] = Array.isArray(value) ? value : [value, { lineHeight: '1.5' }];
      tokens.push({
        name: `text-${size}`,
        value: fontSize,
        description: `Font size ${size}`,
        type: 'typography',
        cssVariable: `--font-size-${size}`
      });
    });

    // Font weights
    Object.entries(designTokens.typography.fontWeight).forEach(([weight, value]) => {
      tokens.push({
        name: `font-${weight}`,
        value: value,
        description: `Font weight ${weight}`,
        type: 'typography',
        cssVariable: `--font-weight-${weight}`
      });
    });

    return tokens;
  }

  /**
   * Generate spacing token information
   */
  private generateSpacingTokens(): TokenInfo[] {
    const tokens: TokenInfo[] = [];
    
    Object.entries(designTokens.spacing).forEach(([space, value]) => {
      tokens.push({
        name: `space-${space}`,
        value: value,
        description: `Spacing value ${space}`,
        type: 'spacing',
        cssVariable: `--spacing-${space}`
      });
    });

    return tokens;
  }

  /**
   * Add component documentation
   */
  addComponent(component: ComponentDocumentation): void {
    this.components.set(component.name, component);
  }

  /**
   * Generate component documentation
   */
  generateComponentDocs(componentName: string): ComponentDocumentation | null {
    return this.components.get(componentName) || null;
  }

  /**
   * Generate complete design system documentation
   */
  generateCompleteDocumentation(): {
    overview: {
      title: string;
      description: string;
      version: string;
      lastUpdated: string;
    };
    tokens: Record<string, DesignTokenDocumentation>;
    components: Record<string, ComponentDocumentation>;
    guidelines: {
      accessibility: string[];
      responsive: string[];
      performance: string[];
    };
  } {
    const overview = {
      title: 'SEO Automation App Design System',
      description: 'A comprehensive design system for building consistent, accessible, and performant user interfaces.',
      version: '1.0.0',
      lastUpdated: new Date().toISOString()
    };

    const tokens: Record<string, DesignTokenDocumentation> = {};
    this.tokenDocs.forEach((doc, key) => {
      tokens[key] = doc;
    });

    const components: Record<string, ComponentDocumentation> = {};
    this.components.forEach((doc, key) => {
      components[key] = doc;
    });

    const guidelines = {
      accessibility: [
        'All components must meet WCAG 2.1 AA standards',
        'Provide keyboard navigation support for all interactive elements',
        'Include proper ARIA attributes and labels',
        'Maintain minimum color contrast ratios',
        'Support screen readers and assistive technologies'
      ],
      responsive: [
        'Design mobile-first with progressive enhancement',
        'Use consistent breakpoints across all components',
        'Ensure touch targets are minimum 44px on mobile',
        'Test layouts across all supported viewport sizes',
        'Optimize for both portrait and landscape orientations'
      ],
      performance: [
        'Lazy load components and assets when possible',
        'Minimize bundle size through tree shaking',
        'Use efficient CSS-in-JS solutions',
        'Optimize images and use modern formats',
        'Monitor Core Web Vitals and performance budgets'
      ]
    };

    return {
      overview,
      tokens,
      components,
      guidelines
    };
  }

  /**
   * Generate usage guidelines for a specific token category
   */
  generateTokenUsageGuide(category: string): {
    category: string;
    bestPractices: string[];
    commonMistakes: string[];
    examples: TokenExample[];
  } {
    const tokenDoc = this.tokenDocs.get(category);
    if (!tokenDoc) {
      throw new Error(`Token category '${category}' not found`);
    }

    const bestPractices: string[] = [];
    const commonMistakes: string[] = [];

    switch (category) {
      case 'colors':
        bestPractices.push(
          'Use semantic color names instead of specific color values',
          'Maintain consistent color contrast ratios',
          'Use the color scale systematically (50 for backgrounds, 500 for primary, 600 for hover)',
          'Test colors in both light and dark themes'
        );
        commonMistakes.push(
          'Using hardcoded hex values instead of design tokens',
          'Inconsistent use of color shades across components',
          'Poor color contrast for accessibility',
          'Not considering color blindness in color choices'
        );
        break;

      case 'typography':
        bestPractices.push(
          'Use the type scale consistently across the application',
          'Maintain proper line height ratios for readability',
          'Choose appropriate font weights for hierarchy',
          'Ensure minimum font sizes for mobile devices'
        );
        commonMistakes.push(
          'Using arbitrary font sizes outside the scale',
          'Poor line height causing readability issues',
          'Inconsistent font weight usage',
          'Text too small on mobile devices'
        );
        break;

      case 'spacing':
        bestPractices.push(
          'Use the spacing scale for consistent layouts',
          'Apply spacing systematically (4px base unit)',
          'Use larger spacing for layout, smaller for components',
          'Maintain consistent spacing patterns'
        );
        commonMistakes.push(
          'Using arbitrary spacing values',
          'Inconsistent spacing between similar elements',
          'Too much or too little whitespace',
          'Not considering spacing on different screen sizes'
        );
        break;
    }

    return {
      category,
      bestPractices,
      commonMistakes,
      examples: tokenDoc.examples
    };
  }

  /**
   * Generate component playground code
   */
  generatePlaygroundCode(componentName: string, variant: string): string {
    const component = this.components.get(componentName);
    if (!component) {
      return `// Component '${componentName}' not found`;
    }

    const variantInfo = component.variants.find(v => v.name === variant);
    if (!variantInfo) {
      return `// Variant '${variant}' not found for component '${componentName}'`;
    }

    return `import { ${componentName} } from '@/components/ui/${componentName.toLowerCase()}';

export default function ${componentName}Playground() {
  return (
    <div className="p-8 space-y-4">
      <h2 className="text-2xl font-bold">${componentName} - ${variant}</h2>
      <div className="border rounded-lg p-4">
        ${variantInfo.preview}
      </div>
      <details className="mt-4">
        <summary className="cursor-pointer font-medium">View Code</summary>
        <pre className="mt-2 p-4 bg-gray-100 rounded overflow-x-auto">
          <code>${variantInfo.preview}</code>
        </pre>
      </details>
    </div>
  );
}`;
  }

  /**
   * Export design tokens for external tools
   */
  exportTokens(format: 'json' | 'css' | 'scss' | 'js'): string {
    switch (format) {
      case 'json':
        return JSON.stringify(designTokens, null, 2);

      case 'css':
        return this.generateCSSVariables();

      case 'scss':
        return this.generateSCSSVariables();

      case 'js':
        return `export const designTokens = ${JSON.stringify(designTokens, null, 2)};`;

      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Generate CSS custom properties
   */
  private generateCSSVariables(): string {
    let css = ':root {\n';
    
    // Colors
    Object.entries(designTokens.colors).forEach(([colorName, colorScale]) => {
      if (typeof colorScale === 'object') {
        Object.entries(colorScale).forEach(([shade, value]) => {
          css += `  --color-${colorName}-${shade}: ${value};\n`;
        });
      }
    });

    // Spacing
    Object.entries(designTokens.spacing).forEach(([space, value]) => {
      css += `  --spacing-${space}: ${value};\n`;
    });

    // Typography
    Object.entries(designTokens.typography.fontSize).forEach(([size, value]) => {
      const fontSize = Array.isArray(value) ? value[0] : value;
      css += `  --font-size-${size}: ${fontSize};\n`;
    });

    css += '}\n';
    return css;
  }

  /**
   * Generate SCSS variables
   */
  private generateSCSSVariables(): string {
    let scss = '// Design System Tokens\n\n';
    
    // Colors
    scss += '// Colors\n';
    Object.entries(designTokens.colors).forEach(([colorName, colorScale]) => {
      if (typeof colorScale === 'object') {
        Object.entries(colorScale).forEach(([shade, value]) => {
          scss += `$color-${colorName}-${shade}: ${value};\n`;
        });
      }
    });

    scss += '\n// Spacing\n';
    Object.entries(designTokens.spacing).forEach(([space, value]) => {
      scss += `$spacing-${space}: ${value};\n`;
    });

    return scss;
  }
}

// Export singleton instance
export const designSystemDocs = new DesignSystemDocumentationGenerator();

// Utility functions
export const generateComponentDocs = (componentName: string) => 
  designSystemDocs.generateComponentDocs(componentName);

export const generateTokenUsageGuide = (category: string) => 
  designSystemDocs.generateTokenUsageGuide(category);

export const exportDesignTokens = (format: 'json' | 'css' | 'scss' | 'js') => 
  designSystemDocs.exportTokens(format);
