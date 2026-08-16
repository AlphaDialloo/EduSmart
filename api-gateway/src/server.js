require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const {
  createProxyMiddleware
} = require("http-proxy-middleware");
const app = express();
app.disable("x-powered-by");
app.set("trust proxy", true);
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(helmet());
app.use(morgan("dev"));
app.get("/health", (_req, res) => {
  return res.status(200).json({
    service: "api-gateway",
    status: "UP",
    timestamp: new Date().toISOString()
  });
});
function proxy(publicPath, target) {
  if (!target) {
    throw new Error(`URL du microservice manquante pour ${publicPath}`);
  }
  app.use(publicPath, createProxyMiddleware({
    target,
    changeOrigin: true,
    xfwd: true,
    proxyTimeout: 300000,
    timeout: 300000,
    pathRewrite(path) {
      if (path.startsWith(publicPath)) {
        return path;
      }
      if (!path || path === "/") {
        return publicPath;
      }
      return `${publicPath}${path.startsWith("/") ? path : `/${path}`}`;
    },
    on: {
      proxyReq(proxyReq, req) {
        console.log(`[Gateway] ${req.method} ${req.originalUrl} -> ${target}${proxyReq.path}`);
      },
      proxyRes(proxyRes, req) {
        console.log(`[Gateway] ${req.method} ${req.originalUrl} <- ${proxyRes.statusCode}`);
      },
      error(error, req, res) {
        console.error(`[Gateway] Erreur proxy ${req.method} ${req.originalUrl} :`, error.message);
        if (!res.headersSent) {
          return res.status(502).json({
            message: "Microservice inaccessible.",
            servicePath: publicPath,
            error: process.env.NODE_ENV === "development" ? error.message : undefined
          });
        }
      }
    }
  }));
}
proxy("/api/auth", process.env.AUTH_SERVICE_URL);
proxy("/api/users", process.env.USER_SERVICE_URL);
proxy("/api/courses", process.env.COURSE_SERVICE_URL);
proxy("/api/course-categories", process.env.COURSE_SERVICE_URL);
proxy("/api/uploads", process.env.COURSE_SERVICE_URL);
proxy("/api/progress", process.env.PROGRESS_SERVICE_URL);
proxy("/api/recommendations", process.env.RECOMMENDATION_SERVICE_URL);
proxy("/api/interactions", process.env.INTERACTION_SERVICE_URL);
proxy("/api/settings", process.env.SETTINGS_SERVICE_URL);
proxy("/api/subscriptions", process.env.SUBSCRIPTION_SERVICE_URL);
proxy("/api/payments", process.env.PAYMENT_SERVICE_URL);
app.use((_req, res) => {
  return res.status(404).json({
    message: "Route introuvable dans le Gateway."
  });
});
app.use((error, _req, res, _next) => {
  console.error("[Gateway] Erreur interne :", error);
  return res.status(error.statusCode || 500).json({
    message: error.message || "Erreur interne du Gateway."
  });
});
const PORT = Number(process.env.PORT) || 3000;
const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`API Gateway lancée sur http://localhost:${PORT}`);
});
server.on("error", error => {
  console.error("[Gateway] Erreur de démarrage :", error);
  process.exit(1);
});
module.exports = app;
