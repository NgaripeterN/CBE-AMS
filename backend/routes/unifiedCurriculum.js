const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { isAuthenticated } = require('../middleware/isAuthenticated');
const { isCourseLead } = require('../middleware/isCourseLead');

// Academic Year Functions
router.post('/years', isAuthenticated, isCourseLead, async (req, res) => {
    const { name, startDate, endDate, courseId } = req.body;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start >= end) return res.status(400).json({ error: 'Start date must be before end date.' });
    try {
        const overlappingYear = await prisma.academicYear.findFirst({
            where: { courseId, OR: [{ startDate: { lt: end }, endDate: { gt: start } }] }
        });
        if (overlappingYear) return res.status(400).json({ error: 'Academic year dates overlap with an existing year for this course.' });
        const academicYear = await prisma.academicYear.create({ data: { name, startDate: start, endDate: end, courseId } });
        res.status(201).json(academicYear);
    } catch (error) {
        res.status(400).json({ error: 'Error creating academic year.' });
    }
});

router.get('/years', isAuthenticated, isCourseLead, async (req, res) => {
    try {
        const { courseId: queryCourseId } = req.query;
        const where = queryCourseId ? { courseId: queryCourseId } : (req.user.role === 'LEAD' ? { courseId: req.user.leadCourseId } : {});
        const academicYears = await prisma.academicYear.findMany({ where, orderBy: { startDate: 'desc' }, include: { course: true } });
        res.status(200).json(academicYears);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching academic years.' });
    }
});

router.put('/years/:id', isAuthenticated, isCourseLead, async (req, res) => {
    const { id } = req.params;
    const { name, startDate, endDate } = req.body;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start >= end) return res.status(400).json({ error: 'Start date must be before end date.' });
    try {
        const yearToUpdate = await prisma.academicYear.findUnique({ where: { id } });
        if (!yearToUpdate) return res.status(404).json({ error: 'Academic year not found.' });
        const overlappingYear = await prisma.academicYear.findFirst({
            where: { id: { not: id }, courseId: yearToUpdate.courseId, OR: [{ startDate: { lt: end }, endDate: { gt: start } }] }
        });
        if (overlappingYear) return res.status(400).json({ error: 'Academic year dates overlap.' });
        const academicYear = await prisma.academicYear.update({ where: { id }, data: { name, startDate: start, endDate: end } });
        res.status(200).json(academicYear);
    } catch (error) {
        res.status(400).json({ error: 'Error updating academic year.' });
    }
});

router.delete('/years/:id', isAuthenticated, isCourseLead, async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.semester.deleteMany({ where: { academicYearId: id } });
        await prisma.academicYear.delete({ where: { id } });
        res.status(204).send();
    } catch (error) {
        res.status(400).json({ error: 'Error deleting academic year.' });
    }
});

// Semester Functions
router.post('/semesters', isAuthenticated, isCourseLead, async (req, res) => {
    const { name, academicYearId, startDate, endDate } = req.body;
    const start = new Date(startDate);
    const end = new Date(endDate);
    try {
        const semester = await prisma.semester.create({ data: { name, academicYearId, startDate: start, endDate: end } });
        res.status(201).json(semester);
    } catch (error) {
        res.status(400).json({ error: 'Error creating semester.' });
    }
});

router.get('/semesters/:academicYearId', isAuthenticated, isCourseLead, async (req, res) => {
    const { academicYearId } = req.params;
    try {
        const semesters = await prisma.semester.findMany({ where: { academicYearId }, orderBy: { startDate: 'asc' } });
        res.status(200).json(semesters);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching semesters.' });
    }
});

router.put('/semesters/:id', isAuthenticated, isCourseLead, async (req, res) => {
    const { id } = req.params;
    const { name, startDate, endDate } = req.body;
    try {
        const semester = await prisma.semester.update({ where: { id }, data: { name, startDate: new Date(startDate), endDate: new Date(endDate) } });
        res.status(200).json(semester);
    } catch (error) {
        res.status(400).json({ error: 'Error updating semester.' });
    }
});

router.delete('/semesters/:id', isAuthenticated, isCourseLead, async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.offering.deleteMany({ where: { semesterId: id } });
        await prisma.semester.delete({ where: { id } });
        res.status(204).send();
    } catch (error) {
        res.status(400).json({ error: 'Error deleting semester.' });
    }
});

router.get('/courses/:courseId', isAuthenticated, isCourseLead, async (req, res) => {
    const { courseId } = req.params;
    try {
        const curriculum = await prisma.module.findMany({
            where: { course_id: courseId },
            orderBy: [{ yearOfStudy: 'asc' }, { semesterOfStudy: 'asc' }],
            include: { competencies: true },
        });
        res.status(200).json(curriculum);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching curriculum.' });
    }
});

// Offering Functions
router.post('/offerings', isAuthenticated, isCourseLead, async (req, res) => {
    const { moduleId, semesterId, assessorIds } = req.body;
    try {
        const offering = await prisma.offering.create({
            data: {
                moduleId,
                semesterId,
                assessors: { create: assessorIds.map(id => ({ assessor: { connect: { id } } })) }
            },
            include: { module: true, semester: { include: { academicYear: true } }, assessors: { include: { assessor: { include: { user: true } } } } }
        });
        res.status(201).json(offering);
    } catch (error) {
        if (error.code === 'P2002') return res.status(400).json({ error: 'This module is already offered in this semester.' });
        res.status(500).json({ error: 'Error creating offering.' });
    }
});

router.get('/offerings/:semesterId', isAuthenticated, isCourseLead, async (req, res) => {
    const { semesterId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    try {
        const where = { semesterId };
        const totalOfferings = await prisma.offering.count({ where });
        const offerings = await prisma.offering.findMany({
            where, skip: (parseInt(page) - 1) * parseInt(limit), take: parseInt(limit),
            include: { module: true, semester: { include: { academicYear: true } }, assessors: { include: { assessor: { include: { user: true } } } } }
        });
        res.status(200).json({ offerings, totalPages: Math.ceil(totalOfferings / limit), currentPage: parseInt(page) });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching offerings.' });
    }
});

router.put('/offerings/:offeringId', isAuthenticated, isCourseLead, async (req, res) => {
    const { offeringId } = req.params;
    const { moduleId, semesterId, assessorIds, yearOfStudy, semesterOfStudy } = req.body;

    try {
        const offeringToUpdate = await prisma.offering.findUnique({ where: { id: offeringId }, include: { module: true } });
        if (!offeringToUpdate) return res.status(404).json({ error: 'Offering not found.' });

        if (moduleId || semesterId) {
            const targetModuleId = moduleId || offeringToUpdate.moduleId;
            const targetSemesterId = semesterId || offeringToUpdate.semesterId;
            const existing = await prisma.offering.findFirst({
                where: { moduleId: targetModuleId, semesterId: targetSemesterId, NOT: { id: offeringId } },
                include: { module: true }
            });
            if (existing) return res.status(409).json({ error: 'Conflict', conflict: { offeringId: existing.id, moduleTitle: existing.module.title } });
        }

        const transaction = [];
        // Sync module metadata so "My Modules" sorts correctly
        if (yearOfStudy || semesterOfStudy) {
            transaction.push(prisma.module.update({
                where: { module_id: offeringToUpdate.moduleId },
                data: { ...(yearOfStudy && { yearOfStudy: parseInt(yearOfStudy) }), ...(semesterOfStudy && { semesterOfStudy: parseInt(semesterOfStudy) }) }
            }));
        }
        if (assessorIds) {
            transaction.push(prisma.offeringAssignment.deleteMany({ where: { offeringId } }));
            transaction.push(...assessorIds.map(id => prisma.offeringAssignment.create({ data: { offeringId, assessorId: id } })));
        }
        transaction.push(prisma.offering.update({
            where: { id: offeringId },
            data: { ...(moduleId && { moduleId }), ...(semesterId && { semesterId }) }
        }));

        await prisma.$transaction(transaction);
        const updated = await prisma.offering.findUnique({
            where: { id: offeringId },
            include: { module: true, semester: { include: { academicYear: true } }, assessors: { include: { assessor: { include: { user: true } } } } }
        });
        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: 'Error updating offering.' });
    }
});

router.delete('/offerings/:offeringId', isAuthenticated, isCourseLead, async (req, res) => {
    const { offeringId } = req.params;
    try {
        await prisma.$transaction([
            prisma.offeringAssignment.deleteMany({ where: { offeringId } }),
            prisma.offering.delete({ where: { id: offeringId } }),
        ]);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Error deleting offering.' });
    }
});

module.exports = router;
