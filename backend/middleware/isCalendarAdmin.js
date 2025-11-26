const isCalendarAdmin = (req, res, next) => {
    if (req.user.role === 'ADMIN' || req.user.role === 'LEAD') {
        next();
    } else {
        res.status(403).json({ message: 'Forbidden' });
    }
};

module.exports = isCalendarAdmin;
