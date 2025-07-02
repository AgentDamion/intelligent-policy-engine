const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:' + process.env.DB_PASSWORD + '@localhost:5432/aicomplyr';

const pool = new Pool({
  connectionString,
});

module.exports = pool; 