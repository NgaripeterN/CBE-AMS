const jwt = require('jsonwebtoken');

const isAuthenticated = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization header missing or malformed' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

const studentOnly = (req, res, next) => {
    if (req.user && req.user.role === 'STUDENT') {
        next();
    } else {
        res.status(403).json({ error: 'Access denied. Student role required.' });
    }
};

const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === 'ADMIN') {
        next();
    } else {
        res.status(403).json({ error: 'Access denied. Admin role required.' });
    }
};

const leadOnly = (req, res, next) => {
    if (req.user && req.user.role === 'LEAD') { // Assuming LEAD is a role
        next();
    } else {
        res.status(403).json({ error: 'Access denied. Lead role required.' });
    }
};

const assessorOnly = (req, res, next) => {
    if (req.user && req.user.role === 'ASSESSOR') {
        next();
    } else {
        res.status(403).json({ error: 'Access denied. Assessor role required.' });
    }
};


module.exports = { 
    isAuthenticated, 
    studentOnly,
    adminOnly,
    leadOnly,
    assessorOnly
};
