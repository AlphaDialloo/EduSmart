require("dotenv").config();

const app = require("./app");
const {
  testDatabaseConnection,
} = require("./config/db");
const {
  ensureDefaultSettings,
} = require("./repositories/settings.repository");

const PORT = Number(process.env.PORT) || 4007;

async function startServer() {
  try {
    await testDatabaseConnection();
    await ensureDefaultSettings();

    app.listen(PORT, () => {
      console.log(
        `settings-service démarré sur le port ${PORT}.`,
      );
    });
  } catch (error) {
    console.error(
      "Impossible de démarrer settings-service :",
      error,
    );
    process.exit(1);
  }
}

startServer();
