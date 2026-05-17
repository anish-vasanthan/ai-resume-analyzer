/**
 * Migration: add scoreBreakdown JSONB column to resumes table
 * Run once: node scripts/add-score-breakdown.js
 */
require('dotenv').config();
const { sequelize } = require('../config/database');

async function migrate() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to database');

    // Add scoreBreakdown column if it doesn't already exist
    await sequelize.query(`
      ALTER TABLE resumes
      ADD COLUMN IF NOT EXISTS "scoreBreakdown" JSONB DEFAULT NULL;
    `);

    console.log('✅ scoreBreakdown column added (or already existed)');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
}

migrate();
