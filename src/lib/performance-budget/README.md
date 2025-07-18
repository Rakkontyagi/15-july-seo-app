
# Performance Budget

This module provides tools for enforcing a performance budget.

## Usage

In your `webpack.config.js`:

```javascript
const { PerformanceBudgetPlugin } = require('./src/lib/performance-budget/webpack-plugin');

module.exports = {
  // ...
  plugins: [
    new PerformanceBudgetPlugin({
      maxBundleSize: 500000, // 500kb
      maxLoadTime: 3000, // 3s
    }),
  ],
};
```
