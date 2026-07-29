const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on("error", (error) => {
  console.error("Erreur PostgreSQL inattendue :", error);
});

async function testDatabaseConnection() {
  const client = await pool.connect();

  try {
    await client.query("SELECT 1");
    console.log("Connexion PostgreSQL établie pour settings-service.");
  } finally {
    client.release();
  }
}

module.exports = {
  pool,
  testDatabaseConnection,
};
