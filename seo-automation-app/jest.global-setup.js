/**
 * Jest Global Setup
 * Following Quinn's recommendation for comprehensive test environment setup
 */

const { setupServer } = require('msw/node');
const { handlers } = require('./src/mocks/handlers');

module.exports = async () => {
  // Setup MSW server for API mocking
  const server = setupServer(...handlers);
  
  // Start the server
  server.listen({
    onUnhandledRequest: 'warn',
  });
  
  // Store server instance globally for cleanup
  global.__MSW_SERVER__ = server;
  
  // Setup test database if needed
  if (process.env.NODE_ENV === 'test') {
    // Initialize test database
    console.log('🧪 Setting up test environment...');
    
    // Set test environment variables
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
    process.env.OPENAI_API_KEY = 'test-openai-key';
    process.env.SERPER_API_KEY = 'test-serper-key';
    process.env.FIRECRAWL_API_KEY = 'test-firecrawl-key';
    
    console.log('✅ Test environment setup complete');
  }
  
  // Setup performance monitoring for tests
  global.performance = global.performance || {
    now: () => Date.now(),
    mark: () => {},
    measure: () => {},
  };
  
  // Setup crypto for Node.js environments
  if (typeof global.crypto === 'undefined') {
    const { webcrypto } = require('crypto');
    global.crypto = webcrypto;
  }
  
  console.log('🚀 Jest global setup complete');
};
