const jwt = require("jsonwebtoken");

function authenticate(req, res, next) {
  const authorization = req.headers.authorization;

  if (!authorization || !authorization.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Jeton d'authentification manquant.",
    });
  }

  const token = authorization.split(" ")[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    req.user = {
      id: payload.id || payload.userId || payload.sub,
      email: payload.email,
      role: payload.role,
      roles: payload.roles,
    };

    return next();
  } catch (error) {
    return res.status(401).json({
      message: "Jeton invalide ou expiré.",
    });
  }
}

function authorize(...allowedRoles) {
  return (req, res, next) => {
    const userRoles = Array.isArray(req.user?.roles)
      ? req.user.roles
      : [req.user?.role].filter(Boolean);

    const hasPermission = userRoles.some((role) =>
      allowedRoles.includes(String(role).toUpperCase()),
    );

    if (!hasPermission) {
      return res.status(403).json({
        message: "Accès refusé.",
      });
    }

    return next();
  };
}

module.exports = {
  authenticate,
  authorize,
};
