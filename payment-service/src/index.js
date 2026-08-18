require("dotenv").config();
const app = require("./app");
const {
  testDatabaseConnection
} = require("./config/db");
const migrate = require("./config/migrate");
const PORT = process.env.PORT || 4009;
(async () => {
  try {
    await testDatabaseConnection();
    await migrate();
    app.listen(PORT, () => console.log(`payment-service démarré sur le port ${PORT}.`));
  } catch (e) {
    console.error("Impossible de démarrer payment-service:", e);
    process.exit(1);
  }
})();
