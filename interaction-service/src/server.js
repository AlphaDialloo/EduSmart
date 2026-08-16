require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const connect = require("./config/mongo");
const routes = require("./routes/interaction.routes");
const app = express();
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());
app.get("/health", (_req, res) => res.json({
  service: "interaction-service",
  status: "OK"
}));
app.use("/interactions", routes);
app.use("/api/interactions", routes);
connect().then(() => app.listen(process.env.PORT || 4006, () => console.log("Interaction Service lancé")));
