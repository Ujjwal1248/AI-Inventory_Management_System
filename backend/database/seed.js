/**
 * seed.js — Inserts sample data into the database.
 * Usage: node database/seed.js
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

async function seed() {
  console.log('🌱 Seeding sample data...\n');
  const seedSQL = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8');

  try {
    await pool.query(seedSQL);
    console.log('✅ Sample data inserted successfully!\n');
  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
    console.error('\n💡 Tip: Make sure you have run `npm run db:setup` first.');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed();
