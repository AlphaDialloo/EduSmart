const express = require("express"),
  cors = require("cors"),
  helmet = require("helmet"),
  morgan = require("morgan");
const routes = require("./routes/payment.routes");
const app = express();
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN === "*" ? "*" : process.env.CORS_ORIGIN?.split(",").map(x => x.trim())
}));
app.use(express.json({
  limit: "1mb"
}));
app.use(morgan("dev"));
app.get("/health", (_q, r) => r.json({
  service: "payment-service",
  status: "UP",
  timestamp: new Date().toISOString()
}));
app.use("/api/payments", routes);
app.use((_q, r) => r.status(404).json({
  message: "Route introuvable."
}));
app.use((e, _q, r, _n) => {
  console.error("Unhandled payment-service error:", e);
  r.status(Number(e.statusCode) || 500).json({
    message: e.message || "Erreur serveur."
  });
});
module.exports = app;
