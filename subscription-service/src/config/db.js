const {
  Pool
} = require("pg");
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? {
    rejectUnauthorized: false
  } : undefined
});
pool.on("error", error => {
  console.error("Erreur PostgreSQL inattendue :", error);
});
async function testDatabaseConnection() {
  const client = await pool.connect();
  try {
    await client.query("SELECT 1");
    console.log("Connexion PostgreSQL établie pour subscription-service.");
  } finally {
    client.release();
  }
}
module.exports = {
  pool,
  testDatabaseConnection
};
