/**
 * Jest Setup File
 * Loads test environment configuration before running tests
 */

const dotenv = require('dotenv');
const path = require('path');

// Load test environment variables
if (process.env.NODE_ENV === 'test') {
  const testEnvPath = path.resolve(__dirname, '.env.test');
  dotenv.config({ path: testEnvPath });
  console.log('📝 Loaded test environment configuration from .env.test');
  
  if (process.env.SKIP_DATABASE_TESTS === 'true') {
    console.log('⚠️  Database tests will be skipped (SKIP_DATABASE_TESTS=true)');
    console.log('   To run database tests, set up a local PostgreSQL database and update .env.test');
  }
}
