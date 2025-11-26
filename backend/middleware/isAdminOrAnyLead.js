const prisma = require('../lib/prisma');

const isAdminOrAnyLead = async (req, res, next) => {
    const userId = req.user.userId;
    const userRole = req.user.role;

    if (userRole === 'ADMIN') {
        return next();
    }

    if (userRole === 'ASSESSOR') {
        try {
            const assessor = await prisma.assessor.findUnique({
                where: { userId: userId }
            });

            if (assessor) {
                const courseAssignment = await prisma.courseAssignment.findFirst({
                    where: { assessorId: assessor.id, role: 'LEAD' },
                });

                if (courseAssignment) {
                    return next();
                }
            }
            return res.status(403).json({ error: 'Forbidden: You are not a lead for any course.' });
        } catch (error) {
            console.error("Error in isAdminOrAnyLead middleware:", error);
            return res.status(500).json({ error: 'Internal server error while verifying lead status.' });
        }
    }

    return res.status(403).json({ error: 'Forbidden: Insufficient permissions.' });
};

module.exports = { isAdminOrAnyLead };