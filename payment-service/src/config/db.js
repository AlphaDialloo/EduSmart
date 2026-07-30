const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.on('error', e => console.error('Erreur PostgreSQL payment-service:', e));
async function testDatabaseConnection(){ const c=await pool.connect(); try{await c.query('SELECT 1'); console.log('Connexion PostgreSQL établie pour payment-service.');} finally{c.release();}}
module.exports={pool,testDatabaseConnection};
