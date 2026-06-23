const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'uoojo_secret_key_12345';

module.exports = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Access denied. Invalid token format.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;

    // Validate if req.user.id is a valid UUID (since we migrated to Supabase)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (req.user.id && !uuidRegex.test(req.user.id)) {
      return res.status(401).json({ message: 'Session invalid. Please log in again.' });
    }

    next();
  } catch (error) {
    res.status(400).json({ message: 'Invalid or expired token.' });
  }
};
