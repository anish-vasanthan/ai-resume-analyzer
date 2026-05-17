/**
 * One-time migration: change users.avatar from VARCHAR(500) to TEXT
 * Run once with: node scripts/migrate-avatar-column.js
 */
require('dotenv').config();
const { Client } = require('pg');

async function migrate() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    statement_timeout: 60000,
    query_timeout: 60000,
    connectionTimeoutMillis: 30000,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Check current column type
    const check = await client.query(`
      SELECT data_type, character_maximum_length
      FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'avatar';
    `);

    if (check.rows.length === 0) {
      console.log('⚠️  Column "avatar" not found in users table');
      await client.end();
      process.exit(1);
    }

    const col = check.rows[0];
    console.log(`Current avatar column: ${col.data_type}(${col.character_maximum_length ?? 'unlimited'})`);

    if (col.data_type === 'text') {
      console.log('✅ Column is already TEXT — no migration needed');
      await client.end();
      process.exit(0);
    }

    // Alter the column
    await client.query(`ALTER TABLE users ALTER COLUMN avatar TYPE TEXT;`);
    console.log('✅ Migration complete — avatar column is now TEXT');
    await client.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    try { await client.end(); } catch {}
    process.exit(1);
  }
}

migrate();
