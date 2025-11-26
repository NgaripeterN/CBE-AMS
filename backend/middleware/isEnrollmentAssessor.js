const prisma = require('../lib/prisma');

const isEnrollmentAssessor = async (req, res, next) => {
  const { userId } = req.user;
  const { enrollmentId } = req.params;

  try {
    const assessor = await prisma.assessor.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!assessor) {
      return res.status(404).json({ error: 'Assessor profile not found' });
    }

    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      select: { offeringId: true },
    });

    if (!enrollment) {
      return res.status(404).json({ error: 'Enrollment not found' });
    }

    const offeringAssignment = await prisma.offeringAssignment.findUnique({
      where: {
        offeringId_assessorId: {
          offeringId: enrollment.offeringId,
          assessorId: assessor.id,
        },
      },
    });

    if (!offeringAssignment) {
      return res.status(403).json({ error: 'You are not an assessor for this module' });
    }

    next();
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while checking enrollment assessor status' });
  }
};

module.exports = isEnrollmentAssessor;
