const {
  Pool
} = require('pg');
module.exports = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'edusmart_db',
  user: process.env.DB_USER || 'edusmart',
  password: process.env.DB_PASSWORD || 'edusmart'
});
