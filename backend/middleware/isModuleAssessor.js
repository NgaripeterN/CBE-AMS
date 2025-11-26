const prisma = require('../lib/prisma');

const isModuleAssessor = async (req, res, next) => {
    const { offeringId: bodyOfferingId, module_id: bodyModuleId } = req.body;
    const { moduleId, module_id: paramModuleId, id: assessmentId, offeringId: paramOfferingId, submission_id } = req.params;
    const userId = req.user.userId;

    let offeringId = bodyOfferingId || paramOfferingId;
    let module_id = moduleId || paramModuleId || bodyModuleId;

    try {
        if (req.user.role === 'ADMIN') {
            return next();
        }

        const assessor = await prisma.assessor.findUnique({
            where: { userId },
        });

        if (!assessor) {
            return res.status(403).json({ error: 'Forbidden: Assessor profile not found.' });
        }

        if (submission_id && !module_id) {
            const submission = await prisma.submission.findUnique({
                where: { submission_id },
                include: { assessment: { select: { module_id: true } } },
            });
            if (submission) {
                module_id = submission.assessment.module_id;
            }
        }

        if (!offeringId && module_id) {
            const offering = await prisma.offering.findFirst({
                where: { moduleId: module_id },
                select: { id: true }
            });
            if (offering) {
                offeringId = offering.id;
            }
        }

        if (assessmentId && !offeringId) {
            const assessment = await prisma.assessment.findUnique({
                where: { assessment_id: assessmentId },
                include: { module: { include: { offerings: { select: { id: true }, take: 1 } } } }
            });
            if (assessment && assessment.module.offerings.length > 0) {
                offeringId = assessment.module.offerings[0].id;
            }
        }

        if (!offeringId) {
            return res.status(400).json({ error: 'Could not determine the offering for authorization.' });
        }

        const offeringAssignment = await prisma.offeringAssignment.findFirst({
            where: {
                offeringId: offeringId,
                assessorId: assessor.id,
            },
        });

        if (offeringAssignment) {
            return next();
        }

        const courseLeadAssignment = await prisma.courseAssignment.findFirst({
            where: {
                assessorId: assessor.id,
                role: 'LEAD',
                course: {
                    modules: {
                        some: {
                            offerings: {
                                some: {
                                    id: offeringId
                                }
                            }
                        }
                    }
                }
            }
        });

        if (courseLeadAssignment) {
            return next();
        }

        return res.status(403).json({ error: 'Forbidden: You are not assigned to this module offering.' });

    } catch (error) {
        console.error('Authorization error in isModuleAssessor:', error);
        return res.status(500).json({ error: 'An internal server error occurred during authorization.' });
    }
};

module.exports = isModuleAssessor;
