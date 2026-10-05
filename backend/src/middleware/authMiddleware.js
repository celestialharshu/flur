import jwt from 'jsonwebtoken';

export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided.' });
  }

  try {
    req.user = jwt.verify(authHeader.slice(7), process.env.JWT_SECRET); // { userId, role }
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}
