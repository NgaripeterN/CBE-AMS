const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { isAuthenticated } = require('../middleware/isAuthenticated');
const isModuleAssessor = require('../middleware/isModuleAssessor'); // Import isModuleAssessor

router.post('/', isAuthenticated, isModuleAssessor, async (req, res) => {
    const { studentEmail, offeringId } = req.body;
    const { userId } = req.user;

    if (!studentEmail || !offeringId) {
        return res.status(400).json({ error: 'studentEmail and offeringId are required' });
    }

    try {
        const studentUser = await prisma.user.findUnique({ where: { email: studentEmail } });
        if (!studentUser) {
            return res.status(404).json({ error: 'Student with that email not found' });
        }

        const student = await prisma.student.findUnique({ where: { userId: studentUser.user_id } });
        if (!student) {
            return res.status(404).json({ error: 'Student profile not found' });
        }

        const assessor = await prisma.assessor.findUnique({
            where: { userId },
            select: { id: true },
        });

        if (!assessor) {
            return res.status(404).json({ error: 'Assessor profile not found' });
        }

        const enrollment = await prisma.enrollment.create({
            data: {
                student_id: student.id,
                offeringId,
                assignedAssessorId: assessor.id,
            },
        });
        res.status(201).json(enrollment);
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Student is already enrolled in this offering.' });
        }
        res.status(500).json({ error: 'Error enrolling student.' });
    }
});

router.get('/:offeringId', isAuthenticated, async (req, res) => {
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
});

module.exports = router;
