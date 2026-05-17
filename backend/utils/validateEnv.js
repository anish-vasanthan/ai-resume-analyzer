/**
 * Environment Variable Validation Utility
 * Validates that all required environment variables are present on server startup
 */

const requiredEnvVars = {
  DATABASE_URL: 'PostgreSQL connection string',
  JWT_SECRET: 'JWT signing secret'
};

// Check for AI service API key (GROQ_API_KEY, GEMINI_API_KEY, DEEPSEEK_API_KEY, or OPENAI_API_KEY)
const aiServiceKeys = ['GROQ_API_KEY', 'GEMINI_API_KEY', 'DEEPSEEK_API_KEY', 'OPENAI_API_KEY'];

/**
 * Validates that all required environment variables are set
 * Logs error and exits with status code 1 if any required variable is missing
 */
function validateEnvironment() {
  const missing = [];
  
  // Check standard required variables
  for (const [key, description] of Object.entries(requiredEnvVars)) {
    if (!process.env[key]) {
      missing.push(`${key} (${description})`);
    }
  }
  
  // Check AI service key (at least one must be present)
  const hasAiKey = aiServiceKeys.some(key => process.env[key]);
  if (!hasAiKey) {
    missing.push(`${aiServiceKeys.join(' or ')} (AI service API key)`);
  }
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(item => console.error(`   - ${item}`));
    console.error('\nPlease set these variables in your .env file or hosting platform environment settings.');
    process.exit(1);
  }
  
  console.log('✅ All required environment variables are set');
}

module.exports = { validateEnvironment };
