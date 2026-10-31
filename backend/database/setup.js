/**
 * setup.js — Runs schema.sql to create database tables.
 * Usage: node database/setup.js
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

async function setup() {
  console.log('🔧 Setting up database schema...\n');
  const schemaSQL = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');

  try {
    await pool.query(schemaSQL);
    console.log('✅ Schema created successfully!\n');
  } catch (err) {
    console.error('❌ Schema setup failed:', err.message);
    if (err.message.includes('ECONNREFUSED') || err.message.includes('password authentication')) {
      console.error('\n💡 Tip: Check your .env file credentials and make sure PostgreSQL is running.');
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

setup();
