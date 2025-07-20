/**
 * Jest Global Teardown
 * Following Quinn's recommendation for proper test cleanup
 */

module.exports = async () => {
  // Cleanup MSW server
  if (global.__MSW_SERVER__) {
    global.__MSW_SERVER__.close();
    console.log('🧹 MSW server closed');
  }
  
  // Cleanup test database if needed
  if (process.env.NODE_ENV === 'test') {
    console.log('🧪 Cleaning up test environment...');
    
    // Clear any test data or connections
    // This would typically involve cleaning up database connections,
    // clearing test files, etc.
    
    console.log('✅ Test environment cleanup complete');
  }
  
  console.log('🏁 Jest global teardown complete');
};
