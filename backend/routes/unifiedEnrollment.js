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

        const offering = await prisma.offering.findUnique({
            where: { id: offeringId }
        });
        if (!offering) {
            return res.status(404).json({ error: 'Offering not found' });
        }

        const existingEnrollment = await prisma.enrollment.findUnique({
            where: {
                module_id_student_id: {
                    module_id: offering.moduleId,
                    student_id: student.id,
                }
            }
        });

        if (existingEnrollment) {
            if (existingEnrollment.status === 'INACTIVE') {
                const enrollment = await prisma.enrollment.update({
                    where: { id: existingEnrollment.id },
                    data: { status: 'ACTIVE', assessor_id: assessor.id },
                });
                return res.status(200).json({ message: 'Student re-enrolled successfully.', enrollment });
            } else {
                return res.status(400).json({ error: 'Student is already enrolled in this offering.' });
            }
        } else {
            const enrollment = await prisma.enrollment.create({
                data: {
                    module: { connect: { module_id: offering.moduleId } },
                    student: { connect: { id: student.id } },
                    assessor: { connect: { id: assessor.id } },
                },
            });
            return res.status(201).json(enrollment);
        }
    } catch (error) {
        console.error("Error enrolling student:", error);
        res.status(500).json({ error: 'Error enrolling student.' });
    }
});

router.get('/:offeringId', isAuthenticated, async (req, res) => {
    const { offeringId } = req.params;
    try {
        const offering = await prisma.offering.findUnique({
            where: { id: offeringId }
        });
        if (!offering) {
            return res.status(404).json({ error: 'Offering not found' });
        }

        const enrollments = await prisma.enrollment.findMany({
            where: { module_id: offering.moduleId, status: 'ACTIVE' },
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
