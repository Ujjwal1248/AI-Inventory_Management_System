/**
 * auth-setup.js — Runs the auth-schema.sql to create users & session tables.
 * Safe to run multiple times (uses IF NOT EXISTS).
 * Does NOT touch existing inventory tables.
 */
require('dotenv').config();
const fs   = require('fs');
const path = require('path');
const { pool } = require('../src/config/database');

async function runAuthSchema() {
  const sqlPath = path.join(__dirname, 'auth-schema.sql');
  const sql     = fs.readFileSync(sqlPath, 'utf8');

  console.log('🔐 Setting up authentication schema...');
  try {
    const result = await pool.query(sql);
    // The final SELECT returns a status message
    const statusRow = result[result.length - 1]?.rows?.[0];
    console.log('✅', statusRow?.status || 'Auth schema applied.');
  } catch (err) {
    console.error('❌ Auth schema error:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runAuthSchema();
