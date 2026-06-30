require('dotenv').config();
const { Sequelize } = require('sequelize');

// CockroachDB connection — uses the postgres dialect with SSL
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
      ...(process.env.DB_CA_CERT && { ca: process.env.DB_CA_CERT })
    },
    connectTimeout: 60000,
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000
  },
  pool: {
    max: 5,
    min: 0,        // 0 so idle connections are released (important for serverless)
    acquire: 60000,
    idle: 20000,
    evict: 5000
  }
});

/**
 * Load all models and wire up associations.
 * Must be called before sequelize.sync() so tables are created in the right order.
 */
function loadModels() {
  const User         = require('../models/User');
  const Resume       = require('../models/Resume');
  const MockInterview = require('../models/MockInterview');

  const models = { User, Resume, MockInterview };

  // Run each model's associate() if defined
  Object.values(models).forEach(model => {
    if (typeof model.associate === 'function') {
      model.associate(models);
    }
  });

  return models;
}

const connectDB = async () => {
  const maxRetries = 3;
  let retryCount = 0;

  console.log('🔌 Connecting to CockroachDB...');

  while (retryCount < maxRetries) {
    try {
      await sequelize.authenticate();
      console.log('✅ Database connected successfully!');

      loadModels();

      // sync separately — don't let a slow sync kill the connection
      sequelize.sync({ alter: false })
        .then(() => console.log('✅ All tables synced.'))
        .catch(err => console.error('⚠️  Table sync failed (non-fatal):', err.message));

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
        console.error('   Server will continue running but DB features will not work.\n');
        return false;  // don't exit — let the server run
      }

      console.log(`⏳ Retrying in 2 seconds...\n`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  return false;
};

module.exports = { sequelize, connectDB };
