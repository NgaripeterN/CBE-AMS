const studentOnly = (req, res, next) => {
  if (req.user.role !== 'STUDENT') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
};

module.exports = studentOnly;
