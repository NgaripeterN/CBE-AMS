const jwt = require('jsonwebtoken');

const assessorOnly = (req, res, next) => {
  if (req.user.role !== 'ASSESSOR' && req.user.role !== 'LEAD') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
};

module.exports = assessorOnly;
