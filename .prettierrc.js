/**
 * Prettier Configuration for SEO Automation App
 * Code formatting and style consistency
 */

module.exports = {
  // Print width - line length that the printer will wrap on
  printWidth: 100,

  // Tab width - number of spaces per indentation level
  tabWidth: 2,

  // Use tabs instead of spaces
  useTabs: false,

  // Semicolons - print semicolons at the ends of statements
  semi: true,

  // Single quotes - use single quotes instead of double quotes
  singleQuote: true,

  // Quote props - change when properties in objects are quoted
  quoteProps: 'as-needed',

  // JSX quotes - use single quotes in JSX
  jsxSingleQuote: false,

  // Trailing commas - print trailing commas wherever possible in multi-line comma-separated syntactic structures
  trailingComma: 'es5',

  // Bracket spacing - print spaces between brackets in object literals
  bracketSpacing: true,

  // JSX bracket same line - put the > of a multi-line JSX element at the end of the last line
  bracketSameLine: false,

  // Arrow function parentheses - include parentheses around a sole arrow function parameter
  arrowParens: 'avoid',

  // Range start - format only a segment of a file
  rangeStart: 0,

  // Range end - format only a segment of a file
  rangeEnd: Infinity,

  // Parser - which parser to use
  parser: undefined,

  // File path - provide the file path to prettier
  filepath: undefined,

  // Require pragma - require a special comment at the top of files to format them
  requirePragma: false,

  // Insert pragma - insert a special @format marker at the top of files
  insertPragma: false,

  // Prose wrap - how to wrap prose
  proseWrap: 'preserve',

  // HTML whitespace sensitivity
  htmlWhitespaceSensitivity: 'css',

  // Vue files script and style tags indentation
  vueIndentScriptAndStyle: false,

  // End of line - line ending style
  endOfLine: 'lf',

  // Embedded language formatting
  embeddedLanguageFormatting: 'auto',

  // Single attribute per line in HTML, Vue and JSX
  singleAttributePerLine: false,

  // Plugin-specific configurations
  plugins: [
    '@trivago/prettier-plugin-sort-imports',
    'prettier-plugin-tailwindcss',
  ],

  // Import sorting configuration
  importOrder: [
    '^react$',
    '^react/(.*)$',
    '^next/(.*)$',
    '<THIRD_PARTY_MODULES>',
    '^@/(.*)$',
    '^[./]',
  ],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
  importOrderBuiltinModulesToTop: true,
  importOrderParserPlugins: ['typescript', 'jsx', 'decorators-legacy'],
  importOrderMergeDuplicateImports: true,
  importOrderCombineTypeAndValueImports: true,

  // Tailwind CSS class sorting
  tailwindConfig: './tailwind.config.js',
  tailwindFunctions: ['clsx', 'cn', 'cva'],

  // Override configurations for specific file types
  overrides: [
    {
      files: '*.json',
      options: {
        printWidth: 200,
        tabWidth: 2,
      },
    },
    {
      files: '*.md',
      options: {
        printWidth: 80,
        proseWrap: 'always',
        tabWidth: 2,
      },
    },
    {
      files: '*.yml',
      options: {
        tabWidth: 2,
        singleQuote: false,
      },
    },
    {
      files: '*.yaml',
      options: {
        tabWidth: 2,
        singleQuote: false,
      },
    },
    {
      files: '*.css',
      options: {
        singleQuote: false,
      },
    },
    {
      files: '*.scss',
      options: {
        singleQuote: false,
      },
    },
    {
      files: '*.html',
      options: {
        printWidth: 120,
        tabWidth: 2,
        htmlWhitespaceSensitivity: 'ignore',
      },
    },
    {
      files: '*.svg',
      options: {
        parser: 'html',
      },
    },
    {
      files: ['*.js', '*.jsx'],
      options: {
        parser: 'babel',
      },
    },
    {
      files: ['*.ts', '*.tsx'],
      options: {
        parser: 'typescript',
      },
    },
    {
      files: '*.vue',
      options: {
        parser: 'vue',
      },
    },
    {
      files: 'package.json',
      options: {
        tabWidth: 2,
        printWidth: 1000,
      },
    },
    {
      files: '.eslintrc*',
      options: {
        parser: 'json',
      },
    },
    {
      files: 'tsconfig*.json',
      options: {
        parser: 'jsonc',
        trailingComma: 'none',
      },
    },
  ],
};
