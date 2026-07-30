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

/**
 * Configure un proxy vers un microservice.
 *
 * Exemple :
 * /api/auth/login
 * devient
 * http://auth-service:4001/api/auth/login
 */
function proxy(publicPath, target) {
  if (!target) {
    throw new Error(`URL du microservice manquante pour ${publicPath}`);
  }

  app.use(
    publicPath,
    createProxyMiddleware({
      target,
      changeOrigin: true,
      proxyTimeout: 10000,
      timeout: 10000,

      /*
       * Express peut retirer le préfixe utilisé dans app.use().
       *
       * Exemple :
       * URL reçue : /api/auth/login
       * Chemin vu par le proxy : /login
       *
       * Cette fonction remet le préfixe uniquement s’il est absent.
       */
      pathRewrite: (path) => {
        if (path.startsWith(publicPath)) {
          return path;
        }

        if (path === "/") {
          return publicPath;
        }

        return `${publicPath}${path}`;
      },

      on: {
        proxyReq: (proxyReq, req) => {
          console.log(
            `[Gateway] ${req.method} ${req.originalUrl} -> ${target}${proxyReq.path}`,
          );
        },

        proxyRes: (proxyRes, req) => {
          console.log(
            `[Gateway] ${req.method} ${req.originalUrl} <- ${proxyRes.statusCode}`,
          );
        },

        error: (error, req, res) => {
          console.error(
            `[Gateway] Erreur proxy pour ${req.method} ${req.originalUrl} :`,
            error.message,
          );

          if (!res.headersSent) {
            return res.status(502).json({
              message: "Microservice inaccessible.",
              servicePath: publicPath,
            });
          }
        },
      },
    }),
  );
}

// Authentification
proxy("/api/auth", process.env.AUTH_SERVICE_URL);

// Utilisateurs
proxy("/api/users", process.env.USER_SERVICE_URL);

// Cours
proxy("/api/courses", process.env.COURSE_SERVICE_URL);

// Progression
proxy("/api/progress", process.env.PROGRESS_SERVICE_URL);

// Recommandations
proxy("/api/recommendations", process.env.RECOMMENDATION_SERVICE_URL);

// Interactions
proxy("/api/interactions", process.env.INTERACTION_SERVICE_URL);

// Paramètres
proxy("/api/settings", process.env.SETTINGS_SERVICE_URL);

// Abonnements
proxy("/api/subscriptions", process.env.SUBSCRIPTION_SERVICE_URL);

// Paiements
proxy("/api/payments", process.env.PAYMENT_SERVICE_URL);

// Route inexistante dans le Gateway
app.use((_req, res) => {
  return res.status(404).json({
    message: "Route introuvable dans le Gateway.",
  });
});

// Gestionnaire global des erreurs
app.use((error, _req, res, _next) => {
  console.error("[Gateway] Erreur interne :", error);

  return res.status(500).json({
    message: "Erreur interne du Gateway.",
  });
});

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, () => {
  console.log(`API Gateway lancée sur le port ${PORT}`);
});
