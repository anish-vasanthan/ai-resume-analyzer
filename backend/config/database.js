require('dotenv').config();
const { Sequelize } = require('sequelize');

// Render PostgreSQL connection with optimized settings
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    },
    // Increase connection timeout
    connectTimeout: 60000, // 60 seconds
    // Keep alive settings
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000
  },
  pool: {
    max: 10,
    min: 2,
    acquire: 60000, // 60 seconds
    idle: 10000,
    evict: 10000
  },
  // Retry settings
  retry: {
    max: 5,
    timeout: 3000,
    match: [
      /SequelizeConnectionError/,
      /SequelizeConnectionRefusedError/,
      /SequelizeHostNotFoundError/,
      /SequelizeHostNotReachableError/,
      /SequelizeInvalidConnectionError/,
      /SequelizeConnectionTimedOutError/,
      /TimeoutError/,
      /ETIMEDOUT/,
      /ECONNREFUSED/,
      /ENOTFOUND/,
      /ENETUNREACH/,
      /ECONNRESET/
    ]
  }
});

const connectDB = async () => {
  const maxRetries = 3;
  let retryCount = 0;
  
  console.log('🔌 Connecting to Render PostgreSQL database...');
  
  while (retryCount < maxRetries) {
    try {
      // Test connection
      await sequelize.authenticate();
      console.log('✅ Database connected successfully!');

      // Sync all models — create tables if they don't exist
      await sequelize.sync({ alter: false }); // Changed to false to avoid altering in production
      console.log('✅ All tables synced.');
      return true;
    } catch (error) {
      retryCount++;
      console.error(`❌ Database connection attempt ${retryCount}/${maxRetries} failed:`);
      console.error(`   Error: ${error.message}`);
      
      if (error.parent) {
        console.error(`   Code: ${error.parent.code}`);
      }
      
      if (retryCount >= maxRetries) {
        console.error('\n❌ Failed to connect to database after multiple attempts.');
        console.error('   Please check:');
        console.error('   1. Your internet connection');
        console.error('   2. Render database is active (https://dashboard.render.com/)');
        console.error('   3. DATABASE_URL is correct in .env file');
        console.error('   4. Firewall/VPN is not blocking the connection');
        console.error('   5. Try disabling VPN if you have one active\n');
        
        // Exit the process - database is required
        process.exit(1);
      }
      
      // Wait before retry (2 seconds)
      console.log(`⏳ Retrying in 2 seconds...\n`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  return false;
};

module.exports = { sequelize, connectDB };
