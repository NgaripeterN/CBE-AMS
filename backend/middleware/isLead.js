const prisma = require('../lib/prisma');

const isLead = async (req, res, next) => {
  const { userId } = req.user;

  try {
    const assessor = await prisma.assessor.findUnique({
      where: { userId: userId },
    });

    if (!assessor) {
      return res.status(403).json({ error: 'Forbidden: Not an assessor' });
    }

    const courseAssignment = await prisma.courseAssignment.findFirst({
      where: {
        assessorId: assessor.id,
        role: 'LEAD',
      },
    });

    if (!courseAssignment && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden: Not a course lead' });
    }

    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while checking lead status' });
  }
};

module.exports = isLead;
