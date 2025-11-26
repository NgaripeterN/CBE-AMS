const leadOnly = (req, res, next) => {
  if (!req.user.leadForCourseId) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
};

module.exports = leadOnly;
