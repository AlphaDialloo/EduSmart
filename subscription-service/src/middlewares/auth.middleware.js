const jwt = require("jsonwebtoken");
function authenticate(req, res, next) {
  const authorization = req.headers.authorization;
  if (!authorization || !authorization.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Jeton d'authentification manquant."
    });
  }
  try {
    const token = authorization.slice(7);
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      id: payload.id || payload.userId || payload.sub,
      email: payload.email,
      role: payload.role,
      roles: payload.roles
    };
    if (!req.user.id) {
      return res.status(401).json({
        message: "Jeton incomplet."
      });
    }
    return next();
  } catch (_error) {
    return res.status(401).json({
      message: "Jeton invalide ou expiré."
    });
  }
}
function authorize(...allowedRoles) {
  const normalizedAllowedRoles = allowedRoles.map(role => String(role).toUpperCase());
  return (req, res, next) => {
    const userRoles = Array.isArray(req.user?.roles) ? req.user.roles : [req.user?.role].filter(Boolean);
    const allowed = userRoles.some(role => normalizedAllowedRoles.includes(String(role).toUpperCase()));
    if (!allowed) {
      return res.status(403).json({
        message: "Accès refusé."
      });
    }
    return next();
  };
}
function authenticateInternal(req, res, next) {
  const providedSecret = req.headers["x-internal-secret"];
  if (!process.env.INTERNAL_SERVICE_SECRET || providedSecret !== process.env.INTERNAL_SERVICE_SECRET) {
    return res.status(401).json({
      message: "Authentification interne invalide."
    });
  }
  return next();
}
module.exports = {
  authenticate,
  authorize,
  authenticateInternal
};
