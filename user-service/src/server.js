require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const routes = require("./routes/user.routes");
const app = express();
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());
app.get("/health", (_req, res) => {
  return res.json({
    service: "user-service",
    status: "UP",
    timestamp: new Date().toISOString()
  });
});
app.use("/api/users", routes);
app.use((_req, res) => {
  return res.status(404).json({
    message: "Route introuvable."
  });
});
const PORT = Number(process.env.PORT) || 4002;
app.listen(PORT, () => {
  console.log(`User Service lancé sur le port ${PORT}`);
});
