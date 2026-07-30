module.exports = function (req, res, next) {
  if (
    req.headers["x-internal-secret"] !== process.env.INTERNAL_SERVICE_SECRET
  ) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }

  next();
};
