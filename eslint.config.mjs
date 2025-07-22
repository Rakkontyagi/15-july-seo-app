import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // Next.js recommended configuration
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  
  // Global configuration for all files
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    rules: {
      // Code quality rules
      "no-unused-vars": "off", // Handled by TypeScript
      "@typescript-eslint/no-unused-vars": ["warn", { 
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_",
        "caughtErrorsIgnorePattern": "^_"
      }],
      
      // Removed import/order rule as it requires eslint-plugin-import
      
      // React specific rules
      "react/prop-types": "off", // Using TypeScript for prop validation
      "react/react-in-jsx-scope": "off", // Not needed in Next.js
      "react-hooks/exhaustive-deps": "warn",
      
      // Next.js specific rules
      "@next/next/no-img-element": "error",
      "@next/next/no-html-link-for-pages": "error",
      
      // Security rules
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error",
      "no-script-url": "error",
      
      // Best practices
      "prefer-const": "error",
      "no-var": "error",
      "object-shorthand": "warn",
      "prefer-template": "warn",
      "prefer-arrow-callback": "warn",
      
      // Console and debugging
      "no-console": ["warn", { "allow": ["warn", "error"] }],
      "no-debugger": "error",
      "no-alert": "error",
      
      // Async/await best practices
      "require-await": "warn",
      "no-return-await": "warn",
      
      // TypeScript specific rules (non-type-aware)
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-non-null-assertion": "warn",
    }
  },
  
  // Configuration for test files
  {
    files: ["**/__tests__/**/*.{js,jsx,ts,tsx}", "**/*.{test,spec}.{js,jsx,ts,tsx}"],
    rules: {
      "no-console": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
    }
  },
  
  // Configuration for configuration files
  {
    files: ["*.config.{js,mjs,ts}", "scripts/**/*.{js,ts}"],
    rules: {
      "no-console": "off",
      "@typescript-eslint/no-var-requires": "off",
    }
  },
  
  // Configuration for middleware and API routes
  {
    files: ["src/middleware.{js,ts}", "src/app/api/**/*.{js,ts}"],
    rules: {
      "no-console": ["warn", { "allow": ["warn", "error", "info"] }],
    }
  },
  
  // Ignore patterns
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "dist/**",
      "coverage/**",
      "playwright-report/**",
      "test-results/**",
      "*.min.js",
      "public/**/*.js",
    ]
  }
];

export default eslintConfig;
