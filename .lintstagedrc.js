/**
 * Lint-staged Configuration for SEO Automation App
 * Runs linting and formatting on staged files
 */

module.exports = {
  // TypeScript and JavaScript files
  '*.{js,jsx,ts,tsx}': [
    'eslint --fix',
    'prettier --write',
    'jest --bail --findRelatedTests --passWithNoTests',
  ],

  // JSON files
  '*.json': [
    'prettier --write',
  ],

  // Markdown files
  '*.md': [
    'prettier --write',
    'markdownlint --fix',
  ],

  // CSS and SCSS files
  '*.{css,scss}': [
    'stylelint --fix',
    'prettier --write',
  ],

  // YAML files
  '*.{yml,yaml}': [
    'prettier --write',
  ],

  // Package.json
  'package.json': [
    'prettier --write',
    'npm audit --audit-level=moderate',
  ],

  // Environment files
  '.env*': [
    // Check for sensitive data patterns
    'node -e "const fs = require(\'fs\'); const content = fs.readFileSync(process.argv[1], \'utf8\'); if (content.match(/password|secret|key/i) && !content.match(/example|placeholder|test/i)) { console.error(\'Potential sensitive data in env file\'); process.exit(1); }"',
  ],

  // Configuration files
  '*.config.{js,ts}': [
    'eslint --fix',
    'prettier --write',
  ],

  // Test files
  '*.{test,spec}.{js,jsx,ts,tsx}': [
    'eslint --fix',
    'prettier --write',
    'jest --bail --findRelatedTests --passWithNoTests',
  ],

  // Storybook files
  '*.stories.{js,jsx,ts,tsx}': [
    'eslint --fix',
    'prettier --write',
  ],

  // HTML files
  '*.html': [
    'prettier --write',
  ],

  // SVG files
  '*.svg': [
    'prettier --write --parser html',
  ],
};
