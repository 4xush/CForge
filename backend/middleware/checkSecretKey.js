const checkSecretKey = (req, res, next) => {
  const providedKey = req.headers['x-secret-key'] || req.query.secretKey;
  const ownerSecretKey = process.env.OWNER_SECRET_KEY;

  if (!ownerSecretKey) {
    return res.status(500).json({ 
      message: "Server configuration error: OWNER_SECRET_KEY not set" 
    });
  }

  if (!providedKey) {
    return res.status(401).json({ 
      message: "Access denied: Secret key required. Provide it via 'x-secret-key' header or 'secretKey' query parameter" 
    });
  }

  if (providedKey !== ownerSecretKey) {
    return res.status(403).json({ 
      message: "Access denied: Invalid secret key" 
    });
  }

  next();
};

module.exports = { checkSecretKey };