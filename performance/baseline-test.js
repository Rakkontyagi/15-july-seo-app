import http from 'k6/http';
import { sleep, check } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';
import { randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

// Custom metrics
const pageLoadTime = new Trend('page_load_time');
const requestsPerSecond = new Rate('requests_per_second');
const failRate = new Rate('fail_rate');
const successfulRequests = new Counter('successful_requests');

// Test configuration
export const options = {
  stages: [
    { duration: '1m', target: 10 }, // Ramp up to 10 users over 1 minute
    { duration: '3m', target: 10 }, // Stay at 10 users for 3 minutes
    { duration: '1m', target: 0 },  // Ramp down to 0 users over 1 minute
  ],
  thresholds: {
    'page_load_time': ['p(95)<500'], // 95% of requests should be below 500ms
    'requests_per_second': ['rate>5'],
    'fail_rate': ['rate<0.1'], // Less than 10% failures
    'http_req_duration': ['p(95)<500'], // 95% of requests should be below 500ms
  },
};

// Main test function
export default function() {
  // Homepage test
  const homeResponse = http.get('http://localhost:3000/');
  check(homeResponse, {
    'homepage status is 200': (r) => r.status === 200,
    'homepage has correct title': (r) => r.body.includes('<title>SEO Automation Platform</title>'),
  });
  
  pageLoadTime.add(homeResponse.timings.duration);
  requestsPerSecond.add(1);
  
  if (homeResponse.status === 200) {
    successfulRequests.add(1);
  } else {
    failRate.add(1);
  }
  
  // API test
  const apiResponse = http.get('http://localhost:3000/api/health');
  check(apiResponse, {
    'API status is 200': (r) => r.status === 200,
    'API returns correct data': (r) => {
      try {
        const data = JSON.parse(r.body);
        return data.status === 'ok';
      } catch (e) {
        return false;
      }
    },
  });
  
  pageLoadTime.add(apiResponse.timings.duration);
  requestsPerSecond.add(1);
  
  if (apiResponse.status === 200) {
    successfulRequests.add(1);
  } else {
    failRate.add(1);
  }
  
  // Random sleep between requests to simulate real user behavior
  sleep(randomIntBetween(1, 5));
}