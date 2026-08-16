require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const connect = require("./config/mongo");
const courseRoutes = require("./routes/course.routes");
const courseCategoryRoutes = require("./routes/courseCategory.routes");
const uploadRoutes = require("./routes/upload.routes");
const app = express();
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());
app.get("/health", (_, res) => {
  return res.json({
    service: "course-service",
    status: "OK"
  });
});
app.use("/api/courses", courseRoutes);
app.use("/api/course-categories", courseCategoryRoutes);
app.use("/api/uploads", uploadRoutes);
connect().then(() => {
  const port = process.env.PORT || 4003;
  app.listen(port, () => {
    console.log(`Course Service lancé sur le port ${port}`);
  });
}).catch(error => {
  console.error("Échec de la connexion à MongoDB :", error);
  process.exit(1);
});
