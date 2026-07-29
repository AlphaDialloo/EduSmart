require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();

app.use(cors());
app.use(helmet());
app.use(morgan("dev"));

app.get("/health", (_req, res) => {
  return res.status(200).json({
    service: "api-gateway",
    status: "UP",
    timestamp: new Date().toISOString(),
  });
});

function proxy(publicPath, target) {
  if (!target) {
    throw new Error(`URL manquante pour ${publicPath}`);
  }

  app.use(
    publicPath,
    createProxyMiddleware({
      target,
      changeOrigin: true,

      pathRewrite: (path) => {
        // Express retire déjà publicPath.
        // On le remet pour que le microservice
        // reçoive le chemin attendu.
        return `${publicPath}${path}`;
      },

      logLevel: "debug",

      on: {
        proxyReq: (proxyReq, req) => {
          console.log(
            `[Gateway] ${req.method} ${req.originalUrl} -> ${target}${publicPath}${req.url}`,
          );
        },

        error: (err, _req, res) => {
          console.error(err);

          if (!res.headersSent) {
            res.status(502).json({
              message: "Microservice inaccessible.",
            });
          }
        },
      },
    }),
  );
}

// ====================
// AUTH
// ====================

proxy("/api/auth", process.env.AUTH_SERVICE_URL);

// ====================
// USERS
// ====================

proxy("/api/users", process.env.USER_SERVICE_URL);

// ====================
// COURSES
// ====================

proxy("/api/courses", process.env.COURSE_SERVICE_URL);

// ====================
// PROGRESS
// ====================

proxy("/api/progress", process.env.PROGRESS_SERVICE_URL);

// ====================
// RECOMMENDATIONS
// ====================

proxy("/api/recommendations", process.env.RECOMMENDATION_SERVICE_URL);

// ====================
// INTERACTIONS
// ====================

proxy("/api/interactions", process.env.INTERACTION_SERVICE_URL);

// ====================
// SETTINGS
// ====================

proxy("/api/settings", process.env.SETTINGS_SERVICE_URL);

// ====================
// SUBSCRIPTIONS
// ====================

proxy("/api/subscriptions", process.env.SUBSCRIPTION_SERVICE_URL);

// ====================

app.use((_req, res) => {
  return res.status(404).json({
    message: "Route introuvable.",
  });
});

app.use((err, _req, res, _next) => {
  console.error(err);

  return res.status(500).json({
    message: "Erreur interne du Gateway.",
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`API Gateway lancée sur le port ${PORT}`);
});
