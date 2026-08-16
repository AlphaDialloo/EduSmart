const jwt = require("jsonwebtoken");
function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) return res.status(401).json({
    message: "Token manquant"
  });
  try {
    req.user = jwt.verify(header.split(" ")[1], process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({
      message: "Token invalide"
    });
  }
}
function authorize(...roles) {
  return (req, res, next) => !req.user || !roles.includes(req.user.role) ? res.status(403).json({
    message: "Accès refusé"
  }) : next();
}
function authenticateInternal(req, res, next) {
  const secret = req.headers["x-internal-secret"];
  if (secret !== process.env.INTERNAL_SERVICE_SECRET) {
    return res.status(401).json({
      message: "Secret interne invalide"
    });
  }
  next();
}
module.exports = {
  authenticate,
  authorize,
  authenticateInternal
};
