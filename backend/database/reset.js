/**
 * reset.js — Drops and recreates the schema, then re-seeds data.
 * Usage: node database/reset.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME     || 'gemini_inventory',
  user:     process.env.DB_USER     || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

async function reset() {
  console.log('⚠️  Resetting database (drop + recreate + seed)...\n');

  const schemaSQL = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  const seedSQL   = fs.readFileSync(path.join(__dirname, 'seed.sql'),   'utf8');

  try {
    await pool.query(schemaSQL);
    console.log('✅ Schema recreated.');
    await pool.query(seedSQL);
    console.log('✅ Sample data re-inserted.');
    console.log('\n🎉 Database reset complete!\n');
  } catch (err) {
    console.error('❌ Reset failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

reset();
