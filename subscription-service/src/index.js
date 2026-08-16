require("dotenv").config();
const app = require("./app");
const {
  testDatabaseConnection
} = require("./config/db");
const port = Number(process.env.PORT || 4008);
async function start() {
  try {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL est obligatoire.");
    }
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET est obligatoire.");
    }
    if (!process.env.SETTINGS_SERVICE_URL) {
      throw new Error("SETTINGS_SERVICE_URL est obligatoire.");
    }
    if (!process.env.INTERNAL_SERVICE_SECRET) {
      throw new Error("INTERNAL_SERVICE_SECRET est obligatoire.");
    }
    await testDatabaseConnection();
    app.listen(port, () => {
      console.log(`subscription-service démarré sur le port ${port}.`);
    });
  } catch (error) {
    console.error("Impossible de démarrer subscription-service :", error);
    process.exit(1);
  }
}
start();
