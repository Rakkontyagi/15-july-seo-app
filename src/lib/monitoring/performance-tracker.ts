
import { performance, PerformanceObserver } from 'perf_hooks';

export class PerformanceTracker {
  private observer: PerformanceObserver;

  constructor() {
    this.observer = new PerformanceObserver((items) => {
      items.getEntries().forEach((entry) => {
        console.log(`Performance: ${entry.name} took ${entry.duration.toFixed(2)}ms`);
      });
    });
    this.observer.observe({ entryTypes: ['measure'] });
  }

  start(label: string) {
    performance.mark(`${label}-start`);
  }

  end(label: string) {
    performance.mark(`${label}-end`);
    performance.measure(label, `${label}-start`, `${label}-end`);
  }

  disconnect() {
    this.observer.disconnect();
  }
}
