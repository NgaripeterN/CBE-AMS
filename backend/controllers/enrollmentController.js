const prisma = require('../lib/prisma');

exports.enrollStudentInOffering = async (req, res) => {
    const { studentId, offeringId } = req.body;
    const { userId } = req.user;

    if (!studentId || !offeringId) {
        return res.status(400).json({ error: 'studentId and offeringId are required' });
    }

    try {
        const assessor = await prisma.assessor.findUnique({
            where: { userId },
            select: { id: true },
        });

        if (!assessor) {
            return res.status(404).json({ error: 'Assessor profile not found' });
        }

        const enrollment = await prisma.enrollment.create({
            data: {
                student: { connect: { id: studentId } },
                offering: { connect: { id: offeringId } },
                assignedAssessor: { connect: { id: assessor.id } },
            },
        });
        res.status(201).json(enrollment);
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Student is already enrolled in this offering.' });
        }
        res.status(500).json({ error: 'Error enrolling student.' });
    }
};

exports.getEnrollmentsForOffering = async (req, res) => {
    const { offeringId } = req.params;
    try {
        const enrollments = await prisma.enrollment.findMany({
            where: { offeringId },
            include: {
                student: {
                    include: {
                        user: true,
                    },
                },
            },
        });
        res.status(200).json(enrollments);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching enrollments.' });
    }
};