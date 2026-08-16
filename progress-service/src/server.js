require("dotenv").config();
const express = require("express"),
  cors = require("cors"),
  helmet = require("helmet"),
  morgan = require("morgan");
const routes = require("./routes/progress.routes");
const progressRoutes = require("./routes/progress.routes");
const migrate = require("./config/migrate");
const app = express();
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());
app.get("/health", (_, res) => res.json({
  service: "progress-service",
  status: "OK"
}));
app.use("/progress", routes);
app.use("/api/progress", progressRoutes);
async function start() {
  await migrate();
  app.listen(process.env.PORT || 4004, () => console.log("Progress Service lancé"));
}
start().catch(error => {
  console.error("Impossible de démarrer le service de progression :", error);
  process.exit(1);
});
