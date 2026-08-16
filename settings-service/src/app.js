const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const settingsRoutes = require("./routes/settings.routes");
const app = express();
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN === "*" ? "*" : process.env.CORS_ORIGIN?.split(",").map(origin => origin.trim())
}));
app.use(express.json({
  limit: "1mb"
}));
app.use(morgan("dev"));
app.get("/health", (_req, res) => {
  return res.status(200).json({
    service: "settings-service",
    status: "UP",
    timestamp: new Date().toISOString()
  });
});
app.use("/api/settings", settingsRoutes);
app.use((_req, res) => {
  return res.status(404).json({
    message: "Route introuvable."
  });
});
app.use((error, _req, res, _next) => {
  console.error("Unhandled settings-service error:", error);
  return res.status(500).json({
    message: "Erreur serveur."
  });
});
module.exports = app;
