// Load environment variables FIRST before any other imports
require('dotenv').config();

// Validate environment variables before starting server
const { validateEnvironment } = require('./utils/validateEnv');
validateEnvironment();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { connectDB } = require('./config/database');

// Initialize express app
const app = express();

// Connect to database (blocking - required for app to work)
// This will exit if connection fails after retries
connectDB();

// Middleware
app.use(helmet());

// Compression middleware for response compression
app.use(compression());

// CORS configuration - allow requests from frontend with credentials
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware for production debugging
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// Rate limiting - production settings
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // 100 requests per 15 min in production
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/resume', require('./routes/resume'));
app.use('/api/analysis', require('./routes/analysis'));
app.use('/api/interview', require('./routes/interview'));
app.use('/api/mock-interview', require('./routes/mockInterview'));
app.use('/api/user', require('./routes/user'));
app.use('/api/enhance', require('./routes/enhance'));
app.use('/api/job-match', require('./routes/jobMatch'));

// Health check - returns environment and timestamp
app.get('/health', async (req, res) => {
  const healthStatus = {
    status: 'OK',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: 'Unknown',
    aiService: (process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY || process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY) ? 'Configured' : 'Not configured'
  };

  // Test database connection
  try {
    const { sequelize } = require('./config/database');
    await sequelize.authenticate();
    healthStatus.database = 'Connected';
  } catch (error) {
    healthStatus.database = 'Disconnected';
    healthStatus.status = 'DEGRADED';
    healthStatus.databaseError = error.message;
  }

  res.status(healthStatus.status === 'OK' ? 200 : 503).json(healthStatus);
});

// 404 handler - must be after all routes
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error handling middleware - must be last
const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

/**
 * Startup checks for critical services
 * Tests database connection and validates Gemini API key
 */
async function performStartupChecks() {
  console.log('='.repeat(50));
  console.log('🚀 Starting server...');
  console.log('='.repeat(50));
  
  let hasErrors = false;
  
  // Check 1: Database Connection Test
  console.log('\n📊 Testing database connection...');
  try {
    const { sequelize } = require('./config/database');
    await sequelize.authenticate();
    console.log('✅ Database connection: SUCCESS');
  } catch (error) {
    console.error('⚠️  Database connection: WARNING');
    console.error(`   Error: ${error.message}`);
    console.error('   Note: Server will start but database features may not work');
    // Don't set hasErrors = true for database, allow server to start
  }
  
  // Check 2: AI Service API Key Validation
  console.log('\n🤖 Validating AI service configuration...');
  const groqKey = process.env.GROQ_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  const deepseekKey = process.env.DEEPSEEK_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  
  if (groqKey) {
    console.log('✅ AI service API key: CONFIGURED');
    console.log('✅ AI service: Ready (Groq API - Ultra Fast ⚡)');
  } else if (geminiKey) {
    console.log('✅ AI service API key: CONFIGURED');
    console.log('✅ AI service: Ready (Google Gemini API)');
  } else if (deepseekKey) {
    console.log('✅ AI service API key: CONFIGURED');
    console.log('✅ AI service: Ready (DeepSeek API)');
  } else if (openaiKey) {
    console.log('✅ AI service API key: CONFIGURED');
    console.log('✅ AI service: Ready (OpenAI API)');
  } else {
    console.error('❌ AI service API key: NOT CONFIGURED');
    console.error('   Please set one of: GROQ_API_KEY, GEMINI_API_KEY, DEEPSEEK_API_KEY, or OPENAI_API_KEY');
    hasErrors = true;
  }
  
  console.log('\n' + '='.repeat(50));
  
  // Exit if critical services failed
  if (hasErrors) {
    console.error('❌ CRITICAL SERVICES FAILED - Server cannot start');
    console.error('   Please check your environment variables and try again');
    console.log('='.repeat(50));
    process.exit(1);
  }
  
  console.log('✅ Startup checks completed');
  console.log('='.repeat(50));
}

// Start server with startup checks
performStartupChecks()
  .then(() => {
    app.listen(PORT, () => {
      console.log('\n' + '='.repeat(50));
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
      
      // Display which AI service is configured
      if (process.env.GROQ_API_KEY) {
        console.log(`🤖 AI Service: Groq API (Configured) ⚡`);
      } else if (process.env.GEMINI_API_KEY) {
        console.log(`🤖 AI Service: Google Gemini API (Configured)`);
      } else if (process.env.DEEPSEEK_API_KEY) {
        console.log(`🤖 AI Service: DeepSeek API (Configured)`);
      } else if (process.env.OPENAI_API_KEY) {
        console.log(`🤖 AI Service: OpenAI API (Configured)`);
      }
      
      console.log('='.repeat(50));
      console.log(`\n🌐 Server ready at http://localhost:${PORT}`);
      console.log(`🏥 Health check: http://localhost:${PORT}/health\n`);
    });
  })
  .catch((error) => {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  });
